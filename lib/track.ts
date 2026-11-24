/**
 * lib/track.ts: browser side of the cookieless counter (lib/counter.ts).
 * Read the totals with `node scripts/events-report.mjs 28`.
 *
 * Keep event names stable: renaming splits the history. `x` is a short id
 * chosen by the code (style, identifier kind, slug), never what the visitor
 * typed.
 */
import { counterPath, type CounterType } from "@/lib/counter";

export const COUNTER_ENDPOINT = "/api/e";

/** Fire-and-forget POST to the counter; never throws, never waits. */
export function track(t: CounterType, extra: { x?: string; r?: string } = {}): void {
  try {
    if (typeof window === "undefined") return;
    // Not from an embed inside another site, and not from local development.
    if (window.top !== window.self) return;
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return;
    const body = JSON.stringify({ t, p: counterPath(window.location.pathname), ...extra });
    if (navigator.sendBeacon?.(COUNTER_ENDPOINT, new Blob([body], { type: "application/json" }))) return;
    void fetch(COUNTER_ENDPOINT, { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
  } catch {
    // Blocked, offline, or an old browser: the count is lost, nothing else.
  }
}
