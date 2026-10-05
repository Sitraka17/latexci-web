import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { bibText, parseIsbn, safeKeyPart } from "@/lib/bib-escape";

export const runtime = "edge";

const UA = { "User-Agent": "latexci/1.0 (https://latexci.com; mailto:contact@latexci.com)" };

/** Resolve Open Library author keys ("/authors/OL123A") to display names. */
async function openLibraryNames(keys: string[]): Promise<string[]> {
  const names = await Promise.all(
    keys.slice(0, 8).map(async (key: string) => {
      try {
        const r = await fetch(`https://openlibrary.org${key}.json`, {
          headers: UA,
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

/** Last resort for authors: Google Books (no key; may be rate limited). */
async function googleBooksAuthors(isbn: string): Promise<string[]> {
  try {
    const r = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`, {
      headers: UA,
      signal: AbortSignal.timeout(5_000),
    });
    if (!r.ok) return [];
    const data = await r.json();
    const authors = data?.items?.[0]?.volumeInfo?.authors;
    return Array.isArray(authors) ? authors.filter((a: unknown): a is string => typeof a === "string") : [];
  } catch { return []; }
}

export async function GET(req: NextRequest) {
  const rl = rateLimit(req, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429, headers: rl.headers });

  const raw = req.nextUrl.searchParams.get("isbn")?.trim() ?? "";
  if (!raw) return NextResponse.json({ error: "Missing isbn param" }, { status: 400 });

  // Removes a leading "ISBN-13:" style label (its "13" used to leak into the
  // digits) and checks the check digit.
  const parsed = parseIsbn(raw);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: `Invalid ISBN: ${parsed.reason} (got "${raw.slice(0, 40)}")` },
      { status: 400 }
    );
  }
  const isbn = parsed.isbn;

  // Open Library Works API — free, no key, covers 20M+ editions
  const url = `https://openlibrary.org/isbn/${isbn}.json`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "latexci/1.0 (https://latexci.com; mailto:contact@latexci.com)" },
      signal: AbortSignal.timeout(10_000),
    });

    if (res.status === 404) {
      return NextResponse.json(
        { error: `Book not found for ISBN ${isbn}. Check the number or try the ISBN-13 variant.` },
        { status: 404 }
      );
    }
    if (!res.ok) {
      return NextResponse.json({ error: `Open Library returned ${res.status}` }, { status: res.status });
    }

    const edition = await res.json();

    // ── Extract edition fields ─────────────────────────────────────────────
    const title     = (edition.title as string ?? "").trim();
    const subtitle  = (edition.subtitle as string ?? "").trim();
    const fullTitle = subtitle ? `${title}: ${subtitle}` : title;

    // Publication year only: last_modified is the catalogue edit date, not a
    // publication date, so no year is better than a wrong one.
    const year     = (edition.publish_date as string ?? "").match(/\b(1[5-9]\d{2}|20\d{2})\b/)?.[1] ?? "";
    const publisher = ((edition.publishers as string[]) ?? [])[0]?.trim() ?? "";
    const place     = ((edition.publish_places as string[]) ?? [])[0]?.trim() ?? "";
    const edition_n = (edition.edition_name as string ?? "").trim();
    const pages_n   = String(edition.number_of_pages ?? "").replace(/[^0-9]/g, "");
    const series    = ((edition.series as string[]) ?? [])[0]?.trim() ?? "";

    // Authors: the edition record often has none (e.g. 9780262035613), in
    // which case they live on the work record; Google Books is the last resort.
    const workKey: string = (edition.works?.[0]?.key as string) ?? "";
    const editionKeys: string[] = (edition.authors ?? [])
      .map((a: { key?: string }) => a?.key)
      .filter((k: unknown): k is string => typeof k === "string");
    let authorNames = editionKeys.length ? await openLibraryNames(editionKeys) : [];
    if (authorNames.length === 0 && /^\/works\/OL\d+W$/.test(workKey)) {
      try {
        const w = await fetch(`https://openlibrary.org${workKey}.json`, {
          headers: UA,
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
    if (authorNames.length === 0) authorNames = await googleBooksAuthors(isbn);
    const authors = authorNames.map(n => bibText(n)).join(" and ");

    // ── Cite key ───────────────────────────────────────────────────────────
    const first = authorNames[0] ?? "";
    const firstAuthorLast = safeKeyPart(
      first.includes(",") ? first.split(",")[0] : first.split(/\s+/).pop() ?? ""
    ) || "Unknown";
    const citeKey = `${firstAuthorLast}${year}_isbn${isbn}`;

    // ── Build BibTeX ────────────────────────────────────────────────────────
    const lines: string[] = [
      authors      ? `  author    = {${authors}}`              : "",
      `  title     = {${bibText(fullTitle)}}`,
      publisher    ? `  publisher = {${bibText(publisher)}}`   : "",
      place        ? `  address   = {${bibText(place)}}`       : "",
      year         ? `  year      = {${year}}`                 : "",
      edition_n    ? `  edition   = {${bibText(edition_n)}}`   : "",
      pages_n      ? `  pages     = {${pages_n}}`              : "",
      series       ? `  series    = {${bibText(series)}}`      : "",
      `  isbn      = {${isbn}}`,
      workKey      ? `  note      = {Open Library: https://openlibrary.org${workKey}}` : "",
    ].filter(Boolean);

    const bibtex = `@book{${citeKey},\n${lines.join(",\n")}\n}`;

    return new NextResponse(bibtex, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    const msg =
      err instanceof Error && err.name === "TimeoutError"
        ? "Open Library request timed out. Try again in a moment."
        : "Network error reaching Open Library";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
