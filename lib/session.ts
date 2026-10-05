/**
 * Google sign-in session, with no database.
 *
 * The session is a signed cookie: base64url(JSON payload) + "." + HMAC-SHA256.
 * Nothing about the user is stored server-side; the plan (free / pro / lab) is
 * read from Stripe on demand (lib/entitlement.ts).
 *
 * Required env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, AUTH_SECRET.
 * Without them sign-in is switched off and every gate fails open.
 */
import { cookies } from "next/headers";

export const SESSION_COOKIE = "lx_session";
/** Non-httpOnly hint so client code can skip /api/auth/me for anonymous visitors. */
export const HINT_COOKIE = "lx_signed_in";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type Session = {
  sub: string;      // Google account id (stable)
  email: string;    // verified by Google
  name?: string;
  exp: number;      // unix seconds
};

export const isAuthConfigured =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET && !!process.env.AUTH_SECRET;

const enc = new TextEncoder();

export function b64url(bytes: ArrayBuffer | Uint8Array): string {
  return Buffer.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)).toString("base64url");
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(process.env.AUTH_SECRET ?? ""), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Sign any small JSON value (session, word-conversion counter). */
export async function sign(value: unknown): Promise<string> {
  const body = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${body}.${await hmac(body)}`;
}

/** Verify and decode a value produced by sign(); null when tampered or malformed. */
export async function unsign<T>(token: string | undefined): Promise<T | null> {
  if (!token || !process.env.AUTH_SECRET) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const body = token.slice(0, dot);
  if (!safeEqual(token.slice(dot + 1), await hmac(body))) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString()) as T;
  } catch {
    return null;
  }
}

export async function readSession(token: string | undefined): Promise<Session | null> {
  const s = await unsign<Session>(token);
  if (!s || typeof s.sub !== "string" || typeof s.email !== "string") return null;
  if (s.exp * 1000 < Date.now()) return null;
  return s;
}

/** Current session in a route handler or server component. */
export async function getSession(): Promise<Session | null> {
  if (!isAuthConfigured) return null;
  const jar = await cookies();
  return readSession(jar.get(SESSION_COOKIE)?.value);
}

/** Only same-site relative paths, never "//evil.com" or absolute URLs. */
export function safeNext(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
