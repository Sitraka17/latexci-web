/**
 * POST /api/word-conversion
 *
 * Gate + counter for Word → LaTeX conversions. The conversion itself runs in
 * the browser; this only meters it.
 *
 * Free tier: 3 conversions per calendar month for signed-in users, counted in
 * a signed cookie (no database). Clearing cookies resets it; acceptable for a
 * feature that costs us nothing to serve. Paid tiers: unlimited.
 * Sign-in or Stripe not configured: everyone allowed, unmetered (nobody could pay).
 *
 * Returns:
 *   200 { allowed: true,  used: N, limit: 3, remaining: R }
 *   200 { allowed: true,  used: null, limit: null, remaining: null }   paid / unmetered
 *   403 { allowed: false, error: "sign_in_required" | "upgrade_required", feature }
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, isAuthConfigured, sign, unsign } from "@/lib/session";
import { getTier, isBillingConfigured, isPaid } from "@/lib/entitlement";

export const runtime = "nodejs";

const FREE_LIMIT = 3;
const COUNTER_COOKIE = "lx_wc";

type Counter = { sub: string; period: string; n: number };

function currentPeriod(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function POST() {
  if (!isAuthConfigured || !isBillingConfigured) {
    return NextResponse.json({ allowed: true, used: 0, limit: null, remaining: null, degraded: true });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { allowed: false, error: "sign_in_required", feature: "word_conversion" },
      { status: 403 },
    );
  }

  if (isPaid(await getTier(session))) {
    return NextResponse.json({ allowed: true, used: null, limit: null, remaining: null });
  }

  const jar = await cookies();
  const period = currentPeriod();
  const saved = await unsign<Counter>(jar.get(COUNTER_COOKIE)?.value);
  const used = saved && saved.sub === session.sub && saved.period === period ? saved.n : 0;

  if (used >= FREE_LIMIT) {
    return NextResponse.json(
      { allowed: false, used, limit: FREE_LIMIT, remaining: 0, error: "upgrade_required", feature: "word_conversion" },
      { status: 403 },
    );
  }

  const res = NextResponse.json({ allowed: true, used: used + 1, limit: FREE_LIMIT, remaining: FREE_LIMIT - used - 1 });
  res.cookies.set(COUNTER_COOKIE, await sign({ sub: session.sub, period, n: used + 1 } satisfies Counter), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/word-conversion",
    maxAge: 60 * 60 * 24 * 40,
  });
  return res;
}
