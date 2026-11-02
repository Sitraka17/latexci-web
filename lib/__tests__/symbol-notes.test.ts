import { describe, expect, it } from "vitest";
import { SYMBOL_NOTES } from "@/lib/symbol-notes";
import { SYMBOLS } from "@/lib/symbols";

const entries = Object.entries(SYMBOL_NOTES);

describe("symbol notes", () => {
  it("are keyed by an existing symbol name", () => {
    const names = new Set(SYMBOLS.map((s) => s.name));
    for (const [name] of entries) expect(names.has(name), name).toBe(true);
  });

  it("have at least two variants, each with a use", () => {
    for (const [name, note] of entries) {
      expect(note.variants.length, name).toBeGreaterThanOrEqual(2);
      for (const v of note.variants) {
        expect(v.code.trim().length, name).toBeGreaterThan(0);
        expect(v.use.trim().length, name).toBeGreaterThan(0);
      }
    }
  });
});

describe("search snippets", () => {
  const withSeo = entries.filter(([, n]) => n.seo);

  it("exist for every note", () => {
    expect(withSeo.length).toBe(entries.length);
  });

  it("fit Google's limits and the house style", () => {
    for (const [name, note] of withSeo) {
      const { title, description } = note.seo!;
      expect(title.length, `${name} title`).toBeLessThanOrEqual(55); // + " | latexci"
      expect(description.length, `${name} description`).toBeGreaterThanOrEqual(110);
      expect(description.length, `${name} description`).toBeLessThanOrEqual(158);
      expect(title + description, name).not.toContain(String.fromCharCode(0x2014)); // em dash
      expect(title.toLowerCase(), `${name} title`).toContain("latex");
    }
  });

  it("only promise commands the page documents", () => {
    // Every backslash command named in a title must appear in the note itself
    // (variants, pitfall or example), so the snippet never oversells the page.
    for (const [name, note] of withSeo) {
      const body = JSON.stringify(note.variants) + (note.pitfall ?? "") + (note.example?.code ?? "");
      const cmds = note.seo!.title.match(/\\[a-zA-Z]+/g) ?? [];
      for (const c of cmds) expect(body.includes(c), `${name}: ${c}`).toBe(true);
    }
  });

  it("have unique titles", () => {
    const titles = withSeo.map(([, n]) => n.seo!.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

// Pages with the most impressions and almost no clicks (Search Console,
// 4 to 31 Oct 2026, docs of 2 Nov): rewritten so the full <title>, brand
// included, fits 60 characters and the description 155.
describe("rewritten snippets, November 2026", () => {
  const rewritten = ["delta", "iff", "hbar Planck", "normal distribution", "indicator function", "Delta"];
  it("fit 60 / 155 characters and name the command searched", () => {
    for (const name of rewritten) {
      const seo = SYMBOL_NOTES[name]?.seo;
      expect(seo, name).toBeDefined();
      expect((seo!.title + " | latexci").length, seo!.title).toBeLessThanOrEqual(60);
      expect(seo!.description.length, name).toBeLessThanOrEqual(155);
      expect(seo!.title, name).toMatch(/\\[a-zA-Z]+/);
    }
  });
});
