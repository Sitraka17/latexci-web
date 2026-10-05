/**
 * GET /api/auth/me[?fresh=1]
 * { configured, user: { email, name } | null, tier }. `fresh=1` skips the
 * entitlement cache (used right after a Stripe checkout).
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession, isAuthConfigured } from "@/lib/session";
import { getTier } from "@/lib/entitlement";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  const session = await getSession();
  if (!session) return NextResponse.json({ configured: isAuthConfigured, user: null, tier: "free" }, { headers });

  const fresh = req.nextUrl.searchParams.get("fresh") === "1";
  if (fresh) {
    const rl = rateLimit(req, { limit: 10, windowMs: 60_000 });
    if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429, headers: rl.headers });
  }
  const tier = await getTier(session, { fresh });
  return NextResponse.json(
    { configured: true, user: { email: session.email, name: session.name ?? null }, tier },
    { headers },
  );
}
