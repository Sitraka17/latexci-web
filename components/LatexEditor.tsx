"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { latexToHtml, ParseWarning } from "@/lib/latex-parser";
import LZString from "lz-string";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), { ssr: false });

const STORAGE_KEY = "latexci_source";

const SAMPLE = `\\documentclass{article}
\\usepackage{amsmath}
\\usepackage{amssymb}

\\title{A Brief Introduction to Calculus}
\\author{latexci Demo}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
Calculus is the mathematical study of continuous change, founded by Newton and Leibniz in the 17th century. This document gives a concise overview of limits, derivatives, and integration.
\\end{abstract}

\\section{Limits and Derivatives}

The derivative of a function $f(x)$ is defined as the limit:

\\[
  f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}
\\]

For example, if $f(x) = x^2$, then $f'(x) = 2x$.

\\subsection{Common Derivatives}

\\begin{itemize}
  \\item $\\frac{d}{dx}[x^n] = nx^{n-1}$
  \\item $\\frac{d}{dx}[\\sin x] = \\cos x$
  \\item $\\frac{d}{dx}[e^x] = e^x$
  \\item $\\frac{d}{dx}[\\ln x] = \\frac{1}{x}$
\\end{itemize}

\\section{Integration}

The fundamental theorem of calculus states:

\\[
  \\int_a^b f'(x)\\,dx = f(b) - f(a)
\\]

The Gaussian integral is a beautiful result:

\\[
  \\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}
\\]

\\section{Maxwell's Equations}

In differential form, Maxwell's equations are:

\\begin{align}
  \\nabla \\cdot \\mathbf{E} &= \\frac{\\rho}{\\varepsilon_0} \\\\
  \\nabla \\cdot \\mathbf{B} &= 0 \\\\
  \\nabla \\times \\mathbf{E} &= -\\frac{\\partial \\mathbf{B}}{\\partial t} \\\\
  \\nabla \\times \\mathbf{B} &= \\mu_0\\mathbf{J} + \\mu_0\\varepsilon_0\\frac{\\partial \\mathbf{E}}{\\partial t}
\\end{align}

\\end{document}
`;

const SNIPPETS: { label: string; icon: string; insert: string }[] = [
  { label: "Inline math",   icon: "∑", insert: "$...$" },
  { label: "Display math",  icon: "∫", insert: "\\[\n  ...\n\\]" },
  { label: "Align",         icon: "=", insert: "\\begin{align}\n  a &= b \\\\\\\\\n  c &= d\n\\end{align}" },
  { label: "Itemize",       icon: "•", insert: "\\begin{itemize}\n  \\item First\n  \\item Second\n\\end{itemize}" },
  { label: "Enumerate",     icon: "1.", insert: "\\begin{enumerate}\n  \\item First\n  \\item Second\n\\end{enumerate}" },
  { label: "Section",       icon: "§", insert: "\\section{Title}" },
  { label: "Bold",          icon: "B", insert: "\\textbf{text}" },
  { label: "Italic",        icon: "I", insert: "\\textit{text}" },
  { label: "Fraction",      icon: "½", insert: "\\frac{a}{b}" },
  { label: "Sum",           icon: "Σ", insert: "\\sum_{i=1}^{n}" },
  { label: "Integral",      icon: "∫", insert: "\\int_{a}^{b} f(x)\\,dx" },
  { label: "Matrix",        icon: "[]", insert: "\\begin{pmatrix}\n  a & b \\\\\\\\\n  c & d\n\\end{pmatrix}" },
  { label: "Theorem",       icon: "⊢", insert: "\\begin{theorem}\n  Statement here.\n\\end{theorem}" },
  { label: "α β λ",         icon: "α", insert: "\\alpha \\beta \\lambda" },
];

export default function LatexEditor({ initialValue }: { initialValue?: string }) {
  const [source, setSource]           = useState(initialValue ?? SAMPLE);
  const [html, setHtml]               = useState("");
  const [warnings, setWarnings]       = useState<ParseWarning[]>([]);
  const [copied, setCopied]           = useState(false);
  const [shared, setShared]           = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [isMobile, setIsMobile]       = useState(false);
  const [activePane, setActivePane]   = useState<"editor" | "preview">("editor");
  const [extensions, setExtensions]   = useState<unknown[]>([]);
  const [lineCount, setLineCount]     = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Load CodeMirror extensions
  useEffect(() => {
    Promise.all([
      import("@codemirror/lang-markdown").then(m => m.markdown()),
      import("@uiw/codemirror-theme-vscode").then(m => m.vscodeDark),
    ]).then(([lang, theme]) => setExtensions([lang, theme]));
  }, []);

  // Load from URL hash or localStorage
  useEffect(() => {
    if (initialValue) return;
    const hash = window.location.hash.slice(1);
    if (hash.startsWith("s=")) {
      const dec = LZString.decompressFromEncodedURIComponent(hash.slice(2));
      if (dec) { setSource(dec); return; }
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setSource(saved);
  }, [initialValue]);

  // Persist to localStorage
  useEffect(() => { localStorage.setItem(STORAGE_KEY, source); }, [source]);

  // Track line count
  useEffect(() => { setLineCount(source.split("\n").length); }, [source]);

  // Debounced render
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const { html: rendered, warnings: w } = latexToHtml(source);
      setHtml(rendered);
      setWarnings(w);
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [source]);

  // KaTeX hydration
  useEffect(() => {
    if (!previewRef.current || !html) return;
    (async () => {
      const katex = (await import("katex")).default;
      await import("katex/dist/katex.min.css");
      const root = previewRef.current!;
      root.querySelectorAll<HTMLElement>(".math-inline[data-math]").forEach(el => {
        try {
          el.innerHTML = katex.renderToString(
            decodeURIComponent(el.dataset.math!),
            { throwOnError: false, displayMode: false }
          );
          el.removeAttribute("data-math");
        } catch { /* ignore */ }
      });
      root.querySelectorAll<HTMLElement>(".math-block[data-math]").forEach(el => {
        try {
          el.innerHTML = katex.renderToString(
            decodeURIComponent(el.dataset.math!),
            { throwOnError: false, displayMode: true }
          );
          el.removeAttribute("data-math");
        } catch { /* ignore */ }
      });
    })();
  }, [html]);

  const copyHtml = useCallback(() => {
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [html]);

  const shareLink = useCallback(() => {
    const compressed = LZString.compressToEncodedURIComponent(source);
    const url = `${window.location.origin}/tools/preview#s=${compressed}`;
    navigator.clipboard.writeText(url);
    window.history.replaceState(null, "", `#s=${compressed}`);
    setShared(true);
    setTimeout(() => setShared(false), 2500);
  }, [source]);

  const insertSnippet = useCallback((text: string) => {
    setSource(prev => prev + (prev.endsWith("\n") ? "" : "\n") + text + "\n");
  }, []);

  const downloadHtml = useCallback(() => {
    const full = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>latexci export</title>` +
      `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex/dist/katex.min.css">` +
      `<style>body{max-width:700px;margin:3rem auto;font-family:Georgia,serif;line-height:1.75;padding:1rem;color:#111}` +
      `h1{font-size:1.8rem;border-bottom:1px solid #ccc;padding-bottom:.4rem}` +
      `h2{font-size:1.3rem;color:#333;margin-top:2rem}` +
      `.math-block{text-align:center;margin:1.5rem 0}` +
      `table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:.5rem .75rem}</style></head>` +
      `<body>${html}</body></html>`;
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([full], { type: "text/html" })),
      download: "document.html",
    });
    a.click();
  }, [html]);

  // ── Styles ─────────────────────────────────────────────────────────────

  const containerH = "calc(100vh - 56px)";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: containerH, background: "var(--bg)" }}>

      {/* ── Top toolbar ──────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.5rem",
        padding: "0 0.75rem", height: 44,
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        {/* macOS dots */}
        <div style={{ display: "flex", gap: 5, marginRight: 4 }}>
          {["#ff5f57", "#ffbd2e", "#28c840"].map(c => (
            <span key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c, display: "inline-block" }} />
          ))}
        </div>

        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.75rem", color: "var(--fg-muted)" }}>
          main.tex
        </span>

        <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px" }} />

        {/* Snippet toggle */}
        <Btn
          active={showSnippets}
          onClick={() => setShowSnippets(s => !s)}
          title="Snippets panel"
        >
          ⌨ Snippets
        </Btn>

        <Btn onClick={() => setSource(SAMPLE)} title="Restore demo document">Reset</Btn>
        <Btn onClick={() => setSource("")} title="Clear editor">Clear</Btn>

        <div style={{ flex: 1 }} />

        {/* Warnings */}
        {warnings.length > 0 && (
          <span title={warnings.map(w => w.env).join(", ")} style={{
            fontSize: "0.71rem", color: "#f59e0b", padding: "0.2rem 0.55rem",
            background: "rgba(245,158,11,0.1)", borderRadius: 5,
            border: "1px solid rgba(245,158,11,0.3)", cursor: "help",
          }}>
            ⚠ {warnings.map(w => w.env).join(", ")}
          </span>
        )}

        {/* Mobile tab switcher */}
        {isMobile && (
          <div style={{ display: "flex", background: "var(--surface2)", borderRadius: 6, border: "1px solid var(--border)", overflow: "hidden" }}>
            {(["editor", "preview"] as const).map(pane => (
              <button key={pane} onClick={() => setActivePane(pane)} style={{
                padding: "0.25rem 0.7rem", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600,
                background: activePane === pane ? "var(--accent)" : "transparent",
                color: activePane === pane ? "#fff" : "var(--fg-muted)",
              }}>
                {pane === "editor" ? "Editor" : "Preview"}
              </button>
            ))}
          </div>
        )}

        {/* Share / Copy / Download */}
        <Btn active={shared} activeColor="#10b981" onClick={shareLink} title="Copy shareable URL">
          {shared ? "✓ Copied!" : "🔗 Share"}
        </Btn>
        <Btn active={copied} activeColor="#6c63ff" onClick={copyHtml} title="Copy HTML output">
          {copied ? "✓ HTML!" : "Copy HTML"}
        </Btn>
        <Btn onClick={downloadHtml} title="Download as HTML file">↓ HTML</Btn>
      </div>

      {/* ── Main split ───────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Editor pane */}
        {(!isMobile || activePane === "editor") && (
          <div style={{
            width: isMobile ? "100%" : showSnippets ? "calc(50% - 160px)" : "50%",
            display: "flex", flexDirection: "column",
            borderRight: "1px solid var(--border)",
            background: "#1e1e1e", /* VSCode dark */
            transition: "width 0.2s",
            flexShrink: 0,
          }}>
            <div style={{ flex: 1, overflow: "hidden" }}>
              {extensions.length > 0 ? (
                <CodeMirror
                  value={source}
                  onChange={setSource}
                  extensions={extensions as import("@uiw/react-codemirror").ReactCodeMirrorProps["extensions"]}
                  height="100%"
                  style={{ height: "100%", fontSize: "13px" }}
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLine: true,
                    bracketMatching: true,
                    autocompletion: false,
                    foldGutter: true,
                  }}
                />
              ) : (
                <textarea
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  spellCheck={false}
                  style={{
                    width: "100%", height: "100%", background: "#1e1e1e", color: "#d4d4d4",
                    border: "none", outline: "none", padding: "1rem",
                    fontFamily: "JetBrains Mono, monospace", fontSize: "13px",
                    lineHeight: 1.65, resize: "none",
                  }}
                />
              )}
            </div>

            {/* Status bar */}
            <div style={{
              padding: "0.2rem 0.75rem",
              background: "#007acc", /* VSCode blue status bar */
              fontSize: "0.68rem", color: "#ffffffcc",
              display: "flex", gap: "1rem", alignItems: "center", flexShrink: 0,
            }}>
              <span>Ln {lineCount}</span>
              <span>{source.length} chars</span>
              <span style={{ marginLeft: "auto", fontWeight: 600, letterSpacing: "0.04em" }}>LaTeX</span>
            </div>
          </div>
        )}

        {/* Snippets sidebar */}
        {showSnippets && !isMobile && (
          <div style={{
            width: 160, borderRight: "1px solid var(--border)",
            background: "var(--surface2)", display: "flex", flexDirection: "column",
            flexShrink: 0, overflowY: "auto",
          }}>
            <div style={{
              padding: "0.5rem 0.75rem", fontSize: "0.65rem", fontWeight: 700,
              color: "var(--fg-muted)", letterSpacing: "0.1em", borderBottom: "1px solid var(--border)",
              textTransform: "uppercase",
            }}>Snippets</div>
            {SNIPPETS.map(s => (
              <button
                key={s.label}
                onClick={() => insertSnippet(s.insert)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  width: "100%", textAlign: "left", padding: "0.45rem 0.75rem",
                  background: "transparent", border: "none",
                  borderBottom: "1px solid var(--border)",
                  color: "var(--fg-muted)", fontSize: "0.78rem", cursor: "pointer",
                  transition: "background 0.1s, color 0.1s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.color = "var(--fg)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fg-muted)"; }}
              >
                <span style={{ width: 18, textAlign: "center", fontSize: "0.85rem", opacity: 0.7 }}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Preview pane ─────────────────────────────────────────── */}
        {(!isMobile || activePane === "preview") && (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            background: "#f0f0f0", /* light outer background */
            minWidth: 0, overflowY: "auto",
          }}>
            {/* Preview header */}
            <div style={{
              padding: "0.35rem 1rem",
              background: "var(--surface2)",
              borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", gap: "0.5rem",
              flexShrink: 0,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: "var(--green)", display: "inline-block",
                boxShadow: "0 0 6px var(--green)",
              }} />
              <span style={{ fontSize: "0.71rem", color: "var(--fg-muted)", fontWeight: 500 }}>Preview · live</span>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: "0.68rem", color: "var(--fg-muted)" }}>
                {html.length > 0 ? `${html.split(/<\/p>|<\/h[1-6]>|<\/li>/).length} blocks` : ""}
              </span>
            </div>

            {/* Paper / document */}
            <div style={{ flex: 1, overflowY: "auto", padding: "2rem 1.5rem" }}>
              <div
                ref={previewRef}
                className="latex-preview"
                dangerouslySetInnerHTML={{ __html: html }}
                style={{
                  maxWidth: 720,
                  margin: "0 auto",
                  background: "#ffffff",
                  boxShadow: "0 2px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
                  borderRadius: 4,
                  padding: "3.5rem 4rem",
                  minHeight: "calc(100vh - 140px)",
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "15px",
                  lineHeight: 1.8,
                  color: "#111",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Small reusable button ────────────────────────────────────────────────
function Btn({
  children, onClick, active, activeColor, title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  activeColor?: string;
  title?: string;
}) {
  const color = activeColor ?? "var(--accent2)";
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: active ? `${activeColor ?? "var(--accent2)"}22` : "var(--surface2)",
        border: `1px solid ${active ? `${color}55` : "var(--border)"}`,
        borderRadius: 5,
        color: active ? color : "var(--fg-muted)",
        fontSize: "0.75rem",
        padding: "0.22rem 0.6rem",
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.color = "var(--fg)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = active ? `${color}55` : "var(--border)";
        e.currentTarget.style.color = active ? color : "var(--fg-muted)";
      }}
    >
      {children}
    </button>
  );
}
