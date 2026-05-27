/**
 * Client-side LaTeX → HTML converter.
 *
 * Strategy: replace all block-level elements with unique placeholders FIRST,
 * then run processInline() only on plain text, then restore blocks.
 * This prevents inline regexes from corrupting already-generated HTML.
 */

export interface ParseWarning { env: string; reason: string; }

const KNOWN_ENVS = new Set([
  "document", "abstract", "itemize", "enumerate", "figure", "verbatim",
  "lstlisting", "tabular", "equation", "equation*", "align", "align*",
  "gather", "gather*", "matrix", "pmatrix", "bmatrix", "vmatrix",
  "array", "cases", "split", "multline", "multline*", "theorem", "proof",
  "lemma", "definition", "proposition", "corollary", "remark", "example",
]);

// Placeholder tokens — cannot appear in valid LaTeX
const PH = (n: number) => `\x00B${n}\x00`;

export function latexToHtml(src: string): { html: string; warnings: ParseWarning[] } {
  const warnings: ParseWarning[] = [];
  const blocks = new Map<string, string>();
  let n = 0;
  const block = (html: string) => { const p = PH(n++); blocks.set(p, html); return p; };

  // ── Extract body ────────────────────────────────────────────────────────
  const bodyMatch = src.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
  let body = bodyMatch ? bodyMatch[1] : src;

  // Remove preamble directives
  body = body.replace(/\\(usepackage|documentclass|geometry|setlength|pagestyle|pagenumbering)(\[.*?\])?\{[^}]*\}/g, "");
  body = body.replace(/\\(onehalfspacing|doublespacing|singlespacing|maketitle)\b/g, "");
  body = body.replace(/\\newcommand\{[^}]*\}(\[.*?\])?\{[^}]*\}/g, "");
  body = body.replace(/\\(renewcommand|setcounter|counterwithin|numberwithin)\{[^}]*\}\{[^}]*\}/g, "");
  body = body.replace(/\\newtheorem\{[^}]*\}(\[[^\]]*\])?\{[^}]*\}/g, "");

  // ── Extract title metadata ──────────────────────────────────────────────
  const rawTitle  = (src.match(/\\title\{([\s\S]*?)\}(?:\s*\\)/)  || src.match(/\\title\{([^}]*)\}/) || [])[1] || "";
  const rawAuthor = (src.match(/\\author\{([^}]*)\}/)  || [])[1] || "";
  const rawDate   = (src.match(/\\date\{([^}]*)\}/)    || [])[1] || "";

  const cleanTitle = escapeForDisplay(rawTitle);
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const cleanDate = escapeForDisplay(rawDate.replace(/\\today/, today));

  let header = "";
  if (cleanTitle) {
    header = `<h1 class="doc-title">${cleanTitle}</h1>`;
    if (rawAuthor) header += `<div class="doc-author">${escapeForDisplay(rawAuthor)}</div>`;
    if (cleanDate) header += `<div class="doc-date">${cleanDate}</div>`;
    header += `<hr class="doc-rule"/>`;
  }

  // ── Phase 1: replace BLOCK elements with placeholders ──────────────────

  // Abstract
  body = body.replace(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/g, (_, c) =>
    block(`<div class="abstract"><strong>Abstract.</strong> ${processInline(c.trim())}</div>`)
  );

  // Display math: \[ ... \]
  body = body.replace(/\\\[([\s\S]*?)\\\]/g, (_, m) =>
    block(`<div class="math-block" data-math="${encodeMath(m)}"></div>`)
  );

  // equation / equation*
  body = body.replace(/\\begin\{equation\*?\}([\s\S]*?)\\end\{equation\*?\}/g, (_, m) =>
    block(`<div class="math-block" data-math="${encodeMath(m)}"></div>`)
  );

  // align / align*
  body = body.replace(/\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g, (_, m) =>
    block(`<div class="math-block" data-math="${encodeMath("\\begin{aligned}" + m + "\\end{aligned}")}"></div>`)
  );

  // gather / gather*
  body = body.replace(/\\begin\{gather\*?\}([\s\S]*?)\\end\{gather\*?\}/g, (_, m) =>
    block(`<div class="math-block" data-math="${encodeMath(m)}"></div>`)
  );

  // multline
  body = body.replace(/\\begin\{multline\*?\}([\s\S]*?)\\end\{multline\*?\}/g, (_, m) =>
    block(`<div class="math-block" data-math="${encodeMath(m)}"></div>`)
  );

  // Verbatim / lstlisting
  body = body.replace(/\\begin\{verbatim\}([\s\S]*?)\\end\{verbatim\}/g, (_, c) =>
    block(`<pre class="verbatim"><code>${escapeHtml(c)}</code></pre>`)
  );
  body = body.replace(/\\begin\{lstlisting\}(\[.*?\])?([\s\S]*?)\\end\{lstlisting\}/g, (_, _opts, c) =>
    block(`<pre class="verbatim"><code>${escapeHtml(c)}</code></pre>`)
  );

  // Theorem-like environments
  const thmEnvs = ["theorem", "lemma", "proposition", "corollary", "definition", "remark", "example", "proof"];
  for (const env of thmEnvs) {
    const label = env.charAt(0).toUpperCase() + env.slice(1);
    body = body.replace(new RegExp(`\\\\begin\\{${env}\\}(?:\\[([^\\]]*)\\])?(\\s*\\*?)([\\s\\S]*?)\\\\end\\{${env}\\}`, "g"),
      (_, opt, _star, c) => block(
        `<div class="thm-box thm-${env}"><span class="thm-label">${label}${opt ? ` (${opt})` : ""}.</span> ${processInline(c.trim())}</div>`
      )
    );
  }

  // Figure
  body = body.replace(/\\begin\{figure\}[\s\S]*?\\end\{figure\}/g, (match) => {
    const caption = (match.match(/\\caption\{([^}]*)\}/) || [])[1] || "";
    const src2    = (match.match(/\\includegraphics(?:\[.*?\])?\{([^}]*)\}/) || [])[1] || "";
    return block(
      `<figure class="fig-block">` +
      `<div class="fig-placeholder">🖼 ${escapeHtml(src2 || "figure")}</div>` +
      (caption ? `<figcaption>${processInline(caption)}</figcaption>` : "") +
      `</figure>`
    );
  });

  // Tables
  body = body.replace(/\\begin\{tabular\}(\{[^}]*\})([\s\S]*?)\\end\{tabular\}/g, (_, _spec, content) => {
    const rows = content.split("\\\\").map((r: string) => r.trim()).filter(Boolean);
    let tbl = `<table>`;
    let firstDataRow = true;
    rows.forEach((row: string) => {
      if (/^\\hline\s*$/.test(row)) return;
      const clean = row.replace(/\\hline/g, "").trim();
      if (!clean) return;
      const cells = clean.split("&").map((c: string) => processInline(c.trim()));
      if (firstDataRow) {
        tbl += `<thead><tr>${cells.map(c => `<th>${c}</th>`).join("")}</tr></thead><tbody>`;
        firstDataRow = false;
      } else {
        tbl += `<tr>${cells.map(c => `<td>${c}</td>`).join("")}</tr>`;
      }
    });
    tbl += `</tbody></table>`;
    return block(tbl);
  });

  // Itemize
  body = body.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (_, items) => {
    const lis = items.split(/\\item\s*/).filter((s: string) => s.trim())
      .map((s: string) => `<li>${processInline(s.trim())}</li>`).join("");
    return block(`<ul>${lis}</ul>`);
  });

  // Enumerate
  body = body.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, (_, items) => {
    const lis = items.split(/\\item\s*/).filter((s: string) => s.trim())
      .map((s: string) => `<li>${processInline(s.trim())}</li>`).join("");
    return block(`<ol>${lis}</ol>`);
  });

  // Remaining unknown envs
  body = body.replace(/\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}/g, (_, env: string, content: string) => {
    if (!KNOWN_ENVS.has(env)) {
      if (!warnings.find(w => w.env === env))
        warnings.push({ env, reason: "Not supported in browser preview" });
      return block(`<div class="unknown-env"><em>[${env}]</em></div>`);
    }
    return content; // shouldn't reach here for known envs
  });

  // Sections → block placeholders (so they don't get wrapped in <p>)
  body = body.replace(/\\chapter\*?\{([^}]*)\}/g, (_, t) =>
    block(`<h1 class="chapter">${processInline(t)}</h1>`)
  );
  body = body.replace(/\\section\*?\{([^}]*)\}/g, (_, t) =>
    block(`<h2>${processInline(t)}</h2>`)
  );
  body = body.replace(/\\subsection\*?\{([^}]*)\}/g, (_, t) =>
    block(`<h3>${processInline(t)}</h3>`)
  );
  body = body.replace(/\\subsubsection\*?\{([^}]*)\}/g, (_, t) =>
    block(`<h4>${processInline(t)}</h4>`)
  );

  // Table of contents placeholder
  body = body.replace(/\\tableofcontents/g, () =>
    block(`<div class="toc-placeholder"><em>[Table of Contents]</em></div>`)
  );
  body = body.replace(/\\(listoffigures|listoftables)/g, () =>
    block(`<div class="toc-placeholder"><em>[List of Figures/Tables]</em></div>`)
  );

  // appendix marker
  body = body.replace(/\\appendix\b/g, () =>
    block(`<div class="appendix-marker"><strong>Appendices</strong></div>`)
  );

  // ── Phase 2: processInline on the plain text (no block HTML) ───────────
  // Remove LaTeX comments
  body = body.replace(/(?<!\\)%[^\n]*/gm, "");
  body = processInline(body);

  // ── Phase 3: Paragraph splitting ───────────────────────────────────────
  body = body
    .split(/\n{2,}/)
    .map((chunk) => {
      const t = chunk.trim();
      if (!t) return "";
      // Placeholders or HTML blocks: return as-is
      if (/^\x00B\d+\x00$/.test(t) || t.startsWith("<")) return t;
      // Single-newline lines → space-joined paragraph
      const inner = t.replace(/\n/g, " ").trim();
      if (!inner) return "";
      return `<p>${inner}</p>`;
    })
    .filter(Boolean)
    .join("\n");

  // ── Phase 4: Restore block placeholders ────────────────────────────────
  for (const [ph, html] of blocks) {
    body = body.split(ph).join(html);
  }

  return { html: header + body, warnings };
}

// ── Inline processing (runs on plain LaTeX text only) ────────────────────

function processInline(text: string): string {
  // Inline math: $...$  (not $$...$$)
  text = text.replace(/\$\$([^$]+)\$\$/g, (_, m) =>
    `<span class="math-block" data-math="${encodeMath(m)}"></span>`
  );
  text = text.replace(/\$([^$\n]+?)\$/g, (_, m) =>
    `<span class="math-inline" data-math="${encodeMath(m)}"></span>`
  );

  // Text formatting
  text = text.replace(/\\textbf\{([^}]*)\}/g, "<strong>$1</strong>");
  text = text.replace(/\\textit\{([^}]*)\}/g, "<em>$1</em>");
  text = text.replace(/\\emph\{([^}]*)\}/g, "<em>$1</em>");
  text = text.replace(/\\underline\{([^}]*)\}/g, "<u>$1</u>");
  text = text.replace(/\\texttt\{([^}]*)\}/g, "<code>$1</code>");
  text = text.replace(/\\text\{([^}]*)\}/g, "$1");
  text = text.replace(/\\textsc\{([^}]*)\}/g, "<span style='font-variant:small-caps'>$1</span>");

  // References and citations
  text = text.replace(/\\cite\{([^}]*)\}/g, "<cite class='ref'>[$1]</cite>");
  text = text.replace(/\\ref\{([^}]*)\}/g, "<span class='ref'>[ref]</span>");
  text = text.replace(/\\label\{[^}]*\}/g, "");
  text = text.replace(/\\eqref\{([^}]*)\}/g, "<span class='ref'>($1)</span>");

  // Footnotes
  text = text.replace(/\\footnote\{([^}]*)\}/g, "<sup title='$1' class='footnote'>†</sup>");

  // URLs and hrefs
  text = text.replace(/\\url\{([^}]*)\}/g, "<a href='$1' target='_blank' rel='noopener'>$1</a>");
  text = text.replace(/\\href\{([^}]*)\}\{([^}]*)\}/g, "<a href='$1' target='_blank' rel='noopener'>$2</a>");

  // Lists of authors (\\and)
  text = text.replace(/\\and\b/g, " &amp; ");

  // Special symbols
  text = text.replace(/\\LaTeX\b/g, "L<sup>a</sup>T<sub>e</sub>X");
  text = text.replace(/\\TeX\b/g, "T<sub>e</sub>X");
  text = text.replace(/\\BibTeX\b/g, "B<sub>IB</sub>T<sub>E</sub>X");
  text = text.replace(/---/g, "—");
  text = text.replace(/--/g, "–");
  text = text.replace(/``/g, "“");
  text = text.replace(/''/g, "”");
  text = text.replace(/`/g, "‘");
  text = text.replace(/'/g, "’");
  text = text.replace(/\\ldots\b/g, "…");
  text = text.replace(/\\dots\b/g, "…");

  // Spacing
  text = text.replace(/\\\\/g, "<br>");
  text = text.replace(/\\newline\b/g, "<br>");
  text = text.replace(/\\~/g, " ");
  text = text.replace(/~/g, " ");
  text = text.replace(/\\(vspace|hspace|kern|mspace)\{[^}]*\}/g, " ");
  text = text.replace(/\\(bigskip|medskip|smallskip|noindent|indent|centering)\b/g, "");
  text = text.replace(/\\(newpage|clearpage|pagebreak)\b/g, "");
  text = text.replace(/\\par\b/g, "");

  // Horizontal rules
  text = text.replace(/\\hrulefill\b/g, "<hr>");
  text = text.replace(/\\rule\{[^}]*\}\{[^}]*\}/g, "<hr>");

  // Thanks
  text = text.replace(/\\thanks\{([^}]*)\}/g, "<sup>*</sup>");

  // Generic \cmd{arg} → arg  (must come last to catch stragglers)
  text = text.replace(/\\[a-zA-Z]+\*?\{([^}]*)\}/g, "$1");
  // \cmd alone
  text = text.replace(/\\[a-zA-Z]+\*?\b/g, "");
  // Bare {group} → content
  text = text.replace(/\{([^}]*)\}/g, "$1");

  return text;
}

function encodeMath(math: string): string {
  return encodeURIComponent(math.trim());
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeForDisplay(text: string): string {
  // Strip LaTeX commands but keep the text content
  return text
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, "$1")
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/\{([^}]*)\}/g, "$1")
    .trim();
}
