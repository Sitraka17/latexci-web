/**
 * ISBN -> BibTeX @book entry, from Open Library with a Google Books fallback.
 * Isomorphic: the route handler uses it, and the ISBN tool calls it straight
 * from the browser first, because Open Library (CORS: *) refuses requests from
 * Vercel's IP ranges (403) while answering visitors normally.
 */
import { bibText, parseIsbn, safeKeyPart } from "@/lib/bib-escape";

export type IsbnResult = { ok: true; bibtex: string } | { ok: false; status: number; error: string };

/** Extra request headers (server only: a browser would preflight on them).
 *  Set per call; every server call uses the same User-Agent, so concurrent
 *  requests sharing this module cannot leak anything into each other. */
let H: Record<string, string> = {};

/** Fields shared by the Open Library and Google Books paths. */
interface BookRecord {
  title: string;
  subtitle: string;
  authorNames: string[];
  year: string;
  publisher: string;
  place: string;
  edition: string;
  pages: string;
  series: string;
  note: string;
}

/** Same BibTeX shape whatever the source: escaped text, key Lastname+Year_isbn... */
function buildBookBibtex(isbn: string, b: BookRecord): string {
  const fullTitle = b.subtitle ? `${b.title}: ${b.subtitle}` : b.title;
  const authors = b.authorNames.map(n => bibText(n)).join(" and ");
  const first = b.authorNames[0] ?? "";
  const firstAuthorLast = safeKeyPart(
    first.includes(",") ? first.split(",")[0] : first.split(/\s+/).pop() ?? ""
  ) || "Unknown";
  const citeKey = `${firstAuthorLast}${b.year}_isbn${isbn}`;

  const lines: string[] = [
    authors     ? `  author    = {${authors}}`             : "",
    `  title     = {${bibText(fullTitle)}}`,
    b.publisher ? `  publisher = {${bibText(b.publisher)}}` : "",
    b.place     ? `  address   = {${bibText(b.place)}}`     : "",
    b.year      ? `  year      = {${b.year}}`               : "",
    b.edition   ? `  edition   = {${bibText(b.edition)}}`   : "",
    b.pages     ? `  pages     = {${b.pages}}`              : "",
    b.series    ? `  series    = {${bibText(b.series)}}`    : "",
    `  isbn      = {${isbn}}`,
    b.note      ? `  note      = {${b.note}}`               : "",
  ].filter(Boolean);

  return `@book{${citeKey},\n${lines.join(",\n")}\n}`;
}

const yearOf = (s: unknown): string =>
  (typeof s === "string" ? s : "").match(/\b(1[5-9]\d{2}|20\d{2})\b/)?.[1] ?? "";

/** Resolve Open Library author keys ("/authors/OL123A") to display names. */
async function openLibraryNames(keys: string[]): Promise<string[]> {
  const names = await Promise.all(
    keys.slice(0, 8).map(async (key: string) => {
      try {
        const r = await fetch(`https://openlibrary.org${key}.json`, {
          headers: H,
          signal: AbortSignal.timeout(5_000),
        });
        if (!r.ok) return null;
        const data = await r.json();
        return ((data.name ?? data.personal_name ?? "") as string).trim() || null;
      } catch { return null; }
    })
  );
  return names.filter((n): n is string => Boolean(n));
}

type GoogleLookup =
  | { ok: true; info: Record<string, unknown> }
  | { ok: false; status: number; reason: string };

/** Google Books volume record for an ISBN (no key; may be rate limited). */
async function googleBooksVolume(isbn: string): Promise<GoogleLookup> {
  try {
    const r = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`, {
      headers: H,
      signal: AbortSignal.timeout(8_000),
    });
    if (!r.ok) return { ok: false, status: 502, reason: `Google Books returned ${r.status}` };
    const data = await r.json();
    const info = data?.items?.[0]?.volumeInfo;
    if (!info || typeof info !== "object") {
      return { ok: false, status: 404, reason: "not found" };
    }
    return { ok: true, info: info as Record<string, unknown> };
  } catch (err) {
    const reason = err instanceof Error && err.name === "TimeoutError"
      ? "Google Books request timed out"
      : "network error reaching Google Books";
    return { ok: false, status: 502, reason };
  }
}

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

function googleAuthors(info: Record<string, unknown>): string[] {
  const a = info.authors;
  return Array.isArray(a) ? a.filter((x: unknown): x is string => typeof x === "string" && x.trim() !== "") : [];
}

/**
 * Fallback when Open Library is unreachable or refuses the request (it answers
 * 403 to some cloud IP ranges, Vercel included): build the whole record from
 * Google Books.
 */
async function fromGoogleBooks(isbn: string, openLibraryProblem: string): Promise<IsbnResult> {
  const g = await googleBooksVolume(isbn);
  if (!g.ok) {
    if (g.status === 404) {
      return { ok: false, status: 404, error: `Book not found for ISBN ${isbn}. Check the number or try the ISBN-13 variant.` };
    }
    return { ok: false, status: 502, error: `Book lookup failed (${openLibraryProblem}; ${g.reason}). Try again in a moment.` };
  }
  const info = g.info;
  const pageCount = typeof info.pageCount === "number" ? String(info.pageCount) : "";
  return { ok: true, bibtex: buildBookBibtex(isbn, {
    title: str(info.title),
    subtitle: str(info.subtitle),
    authorNames: googleAuthors(info),
    year: yearOf(info.publishedDate),
    publisher: str(info.publisher),
    place: "",
    edition: "",
    pages: pageCount.replace(/[^0-9]/g, ""),
    series: "",
    note: "",
  }) };
}

export async function lookupIsbn(raw: string, headers: Record<string, string> = {}): Promise<IsbnResult> {
  H = headers;
  // Removes a leading "ISBN-13:" style label (its "13" used to leak into the
  // digits) and checks the check digit.
  const parsed = parseIsbn(raw);
  if (!parsed.ok) {
    return { ok: false, status: 400, error: `Invalid ISBN: ${parsed.reason} (got "${raw.slice(0, 40)}")` };
  }
  const isbn = parsed.isbn;

  // Open Library edition API: free, no key, covers 20M+ editions
  const url = `https://openlibrary.org/isbn/${isbn}.json`;

  let edition: Record<string, unknown>;
  try {
    const res = await fetch(url, { headers: H, signal: AbortSignal.timeout(10_000) });
    if (res.status === 404) {
      // Open Library does not know it; Google Books sometimes does.
      return fromGoogleBooks(isbn, "Open Library: not found");
    }
    if (!res.ok) return fromGoogleBooks(isbn, `Open Library returned ${res.status}`);
    edition = await res.json();
  } catch (err) {
    const why = err instanceof Error && err.name === "TimeoutError"
      ? "Open Library timed out"
      : "network error reaching Open Library";
    return fromGoogleBooks(isbn, why);
  }

  // ── Extract edition fields ─────────────────────────────────────────────
  const first = (v: unknown): string => (Array.isArray(v) ? str(v[0]) : "");

  // Authors: the edition record often has none (e.g. 9780262035613), in
  // which case they live on the work record; Google Books is the last resort.
  const works = edition.works as { key?: string }[] | undefined;
  const workKey: string = str(works?.[0]?.key);
  const editionKeys: string[] = ((edition.authors as { key?: string }[] | undefined) ?? [])
    .map(a => a?.key)
    .filter((k: unknown): k is string => typeof k === "string");
  let authorNames = editionKeys.length ? await openLibraryNames(editionKeys) : [];
  if (authorNames.length === 0 && /^\/works\/OL\d+W$/.test(workKey)) {
    try {
      const w = await fetch(`https://openlibrary.org${workKey}.json`, {
        headers: H,
        signal: AbortSignal.timeout(5_000),
      });
      if (w.ok) {
        const work = await w.json();
        const workKeys: string[] = (work.authors ?? [])
          .map((a: { author?: { key?: string } }) => a?.author?.key)
          .filter((k: unknown): k is string => typeof k === "string");
        authorNames = await openLibraryNames(workKeys);
      }
    } catch { /* fall through */ }
  }
  if (authorNames.length === 0) {
    const g = await googleBooksVolume(isbn);
    if (g.ok) authorNames = googleAuthors(g.info);
  }

  return { ok: true, bibtex: buildBookBibtex(isbn, {
    title: str(edition.title),
    subtitle: str(edition.subtitle),
    authorNames,
    // Publication year only: last_modified is the catalogue edit date, not a
    // publication date, so no year is better than a wrong one.
    year: yearOf(edition.publish_date),
    publisher: first(edition.publishers),
    place: first(edition.publish_places),
    edition: str(edition.edition_name),
    pages: String(edition.number_of_pages ?? "").replace(/[^0-9]/g, ""),
    series: first(edition.series),
    note: workKey ? `Open Library: https://openlibrary.org${workKey}` : "",
  }) };
}
