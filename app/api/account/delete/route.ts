/**
 * POST /api/account/delete
 *
 * latexci keeps no account data on its servers: the session is a signed
 * cookie and documents live in the browser. "Deleting the account" therefore
 * means clearing the session and metering cookies (the client also wipes its
 * local documents). Billing records stay with Stripe, as required for tax
 * purposes; an active subscription must be cancelled first.
 */
import { NextRequest, NextResponse } from "next/server";
import { HINT_COOKIE, SESSION_COOKIE, getSession } from "@/lib/session";
import { getTier, isPaid } from "@/lib/entitlement";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { limit: 3, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429, headers: rl.headers });

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isPaid(await getTier(session, { fresh: true }))) {
    return NextResponse.json(
      { error: "active_subscription", message: "Cancel your subscription first (link in the receipt email from Stripe), then delete." },
      { status: 409 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(HINT_COOKIE);
  res.cookies.delete({ name: "lx_wc", path: "/api/word-conversion" });
  return res;
}
