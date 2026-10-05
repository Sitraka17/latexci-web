import { beforeAll, describe, expect, it, vi } from "vitest";
import { verifyGoogleIdToken } from "@/lib/google-id-token";

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
let priv: CryptoKey;
let other: CryptoKey;

async function token(claims: Record<string, unknown>, key = priv, kid = "k1") {
  const head = `${b64({ alg: "RS256", kid })}.${b64(claims)}`;
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(head));
  return `${head}.${Buffer.from(sig).toString("base64url")}`;
}

beforeAll(async () => {
  const alg = { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" };
  const pair = (await crypto.subtle.generateKey(alg, true, ["sign", "verify"])) as CryptoKeyPair;
  priv = pair.privateKey;
  other = ((await crypto.subtle.generateKey(alg, true, ["sign", "verify"])) as CryptoKeyPair).privateKey;
  const jwk = { ...(await crypto.subtle.exportKey("jwk", pair.publicKey)), kid: "k1" };
  vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ keys: [jwk] }), { headers: { "cache-control": "max-age=60" } }));
});

const base = () => ({
  iss: "https://accounts.google.com", aud: "client-1", sub: "42", nonce: "n1",
  email: "a@b.c", email_verified: true, exp: Math.floor(Date.now() / 1000) + 300,
});

describe("verifyGoogleIdToken", () => {
  it("accepts a valid token", async () => {
    expect((await verifyGoogleIdToken(await token(base()), "client-1", "n1"))?.sub).toBe("42");
  });
  it("rejects a token signed by another key", async () => {
    expect(await verifyGoogleIdToken(await token(base(), other), "client-1", "n1")).toBeNull();
  });
  it("rejects wrong audience, nonce, issuer or expiry", async () => {
    expect(await verifyGoogleIdToken(await token(base()), "client-2", "n1")).toBeNull();
    expect(await verifyGoogleIdToken(await token(base()), "client-1", "n2")).toBeNull();
    expect(await verifyGoogleIdToken(await token({ ...base(), iss: "https://evil" }), "client-1", "n1")).toBeNull();
    expect(await verifyGoogleIdToken(await token({ ...base(), exp: 1 }), "client-1", "n1")).toBeNull();
  });
  it("rejects tampered claims and garbage", async () => {
    const [h, , s] = (await token(base())).split(".");
    expect(await verifyGoogleIdToken(`${h}.${b64({ ...base(), sub: "1" })}.${s}`, "client-1", "n1")).toBeNull();
    expect(await verifyGoogleIdToken("x.y", "client-1", "n1")).toBeNull();
  });
});
