import { describe, it, expect } from "vitest";
import { buildTableLatex } from "../table-latex";

const base = {
  data: [["Element", "Mass"], ["H", "1.008"], ["C & O", "12%"]],
  aligns: ["l", "r"] as ("l" | "r")[],
  headerRow: true,
  hlines: false,
};

describe("buildTableLatex", () => {
  it("uses [htbp] and puts caption then label above the tabular", () => {
    const out = buildTableLatex({ ...base, borders: "booktabs" });
    expect(out).toContain("\\begin{table}[htbp]");
    expect(out).not.toContain("[h]");
    const lines = out.split("\n");
    const cap = lines.findIndex((l) => l.includes("\\caption"));
    const lab = lines.findIndex((l) => l.includes("\\label"));
    const tab = lines.findIndex((l) => l.includes("\\begin{tabular}"));
    expect(cap).toBeGreaterThan(-1);
    expect(cap).toBeLessThan(lab);
    expect(lab).toBeLessThan(tab);
  });

  it("produces the full booktabs table", () => {
    expect(buildTableLatex({ ...base, borders: "booktabs" })).toBe([
      "% Requires \\usepackage{booktabs} in the preamble",
      "\\begin{table}[htbp]",
      "  \\centering",
      "  \\caption{Your caption here}",
      "  \\label{tab:your-label}",
      "  \\begin{tabular}{l r}",
      "    \\toprule",
      "    \\textbf{Element} & \\textbf{Mass} \\\\",
      "    \\midrule",
      "    H & 1.008 \\\\",
      "    C \\& O & 12\\% \\\\",
      "    \\bottomrule",
      "  \\end{tabular}",
      "\\end{table}",
    ].join("\n"));
  });

  it("keeps hline rules for the simple style", () => {
    const out = buildTableLatex({ ...base, borders: "simple" });
    expect(out).toContain("\\begin{tabular}{|l|r|}");
    expect(out.match(/\\hline/g)?.length).toBe(4);
  });
});
