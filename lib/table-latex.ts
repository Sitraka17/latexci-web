/** LaTeX for the table generator (components/TableGenerator.tsx). */

export type Align = "l" | "c" | "r";
export type BorderStyle = "none" | "simple" | "booktabs";

// Single pass: escaping in sequence would re-escape the braces of an earlier
// replacement (\ -> \textbackslash{} -> \textbackslash\{\}).
const LATEX_ESCAPES: Record<string, string> = {
  "\\": "\\textbackslash{}",
  "&": "\\&", "%": "\\%", "$": "\\$", "#": "\\#", "_": "\\_",
  "{": "\\{", "}": "\\}",
  "~": "\\textasciitilde{}",
  "^": "\\textasciicircum{}",
};

export function escapeLatex(text: string): string {
  return text.replace(/[\\&%$#_{}~^]/g, (ch) => LATEX_ESCAPES[ch]);
}

export interface TableOptions {
  data: string[][];
  aligns: Align[];
  borders: BorderStyle;
  headerRow: boolean;
  hlines: boolean;
}

export function buildTableLatex({ data, aligns, borders, headerRow, hlines }: TableOptions): string {
  const colSpec = borders === "simple" ? `|${aligns.join("|")}|` : aligns.join(" ");
  const lines: string[] = [];

  if (borders === "booktabs") {
    // A comment, not \usepackage: this snippet is pasted into the document
    // body, where \usepackage is an error ("Can be used only in preamble").
    lines.push("% Requires \\usepackage{booktabs} in the preamble");
  }

  // htbp: let LaTeX choose; a bare [h] is often refused and becomes [ht].
  // Table captions go above the table, and \label after \caption.
  lines.push("\\begin{table}[htbp]");
  lines.push("  \\centering");
  lines.push("  \\caption{Your caption here}");
  lines.push("  \\label{tab:your-label}");
  lines.push(`  \\begin{tabular}{${colSpec}}`);

  if (borders === "simple") lines.push("    \\hline");
  if (borders === "booktabs") lines.push("    \\toprule");

  data.forEach((row, r) => {
    const isHeader = headerRow && r === 0;
    const isLast = r === data.length - 1;
    if (isHeader) {
      lines.push(`    ${row.map((cell) => (cell ? `\\textbf{${escapeLatex(cell)}}` : " ")).join(" & ")} \\\\`);
      if (borders === "booktabs") lines.push("    \\midrule");
      else if (borders === "simple" || hlines) lines.push("    \\hline");
    } else {
      lines.push(`    ${row.map((cell) => (cell ? escapeLatex(cell) : " ")).join(" & ")} \\\\`);
      if (!isLast && (borders === "simple" || hlines)) lines.push("    \\hline");
    }
  });

  if (borders === "booktabs") lines.push("    \\bottomrule");
  else if (borders === "simple") lines.push("    \\hline");

  lines.push("  \\end{tabular}");
  lines.push("\\end{table}");
  return lines.join("\n");
}
