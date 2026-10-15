import { describe, expect, it } from "vitest";
import { CATEGORIES, SYMBOLS } from "@/lib/symbols";
import { TEMPLATES } from "@/lib/templates";
import {
  CONFUSABLE_GROUPS,
  TITLE_MAX,
  canonicalSlug,
  canonicalSymbolSlugs,
  caseCounterpart,
  categoryBySlug,
  categorySlug,
  confusedWith,
  hubInfo,
  relatedSymbols,
  symbolBlurb,
  symbolBySlug,
  symbolPageTitle,
} from "@/lib/seo-pages";
import { noteFor } from "@/lib/symbol-notes";

const EM_DASH = String.fromCharCode(0x2014);
const canonical = canonicalSymbolSlugs().map((slug) => symbolBySlug(slug)!);

describe("internal links between symbol pages", () => {
  it("give every canonical symbol page at least 3 inbound links from other symbol pages", () => {
    const inbound = new Map<string, Set<string>>();
    for (const sym of canonical) {
      const from = canonicalSlug(sym);
      const other = caseCounterpart(sym);
      const targets = [...relatedSymbols(sym), ...confusedWith(sym), ...(other ? [other] : [])];
      for (const t of targets) {
        const to = canonicalSlug(t);
        if (to === from) continue;
        if (!inbound.has(to)) inbound.set(to, new Set());
        inbound.get(to)!.add(from);
      }
    }
    const weak = canonical
      .map((s) => [canonicalSlug(s), inbound.get(canonicalSlug(s))?.size ?? 0] as const)
      .filter(([, n]) => n < 3);
    expect(weak).toEqual([]);
  });

  it("centre the related window on the symbol, not on the start of the category", () => {
    const omega = SYMBOLS.find((s) => s.name === "omega")!;
    const related = relatedSymbols(omega).map((s) => s.name);
    expect(related).toContain("psi");
    expect(related).toContain("alpha"); // wraps round
    expect(related).not.toContain("omega");
    expect(new Set(related).size).toBe(related.length);
  });

  it("only name confusables that exist", () => {
    const names = new Set(SYMBOLS.map((s) => s.name));
    for (const g of CONFUSABLE_GROUPS) for (const n of g) expect(names.has(n), n).toBe(true);
    const delta = SYMBOLS.find((s) => s.name === "delta")!;
    expect(confusedWith(delta).map((s) => s.name)).toEqual(["partial", "nabla gradient", "Delta"]);
  });
});

describe("titles", () => {
  it(`fit ${TITLE_MAX} characters before " | latexci" on every symbol page`, () => {
    for (const s of SYMBOLS) {
      const t = symbolPageTitle(s);
      expect(t.length, `${s.name}: ${t}`).toBeLessThanOrEqual(TITLE_MAX);
      // The em dash page names its own subject; nothing else may use one.
      if (s.unicode !== EM_DASH) expect(t, s.name).not.toContain(EM_DASH);
    }
  });

  it("fit on every category hub, with a description Google shows whole", () => {
    for (const c of CATEGORIES) {
      const h = hubInfo(c);
      expect(h.title.length, h.title).toBeLessThanOrEqual(TITLE_MAX);
      expect(h.title.toLowerCase(), h.title).toContain("latex");
      expect(h.description.length, h.description).toBeLessThanOrEqual(158);
      expect(h.title + h.description + h.lede, c).not.toContain(EM_DASH);
      expect(categoryBySlug(categorySlug(c))).toBe(c);
    }
    expect(new Set(CATEGORIES.map((c) => hubInfo(c).title)).size).toBe(CATEGORIES.length);
  });

  it("fit for every template name (the page falls back to the bare name)", () => {
    for (const t of TEMPLATES) expect(t.title.length, t.title).toBeLessThanOrEqual(TITLE_MAX);
  });
});

describe("pages without a note", () => {
  it("each get a sentence of their own", () => {
    const plain = canonical.filter((s) => !noteFor(s.name));
    const blurbs = plain.map(symbolBlurb);
    for (const [i, b] of blurbs.entries()) {
      expect(b.length, plain[i].name).toBeGreaterThan(40);
      if (plain[i].unicode !== EM_DASH) expect(b, plain[i].name).not.toContain(EM_DASH);
    }
    expect(new Set(blurbs).size).toBe(blurbs.length);
  });
});
