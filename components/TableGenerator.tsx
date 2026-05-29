"use client";
import { useState, useCallback, useMemo } from "react";

type Align = "l" | "c" | "r";

const DEFAULT_ROWS = 4;
const DEFAULT_COLS = 3;

function makeGrid(rows: number, cols: number, old?: string[][]): string[][] {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => old?.[r]?.[c] ?? "")
  );
}

function makeAligns(cols: number, old?: Align[]): Align[] {
  return Array.from({ length: cols }, (_, c) => old?.[c] ?? "l");
}

function Btn({
  onClick,
  children,
  title,
  danger,
}: {
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: "0.28rem 0.7rem",
        fontSize: "0.78rem",
        borderRadius: 6,
        border: "1px solid var(--border)",
        background: danger ? "rgba(239,68,68,0.08)" : "var(--surface2)",
        color: danger ? "var(--red)" : "var(--fg-muted)",
        cursor: "pointer",
        transition: "border-color 0.12s, color 0.12s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = danger ? "var(--red)" : "var(--accent)";
        e.currentTarget.style.color = danger ? "var(--red)" : "var(--fg)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.color = danger ? "var(--red)" : "var(--fg-muted)";
      }}
    >
      {children}
    </button>
  );
}

export default function TableGenerator() {
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [data, setData] = useState(() => makeGrid(DEFAULT_ROWS, DEFAULT_COLS));
  const [aligns, setAligns] = useState<Align[]>(() => makeAligns(DEFAULT_COLS));
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
      lines.push("\\usepackage{booktabs} % put in preamble\n");
    }

    lines.push(`\\begin{table}[h]`);
    lines.push(`  \\centering`);
    lines.push(`  \\begin{tabular}{${colSpec}}`);

    if (borders === "simple") lines.push("    \\hline");
    if (borders === "booktabs") lines.push("    \\toprule");

    data.forEach((row, r) => {
      const cells = row.map((cell) => (cell || " ")).join(" & ");
      const isHeader = headerRow && r === 0;
      const isLast = r === data.length - 1;

      if (isHeader) {
        // Bold header cells
        const boldCells = row.map((cell) =>
          cell ? `\\textbf{${cell}}` : " "
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
  }, [data, aligns, borders, headerRow, hlines, cols]);

  const copy = () => {
    navigator.clipboard.writeText(latex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* Toolbar */}
      <div
        style={{
          padding: "0.6rem 1rem",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.75rem",
            color: "var(--fg-muted)",
            marginRight: 4,
          }}
        >
          {rows} × {cols}
        </span>

        <div
          style={{
            width: 1,
            height: 20,
            background: "var(--border)",
            margin: "0 4px",
          }}
        />

        <Btn onClick={addRow} title="Add row">+ Row</Btn>
        <Btn onClick={removeRow} title="Remove last row" danger>− Row</Btn>
        <Btn onClick={addCol} title="Add column">+ Col</Btn>
        <Btn onClick={removeCol} title="Remove last column" danger>− Col</Btn>

        <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px" }} />

        {/* Border style */}
        <select
          value={borders}
          onChange={(e) => setBorders(e.target.value as typeof borders)}
          style={{
            padding: "0.25rem 0.5rem",
            borderRadius: 6,
            border: "1px solid var(--border)",
            background: "var(--surface2)",
            color: "var(--fg)",
            fontSize: "0.78rem",
            cursor: "pointer",
          }}
        >
          <option value="booktabs">booktabs (recommended)</option>
          <option value="simple">Simple borders</option>
          <option value="none">No borders</option>
        </select>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            fontSize: "0.78rem",
            color: "var(--fg-muted)",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={headerRow}
            onChange={(e) => setHeaderRow(e.target.checked)}
          />
          Bold header
        </label>

        {borders !== "simple" && (
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.78rem",
              color: "var(--fg-muted)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={hlines}
              onChange={(e) => setHlines(e.target.checked)}
            />
            Row lines
          </label>
        )}

        <div style={{ flex: 1 }} />

        <button
          onClick={copy}
          style={{
            padding: "0.3rem 0.85rem",
            borderRadius: 6,
            border: "1px solid var(--accent)",
            background: copied
              ? "rgba(52,211,153,0.15)"
              : "linear-gradient(135deg, var(--accent), var(--accent2))",
            color: copied ? "var(--green)" : "#fff",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          {copied ? "✓ Copied!" : "Copy LaTeX"}
        </button>
      </div>

      {/* Main: grid + output */}
      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          minHeight: 0,
        }}
        className="table-gen-layout"
      >
        {/* Left: data input grid */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            minWidth: 0,
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 0.75rem",
                fontSize: "0.8rem",
                color: "var(--fg-muted)",
              }}
            >
              Enter your data. Use Tab to move between cells.
            </p>

            {/* Align row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gap: 4,
                marginBottom: 4,
                marginLeft: 0,
              }}
            >
              {aligns.map((a, c) => (
                <div key={c} style={{ display: "flex", justifyContent: "center", gap: 2 }}>
                  {(["l", "c", "r"] as Align[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setAlign(c, opt)}
                      title={
                        opt === "l" ? "Left align" : opt === "c" ? "Center" : "Right align"
                      }
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 4,
                        border: "1px solid var(--border)",
                        background: a === opt ? "var(--accent)" : "var(--surface2)",
                        color: a === opt ? "#fff" : "var(--fg-muted)",
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "monospace",
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Data grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gap: 4,
              }}
            >
              {data.map((row, r) =>
                row.map((cell, c) => (
                  <input
                    key={`${r}-${c}`}
                    value={cell}
                    placeholder={r === 0 && headerRow ? `Col ${c + 1}` : ""}
                    onChange={(e) => setCell(r, c, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Tab" && c === cols - 1 && r === rows - 1) {
                        e.preventDefault();
                        addRow();
                      }
                    }}
                    style={{
                      padding: "0.4rem 0.55rem",
                      borderRadius: 5,
                      border: `1px solid ${r === 0 && headerRow ? "var(--accent)" : "var(--border)"}`,
                      background:
                        r === 0 && headerRow ? "var(--surface2)" : "var(--surface)",
                      color: "var(--fg)",
                      fontSize: "0.82rem",
                      fontWeight: r === 0 && headerRow ? 600 : 400,
                      outline: "none",
                      width: "100%",
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* Tips */}
          <div
            style={{
              padding: "0.9rem 1rem",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: "0.8rem",
              color: "var(--fg-muted)",
              lineHeight: 1.65,
            }}
          >
            <strong style={{ color: "var(--fg)" }}>Tips:</strong>
            {" "}Use <code style={{ background: "var(--surface2)", padding: "0 0.3em", borderRadius: 3, fontSize: "0.85em" }}>booktabs</code> for journal submissions — it produces cleaner, publication-ready tables.
            {" "}<code style={{ background: "var(--surface2)", padding: "0 0.3em", borderRadius: 3, fontSize: "0.85em" }}>\toprule</code>,{" "}
            <code style={{ background: "var(--surface2)", padding: "0 0.3em", borderRadius: 3, fontSize: "0.85em" }}>\midrule</code>,{" "}
            <code style={{ background: "var(--surface2)", padding: "0 0.3em", borderRadius: 3, fontSize: "0.85em" }}>\bottomrule</code> replace vertical lines.
            Tab through cells; Tab on the last cell adds a new row.
          </div>
        </div>

        {/* Right: LaTeX output */}
        <div
          style={{
            width: "46%",
            borderLeft: "1px solid var(--border)",
            background: "#1e1e1e",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            minWidth: 0,
          }}
        >
          <div
            style={{
              padding: "0.4rem 0.85rem",
              borderBottom: "1px solid #2c2c3e",
              background: "#141419",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: "0.7rem",
                color: "#8a88a4",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              output.tex
            </span>
            <div style={{ flex: 1 }} />
            <button
              onClick={copy}
              style={{
                fontSize: "0.68rem",
                padding: "0.18rem 0.55rem",
                borderRadius: 4,
                border: "1px solid #28283a",
                background: "transparent",
                color: copied ? "#34d399" : "#8a88a4",
                cursor: "pointer",
              }}
            >
              {copied ? "✓" : "Copy"}
            </button>
          </div>
          <pre
            style={{
              flex: 1,
              overflowY: "auto",
              margin: 0,
              padding: "1.25rem 1rem",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.78rem",
              lineHeight: 1.7,
              color: "#d4d4d4",
              background: "transparent",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {latex}
          </pre>
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .table-gen-layout { flex-direction: column !important; }
          .table-gen-layout > div:last-child { width: 100% !important; border-left: none !important; border-top: 1px solid var(--border); }
        }
      `}</style>
    </div>
  );
}
