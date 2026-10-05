import { describe, it, expect } from "vitest";
import { cleanBibTeX, formatEntry, normalizeAuthors, parseBibTeX } from "../bibtex";

describe("parseBibTeX", () => {
  it("parses paren-delimited entries", () => {
    const [e] = parseBibTeX(`@book(knuth84, title = "The {\\TeX}book (vol. A)", year = 1984)`);
    expect(e.type).toBe("book");
    expect(e.key).toBe("knuth84");
    expect(e.fields.title).toBe("The {\\TeX}book (vol. A)");
    expect(e.fields.year).toBe("1984");
  });

  it("expands @string macros, including in concatenations", () => {
    const src = `@string{jgr = "J. Geophys. Res."}
@STRING(pub = {Wiley})
@article{a, journal = jgr, publisher = pub # " & Sons", note = "Vol " # 3 # {, part B}}`;
    const entries = parseBibTeX(src);
    expect(entries).toHaveLength(1);
    expect(entries[0].fields.journal).toBe("J. Geophys. Res.");
    expect(entries[0].fields.publisher).toBe("Wiley & Sons");
    expect(entries[0].fields.note).toBe("Vol 3, part B");
    expect(entries[0].bare).toBeUndefined();
  });

  it("keeps undefined macros bare (month = jan)", () => {
    const [e] = parseBibTeX(`@article{a, month = jan, year = 2020}`);
    expect(e.fields.month).toBe("jan");
    expect(e.bare).toEqual(["month"]);
    expect(formatEntry(e, false)).toContain("month        = jan");
    expect(formatEntry(e, false)).toContain("year         = {2020}");
  });

  it("keeps a concatenation with an undefined macro as a bare expression", () => {
    const [e] = parseBibTeX(`@article{a, month = jan # "~15"}`);
    expect(e.fields.month).toBe('jan # {~15}');
    expect(formatEntry(e, false)).toContain("month        = jan # {~15}");
  });

  it("skips @comment and @preamble blocks", () => {
    const entries = parseBibTeX(`@comment{ignore @article{x, title={no}} }
@preamble{"\\newcommand{\\x}{y}"}
@misc{real, title={Yes}}`);
    expect(entries.map(e => e.key)).toEqual(["real"]);
  });
});

describe("normalizeAuthors", () => {
  it("keeps braced corporate names intact", () => {
    expect(normalizeAuthors("{World Health Organization} and John Smith")).toBe(
      "{World Health Organization} and Smith, John",
    );
    expect(normalizeAuthors("{Barnes and Noble}")).toBe("{Barnes and Noble}");
  });
  it("keeps von particles with the family name", () => {
    expect(normalizeAuthors("Ludwig van Beethoven")).toBe("van Beethoven, Ludwig");
  });
  it("leaves Last, First names unchanged", () => {
    expect(normalizeAuthors("Doe, Jane and others")).toBe("Doe, Jane and others");
  });
});

describe("cleanBibTeX", () => {
  it("round-trips @string, paren entries and bare months", () => {
    const { output, stats } = cleanBibTeX(
      `@string{n = "Nature"}\n@article(k1, journal = n, month = feb, author = {{World Health Organization}})`,
      { normalizeAuthors: true, uppercaseTypes: false },
    );
    expect(stats.total).toBe(1);
    expect(output).toContain("journal      = {Nature}");
    expect(output).toContain("month        = feb");
    expect(output).toContain("author       = {{World Health Organization}}");
  });
});
