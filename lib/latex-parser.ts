/**
 * Client-side LaTeX → HTML converter — two-pass renderer.
 *
 * Pass 1 (prescan): walk the source in document order to assign
 *   sequential numbers to equations, figures, tables, and bibliography
 *   entries; build labelMap (\\label{key} → display number) and
 *   citeMap (\\bibitem{key} → [N]).
 *
 * Pass 2 (render): replace block elements with HTML placeholders,
 *   run processInline() on plain text, split paragraphs, restore.
 *   \\ref / \\eqref / \\cite use the maps from Pass 1.
 */

export interface ParseWarning { env: string; reason: string; }

const KNOWN_ENVS = new Set([
  "document", "abstract", "itemize", "enumerate", "figure", "wrapfigure",
  "table", "verbatim", "lstlisting", "tabular", "equation", "equation*",
  "align", "align*", "gather", "gather*", "matrix", "pmatrix", "bmatrix",
  "vmatrix", "array", "cases", "split", "multline", "multline*",
  "theorem", "proof", "lemma", "definition", "proposition", "corollary",
  "remark", "example", "thebibliography",
]);

// Placeholder tokens — cannot appear in valid LaTeX
const PH = (n: number) => `\x00B${n}\x00`;

// ── Pass 1: prescan ────────────────────────────────────────────────────────

interface PrescanResult {
  labelMap: Map<string, string>;   // label key → display string ("3", "1.2", …)
  citeMap:  Map<string, number>;   // bibitem key → reference number
  bibHtml:  string;                // pre-rendered bibliography HTML (or "")
}

function prescanDocument(body: string): PrescanResult {
  const labelMap = new Map<string, string>();
  const citeMap  = new Map<string, number>();

  let eqN = 0, figN = 0, tblN = 0, secN = 0, subN = 0, subSubN = 0;

  // Collect all structural elements with their byte offsets,
  // then sort by offset so we assign numbers in document order.
  type Event = { pos: number; fn: () => void };
  const events: Event[] = [];

  const scan = (re: RegExp, fn: (m: RegExpExecArray) => void) => {
    let m: RegExpExecArray | null;
    const r = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
    while ((m = r.exec(body)) !== null) {
      const captured = m;
      events.push({ pos: captured.index, fn: () => fn(captured) });
    }
  };

  // Numbered equation environments
  scan(/\\begin\{equation\}([\s\S]*?)\\end\{equation\}/g, m => {
    const n = ++eqN;
    const lm = m[1].match(/\\label\{([^}]*)\}/);
    if (lm) labelMap.set(lm[1].trim(), String(n));
  });
  scan(/\\begin\{align\}([\s\S]*?)\\end\{align\}/g, m => {
    // Count each non-\nonumber line as an equation; assign the block number
    // to any \label found (simplification: first \label gets the block start)
    const lines = m[1].split("\\\\").filter(l => !/\\nonumber/.test(l));
    const blockStart = eqN + 1;
    eqN += Math.max(lines.length, 1);
    const lm = m[1].match(/\\label\{([^}]*)\}/);
    if (lm) labelMap.set(lm[1].trim(), String(blockStart));
  });
  scan(/\\begin\{multline\}([\s\S]*?)\\end\{multline\}/g, m => {
    const n = ++eqN;
    const lm = m[1].match(/\\label\{([^}]*)\}/);
    if (lm) labelMap.set(lm[1].trim(), String(n));
  });
  scan(/\\begin\{gather\}([\s\S]*?)\\end\{gather\}/g, m => {
    const lines = m[1].split("\\\\").filter(l => !/\\nonumber/.test(l));
    const start = eqN + 1;
    eqN += Math.max(lines.length, 1);
    const lm = m[1].match(/\\label\{([^}]*)\}/);
    if (lm) labelMap.set(lm[1].trim(), String(start));
  });

  // Figures
  scan(/\\begin\{(?:figure|wrapfigure)\}[\s\S]*?\\end\{(?:figure|wrapfigure)\}/g, m => {
    const n = ++figN;
    const lm = m[0].match(/\\label\{([^}]*)\}/);
    if (lm) labelMap.set(lm[1].trim(), String(n));
  });

  // Tables (table float, not tabular)
  scan(/\\begin\{table\}[\s\S]*?\\end\{table\}/g, m => {
    const n = ++tblN;
    const lm = m[0].match(/\\label\{([^}]*)\}/);
    if (lm) labelMap.set(lm[1].trim(), String(n));
  });

  // Sections (non-starred = numbered)
  scan(/\\section\{([^}]*)\}(?:[\s\n]*\\label\{([^}]*)\})?/g, m => {
    secN++; subN = 0; subSubN = 0;
    if (m[2]) labelMap.set(m[2].trim(), `${secN}`);
  });
  scan(/\\subsection\{([^}]*)\}(?:[\s\n]*\\label\{([^}]*)\})?/g, m => {
    subN++; subSubN = 0;
    if (m[2]) labelMap.set(m[2].trim(), `${secN}.${subN}`);
  });
  scan(/\\subsubsection\{([^}]*)\}(?:[\s\n]*\\label\{([^}]*)\})?/g, m => {
    subSubN++;
    if (m[2]) labelMap.set(m[2].trim(), `${secN}.${subN}.${subSubN}`);
  });

  // Bibliography entries
  let bibN = 0;
  const bibBlock = body.match(/\\begin\{thebibliography\}(?:\{[^}]*\})?([\s\S]*?)\\end\{thebibliography\}/);
  const bibHtmlParts: string[] = [];
  if (bibBlock) {
    const bibItems = bibBlock[1].split(/(?=\\bibitem)/);
    for (const chunk of bibItems) {
      const km = chunk.match(/\\bibitem(?:\[[^\]]*\])?\{([^}]*)\}([\s\S]*)/);
      if (!km) continue;
      const key = km[1].trim();
      const text = km[2].replace(/\n+/g, " ").trim();
      const n = ++bibN;
      citeMap.set(key, n);
      bibHtmlParts.push(
        `<div class="bib-entry">` +
        `<span class="bib-num">[${n}]</span>` +
        `<span class="bib-text">${processInlineStatic(text)}</span>` +
        `</div>`
      );
    }
  }
  const bibHtml = bibHtmlParts.length
    ? `<div class="bib-section"><h2 class="bib-heading">References</h2>${bibHtmlParts.join("")}</div>`
    : "";

  // Run all events in document order
  events.sort((a, b) => a.pos - b.pos);
  events.forEach(e => e.fn());

  return { labelMap, citeMap, bibHtml };
}

// ── Pass 2: main renderer ─────────────────────────────────────────────────

export function latexToHtml(src: string): { html: string; warnings: ParseWarning[] } {
  const warnings: ParseWarning[] = [];
  const blocks = new Map<string, string>();
  let n = 0;
  const block = (html: string) => { const p = PH(n++); blocks.set(p, html); return p; };

  // Extract body
  const bodyMatch = src.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
  let body = bodyMatch ? bodyMatch[1] : src;

  // ── Prescan ──────────────────────────────────────────────────────────────
  const { labelMap, citeMap, bibHtml } = prescanDocument(body);

  // Footnote collector (threaded through processInline calls)
  let footN = 0;
  const footnoteList: string[] = [];

  // Counters for block rendering (must match prescan order)
  let eqCounter = 0, figCounter = 0, tblCounter = 0;
  let secCounter = 0, subCounter = 0, subSubCounter = 0;

  // Inline helper — closure over maps & footnote list
  const inline = (text: string) =>
    processInline(text, labelMap, citeMap, footnoteList, () => ++footN);

  // ── Preamble cleanup ─────────────────────────────────────────────────────
  body = body.replace(
    /\\(usepackage|documentclass|geometry|setlength|pagestyle|pagenumbering)(\[.*?\])?\{[^}]*\}/g, ""
  );
  body = body.replace(/\\(onehalfspacing|doublespacing|singlespacing|maketitle)\b/g, "");
  body = body.replace(/\\newcommand\{[^}]*\}(\[.*?\])?\{[^}]*\}/g, "");
  body = body.replace(/\\(renewcommand|setcounter|counterwithin|numberwithin)\{[^}]*\}\{[^}]*\}/g, "");
  body = body.replace(/\\newtheorem\{[^}]*\}(\[[^\]]*\])?\{[^}]*\}/g, "");

  // ── Title metadata ───────────────────────────────────────────────────────
  const rawTitle  = extractBracedContent(src, "title");
  const rawAuthor = extractBracedContent(src, "author");
  const rawDate   = extractBracedContent(src, "date");
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const cleanTitle = escapeForDisplay(rawTitle);
  const cleanDate  = escapeForDisplay(rawDate.replace(/\\today/, today));
  let header = "";
  if (cleanTitle) {
    header = `<h1 class="doc-title">${cleanTitle}</h1>`;
    if (rawAuthor) header += `<div class="doc-author">${escapeForDisplay(rawAuthor)}</div>`;
    if (cleanDate) header += `<div class="doc-date">${cleanDate}</div>`;
    header += `<hr class="doc-rule"/>`;
  }

  // ── Phase 1: block-level placeholders ────────────────────────────────────

  // Abstract
  body = body.replace(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/g, (_, c) =>
    block(`<div class="abstract"><strong>Abstract.</strong> ${inline(c.trim())}</div>`)
  );

  // Display math \[ ... \]  (not numbered)
  body = body.replace(/\\\[([\s\S]*?)\\\]/g, (_, m) =>
    block(`<div class="math-block" data-math="${encodeMath(m)}"></div>`)
  );

  // Starred equation environments (no number)
  body = body.replace(/\\begin\{equation\*\}([\s\S]*?)\\end\{equation\*\}/g, (_, m) =>
    block(`<div class="math-block" data-math="${encodeMath(cleanMath(m))}"></div>`)
  );
  body = body.replace(/\\begin\{align\*\}([\s\S]*?)\\end\{align\*\}/g, (_, m) =>
    block(`<div class="math-block" data-math="${encodeMath("\\begin{aligned}" + cleanMath(m) + "\\end{aligned}")}"></div>`)
  );
  body = body.replace(/\\begin\{gather\*\}([\s\S]*?)\\end\{gather\*\}/g, (_, m) =>
    block(`<div class="math-block" data-math="${encodeMath(cleanMath(m))}"></div>`)
  );
  body = body.replace(/\\begin\{multline\*\}([\s\S]*?)\\end\{multline\*\}/g, (_, m) =>
    block(`<div class="math-block" data-math="${encodeMath(cleanMath(m))}"></div>`)
  );

  // Numbered equation
  body = body.replace(/\\begin\{equation\}([\s\S]*?)\\end\{equation\}/g, (_, m) => {
    const num = ++eqCounter;
    return block(numberedMathBlock(cleanMath(m), num));
  });

  // Numbered align  (whole block gets one number if it has ≤ 1 label)
  body = body.replace(/\\begin\{align\}([\s\S]*?)\\end\{align\}/g, (_, m) => {
    const lines = m.split("\\\\");
    const nonNumbered = lines.filter((l: string) => /\\nonumber/.test(l));
    const numLines = lines.length - nonNumbered.length;
    // Build aligned math, strip \nonumber
    const cleanedLines = lines.map((l: string) =>
      l.replace(/\\nonumber/g, "").trimEnd()
    ).join("\\\\");
    if (numLines <= 1) {
      const num = ++eqCounter;
      return block(numberedMathBlock("\\begin{aligned}" + cleanMath(cleanedLines) + "\\end{aligned}", num));
    } else {
      // Multi-line: show as aligned without individual numbers (too complex for browser)
      eqCounter += numLines;
      return block(`<div class="math-block" data-math="${encodeMath("\\begin{aligned}" + cleanMath(cleanedLines) + "\\end{aligned}")}"></div>`);
    }
  });

  // Numbered gather
  body = body.replace(/\\begin\{gather\}([\s\S]*?)\\end\{gather\}/g, (_, m) => {
    const num = ++eqCounter;
    return block(numberedMathBlock(cleanMath(m), num));
  });

  // Numbered multline
  body = body.replace(/\\begin\{multline\}([\s\S]*?)\\end\{multline\}/g, (_, m) => {
    const num = ++eqCounter;
    return block(numberedMathBlock(cleanMath(m), num));
  });

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
    body = body.replace(
      new RegExp(`\\\\begin\\{${env}\\}(?:\\[([^\\]]*)\\])?(\\s*)([\s\S]*?)\\\\end\\{${env}\\}`, "g"),
      (_, opt, _ws, c) => block(
        `<div class="thm-box thm-${env}"><span class="thm-label">${label}${opt ? ` (${opt})` : ""}.</span> ${inline(c.trim())}</div>`
      )
    );
  }

  // Figure / wrapfigure
  body = body.replace(/\\begin\{(?:figure|wrapfigure)\}([\s\S]*?)\\end\{(?:figure|wrapfigure)\}/g, (match) => {
    const num = ++figCounter;
    const captionMatch = match.match(/\\caption(?:\[[^\]]*\])?\{([^}]*)\}/);
    const caption = captionMatch ? captionMatch[1] : "";
    const imgMatch = match.match(/\\includegraphics(?:\[.*?\])?\{([^}]*)\}/);
    const imgSrc = imgMatch ? imgMatch[1] : "";
    return block(
      `<figure class="fig-block">` +
      `<div class="fig-placeholder">🖼 ${escapeHtml(imgSrc || "figure")}</div>` +
      (caption
        ? `<figcaption><strong>Figure ${num}:</strong> ${inline(caption)}</figcaption>`
        : `<figcaption><strong>Figure ${num}</strong></figcaption>`) +
      `</figure>`
    );
  });

  // Table float (wraps tabular)
  body = body.replace(/\\begin\{table\}([\s\S]*?)\\end\{table\}/g, (match) => {
    const num = ++tblCounter;
    const captionMatch = match.match(/\\caption(?:\[[^\]]*\])?\{([^}]*)\}/);
    const caption = captionMatch ? captionMatch[1] : "";
    // Extract inner tabular (if any) and process it
    let inner = match;
    inner = inner.replace(/\\caption(?:\[[^\]]*\])?\{[^}]*\}/g, "");
    inner = inner.replace(/\\label\{[^}]*\}/g, "");
    inner = inner.replace(/\\begin\{table\}[^]*?\\end\{table\}/g, m => m); // don't double-replace
    // Process the inner tabular separately — it'll be handled below if not yet replaced
    return block(
      `<div class="table-float">` +
      (caption
        ? `<div class="table-caption"><strong>Table ${num}:</strong> ${inline(caption)}</div>`
        : `<div class="table-caption"><strong>Table ${num}</strong></div>`) +
      inner.replace(/\\begin\{table\}[\s\S]*?(?=\\begin\{tabular\}|$)/, "")
           .replace(/(?<=\\end\{tabular\})[\s\S]*?\\end\{table\}/, "") +
      `</div>`
    );
  });

  // Tabular (standalone or inside already-block table)
  body = body.replace(/\\begin\{tabular\}(\{[^}]*\})([\s\S]*?)\\end\{tabular\}/g, (_, _spec, content) => {
    const rows = content.split("\\\\").map((r: string) => r.trim()).filter(Boolean);
    let tbl = `<table>`;
    let firstDataRow = true;
    rows.forEach((row: string) => {
      if (/^\\hline\s*$/.test(row) || /^\\(top|mid|bottom)rule\s*$/.test(row)) return;
      const clean = row.replace(/\\hline/g, "").replace(/\\(top|mid|bottom)rule/g, "").trim();
      if (!clean) return;
      const cells = clean.split("&").map((c: string) => inline(c.trim()));
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
      .map((s: string) => `<li>${inline(s.trim())}</li>`).join("");
    return block(`<ul>${lis}</ul>`);
  });

  // Enumerate
  body = body.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, (_, items) => {
    const lis = items.split(/\\item\s*/).filter((s: string) => s.trim())
      .map((s: string) => `<li>${inline(s.trim())}</li>`).join("");
    return block(`<ol>${lis}</ol>`);
  });

  // Bibliography block — use pre-rendered HTML from prescan
  body = body.replace(/\\begin\{thebibliography\}[\s\S]*?\\end\{thebibliography\}/g, () =>
    block(bibHtml || "")
  );

  // Remaining unknown envs
  body = body.replace(/\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}/g, (_, env: string, content: string) => {
    if (!KNOWN_ENVS.has(env)) {
      if (!warnings.find(w => w.env === env))
        warnings.push({ env, reason: "Not supported in browser preview" });
      return block(`<div class="unknown-env"><em>[${env}]</em></div>`);
    }
    return content;
  });

  // Sections
  body = body.replace(/\\chapter\*?\{([^}]*)\}/g, (_, t) =>
    block(`<h1 class="chapter">${inline(t)}</h1>`)
  );
  body = body.replace(/\\section\*?\{([^}]*)\}/g, (full, t) => {
    if (!full.includes("*")) { secCounter++; subCounter = 0; subSubCounter = 0; }
    const num = full.includes("*") ? "" : `<span class="sec-num">${secCounter}</span> `;
    return block(`<h2>${num}${inline(t)}</h2>`);
  });
  body = body.replace(/\\subsection\*?\{([^}]*)\}/g, (full, t) => {
    if (!full.includes("*")) { subCounter++; subSubCounter = 0; }
    const num = full.includes("*") ? "" : `<span class="sec-num">${secCounter}.${subCounter}</span> `;
    return block(`<h3>${num}${inline(t)}</h3>`);
  });
  body = body.replace(/\\subsubsection\*?\{([^}]*)\}/g, (full, t) => {
    if (!full.includes("*")) subSubCounter++;
    const num = full.includes("*") ? "" : `<span class="sec-num">${secCounter}.${subCounter}.${subSubCounter}</span> `;
    return block(`<h4>${num}${inline(t)}</h4>`);
  });

  // TOC / list placeholders
  body = body.replace(/\\tableofcontents/g, () =>
    block(`<div class="toc-placeholder"><em>[Table of Contents]</em></div>`)
  );
  body = body.replace(/\\(listoffigures|listoftables)/g, () =>
    block(`<div class="toc-placeholder"><em>[List of Figures/Tables]</em></div>`)
  );

  // Appendix
  body = body.replace(/\\appendix\b/g, () =>
    block(`<div class="appendix-marker"><strong>Appendices</strong></div>`)
  );

  // ── Phase 2: inline on remaining plain text ──────────────────────────────
  body = body.replace(/(?<!\\)%[^\n]*/gm, "");  // LaTeX comments
  body = inline(body);

  // ── Phase 3: paragraph splitting ─────────────────────────────────────────
  body = body
    .split(/\n{2,}/)
    .map((chunk) => {
      const t = chunk.trim();
      if (!t) return "";
      if (/^\x00B\d+\x00$/.test(t) || t.startsWith("<")) return t;
      const inner = t.replace(/\n/g, " ").trim();
      return inner ? `<p>${inner}</p>` : "";
    })
    .filter(Boolean)
    .join("\n");

  // ── Phase 4: restore placeholders ───────────────────────────────────────
  for (const [ph, html] of blocks) {
    body = body.split(ph).join(html);
  }

  // ── Phase 5: append footnotes ────────────────────────────────────────────
  if (footnoteList.length > 0) {
    const footHtml = footnoteList
      .map((txt, i) =>
        `<div class="footnote-item"><sup class="footnote-num">${i + 1}</sup> ${txt}</div>`
      )
      .join("");
    body += `<div class="footnote-bar"><hr class="footnote-rule"/>${footHtml}</div>`;
  }

  return { html: header + body, warnings };
}

// ── Helper: numbered math block HTML ─────────────────────────────────────────
function numberedMathBlock(math: string, num: number): string {
  return (
    `<div class="math-numbered">` +
    `<div class="math-block math-numbered__inner" data-math="${encodeMath(math)}"></div>` +
    `<span class="eq-number">(${num})</span>` +
    `</div>`
  );
}

// ── Helper: strip \label from math content (KaTeX doesn't understand it) ────
function cleanMath(math: string): string {
  return math.replace(/\\label\{[^}]*\}/g, "").trim();
}

// ── Inline processing ─────────────────────────────────────────────────────────

/** Static version (no footnote collection) — used in prescan bibitem text */
function processInlineStatic(text: string): string {
  return processInline(text, new Map(), new Map(), [], () => 0);
}

function processInline(
  text: string,
  labelMap: Map<string, string>,
  citeMap: Map<string, number>,
  footnoteList: string[],
  nextFootN: () => number,
): string {
  // Inline math: $...$ (not $$...$$)
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

  // ── Citations \\cite{key} or \\cite{key1,key2} ──────────────────────────
  text = text.replace(/\\cite(?:\[[^\]]*\])?\{([^}]*)\}/g, (_, keys: string) => {
    const nums = keys.split(",").map(k => {
      const n = citeMap.get(k.trim());
      return n !== undefined ? String(n) : k.trim();
    });
    return `<cite class="ref">[${nums.join(", ")}]</cite>`;
  });

  // ── Cross-references ──────────────────────────────────────────────────────
  text = text.replace(/\\eqref\{([^}]*)\}/g, (_, key: string) => {
    const n = labelMap.get(key.trim());
    return n !== undefined
      ? `<span class="ref">(${n})</span>`
      : `<span class="ref unresolved" title="Unresolved: ${escapeHtml(key)}">(??)</span>`;
  });
  text = text.replace(/\\ref\{([^}]*)\}/g, (_, key: string) => {
    const n = labelMap.get(key.trim());
    return n !== undefined
      ? `<span class="ref">${n}</span>`
      : `<span class="ref unresolved" title="Unresolved: ${escapeHtml(key)}">??</span>`;
  });
  text = text.replace(/\\label\{[^}]*\}/g, "");  // consume (already in map)

  // ── Footnotes ─────────────────────────────────────────────────────────────
  text = text.replace(/\\footnote\{([^}]*)\}/g, (_, content: string) => {
    const n = nextFootN();
    footnoteList.push(processInlineStatic(content));
    return `<sup class="footnote" title="${escapeHtml(content)}">${n}</sup>`;
  });

  // URLs and hrefs
  text = text.replace(/\\url\{([^}]*)\}/g, "<a href='$1' target='_blank' rel='noopener'>$1</a>");
  text = text.replace(/\\href\{([^}]*)\}\{([^}]*)\}/g, "<a href='$1' target='_blank' rel='noopener'>$2</a>");

  // Author lists
  text = text.replace(/\\and\b/g, " &amp; ");

  // Special symbols
  text = text.replace(/\\LaTeX\b/g, "L<sup>a</sup>T<sub>e</sub>X");
  text = text.replace(/\\TeX\b/g, "T<sub>e</sub>X");
  text = text.replace(/\\BibTeX\b/g, "B<sub>IB</sub>T<sub>E</sub>X");

  // Typography
  text = text.replace(/---/g, "—");
  text = text.replace(/--/g, "–");
  text = text.replace(/``/g, "“");
  text = text.replace(/''/g, "”");
  text = text.replace(/`/g, "‘");
  text = text.replace(/(?<![a-zA-Z])'/g, "’");
  text = text.replace(/\\ldots\b/g, "…");
  text = text.replace(/\\dots\b/g, "…");

  // Spacing / line breaks
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

  // Generic \cmd{arg} → arg  (last-resort)
  text = text.replace(/\\[a-zA-Z]+\*?\{([^}]*)\}/g, "$1");
  text = text.replace(/\\[a-zA-Z]+\*?\b/g, "");
  text = text.replace(/\{([^}]*)\}/g, "$1");

  return text;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function encodeMath(math: string): string {
  return encodeURIComponent(math.trim());
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Extract the content of \cmd{...} respecting nested braces. */
function extractBracedContent(src: string, cmd: string): string {
  const tag = `\\${cmd}{`;
  const idx = src.indexOf(tag);
  if (idx === -1) return "";
  let depth = 1;
  let i = idx + tag.length;
  while (i < src.length && depth > 0) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") depth--;
    if (depth > 0) i++;
  }
  return depth === 0 ? src.slice(idx + tag.length, i) : "";
}

function escapeForDisplay(text: string): string {
  text = text.replace(/\\thanks\{[^{}]*\}/g, "");
  text = text.replace(/\\\\(\[[^\]]*\])?/g, " ");
  let prev = "";
  while (prev !== text) {
    prev = text;
    text = text.replace(/\\[a-zA-Z]+\*?\{([^{}]*)\}/g, "$1");
  }
  text = text.replace(/\\[a-zA-Z]+\*?\b/g, "");
  text = text.replace(/\{([^{}]*)\}/g, "$1");
  text = text.replace(/[{}]/g, "");
  text = text.replace(/\s+/g, " ");
  return text.trim();
}
