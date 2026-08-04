import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "edge";

function xmlText(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? m[1].replace(/<[^>]+>/g, "").trim() : "";
}

function xmlAll(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const out: string[] = [];
  let m;
  while ((m = re.exec(xml)) !== null) {
    out.push(m[1].replace(/<[^>]+>/g, "").trim());
  }
  return out;
}

export async function GET(req: NextRequest) {
  const rl = rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429, headers: rl.headers });

  const raw = req.nextUrl.searchParams.get("id")?.trim() ?? "";
  if (!raw) return NextResponse.json({ error: "Missing id param" }, { status: 400 });

  // Normalize: strip https://arxiv.org/abs/ URL, "arxiv:" prefix, and version suffix
  const id = raw
    .replace(/^https?:\/\/arxiv\.org\/abs\//i, "")
    .replace(/^arxiv:/i, "")
    .replace(/v\d+$/, "");
  // Strict grammar check — new-style (2301.07041) or old-style (math/0309136,
  // math.GT/0309136). This is the injection barrier: the id is interpolated into
  // the BibTeX body below, and a permissive id (e.g. containing "}" or "\")
  // would let attacker text masquerade as trusted registry output.
  if (!/^(\d{4}\.\d{4,5}|[a-z-]+(\.[A-Za-z]{2})?\/\d{7})$/i.test(id)) {
    return NextResponse.json({ error: "Invalid arXiv ID. Expected e.g. 2301.07041 or math/0309136" }, { status: 400 });
  }
  const url = `https://export.arxiv.org/api/query?id_list=${encodeURIComponent(id)}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "latexci/1.0 (https://latexci.com)" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return NextResponse.json({ error: `arXiv returned ${res.status}` }, { status: res.status });

    const xml = await res.text();

    // arXiv namespaces the count tag (<opensearch:totalResults>) — the plain
    // <totalResults> spelling never matches, so also detect the API's error
    // signaling: a feed whose only <entry> is titled "Error".
    if (/<(?:opensearch:)?totalResults[^>]*>0</i.test(xml) || !xml.includes("<entry>")) {
      return NextResponse.json({ error: "arXiv paper not found. Check the ID (e.g. 2301.07041)" }, { status: 404 });
    }

    // Extract metadata from the first <entry> ONLY — the Atom feed's own
    // top-level <title> is the query echo ("arXiv Query: search_query=…"),
    // which previously leaked into the BibTeX title field.
    const entry = xml.match(/<entry[\s\S]*?<\/entry>/i)?.[0] ?? xml;

    const title  = xmlText(entry, "title").replace(/\s+/g, " ").replace(/\n/g, " ");
    // Defense-in-depth: for bad queries arXiv returns a well-formed feed whose
    // only entry is titled "Error" — treat that as not-found, never as a paper.
    if (title === "Error") {
      return NextResponse.json({ error: "arXiv paper not found. Check the ID (e.g. 2301.07041)" }, { status: 404 });
    }
    const year   = (xmlText(entry, "published").match(/^(\d{4})/) ?? [])[1] ?? "";
    const month  = (xmlText(entry, "published").match(/^\d{4}-(\d{2})/) ?? [])[1] ?? "";
    const abstract = xmlText(entry, "summary").replace(/\s+/g, " ");
    // arXiv namespaces the DOI as <arxiv:doi> — try both spellings.
    const doi    = xmlText(entry, "arxiv:doi") || xmlText(entry, "doi") || "";

    const authors = xmlAll(entry, "author")
      .map(a => {
        // Each <author> contains <name>...</name>
        const name = a.match(/<name>([^<]+)<\/name>/)?.[1]?.trim()
                  ?? a.replace(/<[^>]+>/g, "").trim();
        return name;
      })
      .filter(Boolean)
      .join(" and ");

    const citeKey = (() => {
      const firstAuthorLast = (authors.split(" and ")[0] ?? "").split(",")[0].trim()
        .split(" ").pop() ?? "Unknown";
      return `${firstAuthorLast}${year}_${id.replace(/[./]/g, "_")}`;
    })();

    const monthNames: Record<string, string> = {
      "01":"jan","02":"feb","03":"mar","04":"apr","05":"may","06":"jun",
      "07":"jul","08":"aug","09":"sep","10":"oct","11":"nov","12":"dec",
    };

    const lines: string[] = [
      `  author       = {${authors}}`,
      `  title        = {${title}}`,
      `  year         = {${year}}`,
      month ? `  month        = {${monthNames[month] ?? month}}` : "",
      `  journal      = {arXiv preprint}`,
      `  howpublished = {\\url{https://arxiv.org/abs/${id}}}`,
      `  eprint       = {${id}}`,
      `  archivePrefix= {arXiv}`,
      doi ? `  doi          = {${doi}}` : "",
      `  note         = {arXiv:${id}}`,
      abstract ? `  abstract     = {${abstract.slice(0, 400)}${abstract.length > 400 ? "..." : ""}}` : "",
    ].filter(Boolean);

    const bibtex = `@article{${citeKey},\n${lines.join(",\n")}\n}`;

    return new NextResponse(bibtex, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
    });
  } catch (err) {
    const msg = err instanceof Error && err.name === "TimeoutError"
      ? "arXiv request timed out. Try again in a moment."
      : "Network error reaching arXiv";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
