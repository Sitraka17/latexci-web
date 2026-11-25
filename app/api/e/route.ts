import { getCloudflareContext } from "@opennextjs/cloudflare";
import { COUNTER_SQL, MAX_BODY, cleanEvent, foreignOrigin, luxDay } from "@/lib/counter";

export const dynamic = "force-dynamic";

interface D1Like {
  prepare(sql: string): { bind(...values: unknown[]): { run(): Promise<unknown> } };
}

const noContent = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

/** The D1 binding when this runs on the production Worker, else null
 *  (next dev, Vercel): the counter then drops events quietly. */
async function eventsDb(): Promise<D1Like | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return ((env as Record<string, unknown>).EVENTS_DB as D1Like | undefined) ?? null;
  } catch {
    return null;
  }
}

/**
 * POST /api/e - cookieless counter (lib/counter.ts). Always answers 204 so a
 * page never waits on it or shows an error; a refused or failed event is
 * simply not counted.
 */
export async function POST(request: Request) {
  if (foreignOrigin(request)) return noContent();
  if (Number(request.headers.get("Content-Length") || "0") > MAX_BODY) return noContent();
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY) return noContent();
    body = JSON.parse(text);
  } catch {
    return noContent();
  }
  const ev = cleanEvent(body);
  if (!ev) return noContent();
  const db = await eventsDb();
  if (!db) return noContent();
  try {
    await db.prepare(COUNTER_SQL).bind(luxDay(), ev.type, ev.page, ev.target, ev.ref).run();
  } catch (e) {
    // Nothing personal in this message; the count is lost, the page is not.
    console.error("counter /api/e:", e instanceof Error ? e.message : String(e));
  }
  return noContent();
}

export function GET() {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}
