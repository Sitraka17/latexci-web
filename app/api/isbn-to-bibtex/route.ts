import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/** Strip non-digit/X characters and normalise an ISBN-10 or ISBN-13 */
function normaliseIsbn(raw: string): string {
  return raw.replace(/[^\dXx]/g, "").toUpperCase();
}

function isValidIsbn(isbn: string): boolean {
  return isbn.length === 10 || isbn.length === 13;
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("isbn")?.trim() ?? "";
  if (!raw) return NextResponse.json({ error: "Missing isbn param" }, { status: 400 });

  const isbn = normaliseIsbn(raw);
  if (!isValidIsbn(isbn)) {
    return NextResponse.json(
      { error: `Invalid ISBN — must be 10 or 13 digits (got "${raw}")` },
      { status: 400 }
    );
  }

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

    const year     = String(
      (edition.publish_date as string ?? "").match(/\d{4}/)?.[0] ??
      (edition.last_modified?.value as string ?? "").match(/\d{4}/)?.[0] ?? ""
    );
    const publisher = ((edition.publishers as string[]) ?? [])[0]?.trim() ?? "";
    const place     = ((edition.publish_places as string[]) ?? [])[0]?.trim() ?? "";
    const edition_n = (edition.edition_name as string ?? "").trim();
    const pages_n   = String(edition.number_of_pages ?? "").replace(/[^0-9]/g, "");
    const series    = ((edition.series as string[]) ?? [])[0]?.trim() ?? "";

    // Author keys — need a second fetch to resolve names
    const authorKeys: string[] = (edition.authors ?? []).map(
      (a: { key: string }) => a.key
    );

    let authors = "";
    if (authorKeys.length > 0) {
      const authorResults = await Promise.all(
        authorKeys.slice(0, 6).map(async (key: string) => {
          try {
            const r = await fetch(`https://openlibrary.org${key}.json`, {
              headers: { "User-Agent": "latexci/1.0 (https://latexci.com)" },
              signal: AbortSignal.timeout(5_000),
            });
            if (!r.ok) return null;
            const data = await r.json();
            return (data.personal_name ?? data.name ?? "") as string;
          } catch { return null; }
        })
      );
      authors = authorResults
        .filter((n): n is string => Boolean(n))
        .join(" and ");
    }

    // ── Works API for more info (subtitle, subjects) ─────────────────────
    // edition.works[0].key → "/works/OL12345W"
    const workKey: string = (edition.works?.[0]?.key as string) ?? "";

    // ── Cite key ───────────────────────────────────────────────────────────
    const firstAuthorLast = authors.split(" and ")[0]?.split(",")[0]?.trim()
      || authors.split(" ")[0]
      || "Unknown";
    const citeKey = `${firstAuthorLast.replace(/\s+/g, "")}${year}_isbn${isbn}`;

    // ── Build BibTeX ────────────────────────────────────────────────────────
    const lines: string[] = [
      authors      ? `  author    = {${authors}}`              : "",
      `  title     = {${fullTitle}}`,
      publisher    ? `  publisher = {${publisher}}`            : "",
      place        ? `  address   = {${place}}`                : "",
      year         ? `  year      = {${year}}`                 : "",
      edition_n    ? `  edition   = {${edition_n}}`            : "",
      pages_n      ? `  pages     = {${pages_n}}`              : "",
      series       ? `  series    = {${series}}`               : "",
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
