"use client";
import { useState, useMemo, useCallback, useEffect, type ReactNode } from "react";
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

// ── Drop-zone editor pane ─────────────────────────────────────────────────────
function EditorPane({
  value, onChange, label, side, onClear, onFileName,
}: {
  value: string; onChange: (v: string) => void;
  label: string; side: "original" | "revised"; onClear: () => void;
  onFileName?: (name: string) => void;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "text/plain": [".tex", ".txt"], "application/x-tex": [".tex"] },
    maxFiles: 1, noClick: true,
    onDrop: async (files) => {
      if (!files[0]) return;
      onChange(await files[0].text());
      onFileName?.(files[0].name);
    },
  });

  return (
    <div {...getRootProps()} className={`ld-pane ld-pane-${side}${isDragActive ? " is-drop" : ""}`}>
      <input {...getInputProps()} />
      <div className="ld-pane-head">
        <span className="ld-pane-name">{label}</span>
        <span className="ld-pane-hint">
          {isDragActive ? "Drop to load" : "paste, or drop a .tex file"}
        </span>
        <button type="button" className="btn btn-sm ld-clear" onClick={onClear} title="Clear editor">
          Clear
        </button>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        spellCheck={false}
        aria-label={label.startsWith("revised") ? "Revised LaTeX" : "Original LaTeX"}
        placeholder={`Paste ${label} LaTeX here…`}
      />
    </div>
  );
}

// ── Side-by-side diff renderer ────────────────────────────────────────────────
type DiffPart = { value: string; added?: boolean; removed?: boolean };

export type SideBySideRow = {
  left: string | null;
  right: string | null;
  kind: "changed" | "added" | "removed" | "unchanged";
};

const splitLines = (value: string) => {
  const lines = value.split("\n");
  if (lines[lines.length - 1] === "") lines.pop();
  return lines;
};

/**
 * Turn a line diff into side-by-side rows. Each replace block (a run of
 * removed and added parts between unchanged parts) is paired line by line:
 * removed[i] sits next to added[i], and the leftovers become pure removals
 * or additions, so a 3-line edit stays on 3 rows instead of drifting.
 */
export function pairSideBySide(lineDiff: DiffPart[]): SideBySideRow[] {
  const rows: SideBySideRow[] = [];
  let removed: string[] = [];
  let added: string[] = [];
  const flush = () => {
    const n = Math.max(removed.length, added.length);
    for (let k = 0; k < n; k++) {
      const l = removed[k] ?? null;
      const r = added[k] ?? null;
      rows.push({ left: l, right: r, kind: l !== null && r !== null ? "changed" : l !== null ? "removed" : "added" });
    }
    removed = [];
    added = [];
  };
  for (const part of lineDiff) {
    if (part.removed) removed.push(...splitLines(part.value));
    else if (part.added) added.push(...splitLines(part.value));
    else {
      flush();
      for (const line of splitLines(part.value)) rows.push({ left: line, right: line, kind: "unchanged" });
    }
  }
  flush();
  return rows;
}

function SideBySideDiff({ original, revised, mode }: {
  original: string; revised: string; mode: "lines" | "words";
}) {
  // Rows always come from a LINE diff so there is one row per source line; in
  // word mode, changed rows additionally get word-level highlights below.
  const paired = useMemo(
    () => pairSideBySide(Diff.diffLines(original, revised)),
    [original, revised],
  );

  const renderCell = (row: SideBySideRow, side: "left" | "right"): ReactNode => {
    const text = side === "left" ? row.left : row.right;
    if (mode === "lines" || row.kind !== "changed" || row.left === null || row.right === null) return text ?? "";
    return Diff.diffWords(row.left, row.right)
      .filter(p => (side === "left" ? !p.added : !p.removed))
      .map((p, k) =>
        p.added || p.removed
          ? <mark key={k}>{p.value}</mark>
          : <span key={k}>{p.value}</span>
      );
  };

  const cellClass = (side: "left" | "right", kind: SideBySideRow["kind"]) => {
    const isLeft = side === "left";
    const tone =
      (kind === "removed" || kind === "changed") && isLeft ? "diff-removed" :
      (kind === "added" || kind === "changed") && !isLeft ? "diff-added" :
      "diff-neutral";
    return `ld-cell ld-cell-${side} ${tone}${kind === "removed" && isLeft ? " is-struck" : ""}`;
  };

  // One grid row per source line, so the two sides stay aligned when a long
  // line wraps.
  return (
    <div className="ld-sbs">
      <div className="ld-sbs-head ld-cell-left ld-tone-removed">original.tex (removals)</div>
      <div className="ld-sbs-head ld-tone-added">revised.tex (additions)</div>
      {paired.map((row, idx) => (
        <div key={idx} className="ld-sbs-row">
          <span className={cellClass("left", row.kind)}>{renderCell(row, "left")}</span>
          <span className={cellClass("right", row.kind)}>{renderCell(row, "right")}</span>
        </div>
      ))}
    </div>
  );
}

// ── Patch export ──────────────────────────────────────────────────────────────
/**
 * Git-style unified diff (a/ b/ prefixes, `diff --git` header, blank lines
 * kept), so `git apply changes.patch` and `patch -p1 < changes.patch` work in
 * the folder that holds `fileName`. Built from the line texts, whatever the
 * on-screen diff mode.
 */
export function buildPatch(original: string, revised: string, fileName = "main.tex"): string {
  const f = fileName.replace(/^[/\\]+/, "").replace(/\\/g, "/").trim() || "main.tex";
  const body = Diff.createTwoFilesPatch(`a/${f}`, `b/${f}`, original, revised)
    .replace(/^=+\n/m, ""); // jsdiff's "=====" separator is not part of the format
  return `diff --git a/${f} b/${f}\n${body}`;
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

  if (isEmpty) return <p className="ld-empty">The two files are identical.</p>;

  if (mode === "words") return (
    <p className="ld-words">
      {diff.map((part, i) => (
        <span key={i} className={part.added ? "diff-added" : part.removed ? "diff-removed is-struck" : undefined}>
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
        <div key={`${pi}-${li}`} className="ld-line">
          <span className="ld-num">{num ?? ""}</span>
          <span className={`ld-sign ${part.added ? "ld-tone-added" : part.removed ? "ld-tone-removed" : ""}`}>{prefix}</span>
          <span className={`ld-text ${cls}`}>{line || " "}</span>
        </div>
      );
    });
  });

  return <div className="ld-unified">{rows}</div>;
}

// ── Toolbar button ────────────────────────────────────────────────────────────
// A toggle carries aria-pressed (styled in diff.css); a plain action does not.
function TBtn({
  children, onClick, active, title,
}: {
  children: ReactNode; onClick: () => void; active?: boolean; title?: string;
}) {
  return (
    <button type="button" className="btn btn-sm" onClick={onClick} title={title} aria-pressed={active}>
      {children}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
type DiffMode  = "lines" | "words";
type ViewMode  = "unified" | "sidebyside";
type Layout    = "stacked" | "columns";
type MobileTab = "original" | "revised" | "diff";

export default function LatexDiff() {
  const [original, setOriginal] = useState(ORIGINAL);
  const [revised,  setRevised]  = useState(REVISED);
  // File the patch targets (a/<name> b/<name>): the last dropped .tex, editable.
  const [patchFile, setPatchFile] = useState("main.tex");
  const [diffMode, setDiffMode] = useState<DiffMode>("lines");
  const [viewMode, setViewMode] = useState<ViewMode>("unified");
  const [layout,   setLayout]   = useState<Layout>("stacked");
  const [copied,   setCopied]   = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("original");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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

  const copyDiff = useCallback(async () => {
    const text = diff
      .map(p => p.value.split("\n").filter(Boolean)
        .map(l => (p.added ? "+ " : p.removed ? "- " : "  ") + l).join("\n"))
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked (permissions / insecure context): don't show a false "copied"
    }
  }, [diff]);

  const downloadPatch = useCallback(() => {
    const full = buildPatch(original, revised, patchFile);
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([full], { type: "text/x-patch" })),
      download: "changes.patch",
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 0);
  }, [original, revised, patchFile]);

  const isIdentical = stats.added === 0 && stats.removed === 0;

  // ── Toolbar ───────────────────────────────────────────────────────────────
  // On a phone the three panes become tabs, so the view and layout toggles
  // (which only make sense with the panes side by side) are left out.
  const toolbar = (
    <div className="ld-toolbar">
      <div className="ld-group">
        <span className="ld-group-label">Compare by</span>
        <div className="ld-seg">
          <TBtn active={diffMode === "lines"} onClick={() => setDiffMode("lines")}>Lines</TBtn>
          <TBtn active={diffMode === "words"} onClick={() => setDiffMode("words")}>Words</TBtn>
        </div>
      </div>

      {!isMobile && (
        <div className="ld-group">
          <span className="ld-group-label">View</span>
          <div className="ld-seg">
            <TBtn active={viewMode === "unified"} onClick={() => setViewMode("unified")}>Unified</TBtn>
            <TBtn active={viewMode === "sidebyside"} onClick={() => setViewMode("sidebyside")}>Side by side</TBtn>
          </div>
        </div>
      )}

      {!isMobile && (
        <div className="ld-group">
          <span className="ld-group-label">Layout</span>
          <div className="ld-seg">
            <TBtn
              active={layout === "stacked"} title="Editors on top, diff below"
              onClick={() => setLayout("stacked")}
            >Stacked</TBtn>
            <TBtn
              active={layout === "columns"} title="Editors on the left, diff on the right"
              onClick={() => setLayout("columns")}
            >Columns</TBtn>
          </div>
        </div>
      )}

      <div className="ld-group ld-actions">
        <button type="button" className="btn btn-sm" onClick={swap} title="Swap original and revised">Swap</button>
        <button type="button" className="btn btn-sm" onClick={copyDiff} title="Copy unified diff to clipboard">
          {copied ? "Copied" : "Copy diff"}
        </button>
        <input
          value={patchFile}
          onChange={(e) => setPatchFile(e.target.value)}
          aria-label="File name the patch applies to"
          title="File name the patch applies to (git apply / patch -p1)"
          spellCheck={false}
          className="input ld-file"
        />
        <button type="button" className="btn btn-sm" onClick={downloadPatch} title={`Download a patch for ${patchFile} (git apply)`}>
          Download patch
        </button>
      </div>
    </div>
  );

  // ── Panes ─────────────────────────────────────────────────────────────────
  const originalPane = (
    <EditorPane
      value={original} onChange={setOriginal} onFileName={setPatchFile}
      label="original.tex" side="original"
      onClear={() => setOriginal("")}
    />
  );
  const revisedPane = (
    <EditorPane
      value={revised} onChange={setRevised} onFileName={setPatchFile}
      label="revised.tex" side="revised"
      onClear={() => setRevised("")}
    />
  );

  const statsLine = (
    <span className="ld-stats">
      <span className="ld-tone-added">+{stats.added}</span>
      <span className="ld-tone-removed">−{stats.removed}</span>
      <span>{isIdentical ? "identical" : `${stats.unchanged} unchanged`}</span>
    </span>
  );

  // Side by side needs the width of a desktop pane; a phone always gets unified.
  const diffPane = (
    <div className="ld-diff">
      <div className="ld-pane-head">
        <span className="ld-pane-name">Diff</span>
        {statsLine}
      </div>
      <div className="ld-diff-body">
        {viewMode === "sidebyside" && !isMobile
          ? <SideBySideDiff original={original} revised={revised} mode={diffMode} />
          : <UnifiedDiff diff={diff} mode={diffMode} />
        }
      </div>
    </div>
  );

  // ── Mobile layout: one pane at a time, behind tabs ────────────────────────
  if (isMobile) {
    const tab = (id: MobileTab, label: ReactNode) => (
      <button
        type="button" role="tab" className="tab"
        aria-selected={mobileTab === id}
        onClick={() => setMobileTab(id)}
      >
        {label}
      </button>
    );
    return (
      <div className="ld ld-mobile">
        {toolbar}
        <div className="tabs ld-tabs" role="tablist" aria-label="Pane">
          {tab("original", "Original")}
          {tab("revised", "Revised")}
          {tab("diff", stats.added > 0 || stats.removed > 0 ? `Diff (+${stats.added} −${stats.removed})` : "Diff")}
        </div>
        {mobileTab === "original" && <div className="ld-editors">{originalPane}</div>}
        {mobileTab === "revised" && <div className="ld-editors">{revisedPane}</div>}
        {mobileTab === "diff" && diffPane}
      </div>
    );
  }

  // ── Stacked layout: editors on top, diff below ────────────────────────────
  if (layout === "stacked") {
    return (
      <div className="ld ld-stacked">
        {toolbar}
        <div className="ld-editors">
          {originalPane}
          {revisedPane}
        </div>
        {diffPane}
      </div>
    );
  }

  // ── Columns layout: original | revised | diff ─────────────────────────────
  return (
    <div className="ld ld-columns">
      {toolbar}
      <div className="ld-cols">
        {originalPane}
        {revisedPane}
        {diffPane}
      </div>
    </div>
  );
}
