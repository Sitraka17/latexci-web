/**
 * lib/counter.ts: cookieless page and event counter (2026-11-25), the same
 * model as ecofinlearning.com and sitraka.lu.
 *
 * Why: since the move to Cloudflare Workers (2026-11-04) latexci measured
 * nothing; Search Console shows clicks from Google, not what people do once
 * here. The browser sends a tiny JSON body to POST /api/e (lib/track.ts);
 * the route adds 1 to a per-day total in D1 (binding EVENTS_DB, database
 * latexci-events, table ev, migrations/0001_ev.sql).
 *
 * Privacy: no cookie, no IP address, no User-Agent, no identifier. One row is
 * a daily total per (type, page, target, referrer host). Nothing a visitor
 * types or pastes is ever sent: `x` only carries short ids chosen by the code
 * (a style id, an identifier kind, a symbol slug).
 *
 * Shared by the client (what to send) and the route (what to accept).
 */

/** Every event the counter accepts. `view` = one page shown, `land` = an
 *  arrival from another site (carries the referrer host). */
export const COUNTER_TYPES = [
  "view",
  "land",
  "fmt_copy",       // formatter: copy for Word / plain text (x = style)
  "fmt_download",   // formatter: .txt / .html download (x = style)
  "fmt_add",        // formatter: entry added by identifier (x = doi, arxiv, isbn, pmid)
  "lookup",         // converter: BibTeX entry fetched (x = doi, arxiv, isbn, pmid)
  "handoff",        // converter → formatter link (x = style)
  "bib_clean",      // BibTeX cleaner run
  "word_convert",   // Word file converted
  "pdf_export",     // PDF compiled
  "symbol_copy",    // symbol command copied (x = slug)
  "template_open",  // template opened in the editor (x = template id)
  "cv_download",    // CV builder: cv.tex downloaded
] as const;
export type CounterType = (typeof COUNTER_TYPES)[number];

const TYPE_SET = new Set<string>(COUNTER_TYPES);

/** A longer body is not one of ours: ignored. */
export const MAX_BODY = 1024;

export const COUNTER_SQL =
  "INSERT INTO ev (day, type, page, target, ref, n) VALUES (?1, ?2, ?3, ?4, ?5, 1) " +
  "ON CONFLICT (day, type, page, target, ref) DO UPDATE SET n = n + 1";

/** A site path: "/" then lowercase letters, digits, / _ . - [ ], 160 chars max. */
export const PAGE_RE = /^(?=.{1,160}$)\/[a-z0-9/_.\-[\]]*$/;

/** Shared documents and editor links never leave the browser: only the route. */
export function counterPath(pathname: string): string {
  return pathname.replace(/^(\/shared\/)[^/?#]+/, "$1[token]").toLowerCase();
}

const str = (v: unknown): string =>
  typeof v === "string" ? v : typeof v === "number" || typeof v === "boolean" ? String(v) : "";

/** Short target: letters, digits and . _ / : - only. */
export function cleanTarget(v: unknown): string {
  return str(v).replace(/[^a-zA-Z0-9._/:-]/g, "").slice(0, 80);
}

/** Referrer host only (scheme, port, path and query removed), lowercase. */
export function cleanRef(v: unknown): string {
  return str(v)
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
    .split(/[/?#:]/)[0]
    .replace(/[^a-z0-9.-]/g, "")
    .slice(0, 80);
}

export interface CounterRow {
  type: CounterType;
  page: string;
  target: string;
  ref: string;
}

/** Decoded body → row to count, or null (unknown type, bad path, `land`
 *  without a referrer). */
export function cleanEvent(body: unknown): CounterRow | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const b = body as Record<string, unknown>;
  const type = str(b.t).slice(0, 40);
  if (!TYPE_SET.has(type)) return null;
  const page = str(b.p);
  if (!PAGE_RE.test(page)) return null;
  const land = type === "land";
  const ref = land ? cleanRef(b.r) : "";
  if (land && !ref) return null;
  return { type: type as CounterType, page, target: land || type === "view" ? "" : cleanTarget(b.x), ref };
}

/** Day in Luxembourg time, YYYY-MM-DD (same calendar as the other sites). */
export function luxDay(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Luxembourg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** A send from another site (Origin present and different from the host). */
export function foreignOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (!origin || origin === "null") return false;
  try {
    return new URL(origin).host !== new URL(request.url).host;
  } catch {
    return true;
  }
}
