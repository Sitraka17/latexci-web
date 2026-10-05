import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { bibText, pubmedAuthor, safeKeyPart, type PubmedAuthor } from "@/lib/bib-escape";

export const runtime = "edge";

/** Fetch article metadata from NCBI E-utilities (free, no key needed for low traffic) */
export async function GET(req: NextRequest) {
  const rl = rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429, headers: rl.headers });

  const raw = req.nextUrl.searchParams.get("id")?.trim() ?? "";
  if (!raw) return NextResponse.json({ error: "Missing id param" }, { status: 400 });

  // Strip full PubMed URL (the UI placeholder and landing-page FAQ promise URL
  // support), "PMID:" prefix, whitespace, trailing slashes, leading zeros
  const pmid = raw
    .replace(/^https?:\/\/(?:www\.)?pubmed\.ncbi\.nlm\.nih\.gov\//i, "")
    .replace(/\/+$/, "")
    .replace(/^pmid:?\s*/i, "")
    .replace(/\s/g, "")
    .replace(/^0+/, "") || raw;

  // Validate: PubMed IDs are pure numeric, ≤ 9 digits
  if (!/^\d{1,9}$/.test(pmid)) {
    return NextResponse.json({ error: "Invalid PubMed ID — must be a numeric ID (e.g. 37652822)" }, { status: 400 });
  }

  const url =
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "latexci/1.0 (https://latexci.com; mailto:contact@latexci.com)" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: `PubMed returned ${res.status}` }, { status: res.status });
    }

    const json = await res.json();
    const article = json?.result?.[pmid];

    if (!article || article.error) {
      return NextResponse.json({ error: "PubMed article not found. Check the PMID (e.g. 37652822)" }, { status: 404 });
    }

    // ── Extract fields ────────────────────────────────────────────────────────
    // PubMed titles may carry inline HTML (<i>in vivo</i>) and entities.
    const stripTags = (v: string) => v.replace(/<\/?(?:i|b|u|em|strong|sup|sub|scp)>/gi, "");
    const title   = bibText(stripTags(article.title as string ?? "").trim().replace(/\.$/, ""));
    const journal = bibText(article.fulljournalname as string ?? article.source ?? "");
    const volume  = (article.volume as string ?? "").trim();
    const issue   = (article.issue as string ?? "").trim();
    const pages   = (article.pages as string ?? "").trim();
    const doi     = ((article.elocationid as string ?? "").match(/doi:\s*(\S+)/i)?.[1] ?? "").trim();
    const pmcid   = (article.pmcid as string ?? "").trim();

    // Date: pubdate looks like "2023 Aug" or "2023"
    const pubdate = (article.pubdate as string ?? "");
    const yearM   = pubdate.match(/(\d{4})/);
    const year    = yearM?.[1] ?? "";
    const monthMap: Record<string, string> = {
      Jan:"jan", Feb:"feb", Mar:"mar", Apr:"apr", May:"may", Jun:"jun",
      Jul:"jul", Aug:"aug", Sep:"sep", Oct:"oct", Nov:"nov", Dec:"dec",
    };
    const monthKey = pubdate.match(/\b([A-Z][a-z]{2})\b/)?.[1] ?? "";
    const month    = monthMap[monthKey] ?? "";

    // Authors: esummary gives {name: "Doe JA", authtype: "Author" | "CollectiveName"}.
    // The last token is the initials, an optional suffix (Jr, III) follows
    // it, and group authors must be braced so BibTeX keeps them whole.
    const parsedAuthors = ((article.authors as PubmedAuthor[]) ?? [])
      .map(pubmedAuthor)
      .filter(a => a.bib);
    const authors = parsedAuthors.map(a => a.bib).join(" and ");

    // ── Cite key ──────────────────────────────────────────────────────────────
    const firstAuthorLast = safeKeyPart(parsedAuthors[0]?.family ?? "") || "Unknown";
    const citeKey = `${firstAuthorLast}${year}_pmid${pmid}`;

    // ── Build BibTeX ──────────────────────────────────────────────────────────
    const lines: string[] = [
      authors ? `  author   = {${authors}}` : "",
      `  title    = {${title}}`,
      `  journal  = {${journal}}`,
      year   ? `  year     = {${year}}`   : "",
      month  ? `  month    = ${month}`  : "", // bare macro (jan), not {jan}
      volume ? `  volume   = {${bibText(volume)}}` : "",
      issue  ? `  number   = {${bibText(issue)}}`  : "",
      pages  ? `  pages    = {${bibText(pages)}}`  : "",
      doi    ? `  doi      = {${doi}}`    : "",
      pmcid  ? `  pmcid    = {${pmcid}}`  : "",
      `  note     = {PMID: ${pmid}}`,
      `  url      = {https://pubmed.ncbi.nlm.nih.gov/${pmid}/}`,
    ].filter(Boolean);

    const bibtex = `@article{${citeKey},\n${lines.join(",\n")}\n}`;

    return new NextResponse(bibtex, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    const msg =
      err instanceof Error && err.name === "TimeoutError"
        ? "PubMed request timed out. Try again in a moment."
        : "Network error reaching PubMed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
