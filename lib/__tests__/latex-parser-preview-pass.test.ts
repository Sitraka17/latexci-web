/**
 * Regression tests for the live-preview pass (preamble definitions, equation
 * numbering, references, balanced arguments, tables, siunitx, small bugs).
 * Each block maps to one confirmed defect.
 */
import { describe, it, expect } from "vitest";
import { latexToHtml } from "../latex-parser";

const html = (src: string) => latexToHtml(src).html;
/** Visible text: tags removed (inline tags must not add spaces), blocks separated. */
const text = (h: string) =>
  h.replace(/<\/?(?:div|p|h[1-6]|li|tr|td|th|table|figure|figcaption)[^>]*>/g, " ")
    .replace(/<[^>]+>/g, "").replace(/[ \t\n]+/g, " ").trim();
const doc = (preamble: string, body: string) =>
  `\\documentclass{article}\n${preamble}\n\\begin{document}\n${body}\n\\end{document}`;
/** Decoded data-math payloads, in document order. */
const maths = (h: string) => [...h.matchAll(/data-math="([^"]*)"/g)].map((m) => decodeURIComponent(m[1]));

// ── 1. Preamble definitions ──────────────────────────────────────────────────

describe("preamble definitions reach the body", () => {
  it("expands a \\newcommand defined before \\begin{document}", () => {
    const out = html(doc("\\newcommand{\\R}{\\mathbb{R}}", "Let $x \\in \\R^n$."));
    expect(maths(out)[0]).toContain("\\mathbb{R}^n");
  });

  it("expands a \\newcommand with a default optional argument", () => {
    const out = text(html(doc("\\newcommand{\\greet}[2][Hello]{#1, #2!}", "\\greet{Ada} \\greet[Hi]{Bob}")));
    expect(out).toContain("Hello, Ada!");
    expect(out).toContain("Hi, Bob!");
  });

  it("returns \\DeclareMathOperator definitions as KaTeX macros (starred too)", () => {
    const r = latexToHtml(doc("\\DeclareMathOperator{\\sgn}{sgn}\n\\DeclareMathOperator*{\\argmax}{arg\\,max}", "$\\argmax_x \\sgn(x)$"));
    expect(r.macros["\\sgn"]).toBe("\\operatorname{sgn}");
    expect(r.macros["\\argmax"]).toBe("\\operatorname*{arg\\,max}");
    expect(r.html).not.toContain("DeclareMathOperator");
  });

  it("renders a theorem env declared with \\newtheorem in the preamble, with its body", () => {
    const out = html(doc("\\newtheorem{lem}{Lemma}", "\\begin{lem}Every bounded sequence has a convergent subsequence.\\end{lem}"));
    expect(out).toContain("thm-box");
    expect(out).toContain("Lemma 1.");
    expect(out).toContain("convergent subsequence");
    expect(out).not.toContain("[lem]");
  });

  it("numbers theorems with a shared counter and resolves their labels", () => {
    const out = text(html(doc(
      "\\newtheorem{thm}{Theorem}\n\\newtheorem{lem}[thm]{Lemma}",
      "\\begin{thm}\\label{t:a}A\\end{thm}\\begin{lem}\\label{l:b}B\\end{lem} See \\cref{l:b}."
    )));
    expect(out).toContain("Theorem 1.");
    expect(out).toContain("Lemma 2.");
    expect(out).toContain("See Lemma 2.");
  });

  it("never drops the body of an unknown environment, and labels it", () => {
    const r = latexToHtml("\\begin{mybox}Keep this sentence.\\end{mybox}");
    expect(r.html).toContain("Keep this sentence.");
    expect(r.html).toContain("mybox");
    expect(r.warnings.map((w) => w.env)).toContain("mybox");
  });

  it("expands \\newenvironment definitions", () => {
    const out = html(doc("\\newenvironment{note}{\\begin{quote}\\textbf{Note.}}{\\end{quote}}", "\\begin{note}Read this.\\end{note}"));
    expect(out).toContain("<blockquote");
    expect(out).toContain("<strong>Note.</strong>");
    expect(out).toContain("Read this.");
  });
});

// ── 2. Equation numbering ────────────────────────────────────────────────────

describe("equation numbering", () => {
  const SRC = [
    "\\begin{align}a &= b \\label{eq:first}\\\\ c &= d \\nonumber \\\\ e &= f \\label{eq:third}\\end{align}",
    "\\begin{equation}g = h \\label{eq:eq}\\end{equation}",
    "\\begin{gather}i = j \\\\ k = l \\notag\\end{gather}",
    "\\begin{multline}m \\\\ = n \\label{eq:ml}\\end{multline}",
    "See \\eqref{eq:first}, \\eqref{eq:third}, \\ref{eq:eq} and \\eqref{eq:ml}.",
  ].join("\n");

  it("uses one counter in document order, one number per numbered row", () => {
    const m = maths(html(SRC));
    expect(m[0]).toContain("\\tag{1}");
    expect(m[0]).toContain("\\tag{2}");
    expect(m[0]).not.toContain("\\tag{3}");
    expect(m[0]).not.toContain("\\label");
    expect(m[2]).toContain("\\tag{4}");
    expect(m[2]).not.toContain("\\tag{5}");
  });

  it("numbers equation and multline from the same counter", () => {
    const out = html(SRC);
    expect(out).toContain('<span class="eq-number">(3)</span>');
    expect(out).toContain('<span class="eq-number">(5)</span>');
  });

  it("resolves each \\label in a multi-row env to its own row", () => {
    expect(text(html(SRC))).toContain("See (1), (2), 3 and (5).");
  });

  it("keeps an author \\tag and does not consume a number for it", () => {
    const m = maths(html("\\begin{align}x &= 1 \\tag{A}\\\\ y &= 2\\end{align}"));
    expect(m[0]).toContain("\\tag{A}");
    expect(m[0]).toContain("\\tag{1}");
  });

  it("does not split align rows inside a nested cases environment", () => {
    const m = maths(html("\\begin{align}f(x) &= \\begin{cases} 1 \\\\ 0 \\end{cases}\\end{align}"));
    expect(m[0].match(/\\tag\{/g)?.length).toBe(1);
  });

  it("numbers sections, equations and figures per chapter in a report", () => {
    const out = text(html([
      "\\chapter{Background}\\section{Setup}\\label{sec:setup}",
      "\\begin{equation}a\\label{eq:a}\\end{equation}",
      "\\chapter{Method}\\begin{equation}b\\label{eq:b}\\end{equation}",
      "See \\cref{sec:setup}, \\eqref{eq:a} and \\eqref{eq:b}.",
    ].join("\n")));
    expect(out).toContain("Chapter 1");
    expect(out).toContain("1.1 Setup");
    expect(out).toContain("See Section 1.1, (1.1) and (2.1).");
  });
});

// ── 3. References and citations ──────────────────────────────────────────────

describe("references and citations", () => {
  const BIB = "\\begin{thebibliography}{9}\\bibitem{a} A.\\bibitem{knuth} Knuth.\\end{thebibliography}";

  it("formats \\cref, \\Cref and \\autoref by label kind", () => {
    const out = text(html([
      "\\section{Intro}\\label{sec:i}",
      "\\begin{equation}x\\label{eq:x}\\end{equation}",
      "\\begin{figure}\\includegraphics{a.png}\\caption{Cap}\\label{fig:a}\\end{figure}",
      "\\begin{table}\\caption{T}\\label{tab:t}\\begin{tabular}{l}x\\end{tabular}\\end{table}",
      "R: \\cref{eq:x}; \\Cref{fig:a}; \\autoref{sec:i}; \\cref{tab:t}.",
    ].join("\n")));
    expect(out).toContain("R: Eq. (1); Figure 1; Section 1; Table 1.");
  });

  it("treats \\citet, \\citep, \\textcite and \\parencite like \\cite with a numeric bibliography", () => {
    const out = text(html(`\\citet{knuth} \\citep{knuth} \\textcite{knuth} \\parencite{knuth}\n${BIB}`));
    expect(out).toContain("[2] [2] [2] [2]");
  });

  it("renders the optional note of \\cite", () => {
    expect(text(html(`See \\cite[p.~4]{knuth}.\n${BIB}`))).toContain("See [2, p. 4].");
  });

  it("does not print the .bib name of \\bibliography as text", () => {
    const out = html("Text.\n\\bibliographystyle{plain}\n\\bibliography{refs}");
    expect(out).toContain("Bibliography from refs.bib");
    expect(text(out)).not.toMatch(/(^|\s)refs(\s|$)/);
  });
});

// ── 4. Balanced arguments ────────────────────────────────────────────────────

describe("balanced arguments", () => {
  it("keeps the whole caption when it contains nested braces", () => {
    const out = html("\\begin{figure}\\includegraphics{a.png}\\caption{Effect of $\\alpha_{t}$ on the loss}\\end{figure}");
    expect(out).toContain("on the loss");
    expect(maths(out)).toContain("\\alpha_{t}");
  });

  it("keeps a section title with nested braces", () => {
    expect(text(html("\\section{The $\\mathcal{O}(n)$ bound}"))).toContain("bound");
  });

  it("keeps nested braces inside a footnote", () => {
    const out = html("Claim\\footnote{See \\textbf{Smith} for details.}");
    expect(out).toContain("<strong>Smith</strong> for details.");
  });
});

// ── 5. Table column specs and rules ──────────────────────────────────────────

describe("tabular column specs and booktabs rules", () => {
  const T = [
    "\\begin{tabular}{@{}l p{3cm} r@{}}",
    "\\toprule",
    "Model & \\multicolumn{2}{c}{Scores} \\\\",
    "\\cmidrule(lr){2-3}",
    "Name & Notes & F1 \\\\",
    "\\midrule",
    "BERT & base & 0.91 \\\\",
    "\\bottomrule",
    "\\end{tabular}",
  ].join("\n");

  it("does not leak the column spec or rule arguments into cells", () => {
    const out = text(html(T));
    expect(out).not.toContain("3cm");
    expect(out).not.toContain("@");
    expect(out).not.toContain("(lr)");
    expect(out).not.toContain("2-3");
    expect(out).toContain("BERT");
  });

  it("uses the rows above \\midrule as the header and aligns from the spec", () => {
    const out = html(T);
    expect(out).toContain("<th>Name</th>");
    expect(out).toContain('<td style="text-align:right">0.91</td>');
    expect(out).toContain('colspan="2" style="text-align:center"');
  });

  it("expands *{n}{..} column groups", () => {
    const out = html("\\begin{tabular}{l*{2}{r}}a & 1 & 2 \\\\ b & 3 & 4\\end{tabular}");
    expect(out).toContain('<td style="text-align:right">4</td>');
  });
});

// ── 6. siunitx ────────────────────────────────────────────────────────────────

describe("siunitx", () => {
  it("renders \\qty with a unit macro", () => {
    expect(text(html("At \\qty{20}{\\celsius}."))).toContain("At 20 °C.");
  });

  it("renders \\SI with a plain-text unit and a power", () => {
    expect(text(html("g = \\SI{9.81}{m/s^2}"))).toContain("9.81 m/s²");
  });

  it("renders prefixes, \\per and \\squared", () => {
    expect(text(html("\\unit{\\kilo\\metre\\per\\second\\squared}"))).toContain("km/s²");
    expect(text(html("\\qty{5}{\\milli\\metre}"))).toContain("5 mm");
    expect(text(html("\\qty{3}{\\micro\\second}"))).toContain("3 µs");
  });

  it("renders \\num, \\si and \\percent", () => {
    expect(text(html("\\num{12345.6}"))).toContain("12\u2009345.6");
    expect(text(html("\\si{\\metre\\cubed}"))).toContain("m³");
    expect(text(html("\\qty{12}{\\percent}"))).toContain("12 %");
  });
});

// ── 7. Small bugs ────────────────────────────────────────────────────────────

describe("small rendering bugs", () => {
  it("nests \\textbf{\\textit{x}} as balanced HTML", () => {
    expect(html("\\textbf{\\textit{x}}")).toContain("<strong><em>x</em></strong>");
  });

  it("renders \\verb|...| as code without the delimiters", () => {
    const out = html("Use \\verb|\\section{x}| here.");
    expect(out).toContain("<code>\\section{x}</code>");
    expect(out).not.toContain("|");
  });

  it("honours enumitem labels on enumerate", () => {
    const out = text(html("\\begin{enumerate}[label=(\\alph*)]\\item One\\item Two\\end{enumerate}"));
    expect(out).toContain("(a) One");
    expect(out).toContain("(b) Two");
  });

  it("honours the enumerate package short form", () => {
    expect(text(html("\\begin{enumerate}[i.]\\item A\\item B\\item C\\end{enumerate}"))).toContain("iii. C");
  });

  it("honours a custom \\item[--] label", () => {
    const out = html("\\begin{itemize}\\item[--] Dash item\\end{itemize}");
    expect(out).toContain('class="item-label"');
    expect(text(out)).toContain("– Dash item");
  });

  it("uses plain words instead of emoji in placeholders", () => {
    const out = html([
      "\\begin{figure}\\includegraphics{plot.png}\\end{figure}",
      "\\printbibliography",
      "\\input{chapter1}",
      "\\begin{tikzpicture}\\draw (0,0);\\end{tikzpicture}",
    ].join("\n"));
    expect(out).toContain("Figure: plot.png");
    expect(out).toContain("Bibliography");
    expect(out).toContain("Note:");
    expect(out).not.toMatch(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u);
  });
});

// ── Security of the new paths ────────────────────────────────────────────────

describe("new paths stay escaped", () => {
  it("escapes markup in an unknown environment name and body", () => {
    const out = html("\\begin{x<img>}<script>1</script>\\end{x<img>}");
    expect(out).not.toContain("<script>");
    expect(out).not.toContain("<img");
  });

  it("does not let \\verb content break out of a footnote title", () => {
    const out = html('A\\footnote{\\verb|" onmouseover="alert(1)|}');
    expect(out).not.toContain('onmouseover="alert(1)"');
  });

  it("escapes markup inside an algorithm", () => {
    expect(html("\\begin{algorithm}<img src=x onerror=alert(1)>\\end{algorithm}")).not.toContain("<img");
  });
});
