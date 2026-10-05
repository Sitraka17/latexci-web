/**
 * GET /api/auth/google?next=/path
 * Starts the Google OAuth 2.0 authorization-code flow (with PKCE + state).
 */
import { NextRequest, NextResponse } from "next/server";
import { b64url, isAuthConfigured, safeNext, sign } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  if (!isAuthConfigured) {
    return NextResponse.redirect(new URL(`/auth?error=unavailable&next=${encodeURIComponent(next)}`, req.url));
  }

  const state = b64url(crypto.getRandomValues(new Uint8Array(24)));
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));

  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${req.nextUrl.origin}/api/auth/callback/google`,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();

  const res = NextResponse.redirect(auth);
  res.cookies.set("lx_oauth", await sign({ state, verifier, next }), {
    httpOnly: true, secure: req.nextUrl.protocol === "https:", sameSite: "lax", path: "/api/auth", maxAge: 600,
  });
  return res;
}
