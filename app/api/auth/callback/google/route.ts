/**
 * GET /api/auth/callback/google
 * Exchanges the authorization code, checks the ID token claims and sets the
 * signed session cookie. The ID token comes straight from Google's token
 * endpoint over TLS, so (per OpenID Connect Core 3.1.3.7) its claims are
 * validated without a separate signature check.
 */
import { NextRequest, NextResponse } from "next/server";
import {
  HINT_COOKIE, SESSION_COOKIE, SESSION_MAX_AGE, isAuthConfigured, safeNext, sign, unsign, type Session,
} from "@/lib/session";

export const runtime = "nodejs";

type OAuthState = { state: string; verifier: string; next: string };
type IdClaims = { iss: string; aud: string; sub: string; email?: string; email_verified?: boolean; name?: string; exp: number };

function fail(req: NextRequest, code: string) {
  const res = NextResponse.redirect(new URL(`/auth?error=${code}`, req.url));
  res.cookies.delete({ name: "lx_oauth", path: "/api/auth" });
  return res;
}

export async function GET(req: NextRequest) {
  if (!isAuthConfigured) return fail(req, "unavailable");
  const p = req.nextUrl.searchParams;
  if (p.get("error")) return fail(req, "cancelled");

  const saved = await unsign<OAuthState>(req.cookies.get("lx_oauth")?.value);
  const code = p.get("code");
  if (!saved || !code || p.get("state") !== saved.state) return fail(req, "state");

  let claims: IdClaims;
  try {
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${req.nextUrl.origin}/api/auth/callback/google`,
        grant_type: "authorization_code",
        code_verifier: saved.verifier,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!r.ok) {
      console.error("[auth] token exchange failed:", r.status, (await r.text()).slice(0, 200));
      return fail(req, "exchange");
    }
    const { id_token } = (await r.json()) as { id_token?: string };
    const payload = id_token?.split(".")[1];
    if (!payload) return fail(req, "exchange");
    claims = JSON.parse(Buffer.from(payload, "base64url").toString()) as IdClaims;
  } catch (err) {
    console.error("[auth] token exchange error:", err);
    return fail(req, "exchange");
  }

  const issOk = claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com";
  if (!issOk || claims.aud !== process.env.GOOGLE_CLIENT_ID || claims.exp * 1000 < Date.now()) {
    return fail(req, "token");
  }
  if (!claims.email || claims.email_verified !== true) return fail(req, "email");

  const session: Session = {
    sub: claims.sub,
    email: claims.email.toLowerCase(),
    name: claims.name,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
  const secure = req.nextUrl.protocol === "https:";
  const res = NextResponse.redirect(new URL(safeNext(saved.next), req.url));
  res.cookies.set(SESSION_COOKIE, await sign(session), {
    httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE,
  });
  res.cookies.set(HINT_COOKIE, "1", { httpOnly: false, secure, sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE });
  res.cookies.delete({ name: "lx_oauth", path: "/api/auth" });
  return res;
}
