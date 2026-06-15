/**
 * Unit tests for lib/latex-parser.ts
 *
 * Run: npm test
 *
 * Covers the critical paths that have historically had bugs and that
 * real users hit every day. Each group of tests maps to a feature or
 * a past regression.
 */
import { describe, it, expect } from "vitest";
import { latexToHtml } from "../latex-parser";

// ── helpers ─────────────────────────────────────────────────────────────────

/** Strip HTML tags and collapse whitespace — useful for text content checks */
function text(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function html(src: string): string {
  return latexToHtml(src).html;
}

function warns(src: string): string[] {
  return latexToHtml(src).warnings.map(w => w.env);
}

// ── 1. Preamble stripping ────────────────────────────────────────────────────

describe("preamble cleanup", () => {
  it("strips \\usepackage declarations", () => {
    const out = html("\\usepackage{amsmath}\n\\usepackage[utf8]{inputenc}\nhello");
    expect(out).not.toContain("usepackage");
    expect(out).toContain("hello");
  });

  it("strips \\definecolor without leaking color name", () => {
    const out = text(html("\\definecolor{ecblue}{RGB}{0,56,168}\nhello"));
    expect(out).not.toContain("ecblue");
    expect(out).toContain("hello");
  });

  it("strips \\newcommand with nested braces", () => {
    const src = `\\newcommand{\\rubrique}[1]{%
  \\vspace{0.75em}%
  {\\large\\bfseries #1}%
}
hello`;
    const out = text(html(src));
    expect(out).not.toContain("rubrique");
    expect(out).not.toContain("vspace");
    expect(out).not.toContain("#1");
    expect(out).toContain("hello");
  });
});

// ── 2. Sections ───────────────────────────────────────────────────────────────

describe("sections", () => {
  it("renders \\section as <h2>", () => {
    const out = html("\\section{Introduction}");
    expect(out).toContain("<h2>");
    expect(out).toContain("Introduction");
  });

  it("numbers sections sequentially", () => {
    const out = html("\\section{A}\\section{B}\\section{C}");
    expect(out).toContain(">1<");
    expect(out).toContain(">2<");
    expect(out).toContain(">3<");
  });

  it("starred \\section* has no number", () => {
    const out = html("\\section*{Unnumbered}");
    expect(out).toContain("Unnumbered");
    expect(out).not.toMatch(/sec-num.*1/);
  });
});

// ── 3. Math ───────────────────────────────────────────────────────────────────

describe("math", () => {
  it("renders inline $...$ as math-inline span", () => {
    const out = html("Let $x = 2$ be given.");
    expect(out).toContain('class="math-inline"');
    // content is URL-encoded inside data-math attribute
    expect(out).toContain("data-math=");
  });

  it("renders \\[...\\] as math-block div", () => {
    const out = html("\\[ E = mc^2 \\]");
    expect(out).toContain('class="math-block"');
  });

  it("renders \\begin{equation}...\\end{equation} with number", () => {
    const out = html("\\begin{equation}\na = b\n\\end{equation}");
    expect(out).toContain("(1)");
    expect(out).toContain("math-numbered");
  });

  it("numbers multiple equations sequentially", () => {
    const src = "\\begin{equation}a\\end{equation}\\begin{equation}b\\end{equation}";
    const out = html(src);
    expect(out).toContain("(1)");
    expect(out).toContain("(2)");
  });

  it("renders align* without equation number", () => {
    const out = html("\\begin{align*}\na &= b\n\\end{align*}");
    expect(out).toContain("math-block");
    expect(out).not.toContain("eq-number");
  });

  it("renders \\boxed{} — wraps in KaTeX boxed", () => {
    const out = html("The result is $\\boxed{E=mc^2}$.");
    // boxed is handled in processInline, should appear as math-inline
    expect(out).toContain("math-inline");
  });

  it("renders \\bm{x} — maps to \\boldsymbol in data-math", () => {
    const out = html("Vector $\\bm{w}$ is bold.");
    // \bm{w} inside $...$ is sanitised to \boldsymbol{w} before URL-encoding
    // decoding the data-math attribute should contain boldsymbol
    const match = out.match(/data-math="([^"]+)"/);
    expect(match).toBeTruthy();
    const decoded = decodeURIComponent(match![1]);
    expect(decoded).toContain("boldsymbol");
  });
});

// ── 4. Lists ──────────────────────────────────────────────────────────────────

describe("lists", () => {
  it("renders itemize as <ul>", () => {
    const out = html("\\begin{itemize}\\item First\\item Second\\end{itemize}");
    expect(out).toContain("<ul>");
    expect(out).toContain("<li>");
    expect(out).toContain("First");
    expect(out).toContain("Second");
  });

  it("renders enumerate as <ol>", () => {
    const out = html("\\begin{enumerate}\\item A\\item B\\end{enumerate}");
    expect(out).toContain("<ol>");
  });

  it("handles nested lists", () => {
    const src = `\\begin{itemize}
\\item outer
  \\begin{itemize}
  \\item inner
  \\end{itemize}
\\end{itemize}`;
    const out = html(src);
    expect(out.match(/<ul>/g)?.length).toBe(2);
    expect(out).toContain("outer");
    expect(out).toContain("inner");
  });
});

// ── 5. Tables ─────────────────────────────────────────────────────────────────

describe("tabular", () => {
  it("renders tabular as <table>", () => {
    const src = "\\begin{tabular}{ll}\nA & B \\\\\nC & D \\\\\n\\end{tabular}";
    const out = html(src);
    expect(out).toContain("<table>");
    expect(out).toContain("<th>");
    expect(out).toContain("A");
    expect(out).toContain("D");
  });

  it("does not produce orphaned </tbody></table> for hline-only table", () => {
    const out = html("\\begin{tabular}{l}\\hline\\end{tabular}");
    expect(out).not.toContain("</tbody></table>");
  });
});

// ── 6. Environments ────────────────────────────────────────────────────────────

describe("presentation classes (Beamer)", () => {
  const DECK = `\\documentclass[aspectratio=169]{beamer}
\\title{Python, SQL \\& Machine Learning}
\\begin{document}
\\section{Motivation}
\\begin{frame}{First slide}Intro text\\end{frame}
\\begin{frame}[plain]Title slide with no frame title\\end{frame}
\\section{Python for Data}
\\begin{frame}{The DataFrame}\\begin{lstlisting}[style=py]import pandas\\end{lstlisting}\\end{frame}
\\end{document}`;

  it("detects beamer and shows the notice instead of mangled output", () => {
    const out = html(DECK);
    expect(out).toContain("preview-notice");
    expect(out).toContain("Beamer presentation detected");
    expect(out).toContain("↓ PDF");
    // raw lstlisting code must NOT leak into the output
    expect(out).not.toContain("import pandas");
  });

  it("emits a warning for the presentation class", () => {
    expect(warns(DECK)).toContain("beamer");
  });

  it("counts all frames", () => {
    expect(html(DECK)).toContain("3 slides");
  });

  it("builds an outline of sections and frame titles", () => {
    const out = html(DECK);
    expect(out).toContain("beamer-outline");
    expect(out).toContain("Motivation");
    expect(out).toContain("First slide");
    expect(out).toContain("The DataFrame");
  });

  it("detects a deck even without an explicit beamer class (frame env present)", () => {
    const out = html("\\begin{document}\\begin{frame}{Solo}hi\\end{frame}\\end{document}");
    expect(out).toContain("preview-notice");
  });
});

describe("environments", () => {
  it("renders abstract", () => {
    const out = html("\\begin{abstract}This is the abstract.\\end{abstract}");
    expect(out).toContain('class="abstract"');
    expect(out).toContain("This is the abstract.");
  });

  it("renders theorem-like environments", () => {
    const out = html("\\begin{theorem}Pythagoras.\\end{theorem}");
    expect(out).toContain("Theorem");
    expect(out).toContain("Pythagoras.");
  });

  it("renders proof environment", () => {
    const out = html("\\begin{proof}By induction.\\end{proof}");
    expect(out).toContain("Proof");
  });

  it("renders \\begin{center} as centered div", () => {
    const out = html("\\begin{center}Hello centered\\end{center}");
    expect(out).toContain("text-align:center");
    expect(out).toContain("Hello centered");
    expect(out).not.toContain("[center]");
  });

  it("renders description list", () => {
    const out = html("\\begin{description}\\item[Term] Definition\\end{description}");
    expect(out).toContain("<dl");
    expect(out).toContain("<dt>");
    expect(out).toContain("Term");
    expect(out).toContain("Definition");
  });

  it("renders algorithm environment as code block", () => {
    const out = html("\\begin{algorithm}\n\\State $x \\gets 0$\n\\end{algorithm}");
    expect(out).toContain("Algorithm");
    expect(out).not.toContain("[algorithm]");
  });

  it("tikzpicture shows placeholder, not crash", () => {
    const out = html("\\begin{tikzpicture}\\draw(0,0)circle(1cm);\\end{tikzpicture}");
    expect(out).toContain("TikZ");
    expect(out).not.toContain("[tikzpicture]");
  });

  it("comment environment is removed silently", () => {
    const out = text(html("before\\begin{comment}hidden\\end{comment}after"));
    expect(out).not.toContain("hidden");
    expect(out).toContain("before");
    expect(out).toContain("after");
  });
});

// ── 7. References & Citations ─────────────────────────────────────────────────

describe("references and citations", () => {
  it("resolves \\label and \\ref", () => {
    const src = "\\section{Intro}\\label{sec:intro} See Section~\\ref{sec:intro}.";
    const out = html(src);
    expect(out).toContain(">1<");
    expect(out).not.toContain("??");
  });

  it("marks unresolved \\ref as ??", () => {
    const out = html("See~\\ref{sec:missing}.");
    expect(out).toContain("??");
    expect(out).toContain("unresolved");
  });

  it("renders \\cite as [N]", () => {
    const src = `\\begin{thebibliography}{9}
\\bibitem{smith23} Smith et al.
\\end{thebibliography}
See \\cite{smith23}.`;
    const out = html(src);
    expect(out).toContain("[1]");
  });
});

// ── 8. Inline formatting ──────────────────────────────────────────────────────

describe("inline formatting", () => {
  it("\\textbf → <strong>", () => {
    expect(html("\\textbf{bold}")).toContain("<strong>bold</strong>");
  });
  it("\\textit → <em>", () => {
    expect(html("\\textit{italic}")).toContain("<em>italic</em>");
  });
  it("\\texttt → <code>", () => {
    expect(html("\\texttt{mono}")).toContain("<code>mono</code>");
  });
  it("\\href renders a link", () => {
    const out = html("\\href{https://example.com}{link text}");
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain("link text");
  });
  it("\\url blocks javascript: protocol — href is '#'", () => {
    const out = html("\\url{javascript:alert(1)}");
    // href must be '#', not the javascript: URI — visible text may still show it
    expect(out).toContain('href="#"');
    expect(out).not.toContain('href="javascript:');
  });
  it("\\textcolor drops color name", () => {
    const out = text(html("\\textcolor{red}{visible}"));
    expect(out).not.toContain("red");
    expect(out).toContain("visible");
  });
});

// ── 9. Multi-file warning ─────────────────────────────────────────────────────

describe("multi-file documents", () => {
  it("\\input shows a warning block, not silent erasure", () => {
    const out = html("\\input{chapter1.tex}\nhello");
    expect(out).toContain("chapter1.tex");
    expect(out).toContain("hello");
  });

  it("warns about \\input in ParseWarning list", () => {
    const w = warns("\\input{chapter1.tex}");
    expect(w).toContain("\\input");
  });
});

// ── 10. siunitx ───────────────────────────────────────────────────────────────

describe("siunitx", () => {
  it("\\SI{9.8}{\\meter\\per\\second\\squared} renders readable", () => {
    const out = text(html("Speed: \\SI{9.8}{\\meter\\per\\second\\squared}."));
    expect(out).toContain("9.8");
    // unit should be simplified to some readable form
    expect(out).toContain("m");
  });

  it("\\num{1e6} renders the number", () => {
    const out = text(html("Count: \\num{1e6}."));
    expect(out).toContain("1e6");
  });
});

// ── 11. BibTeX \printbibliography placeholder ─────────────────────────────────

describe("printbibliography", () => {
  it("shows a 'compile with biber' placeholder", () => {
    const out = html("\\printbibliography");
    expect(out).toContain("biber");
    expect(out).not.toMatch(/^\s*$/);
  });
});

// ── 12. Typography ────────────────────────────────────────────────────────────

describe("typography", () => {
  it("converts --- to em dash", () => {
    expect(text(html("word---word"))).toContain("word—word");
  });
  it("converts -- to en dash", () => {
    expect(text(html("pp.~10--20"))).toContain("10–20");
  });
  it("converts `` '' to smart quotes", () => {
    const out = text(html("``hello''"));
    expect(out).toContain("\u201chello\u201d");
    expect(out).toContain("“hello”");
  });
  it("\\ldots → ellipsis character", () => {
    expect(text(html("wait\\ldots"))).toContain("wait…");
  });
});
