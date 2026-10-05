import { describe, it, expect } from "vitest";
import { escapeLatex } from "../../components/TableGenerator";

describe("TableGenerator escapeLatex", () => {
  it("escapes a backslash without re-escaping its braces", () => {
    expect(escapeLatex("a\\b")).toBe("a\\textbackslash{}b");
  });

  it("escapes every special character in one pass", () => {
    expect(escapeLatex("& % $ # _ { } ~ ^")).toBe(
      "\\& \\% \\$ \\# \\_ \\{ \\} \\textasciitilde{} \\textasciicircum{}",
    );
  });

  it("leaves plain text alone", () => {
    expect(escapeLatex("Smith, J. (2020)")).toBe("Smith, J. (2020)");
  });
});
