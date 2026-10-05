/** POST /api/auth/signout: clears the session cookies. */
import { NextResponse } from "next/server";
import { HINT_COOKIE, SESSION_COOKIE } from "@/lib/session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(HINT_COOKIE);
  return res;
}
