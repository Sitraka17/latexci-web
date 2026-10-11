"use client";
import { useState, useCallback, useMemo } from "react";

type Align = "l" | "c" | "r";

const DEFAULT_ROWS = 4;
const DEFAULT_COLS = 3;

// Starting content, so the preview shows a real table instead of bare rules.
const SAMPLE: string[][] = [
  ["Element", "Symbol", "Atomic mass"],
  ["Hydrogen", "H", "1.008"],
  ["Carbon", "C", "12.011"],
  ["Oxygen", "O", "15.999"],
];
const SAMPLE_ALIGNS: Align[] = ["l", "c", "r"];

const ALIGN_NAME: Record<Align, "left" | "center" | "right"> = { l: "left", c: "center", r: "right" };

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

function makeGrid(rows: number, cols: number, old?: string[][]): string[][] {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => old?.[r]?.[c] ?? "")
  );
}

function makeAligns(cols: number, old?: Align[]): Align[] {
  return Array.from({ length: cols }, (_, c) => old?.[c] ?? "l");
}

export default function TableGenerator() {
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [data, setData] = useState(() => makeGrid(DEFAULT_ROWS, DEFAULT_COLS, SAMPLE));
  const [aligns, setAligns] = useState<Align[]>(() => makeAligns(DEFAULT_COLS, SAMPLE_ALIGNS));
  const [headerRow, setHeaderRow] = useState(true);
  const [borders, setBorders] = useState<"none" | "simple" | "booktabs">("booktabs");
  const [hlines, setHlines] = useState(false);
  const [copied, setCopied] = useState(false);

  const setCell = useCallback((r: number, c: number, val: string) => {
    setData((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = val;
      return next;
    });
  }, []);

  const addRow = () => {
    setRows((n) => n + 1);
    setData((prev) => [...prev, Array(cols).fill("")]);
  };
  const removeRow = () => {
    if (rows <= 2) return;
    setRows((n) => n - 1);
    setData((prev) => prev.slice(0, -1));
  };
  const addCol = () => {
    setCols((n) => n + 1);
    setData((prev) => prev.map((row) => [...row, ""]));
    setAligns((prev) => [...prev, "l"]);
  };
  const removeCol = () => {
    if (cols <= 2) return;
    setCols((n) => n - 1);
    setData((prev) => prev.map((row) => row.slice(0, -1)));
    setAligns((prev) => prev.slice(0, -1));
  };
  const clearAll = () => setData(makeGrid(rows, cols));
  const setAlign = (c: number, a: Align) => {
    setAligns((prev) => prev.map((v, i) => (i === c ? a : v)));
  };

  // ── Generate LaTeX ─────────────────────────────────────────────────────
  const latex = useMemo(() => {
    const colSpec =
      borders === "simple"
        ? `|${aligns.join("|")}|`
        : aligns.join(" ");

    const lines: string[] = [];

    if (borders === "booktabs") {
      // A comment, not \usepackage: this snippet is pasted into the document
      // body, where \usepackage is an error ("Can be used only in preamble").
      lines.push("% Requires \\usepackage{booktabs} in the preamble");
    }

    lines.push(`\\begin{table}[h]`);
    lines.push(`  \\centering`);
    lines.push(`  \\begin{tabular}{${colSpec}}`);

    if (borders === "simple") lines.push("    \\hline");
    if (borders === "booktabs") lines.push("    \\toprule");

    data.forEach((row, r) => {
      const cells = row.map((cell) => (cell ? escapeLatex(cell) : " ")).join(" & ");
      const isHeader = headerRow && r === 0;
      const isLast = r === data.length - 1;

      if (isHeader) {
        // Bold header cells (escape content first, then wrap in \textbf{})
        const boldCells = row.map((cell) =>
          cell ? `\\textbf{${escapeLatex(cell)}}` : " "
        ).join(" & ");
        lines.push(`    ${boldCells} \\\\`);
        if (borders === "booktabs") lines.push("    \\midrule");
        else if (borders === "simple" || hlines) lines.push("    \\hline");
      } else {
        lines.push(`    ${cells} \\\\`);
        if (!isLast && (borders === "simple" || hlines)) lines.push("    \\hline");
      }
    });

    if (borders === "booktabs") lines.push("    \\bottomrule");
    else if (borders === "simple") lines.push("    \\hline");

    lines.push("  \\end{tabular}");
    lines.push("  \\caption{Your caption here}");
    lines.push("  \\label{tab:your-label}");
    lines.push("\\end{table}");

    return lines.join("\n");
  }, [data, aligns, borders, headerRow, hlines]);

  const copy = () => {
    navigator.clipboard.writeText(latex).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  // ── CSV / Excel paste handler ───────────────────────────────────────────
  // Accepts tab-separated (Excel copy) or comma-separated pasted text.
  // Automatically resizes the grid to fit the pasted data. Only multi-cell
  // pastes (a tab or a newline) are intercepted: a plain value such as
  // "Smith, J." pasted into one cell keeps the browser's default behaviour.
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text");
    if (!text.includes("\t") && !text.includes("\n")) return;
    e.preventDefault();

    // Split rows by newline, then cells by tab (Excel) or comma (CSV). Only the
    // trailing newline is dropped: trim() would also eat leading empty cells.
    // The delimiter is chosen once per paste so a TSV row holding "Smith, J."
    // is not split on its comma.
    const isTsv = text.includes("\t");
    const pasted = text.replace(/(\r?\n)+$/, "").split(/\r?\n/).map(row => {
      if (isTsv) return row.split("\t");
      // Naive CSV: handle quoted fields
      const cells: string[] = [];
      let cur = "", inQ = false;
      for (const ch of row) {
        if (ch === '"') { inQ = !inQ; }
        else if (ch === "," && !inQ) { cells.push(cur.trim()); cur = ""; }
        else cur += ch;
      }
      cells.push(cur.trim());
      return cells;
    }).filter(r => r.some(c => c));

    if (!pasted.length) return;

    const newRows = pasted.length;
    const newCols = Math.max(...pasted.map(r => r.length));
    const newGrid = pasted.map(row =>
      Array.from({ length: newCols }, (_, c) => (row[c] ?? "").trim())
    );

    setRows(newRows);
    setCols(newCols);
    setData(newGrid);
    setAligns(makeAligns(newCols, aligns));
  }, [aligns]);

  // ── Typeset preview ─────────────────────────────────────────────────────
  // Mirrors the rules emitted above: which rule sits under each row. Top and
  // bottom rules and vertical bars come from the border style (see table.css).
  const ruleBelow = (r: number): "mid" | "thin" | null => {
    const isHeader = headerRow && r === 0;
    const isLast = r === data.length - 1;
    if (isHeader) return borders === "booktabs" ? "mid" : borders === "simple" || hlines ? "thin" : null;
    return !isLast && (borders === "simple" || hlines) ? "thin" : null;
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="tg">
      <div className="tg-toolbar">
        <span className="tg-size">{rows} × {cols}</span>
        <div className="tg-group">
          <button type="button" className="btn btn-sm" onClick={addRow}>Add row</button>
          <button type="button" className="btn btn-sm" onClick={removeRow} disabled={rows <= 2} title="Remove last row">Remove row</button>
          <button type="button" className="btn btn-sm" onClick={addCol}>Add column</button>
          <button type="button" className="btn btn-sm" onClick={removeCol} disabled={cols <= 2} title="Remove last column">Remove column</button>
          <button type="button" className="btn btn-sm" onClick={clearAll} title="Empty every cell">Clear</button>
        </div>
        <div className="tg-group">
          <select
            aria-label="Border style"
            className="input tg-select"
            value={borders}
            onChange={(e) => setBorders(e.target.value as typeof borders)}
          >
            <option value="booktabs">booktabs (recommended)</option>
            <option value="simple">Simple borders</option>
            <option value="none">No borders</option>
          </select>
          <label className="tg-check">
            <input type="checkbox" checked={headerRow} onChange={(e) => setHeaderRow(e.target.checked)} />
            Bold header
          </label>
          {borders !== "simple" && (
            <label className="tg-check">
              <input type="checkbox" checked={hlines} onChange={(e) => setHlines(e.target.checked)} />
              Row lines
            </label>
          )}
        </div>
        <button type="button" className="btn btn-sm btn-primary tg-copy" onClick={copy}>
          {copied ? "Copied" : "Copy LaTeX"}
        </button>
      </div>

      <div className="tg-body">
          {/* (a) data grid */}
          <section className="tg-panel" onPaste={handlePaste} aria-label="Table data">
            <h2 className="tg-panel-title">(a) Data</h2>
            <p className="tg-help">
              Type in the cells, Tab to move. Paste a block copied from Excel or a CSV file into any cell
              to fill the whole table. The <code>l</code>, <code>c</code>, <code>r</code> buttons set the
              alignment of each column.
            </p>
            <div className="tg-scroll">
              <div className="tg-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(5.5rem, 1fr))` }}>
                {aligns.map((a, c) => (
                  <div key={`a-${c}`} className="tg-align">
                    {(["l", "c", "r"] as Align[]).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAlign(c, opt)}
                        aria-label={`Column ${c + 1}: ${opt === "l" ? "left align" : opt === "c" ? "center" : "right align"}`}
                        aria-pressed={a === opt}
                        title={opt === "l" ? "Left align" : opt === "c" ? "Center" : "Right align"}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ))}
                {data.map((row, r) =>
                  row.map((cell, c) => (
                    <input
                      key={`${r}-${c}`}
                      value={cell}
                      className={`tg-cell${r === 0 && headerRow ? " is-header" : ""}`}
                      aria-label={`Row ${r + 1}, column ${c + 1}${r === 0 && headerRow ? " (header)" : ""}`}
                      placeholder={r === 0 && headerRow ? `Col ${c + 1}` : ""}
                      onChange={(e) => setCell(r, c, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Tab" && c === cols - 1 && r === rows - 1) {
                          e.preventDefault();
                          addRow();
                        }
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </section>

          {/* (b) typeset preview */}
          <section className="tg-panel tg-panel-preview" aria-label="Preview">
            <h2 className="tg-panel-title">(b) Preview</h2>
            <div className="tg-scroll">
              <div className="tg-preview">
                <table className={`tg-pv tg-pv-${borders}`}>
                  <tbody>
                    {data.map((row, r) => {
                      const rule = ruleBelow(r);
                      const isHeader = headerRow && r === 0;
                      return (
                        <tr key={r} className={rule ? `rule-${rule}` : undefined}>
                          {row.map((cell, c) => {
                            const style = { textAlign: ALIGN_NAME[aligns[c] ?? "l"] };
                            return isHeader
                              ? <th key={c} scope="col" style={style}>{cell || " "}</th>
                              : <td key={c} style={style}>{cell || " "}</td>;
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="tg-pv-caption">Table 1. Your caption here</p>
              </div>
            </div>
          </section>

        {/* (c) LaTeX output */}
        <section className="tg-panel tg-panel-out" aria-label="LaTeX output">
          <h2 className="tg-panel-title">
            <span>(c) LaTeX</span>
            <button type="button" className="btn btn-sm" onClick={copy}>{copied ? "Copied" : "Copy"}</button>
          </h2>
          <pre className="codebox tg-code">{latex}</pre>
          <p className="note">
            <b>Tip.</b> Use <code>booktabs</code> for journal submissions: <code>\toprule</code>,{" "}
            <code>\midrule</code> and <code>\bottomrule</code> replace vertical lines. Pressing Tab in the
            last cell adds a new row.
          </p>
        </section>
      </div>
    </div>
  );
}
