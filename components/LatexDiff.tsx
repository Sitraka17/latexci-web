"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import * as Diff from "diff";
import { useDropzone } from "react-dropzone";

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

function DropZonePane({
  value, onChange, label, color,
}: {
  value: string; onChange: (v: string) => void; label: string; color: string;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "text/plain": [".tex", ".txt"], "application/x-tex": [".tex"] },
    maxFiles: 1,
    noClick: true,
    onDrop: async (files) => {
      if (files[0]) onChange(await files[0].text());
    },
  });

  return (
    <div {...getRootProps()} style={{
      flex: 1, display: "flex", flexDirection: "column",
      border: isDragActive ? `2px dashed ${color}` : "2px dashed transparent",
      borderRadius: isDragActive ? 8 : 0, transition: "border 0.15s", position: "relative",
    }}>
      <input {...getInputProps()} />
      {/* Header */}
      <div style={{
        padding: "0.45rem 0.75rem", borderBottom: "1px solid var(--border)",
        background: "var(--surface2)", display: "flex", alignItems: "center", gap: "0.5rem",
      }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
        <span style={{ fontSize: "0.8rem", fontWeight: 600, color }}>{label}</span>
        <span style={{ fontSize: "0.7rem", color: "var(--fg-muted)", marginLeft: "auto" }}>
          drop .tex file or paste
        </span>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        spellCheck={false}
        placeholder={`Paste ${label} LaTeX here, or drop a .tex file...`}
        style={{
          flex: 1, background: isDragActive ? "rgba(108,99,255,0.04)" : "var(--surface)",
          color: "var(--fg)", border: "none", outline: "none",
          padding: "0.75rem", fontFamily: "JetBrains Mono, monospace",
          fontSize: "12px", lineHeight: 1.65, resize: "none", width: "100%",
        }}
      />
    </div>
  );
}

export default function LatexDiff() {
  const [original, setOriginal] = useState(ORIGINAL);
  const [revised, setRevised] = useState(REVISED);
  const [mode, setMode] = useState<"lines" | "words">("lines");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const diff = useMemo(() => {
    if (mode === "words") return Diff.diffWords(original, revised);
    return Diff.diffLines(original, revised);
  }, [original, revised, mode]);

  const stats = useMemo(() => {
    let added = 0, removed = 0, unchanged = 0;
    diff.forEach(part => {
      const lines = (part.value.match(/\n/g) || []).length || 1;
      if (part.added) added += lines;
      else if (part.removed) removed += lines;
      else unchanged += lines;
    });
    return { added, removed, unchanged };
  }, [diff]);

  const copyDiff = useCallback(() => {
    const text = diff.map(p =>
      p.value.split("\n").filter(Boolean).map(l => (p.added ? "+ " : p.removed ? "- " : "  ") + l).join("\n")
    ).join("\n");
    navigator.clipboard.writeText(text);
  }, [diff]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)" }}>

      {/* Top: two editors */}
      <div style={{
        display: "flex", flexDirection: isMobile ? "column" : "row",
        height: isMobile ? "auto" : "42%",
        minHeight: isMobile ? 300 : undefined,
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: isMobile ? "none" : "1px solid var(--border)", borderBottom: isMobile ? "1px solid var(--border)" : "none" }}>
          <DropZonePane value={original} onChange={setOriginal} label="original.tex" color="#f87171" />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <DropZonePane value={revised} onChange={setRevised} label="revised.tex" color="#34d399" />
        </div>
      </div>

      {/* Diff toolbar */}
      <div style={{
        padding: "0.4rem 1rem", borderBottom: "1px solid var(--border)",
        background: "var(--surface2)", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap",
      }}>
        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--fg-muted)" }}>Diff</span>
        <span style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: 600 }}>+{stats.added}</span>
        <span style={{ fontSize: "0.75rem", color: "#f87171", fontWeight: 600 }}>−{stats.removed}</span>
        <span style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>{stats.unchanged} unchanged</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: "0.72rem", color: "var(--fg-muted)" }}>Mode:</span>
        {(["lines", "words"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            background: mode === m ? "var(--accent)" : "var(--surface)",
            border: "1px solid var(--border)", borderRadius: 5,
            color: mode === m ? "#fff" : "var(--fg-muted)",
            fontSize: "0.73rem", padding: "0.2rem 0.6rem", cursor: "pointer",
          }}>{m}</button>
        ))}
        <button onClick={copyDiff} style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 5, color: "var(--fg-muted)", fontSize: "0.73rem",
          padding: "0.2rem 0.6rem", cursor: "pointer",
        }}>Copy diff</button>
      </div>

      {/* Diff output */}
      <div style={{
        flex: 1, overflowY: "auto", background: "var(--bg)",
        padding: "0.75rem 1.25rem",
        fontFamily: "JetBrains Mono, monospace", fontSize: "12.5px", lineHeight: 1.7,
      }}>
        {diff.length === 0 || (stats.added === 0 && stats.removed === 0) ? (
          <div style={{ color: "var(--fg-muted)", padding: "2rem", textAlign: "center" }}>
            ✓ Files are identical
          </div>
        ) : mode === "lines" ? (
          <div>
            {diff.map((part, i) => {
              const lines = part.value.split("\n");
              return lines.map((line, j) => {
                if (j === lines.length - 1 && line === "") return null;
                const cls = part.added ? "diff-added" : part.removed ? "diff-removed" : "diff-neutral";
                const prefix = part.added ? "+ " : part.removed ? "− " : "  ";
                return <span key={`${i}-${j}`} className={cls}>{prefix}{line}</span>;
              });
            })}
          </div>
        ) : (
          <p style={{ lineHeight: 2, margin: 0 }}>
            {diff.map((part, i) => (
              <span key={i} style={{
                background: part.added ? "rgba(16,185,129,0.2)" : part.removed ? "rgba(239,68,68,0.2)" : "transparent",
                color: part.added ? "#34d399" : part.removed ? "#f87171" : "var(--fg)",
                textDecoration: part.removed ? "line-through" : "none",
                borderRadius: 3, padding: part.added || part.removed ? "0 2px" : 0,
              }}>
                {part.value}
              </span>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}
