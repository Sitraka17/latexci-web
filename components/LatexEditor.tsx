"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { latexToHtml, ParseWarning } from "@/lib/latex-parser";
import LZString from "lz-string";

// Lazy-load CodeMirror to avoid SSR issues
const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), { ssr: false });

const STORAGE_KEY = "latexci_source";

const SAMPLE_LATEX = `\\documentclass{article}
\\usepackage{amsmath}
\\usepackage{amssymb}

\\title{A Brief Introduction to Calculus}
\\author{latexci Demo}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}

Calculus is the mathematical study of continuous change. The two main branches are \\textbf{differential calculus} and \\textbf{integral calculus}, related by the Fundamental Theorem of Calculus.

\\section{Limits and Derivatives}

The derivative of a function $f(x)$ is defined as:

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
  \\nabla \\times \\mathbf{B} &= \\mu_0 \\mathbf{J} + \\mu_0\\varepsilon_0\\frac{\\partial \\mathbf{E}}{\\partial t}
\\end{align}

\\end{document}
`;

const SNIPPETS = [
  { label: "Inline math", insert: "$...$" },
  { label: "Display math", insert: "\\[\n...\n\\]" },
  { label: "Align env", insert: "\\begin{align}\n  a &= b \\\\\n  c &= d\n\\end{align}" },
  { label: "Itemize", insert: "\\begin{itemize}\n  \\item First\n  \\item Second\n\\end{itemize}" },
  { label: "Section", insert: "\\section{Title}" },
  { label: "Bold", insert: "\\textbf{text}" },
  { label: "Italic", insert: "\\textit{text}" },
  { label: "Fraction", insert: "\\frac{numerator}{denominator}" },
  { label: "Sum", insert: "\\sum_{i=1}^{n}" },
  { label: "Integral", insert: "\\int_{a}^{b} f(x)\\,dx" },
  { label: "Matrix", insert: "\\begin{pmatrix}\n  a & b \\\\\n  c & d\n\\end{pmatrix}" },
  { label: "Greek α", insert: "\\alpha" },
  { label: "Greek β", insert: "\\beta" },
  { label: "Greek λ", insert: "\\lambda" },
];

export default function LatexEditor({ initialValue }: { initialValue?: string }) {
  const [source, setSource] = useState(initialValue ?? SAMPLE_LATEX);
  const [html, setHtml] = useState("");
  const [warnings, setWarnings] = useState<ParseWarning[]>([]);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activePane, setActivePane] = useState<"editor" | "preview">("editor");
  const previewRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [extensions, setExtensions] = useState<unknown[]>([]);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Load CodeMirror extensions client-side
  useEffect(() => {
    Promise.all([
      import("@codemirror/lang-markdown").then(m => m.markdown()),
      import("@uiw/codemirror-theme-vscode").then(m => m.vscodeDark),
    ]).then(([markdownLang, theme]) => {
      setExtensions([markdownLang, theme]);
    });
  }, []);

  // Load from URL hash or localStorage on mount
  useEffect(() => {
    if (initialValue) return;
    const hash = window.location.hash.slice(1);
    if (hash.startsWith("s=")) {
      const decoded = LZString.decompressFromEncodedURIComponent(hash.slice(2));
      if (decoded) { setSource(decoded); return; }
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setSource(saved);
  }, [initialValue]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, source);
  }, [source]);

  // Debounced render (300ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const { html: rendered, warnings: w } = latexToHtml(source);
      setHtml(rendered);
      setWarnings(w);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [source]);

  // KaTeX hydration
  useEffect(() => {
    if (!previewRef.current || !html) return;
    const hydrate = async () => {
      const katex = (await import("katex")).default;
      await import("katex/dist/katex.min.css");
      previewRef.current!.querySelectorAll<HTMLElement>(".math-inline[data-math]").forEach(el => {
        try {
          el.innerHTML = katex.renderToString(decodeURIComponent(el.dataset.math!), { throwOnError: false, displayMode: false });
          el.removeAttribute("data-math");
        } catch { /* ignore */ }
      });
      previewRef.current!.querySelectorAll<HTMLElement>(".math-block[data-math]").forEach(el => {
        try {
          el.innerHTML = katex.renderToString(decodeURIComponent(el.dataset.math!), { throwOnError: false, displayMode: true });
          el.removeAttribute("data-math");
        } catch { /* ignore */ }
      });
    };
    hydrate();
  }, [html]);

  const copyHtml = () => {
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  const downloadHtml = () => {
    const blob = new Blob([`<!DOCTYPE html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex/dist/katex.min.css"><script defer src="https://cdn.jsdelivr.net/npm/katex/dist/katex.min.js"></script></head><body style="max-width:800px;margin:2rem auto;font-family:Georgia,serif;padding:1rem">${html}</body></html>`], { type: "text/html" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "document.html" });
    a.click();
  };

  const btnStyle = (active?: boolean, color?: string): React.CSSProperties => ({
    background: active ? (color ? `${color}22` : "var(--surface2)") : "var(--surface)",
    border: `1px solid ${active && color ? `${color}55` : "var(--border)"}`,
    borderRadius: 5, color: active && color ? color : "var(--fg-muted)",
    fontSize: "0.75rem", padding: "0.25rem 0.65rem", cursor: "pointer", transition: "all 0.15s",
  });

  const containerHeight = "calc(100vh - 56px)";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: containerHeight }}>

      {/* Mobile tab bar */}
      {isMobile && (
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "var(--surface2)" }}>
          {(["editor", "preview"] as const).map(pane => (
            <button key={pane} onClick={() => setActivePane(pane)} style={{
              flex: 1, padding: "0.6rem", border: "none", background: activePane === pane ? "var(--surface)" : "transparent",
              color: activePane === pane ? "var(--fg)" : "var(--fg-muted)", fontWeight: 600, fontSize: "0.85rem",
              cursor: "pointer", borderBottom: activePane === pane ? `2px solid var(--accent)` : "2px solid transparent",
            }}>
              {pane === "editor" ? "✏️ Editor" : "👁️ Preview"}
            </button>
          ))}
        </div>
      )}

      {/* Main split layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Editor pane */}
        {(!isMobile || activePane === "editor") && (
          <div style={{
            width: isMobile ? "100%" : showSnippets ? "calc(50% - 180px)" : "50%",
            display: "flex", flexDirection: "column",
            borderRight: isMobile ? "none" : "1px solid var(--border)",
            background: "var(--surface)", transition: "width 0.2s",
          }}>
            {/* Editor toolbar */}
            <div style={{
              padding: "0.45rem 0.75rem", borderBottom: "1px solid var(--border)",
              background: "var(--surface2)", display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap",
            }}>
              <div style={{ display: "flex", gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57", display: "inline-block" }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e", display: "inline-block" }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840", display: "inline-block" }} />
              </div>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.75rem", color: "var(--fg-muted)", marginLeft: "0.25rem" }}>main.tex</span>
              <div style={{ flex: 1 }} />
              <button onClick={() => setShowSnippets(s => !s)} style={btnStyle(showSnippets, "var(--accent2)")}>⌨ Snippets</button>
              <button onClick={() => setSource(SAMPLE_LATEX)} style={btnStyle()}>Reset</button>
              <button onClick={() => setSource("")} style={btnStyle()}>Clear</button>
            </div>

            {/* CodeMirror editor */}
            <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
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
                    foldGutter: false,
                  }}
                />
              ) : (
                <textarea
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Tab") {
                      e.preventDefault();
                      const t = e.currentTarget, s = t.selectionStart, end = t.selectionEnd;
                      setSource(t.value.substring(0, s) + "  " + t.value.substring(end));
                      requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = s + 2; });
                    }
                  }}
                  spellCheck={false}
                  style={{
                    width: "100%", height: "100%", background: "var(--surface)", color: "var(--fg)",
                    border: "none", outline: "none", padding: "1rem",
                    fontFamily: "JetBrains Mono, monospace", fontSize: "13px", lineHeight: 1.65, resize: "none",
                  }}
                />
              )}
            </div>

            {/* Status bar */}
            <div style={{
              padding: "0.25rem 0.75rem", borderTop: "1px solid var(--border)",
              background: "var(--surface2)", fontSize: "0.7rem", color: "var(--fg-muted)",
              display: "flex", gap: "1rem", alignItems: "center",
            }}>
              <span>{source.split("\n").length} lines</span>
              <span>{source.length} chars</span>
              <span style={{ color: "var(--accent)" }}>LaTeX</span>
              {warnings.length > 0 && (
                <span style={{ color: "#f59e0b", marginLeft: "auto" }}>
                  ⚠ {warnings.length} unknown env{warnings.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Snippets sidebar */}
        {showSnippets && !isMobile && (
          <div style={{
            width: 180, borderRight: "1px solid var(--border)", background: "var(--surface2)",
            overflowY: "auto", flexShrink: 0,
          }}>
            <div style={{ padding: "0.5rem 0.75rem", fontSize: "0.72rem", fontWeight: 700, color: "var(--fg-muted)", letterSpacing: "0.08em", borderBottom: "1px solid var(--border)" }}>
              SNIPPETS
            </div>
            {SNIPPETS.map(s => (
              <button key={s.label} onClick={() => insertSnippet(s.insert)} style={{
                display: "block", width: "100%", textAlign: "left", padding: "0.45rem 0.75rem",
                background: "transparent", border: "none", borderBottom: "1px solid var(--border)",
                color: "var(--fg-muted)", fontSize: "0.78rem", cursor: "pointer",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--surface)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Preview pane */}
        {(!isMobile || activePane === "preview") && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg)", minWidth: 0 }}>
            {/* Preview toolbar */}
            <div style={{
              padding: "0.45rem 0.75rem", borderBottom: "1px solid var(--border)",
              background: "var(--surface2)", display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap",
            }}>
              <span style={{ fontSize: "0.78rem", color: "var(--fg-muted)" }}>Preview</span>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
              <span style={{ fontSize: "0.7rem", color: "var(--green)" }}>live</span>
              <div style={{ flex: 1 }} />

              {/* Warnings indicator */}
              {warnings.length > 0 && (
                <span title={warnings.map(w => w.env).join(", ")} style={{
                  fontSize: "0.72rem", color: "#f59e0b", padding: "0.2rem 0.5rem",
                  background: "rgba(245,158,11,0.1)", borderRadius: 4, border: "1px solid rgba(245,158,11,0.3)",
                  cursor: "help",
                }}>
                  ⚠ {warnings.map(w => w.env).join(", ")} not rendered
                </span>
              )}

              <button onClick={shareLink} style={btnStyle(shared, "#10b981")}>
                {shared ? "✓ Link copied!" : "🔗 Share"}
              </button>
              <button onClick={copyHtml} style={btnStyle(copied, "#6c63ff")}>
                {copied ? "✓ Copied!" : "Copy HTML"}
              </button>
              <button onClick={downloadHtml} style={btnStyle()}>↓ HTML</button>
            </div>

            {/* Rendered preview */}
            <div
              ref={previewRef}
              className="latex-preview"
              dangerouslySetInnerHTML={{ __html: html }}
              style={{ flex: 1, overflowY: "auto", padding: "2rem 2.5rem" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
