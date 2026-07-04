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
  // Layout / formatting environments handled below
  "center", "flushleft", "flushright", "minipage", "multicols",
  "tabbing", "quote", "quotation", "verse", "description", "longtable",
  // CS / algorithms
  "algorithm", "algorithmic", "algorithm2e", "algorithmicx", "algpseudocode",
  "lstlisting",
  // Beamer
  "frame", "block", "alertblock", "exampleblock", "columns", "column", "onlyenv",
  // Other common packages
  "tikzpicture", "pgfpicture", "comment",
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

// ── Depth-aware brace skipper ─────────────────────────────────────────────
/** Skip past the closing `}` of a `{...}` group starting at `pos`.  */
function skipBraces(src: string, pos: number): number {
  if (src[pos] !== "{") return pos;
  let depth = 1;
  let i = pos + 1;
  while (i < src.length && depth > 0) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") depth--;
    i++;
  }
  return i; // points to the character AFTER the closing }
}

/**
 * Expand user-defined \newcommand / \renewcommand / \providecommand macros,
 * then remove the definitions. Without this, custom commands such as a CV's
 * \cventry{dates}{title}{...} render their arguments mashed together because
 * the definition is stripped but the *calls* are never substituted.
 *
 * Supports `\newcommand{\name}[n]{body}`, `\newcommand\name[n]{body}`, and the
 * zero-argument form. Macros with an optional-argument default
 * (`[n][default]`) are too complex to expand safely, so their definition is
 * removed but calls are left as-is. Expansion is bounded (calls can nest).
 */
interface UserMacro { nargs: number; body: string; }

function expandUserMacros(src: string): string {
  const macros = new Map<string, UserMacro>();
  const defSpans: Array<[number, number]> = [];
  const defRe = /\\(?:new|renew|provide)command\b\*?\s*/g;
  let m: RegExpExecArray | null;

  while ((m = defRe.exec(src)) !== null) {
    let i = m.index + m[0].length;
    // name: {\foo} or bare \foo
    let name = "";
    if (src[i] === "{") {
      const close = skipBraces(src, i);
      name = src.slice(i + 1, close - 1).trim();
      i = close;
    } else if (src[i] === "\\") {
      let j = i + 1;
      while (j < src.length && /[a-zA-Z]/.test(src[j])) j++;
      name = src.slice(i, j);
      i = j;
    } else {
      continue;
    }
    while (src[i] === " ") i++;
    // optional arg count [n]
    let nargs = 0;
    if (src[i] === "[") {
      const e = src.indexOf("]", i);
      if (e !== -1) { nargs = parseInt(src.slice(i + 1, e), 10) || 0; i = e + 1; }
    }
    // optional default value [default] → can't expand safely
    let hasDefault = false;
    if (src[i] === "[") {
      hasDefault = true;
      const e = src.indexOf("]", i);
      if (e !== -1) i = e + 1;
    }
    while (src[i] === " ") i++;
    if (src[i] !== "{") continue;
    const bodyClose = skipBraces(src, i);
    const body = src.slice(i + 1, bodyClose - 1);
    defSpans.push([m.index, bodyClose]);
    if (/^\\[a-zA-Z]+$/.test(name) && !hasDefault) {
      macros.set(name, { nargs, body });
    }
    defRe.lastIndex = bodyClose;
  }

  // Remove all definition spans.
  let out = "";
  let last = 0;
  for (const [s, e] of defSpans) { out += src.slice(last, s); last = e; }
  out += src.slice(last);

  if (macros.size === 0) return out;

  // Expand invocations. Longest names first so \cvsect is matched before \cv.
  // Bounded passes guard against runaway / mutually-recursive macros.
  const names = [...macros.keys()].sort((a, b) => b.length - a.length);
  for (let pass = 0; pass < 8; pass++) {
    let changed = false;
    for (const name of names) {
      const macro = macros.get(name)!;
      let result = "";
      let idx = 0;
      while (idx < out.length) {
        const at = out.indexOf(name, idx);
        if (at === -1) { result += out.slice(idx); break; }
        // Don't match a prefix of a longer command name (e.g. \cv vs \cvsect).
        const after = out[at + name.length];
        if (after && /[a-zA-Z]/.test(after)) {
          result += out.slice(idx, at + name.length);
          idx = at + name.length;
          continue;
        }
        // Capture nargs brace groups.
        let p = at + name.length;
        const args: string[] = [];
        let ok = true;
        for (let k = 0; k < macro.nargs; k++) {
          while (out[p] === " ") p++;
          if (out[p] !== "{") { ok = false; break; }
          const close = skipBraces(out, p);
          args.push(out.slice(p + 1, close - 1));
          p = close;
        }
        if (!ok) { // not enough args present — leave call untouched
          result += out.slice(idx, at + name.length);
          idx = at + name.length;
          continue;
        }
        const expanded = macro.body.replace(/#(\d)/g, (_, d: string) => args[+d - 1] ?? "");
        result += out.slice(idx, at) + expanded;
        idx = p;
        changed = true;
      }
      out = result;
    }
    if (!changed) break;
  }
  return out;
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

  // ── Unsupported document class: Beamer & other slide/poster classes ───────
  // The preview renders article-style LaTeX (text + math). Presentation decks
  // rely on frames, overlays, TikZ and tcolorbox this client-side parser cannot
  // reproduce, so it would otherwise emit mangled output. Instead, surface a
  // clear notice + a deck outline and point to PDF export (a real LaTeX engine).
  const classMatch = src.match(/\\documentclass(?:\[[^\]]*\])?\{([a-zA-Z]+)\}/);
  const docClass = classMatch?.[1]?.toLowerCase() ?? "";
  const PRESENTATION_CLASSES = new Set(["beamer", "beamerposter", "powerdot", "prosper"]);
  const isPresentation = PRESENTATION_CLASSES.has(docClass) || /\\begin\{frame\}/.test(body);

  if (isPresentation) {
    const label = docClass === "beamer" || docClass === "" ? "Beamer presentation" : `${docClass} presentation`;
    warnings.push({ env: docClass || "beamer", reason: "Presentation class — preview shows an outline; use ↓ PDF to compile the real slides" });

    const slideCount = (body.match(/\\begin\{frame\}/g) || []).length;

    // Title of the title slide (preamble \title, falls back to nothing)
    const deckTitle = extractBracedContent(src, "title");

    // Build a structural outline in document order: sections + frame titles.
    const cleanItem = (t: string) =>
      inline(t.replace(/\\texorpdfstring\{(?:[^{}]|\{[^{}]*\})*\}\{((?:[^{}]|\{[^{}]*\})*)\}/g, "$1").trim());
    const items: { kind: "section" | "frame"; text: string }[] = [];
    const re = /\\section\{([^}]*)\}|\\begin\{frame\}(?:\[[^\]]*\])*\{([^}]*)\}|\\frametitle\{([^}]*)\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(body)) !== null) {
      if (m[1] != null) items.push({ kind: "section", text: m[1] });
      else if (m[2] != null && m[2].trim()) items.push({ kind: "frame", text: m[2] });
      else if (m[3] != null && m[3].trim()) items.push({ kind: "frame", text: m[3] });
    }

    const outline = items.length
      ? `<div class="beamer-outline">${items.map(it =>
          it.kind === "section"
            ? `<div class="beamer-section">${cleanItem(it.text)}</div>`
            : `<div class="beamer-frame">${cleanItem(it.text)}</div>`
        ).join("")}</div>`
      : "";

    const notice =
      `<div class="preview-notice">` +
        `<div class="preview-notice-head">📊 ${label} detected</div>` +
        `<p>The live preview renders <strong>article-style LaTeX</strong> (text &amp; math). ` +
        `It can't reproduce slides, overlays, TikZ, or tcolorbox — but your document looks valid. ` +
        `Use <strong>↓ PDF</strong> in the toolbar to compile the real ${slideCount} slide${slideCount === 1 ? "" : "s"}.</p>` +
        (deckTitle ? `<p class="preview-notice-sub">“${escapeForDisplay(deckTitle)}”</p>` : "") +
      `</div>` +
      (outline ? `<div class="beamer-outline-head">Deck outline · ${slideCount} slide${slideCount === 1 ? "" : "s"}</div>${outline}` : "");

    return { html: notice, warnings };
  }

  // ── Preamble cleanup ─────────────────────────────────────────────────────
  body = body.replace(
    /\\(usepackage|documentclass|geometry|setlength|pagestyle|pagenumbering)(\[.*?\])?\{[^}]*\}/g, ""
  );
  body = body.replace(/\\(onehalfspacing|doublespacing|singlespacing|maketitle)\b/g, "");
  // fancyhdr / page-style commands (header & footer setup — not rendered in
  // preview). Brace pattern tolerates one level of nesting, e.g.
  // \rhead{\textcolor{gray}{\small Title}}.
  {
    const arg = "\\{(?:[^{}]|\\{[^{}]*\\})*\\}";
    body = body.replace(new RegExp(`\\\\(?:thispagestyle|pagestyle)${arg}`, "g"), "");
    body = body.replace(new RegExp(`\\\\fancyhf${arg}`, "g"), "");
    body = body.replace(new RegExp(`\\\\(?:fancyhead|fancyfoot)(?:\\[[^\\]]*\\])?${arg}`, "g"), "");
    body = body.replace(new RegExp(`\\\\(?:[rlc]head|[rlc]foot)${arg}`, "g"), "");
    body = body.replace(new RegExp(`\\\\renewcommand\\{\\\\(?:headrulewidth|footrulewidth)\\}${arg}`, "g"), "");
  }
  // Expand user macros (\newcommand …) then drop their definitions, so custom
  // commands like a CV's \cventry{…}{…} render their arguments properly.
  body = expandUserMacros(body);
  body = body.replace(/\\(setcounter|counterwithin|numberwithin)\{[^}]*\}\{[^}]*\}/g, "");

  // Collect \newtheorem{envname}[optional]{Label} BEFORE stripping them so
  // user-defined envs like \begin{thm} render as proper theorem boxes.
  const extraThmEnvs: Array<[string, string]> = []; // [envname, label]
  body = body.replace(
    /\\newtheorem\{([^}]+)\}(?:\[[^\]]*\])?\{([^}]+)\}/g,
    (_, envName: string, label: string) => { extraThmEnvs.push([envName, label]); return ""; }
  );
  body = body.replace(/\\newtheorem\*?\{[^}]*\}(\[[^\]]*\])?\{[^}]*\}/g, "");
  // Color definitions (\definecolor{name}{model}{spec})
  body = body.replace(/\\definecolor\{[^}]*\}\{[^}]*\}\{[^}]*\}/g, "");
  body = body.replace(/\\colorlet\{[^}]*\}\{[^}]*\}/g, "");
  // hypersetup / hyperref config block
  body = body.replace(/\\hypersetup\{[\s\S]*?\}/g, "");
  // Strip \title{}, \author{}, \date{} if they appear inside the document body
  // (standard LaTeX puts them in the preamble, but some templates don't)
  body = body.replace(/\\(?:title|author|date)\{(?:[^{}]|\{[^{}]*\})*\}/g, "");

  // Neutralise "\\[<len>]" line breaks BEFORE math parsing. The "\[" inside
  // "\\[1cm]" would otherwise be misread as a display-math opener and swallow
  // everything up to the next "\]" (mangling title pages full of \\[..]).
  // Real "\[ ... \]" display math (single backslash) is untouched.
  body = body.replace(/\\\\\*?\s*\[[^\]]*\]/g, "\\\\ ");

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

  // Display math $$...$$ — treat as block so KaTeX renders in displayMode
  body = body.replace(/\$\$([\s\S]*?)\$\$/g, (_, m) =>
    block(`<div class="math-block" data-math="${encodeMath(m.trim())}"></div>`)
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
    // filter(Boolean) removes the empty string created by a trailing \\
    const lines = m.split("\\\\").filter(Boolean);
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

  // Theorem-like environments (built-in + user-defined via \newtheorem)
  const builtinThmEnvs: Array<[string, string]> = [
    ["theorem","Theorem"], ["lemma","Lemma"], ["proposition","Proposition"],
    ["corollary","Corollary"], ["definition","Definition"], ["remark","Remark"],
    ["example","Example"], ["proof","Proof"],
  ];
  for (const [env, label] of [...builtinThmEnvs, ...extraThmEnvs]) {
    body = body.replace(
      new RegExp(`\\\\begin\\{${env}\\}(?:\\[([^\\]]*)\\])?(\\s*)([\\s\\S]*?)\\\\end\\{${env}\\}`, "g"),
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

  // Table float — render caption as a block placeholder, then pass inner
  // LaTeX (the \begin{tabular}…\end{tabular}) back into `body` so the
  // tabular handler below can process it normally.
  body = body.replace(/\\begin\{table\}(?:\[[^\]]*\])?([\s\S]*?)\\end\{table\}/g, (_, inner) => {
    const num = ++tblCounter;
    const captionMatch = inner.match(/\\caption(?:\[[^\]]*\])?\{([^}]*)\}/);
    const caption = captionMatch ? captionMatch[1] : "";
    // Strip caption, label, position specs — keep only tabular LaTeX
    const tabularBody = inner
      .replace(/\\caption(?:\[[^\]]*\])?\{[^}]*\}/g, "")
      .replace(/\\label\{[^}]*\}/g, "")
      .replace(/\\centering\b/g, "")
      .trim();
    const captionBlock = caption
      ? block(`<div class="table-caption"><strong>Table ${num}:</strong> ${inline(caption)}</div>`)
      : block(`<div class="table-caption"><strong>Table ${num}</strong></div>`);
    // Return caption placeholder + raw tabular LaTeX — tabular handler runs next
    return captionBlock + "\n" + tabularBody;
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
      const renderCell = (raw: string, isHeader: boolean) => {
        const mc = raw.trim().match(/^\\multicolumn\{(\d+)\}\{[^}]*\}\{([\s\S]*)\}$/);
        if (mc) {
          const span = mc[1];
          const content = inline(mc[2].trim());
          return isHeader ? `<th colspan="${span}">${content}</th>` : `<td colspan="${span}">${content}</td>`;
        }
        const content = inline(raw.trim());
        return isHeader ? `<th>${content}</th>` : `<td>${content}</td>`;
      };
      const cells = clean.split("&");
      if (firstDataRow) {
        tbl += `<thead><tr>${cells.map(c => renderCell(c, true)).join("")}</tr></thead><tbody>`;
        firstDataRow = false;
      } else {
        tbl += `<tr>${cells.map(c => renderCell(c, false)).join("")}</tr>`;
      }
    });
    // Guard: if no data rows were processed (e.g. table had only \hline rows),
    // close only <table> to avoid orphaned </tbody></table>.
    tbl += firstDataRow ? `</table>` : `</tbody></table>`;
    return block(tbl);
  });

  // Itemize + Enumerate — processed in a loop so nested lists work correctly.
  // Each pass converts the INNERMOST remaining list (non-greedy regex).
  // After conversion the inner list is a placeholder; the outer list then
  // sees only a single placeholder token inside its \item text, which
  // is restored correctly when placeholders are expanded in Phase 4.
  {
    let prev = "";
    while (prev !== body) {
      prev = body;
      // Match only lists with no nested \begin{itemize|enumerate} inside,
      // i.e. the innermost ones — outer lists are converted on later passes.
      // Optional list arguments (\begin{itemize}[leftmargin=*,…]) and custom
      // item labels (\item[•]) are consumed so they don't leak as literal text.
      const toItems = (items: string) =>
        items.split(/\\item\b\s*/).filter((s: string) => s.trim())
          .map((s: string) => `<li>${inline(s.replace(/^\[[^\]]*\]\s*/, "").trim())}</li>`).join("");
      body = body.replace(/\\begin\{itemize\}(?:\[[^\]]*\])?((?:(?!\\begin\{(?:itemize|enumerate)\})[\s\S])*?)\\end\{itemize\}/g,
        (_, items) => block(`<ul>${toItems(items)}</ul>`));
      body = body.replace(/\\begin\{enumerate\}(?:\[[^\]]*\])?((?:(?!\\begin\{(?:itemize|enumerate)\})[\s\S])*?)\\end\{enumerate\}/g,
        (_, items) => block(`<ol>${toItems(items)}</ol>`));
    }
  }

  // Bibliography block — use pre-rendered HTML from prescan
  body = body.replace(/\\begin\{thebibliography\}[\s\S]*?\\end\{thebibliography\}/g, () =>
    block(bibHtml || "")
  );

  // ── Multi-file: \input / \include warning ────────────────────────────────
  // These cannot be resolved in a single-file browser preview.
  // Surface a clear yellow notice instead of silently losing content.
  body = body.replace(/\\(?:input|include|subfile)\{([^}]*)\}/g, (_, fname: string) => {
    warnings.push({ env: "\\input", reason: `Multi-file document: "${fname}" not loaded` });
    return block(
      `<div class="unknown-env" style="border-color:#f59e0b;color:#f59e0b">` +
      `⚠ <code>\\input{${escapeHtml(fname)}}</code> — multi-file document. ` +
      `Paste the contents of <em>${escapeHtml(fname)}</em> here to preview it.` +
      `</div>`
    );
  });

  // ── Algorithm / pseudocode environments ──────────────────────────────────
  // Render as a styled code block. Translates common algorithmic commands.
  function renderAlgorithm(content: string): string {
    const c = content
      // strip \caption and \label
      .replace(/\\caption(?:\[[^\]]*\])?\{[^}]*\}/g, "")
      .replace(/\\label\{[^}]*\}/g, "")
      // algorithmic state — bold keywords
      .replace(/\\(State|Procedure|Function|Return|If|ElsIf|Else|EndIf|For|EndFor|While|EndWhile|Loop|EndLoop|Require|Ensure|Input|Output)\b\s*/g,
        (_: string, kw: string) => `<strong>${kw}</strong> `)
      // \COMMENT{text}
      .replace(/\\(?:Comment|COMMENT)\{([^}]*)\}/g, '<em style="opacity:0.6"> ▷ $1</em>')
      // \State, \gets
      .replace(/\\gets\b/g, "←")
      .replace(/\\textbf\{([^}]*)\}/g, "<strong>$1</strong>")
      .replace(/\\emph\{([^}]*)\}/g, "<em>$1</em>")
      // inline math
      .replace(/\$([^$\n]+?)\$/g, (_, m) =>
        `<span class="math-inline" data-math="${encodeMath(m)}"></span>`)
      // strip remaining LaTeX commands
      .replace(/\\[a-zA-Z]+\*?\{([^}]*)\}/g, "$1")
      .replace(/\\[a-zA-Z]+\*?\b/g, "")
      .replace(/\{([^}]*)\}/g, "$1")
      .trim();
    return (
      `<div class="thm-box" style="font-family:'JetBrains Mono',monospace;font-size:0.85em">` +
      `<span class="thm-label">Algorithm</span><br>` +
      `<div style="white-space:pre-wrap;margin-top:0.5rem">${c}</div>` +
      `</div>`
    );
  }

  const algoEnvs = [
    "algorithm", "algorithmic", "algorithm2e", "algorithmicx", "algpseudocode",
  ];
  for (const env of algoEnvs) {
    body = body.replace(
      new RegExp(`\\\\begin\\{${env}\\}(?:\\[[^\\]]*\\])?(\\s*[\\s\\S]*?)\\\\end\\{${env}\\}`, "g"),
      (_, content: string) => block(renderAlgorithm(content))
    );
  }

  // ── Beamer frame environments ─────────────────────────────────────────────
  // Render each frame as a styled card with its title (frametitle).
  body = body.replace(
    /\\begin\{frame\}(\[[^\]]*\])?(?:\{([^}]*)\})?([\s\S]*?)\\end\{frame\}/g,
    (_, _opts, title: string | undefined, content: string) => {
      const titleHtml = title
        ? `<div style="font-weight:700;font-size:1rem;margin-bottom:0.6rem;padding-bottom:0.4rem;border-bottom:1px solid var(--border)">${inline(title)}</div>`
        : "";
      const frametitle = content.match(/\\frametitle\{([^}]*)\}/);
      const ftHtml = frametitle
        ? `<div style="font-weight:700;font-size:1rem;margin-bottom:0.6rem;padding-bottom:0.4rem;border-bottom:1px solid var(--border)">${inline(frametitle[1])}</div>`
        : "";
      const cleaned = content
        .replace(/\\frametitle\{[^}]*\}/g, "")
        .replace(/\\framesubtitle\{[^}]*\}/g, "");
      return block(
        `<div class="thm-box" style="border-left:3px solid var(--accent);margin:0.75rem 0">` +
        (ftHtml || titleHtml) +
        `${inline(cleaned.trim())}</div>`
      );
    }
  );

  // Beamer block environments
  body = body.replace(/\\begin\{block\}\{([^}]*)\}([\s\S]*?)\\end\{block\}/g, (_, title, c) =>
    block(`<div class="thm-box"><span class="thm-label">${inline(title)}</span> ${inline(c.trim())}</div>`)
  );
  body = body.replace(/\\begin\{alertblock\}\{([^}]*)\}([\s\S]*?)\\end\{alertblock\}/g, (_, title, c) =>
    block(`<div class="thm-box" style="border-color:#f87171"><span class="thm-label" style="color:#f87171">${inline(title)}</span> ${inline(c.trim())}</div>`)
  );
  body = body.replace(/\\begin\{exampleblock\}\{([^}]*)\}([\s\S]*?)\\end\{exampleblock\}/g, (_, title, c) =>
    block(`<div class="thm-box" style="border-color:#34d399"><span class="thm-label" style="color:#34d399">${inline(title)}</span> ${inline(c.trim())}</div>`)
  );

  // Beamer columns layout — render each column inline
  body = body.replace(/\\begin\{columns\}([\s\S]*?)\\end\{columns\}/g, (_, content) => {
    const cols = [...content.matchAll(/\\begin\{column\}(?:\[[^\]]*\])?\{[^}]*\}([\s\S]*?)\\end\{column\}/g)]
      .map(m => `<div style="flex:1;min-width:0">${inline(m[1].trim())}</div>`)
      .join("");
    return block(`<div style="display:flex;gap:1.5rem;align-items:flex-start">${cols}</div>`);
  });

  // ── Suppress non-renderable environments gracefully ───────────────────────
  // tikz, pgf, comment — remove silently (can't render in browser)
  body = body.replace(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g, () =>
    block(`<div class="fig-placeholder">🔷 TikZ figure (not rendered in browser preview — compile to PDF)</div>`)
  );
  body = body.replace(/\\begin\{pgfpicture\}[\s\S]*?\\end\{pgfpicture\}/g, () =>
    block(`<div class="fig-placeholder">🔷 PGF figure (not rendered in browser preview)</div>`)
  );
  body = body.replace(/\\begin\{comment\}[\s\S]*?\\end\{comment\}/g, "");

  // \printbibliography placeholder
  body = body.replace(/\\printbibliography(?:\[[^\]]*\])?/g, () =>
    block(`<div class="bib-section"><h2 class="bib-heading">References</h2>` +
      `<div class="unknown-env" style="border-color:#6366f1;color:#6366f1;font-size:0.82em">` +
      `📚 <code>\\printbibliography</code> — compile with <strong>biber</strong> to generate the reference list.</div></div>`)
  );

  // ── Layout / formatting environments ─────────────────────────────────────

  // titlepage — unwrap so its content (minipages, rules, \\[len], super-
  // scripts) flows through the normal pipeline instead of being dumped raw
  // as an "unknown environment". Must run before the minipage handler below.
  body = body.replace(/\\begin\{titlepage\}([\s\S]*?)\\end\{titlepage\}/g, (_, c) => `\n${c}\n`);

  // center / flushleft / flushright
  body = body.replace(/\\begin\{center\}([\s\S]*?)\\end\{center\}/g, (_, c) =>
    block(`<div style="text-align:center">${inline(c.trim())}</div>`)
  );
  body = body.replace(/\\begin\{flushleft\}([\s\S]*?)\\end\{flushleft\}/g, (_, c) =>
    block(`<div style="text-align:left">${inline(c.trim())}</div>`)
  );
  body = body.replace(/\\begin\{flushright\}([\s\S]*?)\\end\{flushright\}/g, (_, c) =>
    block(`<div style="text-align:right">${inline(c.trim())}</div>`)
  );

  // minipage — strip position/width args, pass content through
  body = body.replace(
    /\\begin\{minipage\}(?:\[[^\]]*\])?(?:\[[^\]]*\])?\{[^}]*\}([\s\S]*?)\\end\{minipage\}/g,
    (_, c) => inline(c.trim()) + " "
  );

  // multicols — strip column arg, pass content through
  body = body.replace(/\\begin\{multicols\}\{[^}]*\}([\s\S]*?)\\end\{multicols\}/g, (_, c) =>
    block(`<div style="column-count:2;gap:2em">${inline(c.trim())}</div>`)
  );

  // quote / quotation / verse
  body = body.replace(/\\begin\{(?:quote|quotation)\}([\s\S]*?)\\end\{(?:quote|quotation)\}/g, (_, c) =>
    block(`<blockquote style="margin:1rem 2rem;font-style:italic">${inline(c.trim())}</blockquote>`)
  );
  body = body.replace(/\\begin\{verse\}([\s\S]*?)\\end\{verse\}/g, (_, c) =>
    block(`<div style="margin:1rem 2rem;font-style:italic;white-space:pre-line">${inline(c.trim())}</div>`)
  );

  // description (labelled list like <dl>)
  body = body.replace(/\\begin\{description\}([\s\S]*?)\\end\{description\}/g, (_, content) => {
    const items = content.split(/\\item\s*/).filter((s: string) => s.trim());
    const dls = items.map((s: string) => {
      const labelM = s.match(/^\[([^\]]*)\]\s*/);
      if (labelM) {
        const label = labelM[1];
        const rest  = s.slice(labelM[0].length).trim();
        return `<dt><strong>${inline(label)}</strong></dt><dd>${inline(rest)}</dd>`;
      }
      return `<dd>${inline(s.trim())}</dd>`;
    }).join("");
    return block(`<dl style="margin:0.75rem 0 0.75rem 1.5rem">${dls}</dl>`);
  });

  // longtable — treat same as tabular but drop caption that might appear mid-body
  body = body.replace(/\\begin\{longtable\}(\{[^}]*\})([\s\S]*?)\\end\{longtable\}/g, (_, spec, content) => {
    // Strip longtable-specific commands
    const clean = content
      .replace(/\\(?:endhead|endfirsthead|endfoot|endlastfoot)\b/g, "")
      .replace(/\\caption(?:\[[^\]]*\])?\{[^}]*\}(?:\\\\)?/g, "")
      .replace(/\\label\{[^}]*\}/g, "");
    // Reuse tabular renderer by prepending \begin{tabular}
    const fakeTabular = `\\begin{tabular}${spec}${clean}\\end{tabular}`;
    return fakeTabular;
  });

  // Remaining unknown envs
  body = body.replace(/\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}/g, (_, env: string, content: string) => {
    if (!KNOWN_ENVS.has(env)) {
      if (!warnings.find(w => w.env === env))
        warnings.push({ env, reason: "Not supported in browser preview" });
      return block(`<div class="unknown-env"><em>[${env}]</em></div>`);
    }
    return content;
  });

  // Sections — single combined pass to preserve document order.
  // Three separate body.replace() calls would process ALL sections before
  // ANY subsections, making secCounter stale by the time subsections run.
  body = body.replace(/\\(chapter|(?:sub){0,2}section)(\*?)\{([^}]*)\}/g, (_, cmd, star, t) => {
    const starred = star === "*";
    if (cmd === "chapter") {
      return block(`<h1 class="chapter">${inline(t)}</h1>`);
    } else if (cmd === "section") {
      if (!starred) { secCounter++; subCounter = 0; subSubCounter = 0; }
      const num = starred ? "" : `<span class="sec-num">${secCounter}</span> `;
      return block(`<h2>${num}${inline(t)}</h2>`);
    } else if (cmd === "subsection") {
      if (!starred) { subCounter++; subSubCounter = 0; }
      const num = starred ? "" : `<span class="sec-num">${secCounter}.${subCounter}</span> `;
      return block(`<h3>${num}${inline(t)}</h3>`);
    } else { // subsubsection
      if (!starred) subSubCounter++;
      const num = starred ? "" : `<span class="sec-num">${secCounter}.${subCounter}.${subSubCounter}</span> `;
      return block(`<h4>${num}${inline(t)}</h4>`);
    }
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
  // IMPORTANT: iterate in REVERSE insertion order so that inner placeholders
  // (which were inserted first) are resolved after outer ones embed them.
  // e.g. nested \begin{itemize} — inner list ph appears inside outer list html;
  // processing outer first puts inner ph into body, then inner resolves it.
  for (const [ph, html] of [...blocks].reverse()) {
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

// ── Helper: translate packages that KaTeX doesn't support natively ────────────
// Called on math content BEFORE encodeMath so KaTeX can render correctly.
function sanitizeMathForKaTeX(math: string): string {
  return math
    // bm package: \bm{x} → \boldsymbol{x}  (KaTeX supports boldsymbol, not bm)
    .replace(/\\bm\{/g, "\\boldsymbol{")
    // \operatorname* (starred) → \operatorname (KaTeX doesn't support *)
    .replace(/\\operatorname\*/g, "\\operatorname");
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
  // Inline math: $...$ only ($$...$$ is handled as block in Phase 1)
  text = text.replace(/\$([^$\n]+?)\$/g, (_, m) =>
    `<span class="math-inline" data-math="${encodeMath(sanitizeMathForKaTeX(m))}"></span>`
  );

  // Text formatting
  text = text.replace(/\\textbf\{([^}]*)\}/g, "<strong>$1</strong>");
  text = text.replace(/\\textit\{([^}]*)\}/g, "<em>$1</em>");
  text = text.replace(/\\emph\{([^}]*)\}/g, "<em>$1</em>");
  text = text.replace(/\\underline\{([^}]*)\}/g, "<u>$1</u>");
  text = text.replace(/\\texttt\{([^}]*)\}/g, "<code>$1</code>");
  text = text.replace(/\\text\{([^}]*)\}/g, "$1");
  text = text.replace(/\\textsc\{([^}]*)\}/g, '<span style="font-variant:small-caps">$1</span>');
  text = text.replace(/\\textsuperscript\{([^}]*)\}/g, "<sup>$1</sup>");
  text = text.replace(/\\textsubscript\{([^}]*)\}/g, "<sub>$1</sub>");
  // \parbox[pos][height][inner]{width}{content} → content (drop the box sizing
  // args, which otherwise leak as literal "[2.8cm]" text in photo-CV templates).
  text = text.replace(/\\parbox(?:\[[^\]]*\]){0,3}\{[^{}]*\}\{((?:[^{}]|\{[^{}]*\})*)\}/g, "$1");
  // \fbox / \framebox / \mbox / \makebox → content
  text = text.replace(/\\(?:fbox|framebox|mbox|makebox)(?:\[[^\]]*\])*\{((?:[^{}]|\{[^{}]*\})*)\}/g, "$1");

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

  // URLs and hrefs — sanitize to block javascript: and other dangerous protocols
  text = text.replace(/\\url\{([^}]*)\}/g, (_, u) => {
    const href = safeHref(u);
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${escapeHtml(u)}</a>`;
  });
  text = text.replace(/\\href\{([^}]*)\}\{([^}]*)\}/g, (_, u, label) => {
    const href = safeHref(u);
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });

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

  // Spacing / line breaks — consume the optional \\[length] / \\* spacing arg
  // (otherwise "[1em]", "[0.5em]" leak into the output as literal text).
  text = text.replace(/\\\\\*?(?:\s*\[[^\]]*\])?/g, "<br>");
  text = text.replace(/\\newline\b/g, "<br>");
  text = text.replace(/\\~/g, " ");
  text = text.replace(/~/g, " ");
  text = text.replace(/\\(vspace|hspace|kern|mspace)\*?\{[^}]*\}/g, " ");
  text = text.replace(/\\(bigskip|medskip|smallskip|noindent|indent|centering)\b/g, "");
  text = text.replace(/\\(newpage|clearpage|pagebreak)\b/g, "");
  text = text.replace(/\\par\b/g, "");

  // Horizontal rules
  text = text.replace(/\\hrulefill\b/g, "<hr>");
  text = text.replace(/\\rule\{[^}]*\}\{[^}]*\}/g, "<hr>");

  // Thanks
  text = text.replace(/\\thanks\{([^}]*)\}/g, "<sup>*</sup>");

  // ── \boxed{} — highlight result (very common in physics/math) ────────────
  // Wrap in KaTeX \boxed so it renders with a box
  text = text.replace(/\\boxed\{([^}]*)\}/g, (_, inner) =>
    `<span class="math-inline" data-math="${encodeMath("\\boxed{" + inner + "}")}"></span>`
  );

  // ── \bm{} — bold math (bm package, standard in ML papers) ────────────────
  // Map to \boldsymbol which KaTeX understands
  text = text.replace(/\\bm\{([^}]*)\}/g, (_, inner) =>
    `<span class="math-inline" data-math="${encodeMath("\\boldsymbol{" + inner + "}")}"></span>`
  );

  // ── siunitx: \SI{value}{unit} / \si{unit} / \num{number} ─────────────────
  text = text.replace(/\\SI\{([^}]*)\}\{([^}]*)\}/g, (_, val, unit) => {
    // Simplify unit: \meter → m, \per → /, \squared → ², etc.
    const u = unit
      .replace(/\\per\b/g, "/").replace(/\\kilo\b/g, "k").replace(/\\mega\b/g, "M")
      .replace(/\\meter\b/g, "m").replace(/\\metre\b/g, "m")
      .replace(/\\second\b/g, "s").replace(/\\kilogram\b/g, "kg")
      .replace(/\\newton\b/g, "N").replace(/\\joule\b/g, "J")
      .replace(/\\watt\b/g, "W").replace(/\\hertz\b/g, "Hz")
      .replace(/\\pascal\b/g, "Pa").replace(/\\kelvin\b/g, "K")
      .replace(/\\celsius\b/g, "°C").replace(/\\degree\b/g, "°")
      .replace(/\\squared\b/g, "²").replace(/\\cubed\b/g, "³")
      .replace(/\\\\|\s*\.\s*/g, "").replace(/\{|\}/g, "").trim();
    return `${val} ${u}`;
  });
  text = text.replace(/\\si\{([^}]*)\}/g, (_, unit) =>
    unit.replace(/\\[a-zA-Z]+/g, (m: string) => m.slice(1)).replace(/[{}]/g, "")
  );
  text = text.replace(/\\num\{([^}]*)\}/g, "$1");

  // ── \substack — multi-line subscript/superscript ──────────────────────────
  // Already handled by KaTeX if inside math — this is a fallback for text mode
  text = text.replace(/\\substack\{([^}]*)\}/g, (_, inner) =>
    `<span class="math-inline" data-math="${encodeMath("\\substack{" + inner + "}")}"></span>`
  );

  // ── \color commands ────────────────────────────────────────────────────────
  // \textcolor{color}{text} — keep text, drop color
  text = text.replace(/\\textcolor\{[^}]*\}\{([^}]*)\}/g, "$1");
  // \colorbox{color}{text} — keep text
  text = text.replace(/\\colorbox\{[^}]*\}\{([^}]*)\}/g, "$1");
  // \color{...} — drop entirely (don't emit color name)
  text = text.replace(/\\color\{[^}]*\}/g, "");
  // \pagecolor, \normalcolor, etc. — drop
  text = text.replace(/\\(?:pagecolor|normalcolor|textcolor)\{[^}]*\}/g, "");

  // ── Font size / weight / shape shortcuts ─────────────────────────────────
  text = text.replace(
    /\\(?:tiny|scriptsize|footnotesize|small|normalsize|large|Large|LARGE|huge|Huge)\b/g, ""
  );
  text = text.replace(
    /\\(?:bfseries|itshape|upshape|slshape|scshape|mdseries|rmfamily|sffamily|ttfamily|normalfont)\b/g, ""
  );

  // ── Alignment directives ──────────────────────────────────────────────────
  text = text.replace(/\\(?:raggedright|raggedleft|centering|justifying)\b/g, "");

  // ── Horizontal rules ──────────────────────────────────────────────────────
  // \hrule and \hrule height 0.6pt — render as <hr>
  text = text.replace(/\\hrule(?:\s+height\s+[0-9.]+\s*[a-z]*)?\b/g, "<hr>");

  // ── Argument placeholders (#1, #2, …) left over from un-stripped commands ──
  text = text.replace(/#\d/g, "");

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

function safeHref(url: string): string {
  const u = url.trim();
  if (/^https?:\/\//i.test(u) || /^mailto:/i.test(u) || /^\//.test(u)) return u;
  return "#";
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
