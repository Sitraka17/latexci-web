/**
 * POST /api/word-conversion
 * Word to LaTeX runs in the browser; this only checks that the visitor is
 * signed in (the feature is free but needs an account) and counts the use.
 *   200 { allowed: true }   |   401 { allowed: false, error: "sign_in_required" }
 */
import { NextResponse, after } from "next/server";
import { getSession, isAuthConfigured } from "@/lib/session";
import { recordUsage } from "@/lib/users";

export const runtime = "nodejs";

export async function POST() {
  if (!isAuthConfigured) return NextResponse.json({ allowed: true });
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ allowed: false, error: "sign_in_required", feature: "word_conversion" }, { status: 401 });
  }
  after(() => recordUsage(session, "word"));
  return NextResponse.json({ allowed: true });
}
