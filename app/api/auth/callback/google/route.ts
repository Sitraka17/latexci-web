/**
 * POST /api/auth/callback/google  (form_post from Google)
 * Verifies the ID token (signature, issuer, audience, expiry, nonce) and the
 * state, then sets the signed session cookie. GET covers a cancelled sign-in.
 */
import { NextRequest, NextResponse, after } from "next/server";
import {
  HINT_COOKIE, SESSION_COOKIE, SESSION_MAX_AGE, isAuthConfigured, safeNext, sign, unsign, type Session,
} from "@/lib/session";
import { verifyGoogleIdToken } from "@/lib/google-id-token";
import { recordUsage } from "@/lib/users";

export const runtime = "nodejs";

type OAuthState = { state: string; nonce: string; next: string };

function fail(req: NextRequest, code: string) {
  // 303: turn Google's POST into a GET of the sign-in page.
  const res = NextResponse.redirect(new URL(`/auth?error=${code}`, req.url), 303);
  res.cookies.set("lx_oauth", "", { path: "/api/auth", maxAge: 0, secure: true, sameSite: "none" });
  return res;
}

export async function GET(req: NextRequest) {
  return fail(req, req.nextUrl.searchParams.get("error") ? "cancelled" : "state");
}

export async function POST(req: NextRequest) {
  if (!isAuthConfigured) return fail(req, "unavailable");
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail(req, "state");
  }
  if (form.get("error")) return fail(req, "cancelled");

  const saved = await unsign<OAuthState>(req.cookies.get("lx_oauth")?.value);
  const idToken = form.get("id_token");
  if (!saved || typeof idToken !== "string" || form.get("state") !== saved.state) return fail(req, "state");

  let claims;
  try {
    claims = await verifyGoogleIdToken(idToken, process.env.GOOGLE_CLIENT_ID!, saved.nonce);
  } catch (err) {
    console.error("[auth] could not verify ID token:", err);
    return fail(req, "exchange");
  }
  if (!claims) return fail(req, "token");
  if (!claims.email || claims.email_verified !== true) return fail(req, "email");

  const session: Session = {
    sub: claims.sub,
    email: claims.email.toLowerCase(),
    name: claims.name,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
  after(() => recordUsage(session, "signin"));
  const secure = req.nextUrl.protocol === "https:";
  const res = NextResponse.redirect(new URL(safeNext(saved.next), req.url), 303);
  res.cookies.set(SESSION_COOKIE, await sign(session), {
    httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE,
  });
  res.cookies.set(HINT_COOKIE, "1", { httpOnly: false, secure, sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE });
  res.cookies.set("lx_oauth", "", { path: "/api/auth", maxAge: 0, secure: true, sameSite: "none" });
  return res;
}
