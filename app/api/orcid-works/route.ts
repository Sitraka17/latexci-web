import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "edge";

// ORCID iD: four blocks of four, last character may be X (ISO 7064 checksum).
const ORCID_RE = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

interface OrcidWork {
  title: string;
  venue: string;
  year: string;
  doi: string;
  type: string;
}

type Json = Record<string, unknown>;
const get = (o: unknown, ...path: string[]): unknown =>
  path.reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Json)[k] : undefined), o);

/**
 * Public works list of an ORCID record, for the CV builder's Publications
 * section. Only the iD the user typed is sent to ORCID (pub.orcid.org).
 */
export async function GET(req: NextRequest) {
  const rl = rateLimit(req, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429, headers: rl.headers });

  const raw = (req.nextUrl.searchParams.get("id") ?? "").trim()
    .replace(/^https?:\/\/(www\.)?orcid\.org\//i, "")
    .replace(/\/$/, "")
    .toUpperCase();
  if (!ORCID_RE.test(raw)) {
    return NextResponse.json({ error: "Invalid ORCID iD. Expected e.g. 0000-0002-1825-0097" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://pub.orcid.org/v3.0/${raw}/works`, {
      headers: { Accept: "application/json", "User-Agent": "latexci/1.0 (https://latexci.com)" },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 404) return NextResponse.json({ error: "ORCID record not found" }, { status: 404 });
    if (!res.ok) return NextResponse.json({ error: `ORCID returned ${res.status}` }, { status: 502 });

    const data = (await res.json()) as Json;
    const groups = (get(data, "group") as unknown[]) ?? [];
    const works: OrcidWork[] = [];
    for (const g of groups) {
      const s = ((get(g, "work-summary") as unknown[]) ?? [])[0];
      if (!s) continue;
      const ids = ((get(s, "external-ids", "external-id") as unknown[]) ?? []);
      const doi = ids.find((x) => String(get(x, "external-id-type")).toLowerCase() === "doi");
      works.push({
        title: String(get(s, "title", "title", "value") ?? "").trim(),
        venue: String(get(s, "journal-title", "value") ?? "").trim(),
        year: String(get(s, "publication-date", "year", "value") ?? "").trim(),
        doi: doi ? String(get(doi, "external-id-value") ?? "").trim() : "",
        type: String(get(s, "type") ?? ""),
      });
    }
    works.sort((a, b) => (b.year || "0").localeCompare(a.year || "0"));

    return NextResponse.json(
      { orcid: raw, works: works.filter((w) => w.title).slice(0, 100) },
      { headers: { "Cache-Control": "public, max-age=3600" } },
    );
  } catch (err) {
    const msg = err instanceof Error && err.name === "TimeoutError"
      ? "ORCID request timed out. Try again in a moment."
      : "Network error reaching ORCID";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
