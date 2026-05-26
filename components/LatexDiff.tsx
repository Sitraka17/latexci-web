"use client";
import { useState, useMemo } from "react";
import * as Diff from "diff";

const ORIGINAL = `\\documentclass{article}
\\begin{document}

\\section{Introduction}

This is the original version of the document.
We are studying the properties of prime numbers.

The sum of two primes is often even.

\\section{Conclusion}

In conclusion, primes are fascinating.

\\end{document}`;

const REVISED = `\\documentclass{article}
\\usepackage{amsmath}
\\begin{document}

\\section{Introduction}

This is the \\textbf{revised} version of the document.
We are studying the properties of prime numbers and their distribution.

The sum of two odd primes is always even.

\\section{New Section}

We added an important equation:
\\[
  \\pi(x) \\sim \\frac{x}{\\ln x}
\\]

\\section{Conclusion}

In conclusion, primes are truly fascinating objects.

\\end{document}`;

export default function LatexDiff() {
  const [original, setOriginal] = useState(ORIGINAL);
  const [revised, setRevised] = useState(REVISED);
  const [mode, setMode] = useState<"lines" | "words">("lines");

  const diff = useMemo(() => {
    if (mode === "words") return Diff.diffWords(original, revised);
    return Diff.diffLines(original, revised);
  }, [original, revised, mode]);

  const stats = useMemo(() => {
    let added = 0, removed = 0;
    diff.forEach((part) => {
      const lines = (part.value.match(/\n/g) || []).length || 1;
      if (part.added) added += lines;
      else if (part.removed) removed += lines;
    });
    return { added, removed };
  }, [diff]);

  const textareaStyle: React.CSSProperties = {
    width: "100%",
    flex: 1,
    background: "var(--surface)",
    color: "var(--fg)",
    border: "none",
    outline: "none",
    padding: "1rem",
    fontFamily: "JetBrains Mono, monospace",
    fontSize: "12px",
    lineHeight: 1.65,
    resize: "none",
  };

  const paneHeader = (label: string, color: string) => (
    <div
      style={{
        padding: "0.5rem 1rem",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface2)",
        fontSize: "0.8rem",
        fontWeight: 600,
        color,
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          display: "inline-block",
        }}
      />
      {label}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)" }}>
      {/* Top: two editors */}
      <div style={{ display: "flex", height: "40%", borderBottom: "1px solid var(--border)" }}>
        {/* Original */}
        <div style={{ width: "50%", display: "flex", flexDirection: "column", borderRight: "1px solid var(--border)", background: "var(--surface)" }}>
          {paneHeader("original.tex", "#f87171")}
          <textarea
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
            spellCheck={false}
            placeholder="Paste original LaTeX here..."
            style={textareaStyle}
          />
        </div>

        {/* Revised */}
        <div style={{ width: "50%", display: "flex", flexDirection: "column", background: "var(--surface)" }}>
          {paneHeader("revised.tex", "#34d399")}
          <textarea
            value={revised}
            onChange={(e) => setRevised(e.target.value)}
            spellCheck={false}
            placeholder="Paste revised LaTeX here..."
            style={textareaStyle}
          />
        </div>
      </div>

      {/* Diff toolbar */}
      <div
        style={{
          padding: "0.5rem 1.25rem",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface2)",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--fg-muted)" }}>Diff output</span>
        <span style={{ fontSize: "0.78rem", color: "#34d399" }}>+{stats.added} added</span>
        <span style={{ fontSize: "0.78rem", color: "#f87171" }}>−{stats.removed} removed</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>Mode:</span>
        {(["lines", "words"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              background: mode === m ? "var(--accent)" : "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 5,
              color: mode === m ? "#fff" : "var(--fg-muted)",
              fontSize: "0.75rem",
              padding: "0.2rem 0.7rem",
              cursor: "pointer",
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Diff view */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: "var(--bg)",
          padding: "1rem 1.5rem",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "12.5px",
          lineHeight: 1.7,
        }}
      >
        {mode === "lines" ? (
          <div>
            {diff.map((part, i) => {
              const lines = part.value.split("\n");
              return lines.map((line, j) => {
                if (j === lines.length - 1 && line === "") return null;
                const cls = part.added ? "diff-added" : part.removed ? "diff-removed" : "diff-neutral";
                const prefix = part.added ? "+ " : part.removed ? "− " : "  ";
                return (
                  <span key={`${i}-${j}`} className={cls}>
                    {prefix}{line}
                  </span>
                );
              });
            })}
          </div>
        ) : (
          <p style={{ lineHeight: 2, margin: 0 }}>
            {diff.map((part, i) => (
              <span
                key={i}
                style={{
                  background: part.added
                    ? "rgba(16,185,129,0.2)"
                    : part.removed
                    ? "rgba(239,68,68,0.2)"
                    : "transparent",
                  color: part.added ? "#34d399" : part.removed ? "#f87171" : "var(--fg)",
                  textDecoration: part.removed ? "line-through" : "none",
                  borderRadius: 3,
                  padding: part.added || part.removed ? "0 2px" : 0,
                }}
              >
                {part.value}
              </span>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}
