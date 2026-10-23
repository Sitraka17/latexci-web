import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { bibText, normalizeDoi, protectTitleCaps } from "@/lib/bib-escape";
import { formatEntry, parseBibTeX, splitAuthors } from "@/lib/bibtex";

// Node runtime: the Cloudflare adapter (OpenNext) does not bundle edge-runtime
// routes; on Workers both run on workerd anyway, and Vercel serves it fine.
export const runtime = "nodejs";

/** Basic DOI format check — must start with "10." followed by registrant code. */
const DOI_RE = /^10\.\d{4,}[\w.()/:;-]*\/\S+$/;

/** Fields that hold identifiers or links: never LaTeX-escaped. */
const RAW_FIELDS = new Set(["url", "doi", "issn", "isbn", "eprint", "archiveprefix", "file"]);

/** True when a registry `url` only restates the DOI (doi.org / dx.doi.org). */
function urlDuplicatesDoi(url: string, doi: string): boolean {
  if (!doi) return false;
  let u = url.trim();
  try { u = decodeURIComponent(u); } catch { /* keep as given */ }
  const target = normalizeDoi(u);
  return target !== u && target.toLowerCase() === normalizeDoi(doi).toLowerCase();
}

/** Remove empty names from an author list ("Smith, John and " -> "Smith, John"). */
function dropEmptyNames(list: string): string {
  return splitAuthors(list)
    .map(n => n.trim())
    .filter(n => n !== "" && n !== "{}" && !/^[,\s]*$/.test(n))
    .join(" and ");
}

/**
 * Registry BibTeX is not TeX-safe: CrossRef emits `journal={Computers &amp;
 * Security}` (an XML entity, and a raw `&` once decoded), which stops
 * pdflatex with "Misplaced alignment tab". Decode entities and escape every
 * text field; identifiers and URLs stay raw, bare macros (month=May) stay bare.
 * CrossRef quirks are fixed on the way: a `url` that only repeats the DOI is
 * dropped, page ranges use `--`, empty author names are removed, and title
 * capitals (DNA, COVID-19) are braced.
 */
function sanitiseRegistryBib(bib: string): string {
  const entries = parseBibTeX(bib);
  if (entries.length === 0) return bib;
  return entries.map(e => {
    const bare = new Set(e.bare ?? []);
    for (const [k, v] of Object.entries(e.fields)) {
      if (bare.has(k) || RAW_FIELDS.has(k)) continue;
      e.fields[k] = bibText(v, { keepMath: true });
    }
    if (e.fields.title && !bare.has("title")) e.fields.title = protectTitleCaps(e.fields.title);
    if (e.fields.pages && !bare.has("pages")) {
      e.fields.pages = e.fields.pages.replace(/\s*[-\u2010-\u2015\u2212]+\s*/g, "--");
    }
    for (const k of ["author", "editor"]) {
      if (e.fields[k] && !bare.has(k)) {
        const cleaned = dropEmptyNames(e.fields[k]);
        if (cleaned) e.fields[k] = cleaned;
        else delete e.fields[k];
      }
    }
    if (e.fields.url && urlDuplicatesDoi(e.fields.url, e.fields.doi ?? "")) delete e.fields.url;
    return formatEntry(e, false, true);
  }).join("\n\n");
}

export async function GET(req: NextRequest) {
  const rl = rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429, headers: rl.headers });

  // Accept "doi:10.x/y", "https://doi.org/10.x/y", "dx.doi.org/10.x/y" too.
  const doi = normalizeDoi(req.nextUrl.searchParams.get("doi") ?? "");
  if (!doi) return NextResponse.json({ error: "Missing doi param" }, { status: 400 });

  if (!DOI_RE.test(doi)) {
    return NextResponse.json(
      { error: "Invalid DOI format. Expected format: 10.1234/example" },
      { status: 400 }
    );
  }

  // CrossRef returns BibTeX directly when you request this content type
  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}/transform/application/x-bibtex`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/x-bibtex",
        "User-Agent": "latexci/1.0 (https://latexci.com; mailto:contact@latexci.com)",
      },
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      if (res.status === 404) {
        // Not in CrossRef — dataset/software DOIs (Zenodo, Figshare, Dryad…) are
        // registered with DataCite instead. Its content negotiation returns
        // BibTeX directly, so fall back before declaring the DOI unknown.
        const dc = await fetch(`https://api.datacite.org/dois/${encodeURIComponent(doi)}`, {
          headers: {
            Accept: "application/x-bibtex",
            "User-Agent": "latexci/1.0 (https://latexci.com; mailto:contact@latexci.com)",
          },
          signal: AbortSignal.timeout(8_000),
        }).catch(() => null);
        if (dc?.ok) {
          const dcBib = (await dc.text()).trim();
          if (dcBib.startsWith("@")) {
            return new NextResponse(sanitiseRegistryBib(dcBib), {
              headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" },
            });
          }
        }
        return NextResponse.json({ error: "DOI not found. Check the format (e.g. 10.1038/nature12373)" }, { status: 404 });
      }
      return NextResponse.json({ error: `CrossRef returned ${res.status}` }, { status: res.status });
    }

    // CrossRef's transform output begins with a leading space (" @article{…"),
    // so trim before validating — the untrimmed startsWith("@") check rejected
    // EVERY successful response with a bogus 502.
    const bibtex = (await res.text()).trim();
    if (!bibtex.startsWith("@")) {
      return NextResponse.json({ error: "CrossRef returned unexpected content" }, { status: 502 });
    }

    return new NextResponse(sanitiseRegistryBib(bibtex), {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" },
    });
  } catch (err) {
    const msg = err instanceof Error && err.name === "TimeoutError"
      ? "CrossRef request timed out. Try again in a moment."
      : "Network error reaching CrossRef";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
