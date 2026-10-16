/**
 * POST /api/word-conversion
 * Word to LaTeX runs in the browser; this only decides whether the visitor
 * may convert and counts the use. The first file is free without an account
 * (the tool has to prove itself before asking for anything); from the second
 * one a free Google sign-in is needed.
 *   200 { allowed: true, anonymous?: true }
 *   401 { allowed: false, error: "sign_in_required" }
 */
import { NextRequest, NextResponse, after } from "next/server";
import { getSession, isAuthConfigured, sign, unsign } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { recordUsage } from "@/lib/users";

export const runtime = "nodejs";

/** Signed count of anonymous conversions in this browser. */
const FREE_COOKIE = "lx_wf";
/** Readable flag so the page can word its sign-in note before the drop. */
const FREE_USED_HINT = "lx_wf_used";
const FREE_CONVERSIONS = 1;
const YEAR = 60 * 60 * 24 * 365;

export async function POST(req: NextRequest) {
  if (!isAuthConfigured) return NextResponse.json({ allowed: true });
  const session = await getSession();
  if (session) {
    after(() => recordUsage(session, "word"));
    return NextResponse.json({ allowed: true });
  }

  const rl = rateLimit(req, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429, headers: rl.headers });

  const used = (await unsign<{ n: number }>(req.cookies.get(FREE_COOKIE)?.value))?.n ?? 0;
  if (used >= FREE_CONVERSIONS) {
    return NextResponse.json({ allowed: false, error: "sign_in_required", feature: "word_conversion" }, { status: 401 });
  }
  const res = NextResponse.json({ allowed: true, anonymous: true });
  const secure = req.nextUrl.protocol === "https:";
  res.cookies.set(FREE_COOKIE, await sign({ n: used + 1 }), { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: YEAR });
  res.cookies.set(FREE_USED_HINT, "1", { httpOnly: false, secure, sameSite: "lax", path: "/", maxAge: YEAR });
  return res;
}
