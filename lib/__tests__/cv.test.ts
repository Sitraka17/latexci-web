import { describe, it, expect } from "vitest";
import { tex, generateCv, unsupportedChars, EXAMPLE_CV, type CvData } from "../cv";
import { SYMBOL_NOTES } from "../symbol-notes";
import { SYMBOLS } from "../symbols";

describe("tex() escaping", () => {
  it("escapes every LaTeX special character", () => {
    expect(tex("R&D 100% $5 #1 a_b {x} ~ ^")).toBe(
      "R\\&D 100\\% \\$5 \\#1 a\\_b \\{x\\} \\textasciitilde{} \\textasciicircum{}",
    );
  });
  it("maps Greek letters and common symbols, keeps accents", () => {
    expect(tex("β-catenin")).toBe("\\ensuremath{\\beta}-catenin");
    expect(tex("€ ± ≤")).toBe("\\texteuro{} \\ensuremath{\\pm} \\ensuremath{\\leq}");
    expect(tex("Zoë, José, Ça’")).toBe("Zoë, José, Ça’");
  });
  it("replaces characters pdfLaTeX cannot typeset and reports them", () => {
    expect(tex("中文 ok")).toBe("?? ok");
    expect(unsupportedChars({ ...EXAMPLE_CV, name: "李 Smith 😀" })).toEqual(["李", "😀"]);
  });
  it("turns a backslash into text, never a command", () => {
    expect(tex("\\input{secret}")).toBe("\\textbackslash{}input\\{secret\\}");
  });
});

const combos: CvData[] = (["academic", "industry"] as const).flatMap((layout) =>
  (["en", "fr"] as const).map((lang) => ({ ...EXAMPLE_CV, layout, lang, photo: layout === "industry" })),
);

describe("generateCv", () => {
  it.each(combos.map((c) => [`${c.layout}/${c.lang}`, c] as const))("%s is a complete document", (_, c) => {
    const out = generateCv(c);
    expect(out).toMatch(/^\\documentclass/);
    expect(out.trim().endsWith("\\end{document}")).toBe(true);
    expect(out).toContain(c.lang === "fr" ? "[french]{babel}" : "[english]{babel}");
    expect(out).toContain("Dr Jane Smith");
    // Braces must balance once escaped braces are ignored.
    const bare = out.replace(/\\[{}]/g, "");
    expect((bare.match(/{/g) ?? []).length).toBe((bare.match(/}/g) ?? []).length);
  });

  it("escapes hostile input in every field", () => {
    const out = generateCv({ ...EXAMPLE_CV, name: "A & B \\def\\x{}", summary: "100% {bad} $x$" });
    expect(out).toContain("A \\& B \\textbackslash{}def\\textbackslash{}x\\{\\}");
    expect(out).toContain("100\\% \\{bad\\} \\$x\\$");
  });

  it("omits empty sections", () => {
    const out = generateCv({ ...EXAMPLE_CV, publications: [], skills: "", languages: "" });
    expect(out).not.toContain("Publications");
    expect(out).not.toContain("tabular");
  });

  it("uses French section headings in French", () => {
    expect(generateCv({ ...EXAMPLE_CV, lang: "fr" })).toContain("\\cvsect{Formation}");
  });
});

describe("symbol notes", () => {
  it("only annotates symbols that exist", () => {
    const names = new Set(SYMBOLS.map((s) => s.name));
    for (const name of Object.keys(SYMBOL_NOTES)) expect(names.has(name)).toBe(true);
  });
  it("lists at least two variants per note", () => {
    for (const n of Object.values(SYMBOL_NOTES)) expect(n.variants.length).toBeGreaterThanOrEqual(2);
  });
});
