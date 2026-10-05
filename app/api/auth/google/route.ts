/**
 * GET /api/auth/google?next=/path
 * Starts OpenID Connect sign-in with Google. No client secret: Google posts a
 * signed ID token back (response_mode=form_post) and the callback verifies it
 * against Google's public keys, with state and nonce bound to this browser.
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
  const nonce = b64url(crypto.getRandomValues(new Uint8Array(24)));

  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${req.nextUrl.origin}/api/auth/callback/google`,
    response_type: "id_token",
    response_mode: "form_post",
    scope: "openid email profile",
    state,
    nonce,
    prompt: "select_account",
  }).toString();

  const res = NextResponse.redirect(auth);
  // SameSite=None: Google's form_post is a cross-site POST, which drops Lax cookies.
  res.cookies.set("lx_oauth", await sign({ state, nonce, next }), {
    httpOnly: true, secure: true, sameSite: "none", path: "/api/auth", maxAge: 600,
  });
  return res;
}
