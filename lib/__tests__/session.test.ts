import { describe, expect, it, beforeAll, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-for-vitest-only";
});

describe("signed values", () => {
  it("round-trips and rejects tampering", async () => {
    const { sign, unsign } = await import("@/lib/session");
    const token = await sign({ a: 1 });
    expect(await unsign(token)).toEqual({ a: 1 });
    const [body, mac] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ a: 2 })).toString("base64url");
    expect(await unsign(`${forged}.${mac}`)).toBeNull();
    expect(await unsign(`${body}.x${mac.slice(1)}`)).toBeNull();
    expect(await unsign("garbage")).toBeNull();
    expect(await unsign(undefined)).toBeNull();
  });

  it("refuses expired sessions", async () => {
    const { sign, readSession } = await import("@/lib/session");
    const now = Math.floor(Date.now() / 1000);
    const ok = await sign({ sub: "1", email: "a@b.c", exp: now + 60 });
    const old = await sign({ sub: "1", email: "a@b.c", exp: now - 60 });
    expect((await readSession(ok))?.email).toBe("a@b.c");
    expect(await readSession(old)).toBeNull();
  });
});

describe("safeNext", () => {
  it("only allows same-site relative paths", async () => {
    const { safeNext } = await import("@/lib/session");
    expect(safeNext("/pricing")).toBe("/pricing");
    expect(safeNext("//evil.com")).toBe("/dashboard");
    expect(safeNext("/\\evil.com")).toBe("/dashboard");
    expect(safeNext("https://evil.com")).toBe("/dashboard");
    expect(safeNext(null)).toBe("/dashboard");
  });
});
