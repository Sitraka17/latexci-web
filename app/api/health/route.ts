import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Health check + Supabase keep-warm.
 *
 * Supabase free-tier projects pause after ~7 days of *no database activity*
 * (independent of user count). This route runs one tiny query so a scheduled
 * ping (see .github/workflows/keep-warm.yml) counts as activity and prevents
 * the project from pausing. It also doubles as an uptime probe.
 */
export async function GET() {
  const ts = new Date().toISOString();
  const admin = getAdmin();

  if (!admin) {
    // Env not configured (e.g. preview deploy) — report, don't fail.
    return NextResponse.json({ ok: true, db: "unconfigured", ts });
  }

  try {
    // Lightweight, indexed, head-only count — this is the "activity" that
    // keeps the project warm. Never returns row data.
    const { error } = await admin
      .from("profiles")
      .select("id", { head: true, count: "exact" })
      .limit(1);

    if (error) {
      return NextResponse.json({ ok: false, db: "error", detail: error.message, ts }, { status: 503 });
    }
    return NextResponse.json({ ok: true, db: "up", ts });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ ok: false, db: "unreachable", detail, ts }, { status: 503 });
  }
}
