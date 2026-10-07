/**
 * POST /api/account/delete
 *
 * Deletes the user's record (lib/users.ts) and clears the session cookies;
 * the client also wipes the documents saved in this browser.
 */
import { NextRequest, NextResponse } from "next/server";
import { HINT_COOKIE, SESSION_COOKIE, getSession } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { deleteUser } from "@/lib/users";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { limit: 3, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429, headers: rl.headers });

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await deleteUser(session.sub);
  } catch (err) {
    console.error("[account/delete] could not delete user record:", err);
    return NextResponse.json({ error: "Could not delete your data. Please try again." }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(HINT_COOKIE);
  return res;
}
