/**
 * lib/bib-handoff.ts: passes BibTeX from the identifier converters to the
 * formatter pages in the URL fragment (#bib=...), compressed like the
 * "Open in editor" links of the templates. The fragment never reaches the
 * server, so the entries stay in the browser.
 */
import LZString from "lz-string";

export const FORMAT_TARGETS = [
  { label: "APA", href: "/tools/bibtex-to-apa" },
  { label: "MLA", href: "/tools/bibtex-to-mla" },
  { label: "Chicago", href: "/tools/bibtex-to-chicago" },
  { label: "IEEE", href: "/tools/bibtex-to-ieee" },
  { label: "Harvard", href: "/tools/bibtex-to-harvard" },
];

export function formatHref(path: string, bib: string): string {
  return `${path}#bib=${LZString.compressToEncodedURIComponent(bib)}`;
}

/** BibTeX carried by `hash` ("#bib=..."), or null. */
export function readHandoff(hash: string): string | null {
  const h = hash.replace(/^#/, "");
  if (!h.startsWith("bib=")) return null;
  return LZString.decompressFromEncodedURIComponent(h.slice(4)) || null;
}

export type IdKind = "doi" | "arxiv" | "pmid" | "isbn";

/**
 * What an identifier typed in the formatter is, and the lookup route that
 * turns it into BibTeX. DOIs start with 10. (bare or inside a doi.org link);
 * arXiv IDs are YYMM.NNNNN or archive/NNNNNNN; ten or thirteen digits are an
 * ISBN; shorter numbers a PubMed ID.
 */
export function identifierLookup(raw: string): { kind: IdKind; url: string } | null {
  const s = raw.trim();
  if (!s) return null;
  if (/10\.\d{4,}\/\S+/.test(s)) return { kind: "doi", url: `/api/doi-to-bibtex?doi=${encodeURIComponent(s)}` };
  const ax = s.replace(/^(arxiv:|https?:\/\/arxiv\.org\/(abs|pdf)\/)/i, "").replace(/\.pdf$/i, "");
  if (/^(\d{4}\.\d{4,5}|[a-z-]+(\.[A-Z]{2})?\/\d{7})(v\d+)?$/i.test(ax)) {
    return { kind: "arxiv", url: `/api/arxiv-to-bibtex?id=${encodeURIComponent(ax)}` };
  }
  const digits = s.replace(/^(pmid:|isbn:?)\s*/i, "").replace(/[\s-]/g, "");
  if (/^(\d{9}[\dX]|\d{13})$/i.test(digits)) return { kind: "isbn", url: `/api/isbn-to-bibtex?isbn=${encodeURIComponent(digits)}` };
  if (/^\d{1,9}$/.test(digits)) return { kind: "pmid", url: `/api/pmid-to-bibtex?id=${encodeURIComponent(digits)}` };
  return null;
}
