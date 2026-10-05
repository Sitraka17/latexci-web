import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { bibText, normalizeDoi } from "@/lib/bib-escape";
import { formatEntry, parseBibTeX } from "@/lib/bibtex";

export const runtime = "edge";

/** Basic DOI format check — must start with "10." followed by registrant code. */
const DOI_RE = /^10\.\d{4,}[\w.()/:;-]*\/\S+$/;

/** Fields that hold identifiers or links: never LaTeX-escaped. */
const RAW_FIELDS = new Set(["url", "doi", "issn", "isbn", "eprint", "archiveprefix", "file"]);

/**
 * Registry BibTeX is not TeX-safe: CrossRef emits `journal={Computers &amp;
 * Security}` (an XML entity, and a raw `&` once decoded), which stops
 * pdflatex with "Misplaced alignment tab". Decode entities and escape every
 * text field; identifiers and URLs stay raw, bare macros (month=May) stay bare.
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
