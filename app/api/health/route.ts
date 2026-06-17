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

  // Probe the core tables (head-only counts — no row data). Touching the DB
  // is also the "activity" that keeps a free-tier project warm. Reporting which
  // tables exist makes "Failed to create document" diagnosable: a missing
  // `documents` table means the schema wasn't fully applied.
  const probe = async (table: string) => {
    const { error } = await admin.from(table).select("id", { head: true, count: "exact" }).limit(1);
    return error ? error.message : null;
  };

  try {
    const [profilesErr, documentsErr] = await Promise.all([probe("profiles"), probe("documents")]);
    const tables = { profiles: !profilesErr, documents: !documentsErr };
    const ok = tables.profiles && tables.documents;
    return NextResponse.json(
      {
        ok,
        db: ok ? "up" : "degraded",
        tables,
        ...(profilesErr || documentsErr ? { detail: { profiles: profilesErr, documents: documentsErr } } : {}),
        ts,
      },
      { status: ok ? 200 : 503 }
    );
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ ok: false, db: "unreachable", detail, ts }, { status: 503 });
  }
}
