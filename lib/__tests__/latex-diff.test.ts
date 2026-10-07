import { describe, it, expect } from "vitest";
import * as Diff from "diff";
import { buildPatch, pairSideBySide } from "../../components/LatexDiff";

const ORIGINAL = "\\section{A}\n\nline one\nline two\n\n\\section{B}\n\nkeep\n";
const REVISED = "\\section{A}\n\nline ONE\nline TWO\nline three\n\n\\section{B}\n\nkeep\nadded\n";

describe("LatexDiff patch export", () => {
  it("produces a patch that applies back to the revised text", () => {
    const patch = buildPatch(ORIGINAL, REVISED);
    expect(patch.startsWith("diff --git a/main.tex b/main.tex\n")).toBe(true);
    expect(patch).toContain("--- a/main.tex");
    expect(patch).toContain("+++ b/main.tex");
    expect(patch).not.toMatch(/^=+$/m);
    expect(patch).not.toContain("@@ -1 +1 @@");
    expect(Diff.applyPatch(ORIGINAL, patch)).toBe(REVISED);
  });

  it("uses the given file name", () => {
    expect(buildPatch("a\n", "b\n", "chapters/intro.tex")).toContain("+++ b/chapters/intro.tex");
  });

  it("keeps blank-line changes", () => {
    const a = "x\ny\n";
    const b = "x\n\n\ny\n";
    expect(Diff.applyPatch(a, buildPatch(a, b))).toBe(b);
  });
});

describe("LatexDiff side-by-side pairing", () => {
  it("pairs a replace block line by line", () => {
    const rows = pairSideBySide(Diff.diffLines("a\nb\nc\nz\n", "A\nB\nz\n"));
    expect(rows).toEqual([
      { left: "a", right: "A", kind: "changed" },
      { left: "b", right: "B", kind: "changed" },
      { left: "c", right: null, kind: "removed" },
      { left: "z", right: "z", kind: "unchanged" },
    ]);
  });

  it("keeps both sides aligned on unchanged lines", () => {
    const rows = pairSideBySide(Diff.diffLines(ORIGINAL, REVISED));
    for (const r of rows.filter(r => r.kind === "unchanged")) expect(r.left).toBe(r.right);
    expect(rows.filter(r => r.left !== null).map(r => r.left).join("\n") + "\n").toBe(ORIGINAL);
    expect(rows.filter(r => r.right !== null).map(r => r.right).join("\n") + "\n").toBe(REVISED);
  });
});
