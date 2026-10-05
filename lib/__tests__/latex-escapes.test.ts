import { describe, it, expect } from "vitest";
import { latexToHtml } from "../latex-parser";

const html = (src: string) => latexToHtml(src).html;

describe("escaped characters", () => {
  it("renders \\% \\$ \\& \\# \\_ \\{ \\} as plain characters", () => {
    expect(html("50\\% of \\$5 \\& \\# \\_ \\{x\\}")).toBe("<p>50% of $5 &amp; # _ {x}</p>");
  });

  it("does not open inline math on escaped dollars", () => {
    const out = html("Price is \\$5 and \\$6 here");
    expect(out).not.toContain("math-inline");
    expect(out).toContain("Price is $5 and $6 here");
  });

  it("keeps escapes as LaTeX inside math", () => {
    const out = html("cost $\\$5 + 50\\%$");
    expect(out).toContain(`data-math="${encodeURIComponent("\\$5 + 50\\%")}"`);
  });

  it("does not split a tabular cell on \\&", () => {
    const out = html("\\begin{tabular}{cc} a \\& b & c \\\\ \\end{tabular}");
    expect(out).toContain("<th>a &amp; b</th><th>c</th>");
  });

  it("does not treat % in \\url as a comment", () => {
    const out = html("\\url{https://x.com/a_b%20c}");
    expect(out).toContain('href="https://x.com/a_b%20c"');
    expect(out).toContain(">https://x.com/a_b%20c</a>");
  });

  it("keeps \\% literal in verbatim", () => {
    expect(html("\\begin{verbatim}a \\% b\\end{verbatim}")).toContain("<code>a \\% b</code>");
  });

  it("still strips real comments, including after a \\\\ line break", () => {
    const out = html("100\\% kept % dropped\nline \\\\% gone too\nend");
    expect(out).toContain("100% kept");
    expect(out).not.toContain("dropped");
    expect(out).not.toContain("gone too");
  });

  it("unescapes the title block", () => {
    expect(html("\\title{R\\&D \\'Etude}\\begin{document}x\\end{document}"))
      .toContain('<h1 class="doc-title">R&amp;D Étude</h1>');
  });
});

describe("accents", () => {
  it("composes text-mode accents", () => {
    expect(html("\\'e \\\"o \\^o \\`a \\c{c} \\~n \\'{\\i} \\v{s}")).toBe("<p>é ö ô à ç ñ í š</p>");
  });

  it("renders special letters", () => {
    expect(html("Stra\\ss e \\ss{} \\o{} \\ae")).toBe("<p>Straße ß ø æ</p>");
  });

  it("renders \\textbackslash, \\textasciitilde and \\textasciicircum", () => {
    expect(html("\\textbackslash{} \\textasciitilde{} \\textasciicircum{}")).toBe("<p>\\ ~ ^</p>");
  });
});

describe("block nesting", () => {
  it("never wraps headings in <p>", () => {
    const out = html("\\section*{Intro} \\subsection{A}");
    expect(out).not.toMatch(/<p>\s*<h[1-4]/);
    expect(out).toContain("<h2>Intro</h2>");
  });

  it("splits text around a heading into separate paragraphs", () => {
    const out = html("Before \\section{S} after");
    expect(out).toMatch(/^<p>Before<\/p>\s*<h2>.*<\/h2>\s*<p>after<\/p>$/);
  });
});
