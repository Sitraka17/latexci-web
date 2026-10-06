/**
 * POST /api/account/delete
 *
 * latexci keeps no account data on its servers: the session is a signed
 * cookie and documents live in the browser. "Deleting the account" therefore
 * means clearing the session and metering cookies (the client also wipes its
 * local documents).
 */
import { NextRequest, NextResponse } from "next/server";
import { HINT_COOKIE, SESSION_COOKIE, getSession } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { limit: 3, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429, headers: rl.headers });

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(HINT_COOKIE);
  return res;
}
