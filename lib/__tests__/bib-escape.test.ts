import { describe, it, expect } from "vitest";
import {
  arxivAuthors, decodeXmlEntities, escapeLatex, normalizeDoi, parseIsbn, pubmedAuthor,
} from "../bib-escape";

describe("decodeXmlEntities", () => {
  it("decodes named and numeric entities in one pass", () => {
    expect(decodeXmlEntities("a &amp;= b &lt;c&gt; &quot;q&quot; it&#39;s &#x3B1;")).toBe(
      "a &= b <c> \"q\" it's α",
    );
    expect(decodeXmlEntities("&amp;lt;")).toBe("&lt;");
    expect(decodeXmlEntities("&unknown;")).toBe("&unknown;");
  });
});

describe("escapeLatex", () => {
  it("escapes & % $ # _ and a bare ^", () => {
    expect(escapeLatex("Computers & Security 100% $5 #1 a_b x^2")).toBe(
      "Computers \\& Security 100\\% \\$5 \\#1 a\\_b x\\^{}2",
    );
  });
  it("does not double-escape", () => {
    const once = escapeLatex("R&D_1");
    expect(escapeLatex(once)).toBe(once);
    expect(escapeLatex("A \\& B")).toBe("A \\& B");
  });
  it("keeps balanced braces and escapes unbalanced ones", () => {
    expect(escapeLatex("The {DNA} code")).toBe("The {DNA} code");
    expect(escapeLatex("broken } brace {")).toBe("broken \\} brace \\{");
  });
  it("keeps balanced math with keepMath", () => {
    expect(escapeLatex("Bounds on $O(n_1)$ & more", { keepMath: true })).toBe(
      "Bounds on $O(n_1)$ \\& more",
    );
    expect(escapeLatex("costs $5", { keepMath: true })).toBe("costs \\$5");
  });
});

describe("arxivAuthors", () => {
  it("reads <name> only, never the affiliation", () => {
    const entry = `<entry><author><name>Diego J. Cirilo-Lombardo</name>
      <arxiv:affiliation>CONICET</arxiv:affiliation></author>
      <author><name>A &amp; B Lab</name></author></entry>`;
    expect(arxivAuthors(entry)).toEqual(["Diego J. Cirilo-Lombardo", "A & B Lab"]);
  });
});

describe("normalizeDoi", () => {
  it.each([
    ["doi:10.1038/nature12373"],
    ["DOI: 10.1038/nature12373"],
    ["https://doi.org/10.1038/nature12373"],
    ["http://dx.doi.org/10.1038/nature12373"],
    ["doi.org/10.1038/nature12373"],
    ["https://doi.org/10.1038%2Fnature12373"],
  ])("%s", raw => {
    expect(normalizeDoi(raw)).toBe("10.1038/nature12373");
  });
});

describe("parseIsbn", () => {
  it("strips the ISBN label before reading digits", () => {
    expect(parseIsbn("ISBN-13: 9780134685991")).toEqual({ ok: true, isbn: "9780134685991" });
    expect(parseIsbn("ISBN 978-0-262-03561-3")).toEqual({ ok: true, isbn: "9780262035613" });
    expect(parseIsbn("isbn10:0-306-40615-2")).toEqual({ ok: true, isbn: "0306406152" });
    expect(parseIsbn("080442957X")).toEqual({ ok: true, isbn: "080442957X" });
  });
  it("rejects bad check digits and lengths", () => {
    expect(parseIsbn("9780262035614").ok).toBe(false);
    expect(parseIsbn("0306406153").ok).toBe(false);
    expect(parseIsbn("12345").ok).toBe(false);
    expect(parseIsbn("ISBN-13: 97801346859910").ok).toBe(false);
  });
});

describe("pubmedAuthor", () => {
  const bib = (name: string, authtype = "Author") => pubmedAuthor({ name, authtype }).bib;
  it("splits family name and initials", () => {
    expect(bib("Polack FP")).toBe("Polack, F. P.");
    expect(bib("Pérez Marc G")).toBe("Pérez Marc, G.");
    expect(bib("Türeci Ö")).toBe("Türeci, Ö.");
  });
  it("handles suffixes and particles", () => {
    expect(bib("Frenck RW Jr")).toBe("Frenck, Jr, R. W.");
    expect(bib("de Azevedo WF Jr")).toBe("de Azevedo, Jr, W. F.");
    expect(bib("Smith JA III")).toBe("Smith, III, J. A.");
    expect(bib("Smith V")).toBe("Smith, V.");
  });
  it("braces collective names", () => {
    expect(bib("C4591001 Clinical Trial Group", "CollectiveName")).toBe("{C4591001 Clinical Trial Group}");
    expect(bib("R&D Group", "CollectiveName")).toBe("{R\\&D Group}");
  });
  it("gives a family name for the cite key", () => {
    expect(pubmedAuthor({ name: "de Azevedo WF Jr" }).family).toBe("Azevedo");
  });
});
