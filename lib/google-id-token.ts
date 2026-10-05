/**
 * Verify a Google ID token (JWT, RS256) against Google's published keys.
 * Used by the secret-free sign-in flow: the token reaches us through the
 * browser (form_post), so its signature must be checked, unlike a token
 * fetched server-to-server with a client secret.
 */
type Jwk = JsonWebKey & { kid: string };
export type GoogleClaims = {
  iss: string; aud: string; sub: string; exp: number; nonce?: string;
  email?: string; email_verified?: boolean; name?: string;
};

const CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";
let keys: { list: Jwk[]; until: number } | null = null;

async function googleKeys(force = false): Promise<Jwk[]> {
  if (!force && keys && Date.now() < keys.until) return keys.list;
  const r = await fetch(CERTS_URL, { signal: AbortSignal.timeout(5_000) });
  if (!r.ok) throw new Error(`certs HTTP ${r.status}`);
  const maxAge = Number(r.headers.get("cache-control")?.match(/max-age=(\d+)/)?.[1] ?? 3600);
  keys = { list: ((await r.json()) as { keys: Jwk[] }).keys, until: Date.now() + maxAge * 1000 };
  return keys.list;
}

const fromB64url = (s: string) => new Uint8Array(Buffer.from(s, "base64url"));

/** Returns the claims when signature, issuer, audience, expiry and nonce all check out. */
export async function verifyGoogleIdToken(token: string, audience: string, nonce: string): Promise<GoogleClaims | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  let header: { alg?: string; kid?: string };
  let claims: GoogleClaims;
  try {
    header = JSON.parse(Buffer.from(parts[0], "base64url").toString());
    claims = JSON.parse(Buffer.from(parts[1], "base64url").toString());
  } catch {
    return null;
  }
  if (header.alg !== "RS256" || !header.kid) return null;

  let jwk = (await googleKeys()).find((k) => k.kid === header.kid);
  if (!jwk) jwk = (await googleKeys(true)).find((k) => k.kid === header.kid); // key rotation
  if (!jwk) return null;

  const key = await crypto.subtle.importKey(
    "jwk", { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"],
  );
  const ok = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5", key, fromB64url(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  if (!ok) return null;

  const issOk = claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com";
  if (!issOk || claims.aud !== audience || claims.exp * 1000 < Date.now() || claims.nonce !== nonce) return null;
  return claims;
}
