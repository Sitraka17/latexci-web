"use client";
import {
  useState, useMemo, useCallback, useEffect, useRef, type ReactNode,
} from "react";
import * as Diff from "diff";
import { useDropzone } from "react-dropzone";

// ── Sample documents ─────────────────────────────────────────────────────────
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

// ── Drag-to-resize hook ───────────────────────────────────────────────────────
function useDrag(
  axis: "x" | "y",
  initial = 50,
  min = 15,
  max = 85,
) {
  const [pct, setPct] = useState(initial);
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = axis === "x" ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
  }, [axis]);

  const reset = useCallback(() => setPct(initial), [initial]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const raw =
        axis === "x"
          ? ((e.clientX - rect.left) / rect.width) * 100
          : ((e.clientY - rect.top) / rect.height) * 100;
      setPct(Math.max(min, Math.min(max, raw)));
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [axis, min, max]);

  return { pct, containerRef, onMouseDown, reset };
}

// ── Drag handle visual ────────────────────────────────────────────────────────
function DragHandle({
  axis, onMouseDown, onDoubleClick,
}: {
  axis: "x" | "y";
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
}) {
  const isVert = axis === "y";
  return (
    <div
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      title="Drag to resize · double-click to reset"
      style={{
        flexShrink: 0,
        width: isVert ? "100%" : 6,
        height: isVert ? 6 : "100%",
        cursor: isVert ? "row-resize" : "col-resize",
        background: "var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.15s",
        zIndex: 10,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "var(--accent)")}
      onMouseLeave={e => (e.currentTarget.style.background = "var(--border)")}
    >
      {/* Grip dots */}
      <div style={{
        display: "flex",
        flexDirection: isVert ? "row" : "column",
        gap: 3, pointerEvents: "none",
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 3, height: 3, borderRadius: "50%",
            background: "var(--fg-muted)", opacity: 0.5,
          }} />
        ))}
      </div>
    </div>
  );
}

// ── Drop-zone editor pane ─────────────────────────────────────────────────────
function EditorPane({
  value, onChange, label, color, onClear,
}: {
  value: string; onChange: (v: string) => void;
  label: string; color: string; onClear: () => void;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "text/plain": [".tex", ".txt"], "application/x-tex": [".tex"] },
    maxFiles: 1, noClick: true,
    onDrop: async (files) => { if (files[0]) onChange(await files[0].text()); },
  });

  return (
    <div {...getRootProps()} style={{
      flex: 1, display: "flex", flexDirection: "column", overflow: "hidden",
      outline: isDragActive ? `2px dashed ${color}` : "none",
      outlineOffset: -2, transition: "outline 0.15s",
    }}>
      <input {...getInputProps()} />
      {/* Pane header */}
      <div style={{
        padding: "0.35rem 0.75rem", borderBottom: "1px solid var(--border)",
        background: "var(--surface2)", display: "flex", alignItems: "center",
        gap: "0.5rem", flexShrink: 0,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%",
          background: color, display: "inline-block", flexShrink: 0,
        }} />
        <span style={{ fontSize: "0.8rem", fontWeight: 600, color, flex: 1 }}>
          {label}
        </span>
        <span style={{ fontSize: "0.68rem", color: "var(--fg-muted)" }}>
          {isDragActive ? "Drop to load" : "drop .tex · paste"}
        </span>
        <button
          onClick={onClear}
          title="Clear editor"
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--fg-muted)", fontSize: "0.72rem", padding: "0 0.2rem",
            lineHeight: 1,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--fg)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--fg-muted)")}
        >
          ✕
        </button>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        spellCheck={false}
        placeholder={`Paste ${label} LaTeX here…`}
        style={{
          flex: 1, background: isDragActive
            ? "color-mix(in srgb, var(--accent) 4%, var(--surface))"
            : "var(--surface)",
          color: "var(--fg)", border: "none", outline: "none",
          padding: "0.75rem", fontFamily: "JetBrains Mono, monospace",
          fontSize: "12px", lineHeight: 1.65, resize: "none", width: "100%",
        }}
      />
    </div>
  );
}

// ── Side-by-side diff renderer ────────────────────────────────────────────────
type DiffPart = { value: string; added?: boolean; removed?: boolean };

function SideBySideDiff({ diff }: { diff: DiffPart[] }) {
  type Row = { left: string | null; right: string | null; kind: "added" | "removed" | "unchanged" };
  const rows: Row[] = [];

  for (const part of diff) {
    const lines = part.value.split("\n");
    if (lines[lines.length - 1] === "") lines.pop();
    for (const line of lines) {
      if (part.removed) rows.push({ left: line, right: null, kind: "removed" });
      else if (part.added) rows.push({ left: null, right: line, kind: "added" });
      else rows.push({ left: line, right: line, kind: "unchanged" });
    }
  }

  // Pair removed/added so they sit on the same row
  const paired: { left: string | null; right: string | null; kind: "changed" | "added" | "removed" | "unchanged" }[] = [];
  let i = 0;
  while (i < rows.length) {
    const r = rows[i];
    if (r.kind === "removed") {
      // Look ahead for an added row to pair with
      const next = rows[i + 1];
      if (next?.kind === "added") {
        paired.push({ left: r.left, right: next.right, kind: "changed" });
        i += 2;
      } else {
        paired.push({ left: r.left, right: null, kind: "removed" });
        i++;
      }
    } else if (r.kind === "added") {
      paired.push({ left: null, right: r.right, kind: "added" });
      i++;
    } else {
      paired.push({ left: r.left, right: r.right, kind: "unchanged" });
      i++;
    }
  }

  const cellStyle = (side: "left" | "right", kind: string): React.CSSProperties => {
    const isLeft = side === "left";
    const bg =
      kind === "removed" && isLeft ? "rgba(248,113,113,0.12)" :
      kind === "added"   && !isLeft ? "rgba(52,211,153,0.12)"  :
      kind === "changed" && isLeft ? "rgba(248,113,113,0.10)"  :
      kind === "changed" && !isLeft ? "rgba(52,211,153,0.10)"  :
      "transparent";
    return {
      display: "block",
      padding: "0 0.6rem",
      background: bg,
      fontFamily: "JetBrains Mono, monospace",
      fontSize: "12.5px",
      lineHeight: "1.7",
      whiteSpace: "pre",
      color:
        kind === "removed" && isLeft ? "#f87171" :
        kind === "added"   && !isLeft ? "#34d399" :
        kind === "changed" && isLeft ? "#fca5a5" :
        kind === "changed" && !isLeft ? "#6ee7b7" :
        "var(--fg-muted)",
      textDecoration: kind === "removed" && isLeft ? "line-through" : "none",
      minHeight: "1.7em",
    };
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Left: original */}
      <div style={{
        flex: 1, overflowY: "auto", overflowX: "auto",
        borderRight: "1px solid var(--border)",
      }}>
        <div style={{
          padding: "0.35rem 0.75rem", borderBottom: "1px solid var(--border)",
          background: "var(--surface2)", fontSize: "0.75rem",
          fontWeight: 600, color: "#f87171", flexShrink: 0,
        }}>original.tex (removals)</div>
        <div style={{ padding: "0.25rem 0" }}>
          {paired.map((row, idx) => (
            <span key={idx} style={cellStyle("left", row.kind)}>
              {row.left ?? ""}
            </span>
          ))}
        </div>
      </div>
      {/* Right: revised */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
        <div style={{
          padding: "0.35rem 0.75rem", borderBottom: "1px solid var(--border)",
          background: "var(--surface2)", fontSize: "0.75rem",
          fontWeight: 600, color: "#34d399", flexShrink: 0,
        }}>revised.tex (additions)</div>
        <div style={{ padding: "0.25rem 0" }}>
          {paired.map((row, idx) => (
            <span key={idx} style={cellStyle("right", row.kind)}>
              {row.right ?? ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Unified diff renderer ─────────────────────────────────────────────────────
function UnifiedDiff({ diff, mode }: { diff: DiffPart[]; mode: "lines" | "words" }) {
  const stats = useMemo(() => {
    let added = 0, removed = 0;
    diff.forEach(p => {
      const n = mode === "lines"
        ? (p.value.match(/\n/g) || []).length || 1
        : p.value.trim().split(/\s+/).filter(Boolean).length;
      if (p.added) added += n;
      else if (p.removed) removed += n;
    });
    return { added, removed };
  }, [diff, mode]);

  const isEmpty = stats.added === 0 && stats.removed === 0;

  if (isEmpty) return (
    <div style={{
      color: "var(--fg-muted)", padding: "3rem", textAlign: "center",
      fontSize: "0.9rem",
    }}>
      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✓</div>
      Files are identical
    </div>
  );

  if (mode === "words") return (
    <p style={{ lineHeight: 2, margin: "0.75rem 1.25rem", fontSize: "12.5px", fontFamily: "JetBrains Mono, monospace" }}>
      {diff.map((part, i) => (
        <span key={i} style={{
          background: part.added ? "rgba(52,211,153,0.2)" : part.removed ? "rgba(248,113,113,0.2)" : "transparent",
          color: part.added ? "#34d399" : part.removed ? "#f87171" : "var(--fg)",
          textDecoration: part.removed ? "line-through" : "none",
          borderRadius: 3,
          padding: part.added || part.removed ? "0 2px" : 0,
        }}>
          {part.value}
        </span>
      ))}
    </p>
  );

  // Lines mode with line numbers
  let lineNum = 1;
  const rows: ReactNode[] = [];
  diff.forEach((part, pi) => {
    const lines = part.value.split("\n");
    if (lines[lines.length - 1] === "") lines.pop();
    lines.forEach((line, li) => {
      const cls = part.added ? "diff-added" : part.removed ? "diff-removed" : "diff-neutral";
      const prefix = part.added ? "+" : part.removed ? "−" : " ";
      const num = !part.added ? lineNum++ : null;
      rows.push(
        <div key={`${pi}-${li}`} style={{ display: "flex" }}>
          <span style={{
            width: 36, textAlign: "right", paddingRight: "0.75rem",
            color: "var(--fg-muted)", fontSize: "11px", lineHeight: "1.7",
            flexShrink: 0, opacity: 0.5, userSelect: "none",
          }}>
            {num ?? ""}
          </span>
          <span style={{
            width: 18, textAlign: "center", flexShrink: 0,
            lineHeight: "1.7", fontSize: "12px",
            color: part.added ? "#34d399" : part.removed ? "#f87171" : "var(--fg-muted)",
          }}>
            {prefix}
          </span>
          <span className={cls} style={{ flex: 1, display: "block" }}>{line || " "}</span>
        </div>
      );
    });
  });

  return <div style={{ padding: "0.25rem 0" }}>{rows}</div>;
}

// ── Toolbar button ────────────────────────────────────────────────────────────
function TBtn({
  children, onClick, active, title, danger,
}: {
  children: ReactNode; onClick: () => void; active?: boolean; title?: string; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: active ? "color-mix(in srgb, var(--accent) 18%, transparent)" : "var(--surface)",
        border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
        borderRadius: 5, color: active ? "var(--accent2)" : danger ? "#f87171" : "var(--fg-muted)",
        fontSize: "0.73rem", padding: "0.22rem 0.65rem",
        cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
        fontWeight: active ? 600 : 400,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = danger ? "#f87171" : "var(--accent)";
        e.currentTarget.style.color = danger ? "#f87171" : "var(--fg)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = active ? "var(--accent)" : "var(--border)";
        e.currentTarget.style.color = active ? "var(--accent2)" : danger ? "#f87171" : "var(--fg-muted)";
      }}
    >
      {children}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
type DiffMode  = "lines" | "words";
type ViewMode  = "unified" | "sidebyside";
type Layout    = "stacked" | "columns";

export default function LatexDiff() {
  const [original, setOriginal] = useState(ORIGINAL);
  const [revised,  setRevised]  = useState(REVISED);
  const [diffMode, setDiffMode] = useState<DiffMode>("lines");
  const [viewMode, setViewMode] = useState<ViewMode>("unified");
  const [layout,   setLayout]   = useState<Layout>("stacked");
  const [copied,   setCopied]   = useState(false);

  // Resizable panels
  // "stacked" layout: editorSplit = % of height for editors row
  //                   hSplit      = % of editors width for original
  // "columns" layout: hSplit splits original | revised | diff (we reuse hSplit for orig/revised)
  const editorDrag = useDrag("y", 42, 15, 82);
  const hSplitDrag = useDrag("x", 50, 15, 85);

  const diff = useMemo(() =>
    diffMode === "words"
      ? Diff.diffWords(original, revised)
      : Diff.diffLines(original, revised),
    [original, revised, diffMode]
  );

  const stats = useMemo(() => {
    let added = 0, removed = 0, unchanged = 0;
    diff.forEach(p => {
      const n = (p.value.match(/\n/g) || []).length || 1;
      if (p.added)    added += n;
      else if (p.removed) removed += n;
      else            unchanged += n;
    });
    return { added, removed, unchanged };
  }, [diff]);

  const swap = useCallback(() => {
    setOriginal(revised);
    setRevised(original);
  }, [original, revised]);

  const copyDiff = useCallback(() => {
    const text = diff
      .map(p => p.value.split("\n").filter(Boolean)
        .map(l => (p.added ? "+ " : p.removed ? "- " : "  ") + l).join("\n"))
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [diff]);

  const downloadPatch = useCallback(() => {
    const patch = diff
      .map(p => p.value.split("\n").filter(Boolean)
        .map(l => (p.added ? "+" : p.removed ? "-" : " ") + l).join("\n"))
      .join("\n");
    const full = `--- original.tex\n+++ revised.tex\n@@ -1 +1 @@\n${patch}\n`;
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([full], { type: "text/x-patch" })),
      download: "changes.patch",
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [diff]);

  const isIdentical = stats.added === 0 && stats.removed === 0;

  // ── Toolbar ───────────────────────────────────────────────────────────────
  const toolbar = (
    <div style={{
      padding: "0.4rem 0.75rem", borderBottom: "1px solid var(--border)",
      background: "var(--surface2)", display: "flex", alignItems: "center",
      gap: "0.5rem", flexShrink: 0, flexWrap: "wrap",
    }}>
      {/* Stats */}
      <span style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: 700 }}>+{stats.added}</span>
      <span style={{ fontSize: "0.75rem", color: "#f87171", fontWeight: 700 }}>−{stats.removed}</span>
      <span style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>{stats.unchanged} same</span>
      {isIdentical && (
        <span style={{ fontSize: "0.72rem", color: "#34d399", fontWeight: 600 }}>✓ identical</span>
      )}

      <div style={{ width: 1, height: 16, background: "var(--border)", margin: "0 2px" }} />

      {/* Diff mode */}
      <span style={{ fontSize: "0.7rem", color: "var(--fg-muted)" }}>Diff:</span>
      {(["lines", "words"] as DiffMode[]).map(m => (
        <TBtn key={m} active={diffMode === m} onClick={() => setDiffMode(m)}>{m}</TBtn>
      ))}

      <div style={{ width: 1, height: 16, background: "var(--border)", margin: "0 2px" }} />

      {/* View mode */}
      <span style={{ fontSize: "0.7rem", color: "var(--fg-muted)" }}>View:</span>
      <TBtn active={viewMode === "unified"}    onClick={() => setViewMode("unified")}>unified</TBtn>
      <TBtn active={viewMode === "sidebyside"} onClick={() => setViewMode("sidebyside")}>side-by-side</TBtn>

      <div style={{ width: 1, height: 16, background: "var(--border)", margin: "0 2px" }} />

      {/* Layout */}
      <span style={{ fontSize: "0.7rem", color: "var(--fg-muted)" }}>Layout:</span>
      <TBtn
        active={layout === "stacked"} title="Editors on top, diff on bottom"
        onClick={() => setLayout("stacked")}
      >⬛ stacked</TBtn>
      <TBtn
        active={layout === "columns"} title="Editors on left, diff on right"
        onClick={() => setLayout("columns")}
      >▥ columns</TBtn>

      <div style={{ flex: 1 }} />

      {/* Actions */}
      <TBtn onClick={swap} title="Swap original ↔ revised">⇄ swap</TBtn>
      <TBtn active={copied} onClick={copyDiff} title="Copy unified diff to clipboard">
        {copied ? "✓ copied" : "copy diff"}
      </TBtn>
      <TBtn onClick={downloadPatch} title="Download as .patch file">↓ .patch</TBtn>
    </div>
  );

  // ── Editor pair ───────────────────────────────────────────────────────────
  const editors = (refProp?: React.RefObject<HTMLDivElement | null>, flex?: string) => (
    <div
      ref={refProp}
      style={{
        flex: flex ?? undefined,
        display: "flex",
        flexDirection: "row",
        overflow: "hidden",
        minHeight: 0,
      }}
    >
      <EditorPane
        value={original} onChange={setOriginal}
        label="original.tex" color="#f87171"
        onClear={() => setOriginal("")}
      />
      <DragHandle axis="x" onMouseDown={hSplitDrag.onMouseDown} onDoubleClick={hSplitDrag.reset} />
      <EditorPane
        value={revised} onChange={setRevised}
        label="revised.tex" color="#34d399"
        onClear={() => setRevised("")}
      />
    </div>
  );

  // ── Diff output ───────────────────────────────────────────────────────────
  const diffOutput = (flex?: string) => (
    <div style={{
      flex: flex ?? "1",
      overflowY: viewMode === "sidebyside" ? "hidden" : "auto",
      overflowX: "hidden",
      background: "var(--bg)",
      minHeight: 0,
    }}>
      {viewMode === "sidebyside"
        ? <SideBySideDiff diff={diff} />
        : <UnifiedDiff diff={diff} mode={diffMode} />
      }
    </div>
  );

  // ── Stacked layout ────────────────────────────────────────────────────────
  if (layout === "stacked") {
    return (
      <div
        ref={editorDrag.containerRef}
        style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}
      >
        {toolbar}
        {/* Editors row */}
        <div
          ref={hSplitDrag.containerRef}
          style={{
            height: `${editorDrag.pct}%`,
            display: "flex", flexDirection: "row", flexShrink: 0,
            borderBottom: "1px solid var(--border)", overflow: "hidden", minHeight: 60,
          }}
        >
          <EditorPane
            value={original} onChange={setOriginal}
            label="original.tex" color="#f87171"
            onClear={() => setOriginal("")}
          />
          <DragHandle axis="x" onMouseDown={hSplitDrag.onMouseDown} onDoubleClick={hSplitDrag.reset} />
          <EditorPane
            value={revised} onChange={setRevised}
            label="revised.tex" color="#34d399"
            onClear={() => setRevised("")}
          />
        </div>

        {/* Drag handle: editors ↔ diff */}
        <DragHandle axis="y" onMouseDown={editorDrag.onMouseDown} onDoubleClick={editorDrag.reset} />

        {/* Diff pane */}
        {diffOutput()}
      </div>
    );
  }

  // ── Columns layout ────────────────────────────────────────────────────────
  // Original | Revised | Diff   (3 columns, editors split on left, diff on right)
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {toolbar}
      <div
        ref={hSplitDrag.containerRef}
        style={{ flex: 1, display: "flex", flexDirection: "row", overflow: "hidden", minHeight: 0 }}
      >
        {/* Left: original editor (hSplitDrag.pct% of total) */}
        <EditorPane
          value={original} onChange={setOriginal}
          label="original.tex" color="#f87171"
          onClear={() => setOriginal("")}
        />
        <DragHandle axis="x" onMouseDown={hSplitDrag.onMouseDown} onDoubleClick={hSplitDrag.reset} />
        {/* Middle: revised editor */}
        <EditorPane
          value={revised} onChange={setRevised}
          label="revised.tex" color="#34d399"
          onClear={() => setRevised("")}
        />
        {/* Right: diff output — uses editorDrag as a second horiz split */}
        <div
          ref={editorDrag.containerRef}
          style={{
            display: "flex", flexDirection: "row",
            width: `${100 - editorDrag.pct}%`, minWidth: 120,
            flexShrink: 0, overflow: "hidden",
          }}
        >
          <DragHandle axis="x" onMouseDown={editorDrag.onMouseDown} onDoubleClick={editorDrag.reset} />
          <div style={{
            flex: 1, overflowY: "auto", overflowX: "hidden",
            background: "var(--bg)", minWidth: 0,
          }}>
            <div style={{
              padding: "0.35rem 0.75rem", borderBottom: "1px solid var(--border)",
              background: "var(--surface2)", fontSize: "0.75rem",
              fontWeight: 700, color: "var(--fg-muted)", flexShrink: 0,
            }}>
              diff output
            </div>
            {viewMode === "sidebyside"
              ? <SideBySideDiff diff={diff} />
              : <UnifiedDiff diff={diff} mode={diffMode} />
            }
          </div>
        </div>
      </div>
    </div>
  );
}
