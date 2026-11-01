import { describe, expect, it } from "vitest";
import { classify, nextEnvNames, parseDotenv, scanText } from "../../scripts/cf-guard-lib.mjs";

// Obviously fake values, built at runtime so no token-shaped literal sits in the repo.
const fakeBlob = ["vercel", "blob", "rw", "FAKEstore1234", "FAKEFAKEFAKEFAKEFAKE0000"].join("_");
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const fakeOidc = `${b64({ alg: "none", typ: "JWT" })}.${b64({ iss: "https://oidc.vercel.com/fake-team" })}.FAKEsignatureFAKE`;
const otherJwt = `${b64({ alg: "none", typ: "JWT" })}.${b64({ iss: "https://accounts.google.com" })}.FAKEsignatureFAKE`;

describe("cf-guard helpers", () => {
  it("parses dotenv lines with quotes and comments", () => {
    const env = parseDotenv('A="x y"\nexport B=plain # note\n# C=no\nD=\'q\'\n');
    expect(env).toEqual({ A: "x y", B: "plain", D: "q" });
  });

  it("classifies latexci secrets by name and by shape", () => {
    expect(classify("BLOB_READ_WRITE_TOKEN", "fake-value-123")).toBe("fail");
    expect(classify("AUTH_SECRET", "fake-value-123")).toBe("fail");
    expect(classify("GOOGLE_CLIENT_ID", "fake-id.apps.example")).toBe("fail");
    expect(classify("SOMETHING", fakeBlob)).toBe("fail");
    expect(classify("ADMIN_EMAILS", "admin@example.test")).toBe("warn");
    expect(classify("NEXT_PUBLIC_SITE_URL", "https://latexci.com")).toBeNull();
    expect(classify("AUTH_SECRET", "short")).toBeNull();
  });

  it("finds Blob tokens and Vercel OIDC JWTs by shape only", () => {
    expect(scanText(`const t="${fakeBlob}";`)).toContain("jeton Vercel Blob (vercel_blob_rw_)");
    expect(scanText(`x=${fakeOidc}`)).toContain("jeton OIDC Vercel (JWT)");
    expect(scanText(`x=${otherJwt}`)).toEqual([]);
    expect(scanText("export const production = {};")).toEqual([]);
  });

  it("lists next-env.mjs names, never values", () => {
    const src = 'export const production = {"BLOB_READ_WRITE_TOKEN":"v","A_B":"w"};\n';
    expect(nextEnvNames(src)).toEqual(["BLOB_READ_WRITE_TOKEN", "A_B"]);
  });
});
