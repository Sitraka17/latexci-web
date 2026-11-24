import { describe, expect, it } from "vitest";
import { cleanEvent, cleanRef, cleanTarget, counterPath, foreignOrigin, luxDay } from "../counter";

describe("cleanEvent", () => {
  it("accepts a page view and drops any target", () => {
    expect(cleanEvent({ t: "view", p: "/tools/bibtex-to-apa", x: "ignored" }))
      .toEqual({ type: "view", page: "/tools/bibtex-to-apa", target: "", ref: "" });
  });

  it("keeps a short target on a tool event", () => {
    expect(cleanEvent({ t: "fmt_copy", p: "/tools/bibtex-to-apa", x: "apa:text" })?.target).toBe("apa:text");
    expect(cleanEvent({ t: "lookup", p: "/tools/doi-to-bibtex", x: "doi" })?.target).toBe("doi");
  });

  it("needs a referrer host for an arrival", () => {
    expect(cleanEvent({ t: "land", p: "/", r: "https://www.bing.com/search?q=x" })?.ref).toBe("www.bing.com");
    expect(cleanEvent({ t: "land", p: "/" })).toBeNull();
  });

  it("refuses unknown types, bad paths and non-objects", () => {
    expect(cleanEvent({ t: "purchase", p: "/" })).toBeNull();
    expect(cleanEvent({ t: "view", p: "https://evil.example/" })).toBeNull();
    expect(cleanEvent({ t: "view", p: "/Tools?q=secret" })).toBeNull();
    expect(cleanEvent(["view"])).toBeNull();
    expect(cleanEvent(null)).toBeNull();
  });
});

describe("helpers", () => {
  it("strips anything a visitor could have typed from targets", () => {
    expect(cleanTarget("10.1093/comjnl <script>")).toBe("10.1093/comjnlscript");
    expect(cleanTarget("x".repeat(200))).toHaveLength(80);
  });

  it("keeps the referrer host only", () => {
    expect(cleanRef("https://Duckduckgo.com:443/?q=latex")).toBe("duckduckgo.com");
  });

  it("hides shared-document tokens", () => {
    expect(counterPath("/shared/AbC123")).toBe("/shared/[token]");
    expect(counterPath("/Tools/Symbols/Delta")).toBe("/tools/symbols/delta");
  });

  it("dates in Luxembourg time", () => {
    expect(luxDay(new Date("2026-11-24T23:30:00Z"))).toBe("2026-11-25");
  });

  it("flags a send from another site", () => {
    const req = (origin?: string) =>
      new Request("https://latexci.com/api/e", { method: "POST", headers: origin ? { Origin: origin } : {} });
    expect(foreignOrigin(req("https://latexci.com"))).toBe(false);
    expect(foreignOrigin(req())).toBe(false);
    expect(foreignOrigin(req("https://evil.example"))).toBe(true);
  });
});
