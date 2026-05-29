import { NextRequest, NextResponse } from "next/server";

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
  const raw = req.nextUrl.searchParams.get("id")?.trim() ?? "";
  if (!raw) return NextResponse.json({ error: "Missing id param" }, { status: 400 });

  // Normalize: strip "arxiv:" prefix, strip version suffix
  const id = raw.replace(/^arxiv:/i, "").replace(/v\d+$/, "");
  const url = `https://export.arxiv.org/api/query?id_list=${encodeURIComponent(id)}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "latexci/1.0 (https://latexci-web.vercel.app)" },
    });
    if (!res.ok) return NextResponse.json({ error: `arXiv returned ${res.status}` }, { status: res.status });

    const xml = await res.text();

    if (xml.includes("<totalResults>0</totalResults>") || !xml.includes("<entry>")) {
      return NextResponse.json({ error: "arXiv paper not found. Check the ID (e.g. 2301.07041)" }, { status: 404 });
    }

    // Extract metadata
    const title  = xmlText(xml, "title").replace(/\s+/g, " ").replace(/\n/g, " ");
    const year   = (xmlText(xml, "published").match(/^(\d{4})/) ?? [])[1] ?? "";
    const month  = (xmlText(xml, "published").match(/^\d{4}-(\d{2})/) ?? [])[1] ?? "";
    const abstract = xmlText(xml, "summary").replace(/\s+/g, " ");
    const doi    = xmlText(xml, "doi") || "";

    const authors = xmlAll(xml, "author")
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
  } catch {
    return NextResponse.json({ error: "Network error reaching arXiv" }, { status: 502 });
  }
}
