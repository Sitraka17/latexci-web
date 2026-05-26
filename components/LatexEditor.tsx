"use client";
import { useEffect, useRef, useState } from "react";
import { latexToHtml } from "@/lib/latex-parser";

interface Props {
  initialValue?: string;
}

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

export default function LatexEditor({ initialValue = SAMPLE_LATEX }: Props) {
  const [source, setSource] = useState(initialValue);
  const [html, setHtml] = useState("");
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Render LaTeX → HTML, then hydrate math with KaTeX
  useEffect(() => {
    const rendered = latexToHtml(source);
    setHtml(rendered);
  }, [source]);

  // Hydrate math nodes with KaTeX after HTML updates
  useEffect(() => {
    if (!previewRef.current) return;
    const hydrate = async () => {
      const katex = (await import("katex")).default;
      await import("katex/dist/katex.min.css");

      // Inline math
      previewRef.current!.querySelectorAll<HTMLElement>(".math-inline[data-math]").forEach((el) => {
        try {
          el.innerHTML = katex.renderToString(decodeURIComponent(el.dataset.math || ""), {
            throwOnError: false,
            displayMode: false,
          });
          el.removeAttribute("data-math");
        } catch {}
      });

      // Display math
      previewRef.current!.querySelectorAll<HTMLElement>(".math-block[data-math]").forEach((el) => {
        try {
          el.innerHTML = katex.renderToString(decodeURIComponent(el.dataset.math || ""), {
            throwOnError: false,
            displayMode: true,
          });
          el.removeAttribute("data-math");
        } catch {}
      });
    };
    hydrate();
  }, [html]);

  const copyHtml = () => {
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = ta.value.substring(0, start) + "  " + ta.value.substring(end);
      setSource(newVal);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 56px)", overflow: "hidden" }}>
      {/* Editor pane */}
      <div
        style={{
          width: "50%",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        {/* Editor toolbar */}
        <div
          style={{
            padding: "0.5rem 1rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "var(--surface2)",
          }}
        >
          <div style={{ display: "flex", gap: "5px" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57", display: "inline-block" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e", display: "inline-block" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840", display: "inline-block" }} />
          </div>
          <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", color: "var(--fg-muted)", fontFamily: "JetBrains Mono, monospace" }}>
            main.tex
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setSource(SAMPLE_LATEX)}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 5,
              color: "var(--fg-muted)",
              fontSize: "0.75rem",
              padding: "0.2rem 0.6rem",
              cursor: "pointer",
            }}
          >
            Reset example
          </button>
          <button
            onClick={() => setSource("")}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 5,
              color: "var(--fg-muted)",
              fontSize: "0.75rem",
              padding: "0.2rem 0.6rem",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>

        {/* Textarea */}
        <textarea
          ref={editorRef}
          value={source}
          onChange={(e) => setSource(e.target.value)}
          onKeyDown={handleTab}
          spellCheck={false}
          placeholder="Paste your LaTeX here..."
          style={{
            flex: 1,
            background: "var(--surface)",
            color: "var(--fg)",
            border: "none",
            outline: "none",
            padding: "1.25rem",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "13px",
            lineHeight: 1.65,
            resize: "none",
            overflowY: "auto",
          }}
        />

        {/* Status bar */}
        <div
          style={{
            padding: "0.3rem 1rem",
            borderTop: "1px solid var(--border)",
            background: "var(--surface2)",
            fontSize: "0.72rem",
            color: "var(--fg-muted)",
            display: "flex",
            gap: "1rem",
          }}
        >
          <span>{source.split("\n").length} lines</span>
          <span>{source.length} chars</span>
          <span style={{ color: "var(--accent)" }}>LaTeX</span>
        </div>
      </div>

      {/* Preview pane */}
      <div
        style={{
          width: "50%",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg)",
        }}
      >
        {/* Preview toolbar */}
        <div
          style={{
            padding: "0.5rem 1rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "var(--surface2)",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "var(--fg-muted)" }}>
            HTML Preview
          </span>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--green)",
              marginLeft: "0.25rem",
            }}
          />
          <span style={{ fontSize: "0.72rem", color: "var(--green)" }}>live</span>
          <div style={{ flex: 1 }} />
          <button
            onClick={copyHtml}
            style={{
              background: copied ? "rgba(16,185,129,0.15)" : "var(--surface)",
              border: `1px solid ${copied ? "var(--green)" : "var(--border)"}`,
              borderRadius: 5,
              color: copied ? "var(--green)" : "var(--fg-muted)",
              fontSize: "0.75rem",
              padding: "0.2rem 0.6rem",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {copied ? "✓ Copied!" : "Copy HTML"}
          </button>
        </div>

        {/* Rendered output */}
        <div
          ref={previewRef}
          className="latex-preview"
          dangerouslySetInnerHTML={{ __html: html }}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "2rem 2.5rem",
            maxWidth: "100%",
          }}
        />
      </div>
    </div>
  );
}
