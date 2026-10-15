/**
 * Word (.docx) to LaTeX: the pure part of components/WordToLatex.tsx.
 *
 * The pipeline is: OMML equations in word/document.xml are swapped for
 * placeholder runs (mammoth drops OMML), mammoth turns the document into
 * HTML, htmlToLatex walks that HTML, and the placeholders are swapped back
 * for the converted math.
 *
 * Only plain DOM Level 2 calls are used (childNodes, getAttribute,
 * getElementsByTagName...), no CSS selectors, so the same code runs in the
 * browser and in Node with @xmldom/xmldom (tests).
 */

export interface WordStats {
  headings: number;
  paragraphs: number;
  tables: number;
  images: number;
  footnotes: number;
  lists: number;
  links: number;
  unresolvedImages: number;
}

export interface Equation { latex: string; display: boolean }

export interface DomImpl {
  DOMParser: { new (): DOMParser };
  XMLSerializer: { new (): XMLSerializer };
}

const ELEMENT = 1;
const TEXT = 3;

function name(n: Node): string {
  const el = n as Element;
  return (el.localName || el.nodeName || "").toLowerCase();
}

function childElements(el: Node): Element[] {
  return Array.from(el.childNodes).filter((n) => n.nodeType === ELEMENT) as Element[];
}

function child(el: Node, tag: string): Element | undefined {
  return childElements(el).find((c) => name(c) === tag);
}

function descendants(el: Node, test: (e: Element) => boolean, out: Element[] = []): Element[] {
  for (const c of childElements(el)) {
    if (test(c)) out.push(c);
    descendants(c, test, out);
  }
  return out;
}

function defaultDom(): DomImpl {
  return { DOMParser: globalThis.DOMParser, XMLSerializer: globalThis.XMLSerializer };
}

// ── Characters pdfLaTeX cannot typeset as-is ───────────────────────────────
// Same idea as lib/cv.ts: utf8 + T1 cover Latin-1 and Latin Extended-A;
// symbols people type in Word (Greek letters, relations, arrows, the minus
// sign U+2212) stop pdfLaTeX with "Unicode character ... not set up".
const GREEK = "α:alpha β:beta γ:gamma δ:delta ε:epsilon ζ:zeta η:eta θ:theta ι:iota κ:kappa λ:lambda μ:mu ν:nu ξ:xi π:pi ρ:rho σ:sigma ς:varsigma τ:tau υ:upsilon φ:phi ϕ:phi χ:chi ψ:psi ω:omega ϑ:vartheta ϵ:epsilon Γ:Gamma Δ:Delta Θ:Theta Λ:Lambda Ξ:Xi Π:Pi Σ:Sigma Υ:Upsilon Φ:Phi Ψ:Psi Ω:Omega";
const MATH_SYMBOLS: Record<string, string> = {
  "≤": "leq", "≥": "geq", "≠": "neq", "≈": "approx", "≡": "equiv", "∼": "sim", "≃": "simeq", "≅": "cong",
  "∝": "propto", "≪": "ll", "≫": "gg", "±": "pm", "∓": "mp", "÷": "div", "⋅": "cdot", "∗": "ast",
  "→": "rightarrow", "←": "leftarrow", "↔": "leftrightarrow", "⇒": "Rightarrow", "⇐": "Leftarrow",
  "⇔": "Leftrightarrow", "↦": "mapsto", "↑": "uparrow", "↓": "downarrow",
  "∞": "infty", "∂": "partial", "∇": "nabla", "∑": "sum", "∏": "prod", "∫": "int", "∮": "oint", "√": "surd",
  "∈": "in", "∉": "notin", "∋": "ni", "⊂": "subset", "⊃": "supset", "⊆": "subseteq", "⊇": "supseteq",
  "∪": "cup", "∩": "cap", "∅": "emptyset", "∀": "forall", "∃": "exists", "∄": "nexists", "¬": "neg",
  "∧": "wedge", "∨": "vee", "⊕": "oplus", "⊗": "otimes", "⊥": "perp", "∥": "parallel", "∠": "angle",
  "′": "prime", "″": "prime\\prime", "ℓ": "ell", "ℏ": "hbar", "ℝ": "mathbb{R}", "ℕ": "mathbb{N}",
  "ℤ": "mathbb{Z}", "ℚ": "mathbb{Q}", "ℂ": "mathbb{C}", "…": "ldots", "⋯": "cdots", "∘": "circ",
  "∙": "bullet", "⟨": "langle", "⟩": "rangle", "µ": "mu",
};
const UNICODE_TEXT: Record<string, string> = {
  ...Object.fromEntries(GREEK.split(" ").map((p) => { const [c, n] = p.split(":"); return [c, `\\ensuremath{\\${n}}`]; })),
  ...Object.fromEntries(Object.entries(MATH_SYMBOLS).map(([c, n]) => [c, `\\ensuremath{\\${n}}`])),
  "−": "\\ensuremath{-}", "×": "\\texttimes{}", "°": "\\textdegree{}", "€": "\\texteuro{}",
  "…": "\\ldots{}", "·": "\\textperiodcentered{}", "•": "\\textbullet{}",
  "‐": "-", "‑": "-", "‒": "--", "\u00a0": "~", "\u2009": "\\,", "\u202f": "\\,", "\u2002": "\\enspace{}",
  "\u2003": "\\quad{}", "\u200b": "", "\u200c": "", "\u200d": "", "\ufeff": "", "\u00ad": "\\-",
  "✓": "\\ensuremath{\\checkmark}", "™": "\\texttrademark{}", "℃": "\\textdegree{}C",
};
const PUNCT = new Set("–\u2014‘’‚“”„†‡•…‰‹›");
const TEX_ESC: Record<string, string> = {
  "\\": "\\textbackslash{}", "{": "\\{", "}": "\\}", $: "\\$", "&": "\\&", "%": "\\%",
  "#": "\\#", _: "\\_", "^": "\\textasciicircum{}", "~": "\\textasciitilde{}",
};

/** True if pdfLaTeX (utf8 + T1) typesets the character as-is. */
function typesettable(ch: string): boolean {
  const c = ch.codePointAt(0)!;
  if (c < 0x20) return ch === "\n" || ch === "\t";
  return c <= 0x17f || (c >= 0x218 && c <= 0x21b) || PUNCT.has(ch);
}

/**
 * Escape text for a LaTeX body, in one pass so the braces of
 * \textbackslash{} are never escaped again. Characters with no pdfLaTeX
 * equivalent become "?" and are recorded in `unsupported`.
 */
export function escapeText(text: string, unsupported?: Set<string>): string {
  let out = "";
  for (const ch of text.normalize("NFC")) {
    const mapped = TEX_ESC[ch] ?? UNICODE_TEXT[ch];
    if (mapped !== undefined) out += mapped;
    else if (typesettable(ch)) out += ch;
    else if (/^[\uE000-\uF8FF]$/.test(ch)) out += ""; // private use (Symbol-font bullets)
    else { unsupported?.add(ch); out += "?"; }
  }
  return out;
}

const MATH_ESC: Record<string, string> = {
  "{": "\\{", "}": "\\}", $: "\\$", "%": "\\%", "#": "\\#", _: "\\_", "&": "\\&",
  "\\": "\\backslash ", "~": "\\sim ", "−": "-", "∗": "*",
};

/** Escape the text of an OMML run for math mode. */
function escapeMath(text: string, unsupported?: Set<string>, alignAmp = false): string {
  let out = "";
  for (const ch of text.normalize("NFC")) {
    if (ch === "&" && alignAmp) { out += "&"; continue; }
    if (MATH_ESC[ch] !== undefined) { out += MATH_ESC[ch]; continue; }
    const greek = UNICODE_TEXT[ch];
    if (MATH_SYMBOLS[ch]) { out += `\\${MATH_SYMBOLS[ch]} `; continue; }
    if (greek?.startsWith("\\ensuremath{")) { out += `${greek.slice(12, -1)} `; continue; }
    if (ch === "\u00a0" || ch === "\u2009" || ch === "\u202f") { out += "\\,"; continue; }
    if (ch === "×") { out += "\\times "; continue; }
    if (ch === "°") { out += "^{\\circ}"; continue; }
    if (typesettable(ch) && ch.codePointAt(0)! < 0x80) { out += ch; continue; }
    if (/^[\u200b-\u200d\ufeff]$/.test(ch)) continue;
    if (typesettable(ch)) { out += `\\text{${ch}}`; continue; }
    unsupported?.add(ch);
    out += "?";
  }
  return out;
}

// ── OMML to LaTeX (best effort) ──────────────────────────────────────────
const FUNCTIONS = new Set([
  "sin", "cos", "tan", "cot", "sec", "csc", "arcsin", "arccos", "arctan", "sinh", "cosh", "tanh", "coth",
  "log", "ln", "lg", "exp", "lim", "max", "min", "sup", "inf", "det", "dim", "ker", "deg", "gcd", "arg", "Pr",
]);

const NARY: Record<string, string> = {
  "∑": "\\sum", "∏": "\\prod", "∐": "\\coprod", "∫": "\\int", "∬": "\\iint", "∭": "\\iiint", "∮": "\\oint",
  "⋃": "\\bigcup", "⋂": "\\bigcap", "⋁": "\\bigvee", "⋀": "\\bigwedge", "⨁": "\\bigoplus", "⨂": "\\bigotimes",
};

const ACCENTS: Record<string, string> = {
  "\u0302": "hat", "^": "hat", "\u0303": "tilde", "~": "tilde", "\u0304": "bar", "\u0305": "bar", "¯": "bar",
  "\u20d7": "vec", "\u20d1": "vec", "\u0307": "dot", "\u0308": "ddot", "\u030c": "check", "\u0306": "breve",
  "\u0301": "acute", "\u0300": "grave",
};

const DELIMS: Record<string, string> = {
  "(": "(", ")": ")", "[": "[", "]": "]", "{": "\\{", "}": "\\}", "|": "|", "‖": "\\|",
  "⟨": "\\langle", "⟩": "\\rangle", "〈": "\\langle", "〉": "\\rangle", "⌊": "\\lfloor", "⌋": "\\rfloor",
  "⌈": "\\lceil", "⌉": "\\rceil", "": ".",
};

function mval(el: Element | undefined): string | null {
  if (!el) return null;
  return el.getAttribute("m:val") ?? el.getAttribute("val");
}

function prop(el: Element, pr: string, key: string): string | null {
  const p = child(el, pr);
  return p ? mval(child(p, key)) : null;
}

interface MathCtx { unsupported?: Set<string>; alignAmp?: boolean }

/** Convert the element children of an OMML node and join them. */
function mathKids(el: Element | undefined, ctx: MathCtx): string {
  if (!el) return "";
  return childElements(el).map((c) => ommlToLatex(c, ctx)).join("");
}

export function ommlToLatex(el: Element, ctx: MathCtx = {}): string {
  const tag = name(el);
  const part = (n: string) => mathKids(child(el, n), ctx).trim();
  const script = (mark: "_" | "^", s: string) => (s ? `${mark}{${s}}` : "");
  // A one-token base needs no braces: x^{2}, \\sigma^{2}; anything longer is grouped.
  const baseOf = (b: string) => (/^(?:[A-Za-z0-9]|\\[A-Za-z]+)$/.test(b) ? b : `{${b}}`);

  switch (tag) {
    case "omath": return mathKids(el, ctx);
    case "omathpara": return childElements(el).filter((c) => name(c) === "omath").map((m) => mathKids(m, ctx)).join(" \\\\ ");
    case "r": {
      const text = childElements(el).filter((c) => name(c) === "t").map((t) => t.textContent ?? "").join("");
      const esc = escapeMath(text, ctx.unsupported, ctx.alignAmp);
      const sty = prop(el, "rpr", "sty");
      const scr = prop(el, "rpr", "scr");
      if (scr === "double-struck") return `\\mathbb{${esc}}`;
      if (scr === "script") return `\\mathcal{${esc}}`;
      if (sty === "b") return `\\mathbf{${esc}}`;
      if (sty === "bi") return `\\boldsymbol{${esc}}`;
      // Upright words of several letters (units, "if"): \mathrm keeps them upright.
      if (sty === "p" && /^[A-Za-z]{2,}$/.test(text)) return FUNCTIONS.has(text) ? `\\${text} ` : `\\mathrm{${esc}}`;
      return esc;
    }
    case "f": {
      const type = prop(el, "fpr", "type");
      if (type === "lin") return `${part("num")}/${part("den")}`;
      if (type === "noBar") return `\\genfrac{}{}{0pt}{}{${part("num")}}{${part("den")}}`;
      return `\\frac{${part("num") || "{}"}}{${part("den") || "{}"}}`;
    }
    case "ssup": return `${baseOf(part("e"))}${script("^", part("sup"))}`;
    case "ssub": return `${baseOf(part("e"))}${script("_", part("sub"))}`;
    case "ssubsup": return `${baseOf(part("e"))}${script("_", part("sub"))}${script("^", part("sup"))}`;
    case "spre": return `{}${script("_", part("sub"))}${script("^", part("sup"))}{${part("e")}}`;
    case "rad": {
      const deg = part("deg");
      const hide = prop(el, "radpr", "degHide") ?? prop(el, "radpr", "deghide");
      return deg && deg !== "2" && hide !== "1" && hide !== "on" ? `\\sqrt[${deg}]{${part("e")}}` : `\\sqrt{${part("e")}}`;
    }
    case "nary": {
      const chr = prop(el, "narypr", "chr") ?? "∫";
      const sym = NARY[chr] ?? "\\int";
      return `${sym}${script("_", part("sub"))}${script("^", part("sup"))} ${part("e")}`;
    }
    case "d": {
      const pr = child(el, "dpr");
      const beg = pr ? mval(child(pr, "begchr")) : null;
      const end = pr ? mval(child(pr, "endchr")) : null;
      const sep = (pr ? mval(child(pr, "sepchr")) : null) ?? "|";
      const open = DELIMS[beg ?? "("] ?? ".";
      const close = DELIMS[end ?? ")"] ?? ".";
      const parts = childElements(el).filter((c) => name(c) === "e").map((e) => mathKids(e, ctx).trim());
      const sepL = DELIMS[sep] ?? escapeMath(sep, ctx.unsupported);
      return `\\left${open} ${parts.join(` ${sepL === "|" ? "\\mid" : sepL} `)} \\right${close}`;
    }
    case "func": {
      const fname = child(el, "fname");
      const raw = (fname?.textContent ?? "").trim();
      const fn = FUNCTIONS.has(raw) ? `\\${raw}` : raw ? `\\operatorname{${escapeMath(raw, ctx.unsupported)}}` : mathKids(fname, ctx);
      // A function name can hold a limit (lim under x->0): keep it then.
      const head = fname && descendants(fname, (d) => name(d) === "limlow" || name(d) === "limupp").length
        ? mathKids(fname, ctx) : fn;
      return `${head}{${part("e")}}`;
    }
    case "limlow": case "limupp": {
      const raw = (child(el, "e")?.textContent ?? "").trim();
      const base = FUNCTIONS.has(raw) ? `\\${raw}` : part("e");
      return `${base}${script(tag === "limlow" ? "_" : "^", part("lim"))}`;
    }
    case "m": {
      const rows = childElements(el).filter((c) => name(c) === "mr")
        .map((r) => childElements(r).filter((c) => name(c) === "e").map((c) => mathKids(c, ctx).trim()).join(" & "));
      return `\\begin{pmatrix} ${rows.join(" \\\\ ")} \\end{pmatrix}`;
    }
    case "eqarr": {
      const rows = childElements(el).filter((c) => name(c) === "e")
        .map((e) => mathKids(e, { ...ctx, alignAmp: true }).trim());
      return `\\begin{aligned} ${rows.join(" \\\\ ")} \\end{aligned}`;
    }
    case "acc": {
      const chr = prop(el, "accpr", "chr") ?? "\u0302";
      return `\\${ACCENTS[chr] ?? "hat"}{${part("e")}}`;
    }
    case "bar": {
      const pos = prop(el, "barpr", "pos");
      return pos === "bot" ? `\\underline{${part("e")}}` : `\\overline{${part("e")}}`;
    }
    case "groupchr": {
      const pos = prop(el, "groupchrpr", "pos");
      return pos === "top" ? `\\overbrace{${part("e")}}` : `\\underbrace{${part("e")}}`;
    }
    case "borderbox": return `\\boxed{${part("e")}}`;
    case "box": case "e": case "num": case "den": case "sub": case "sup": case "deg": case "lim": case "fname":
      return mathKids(el, ctx);
    case "t": return escapeMath(el.textContent ?? "", ctx.unsupported, ctx.alignAmp);
    default:
      // Property elements (*Pr) and Word run properties hold no math.
      if (tag.endsWith("pr")) return "";
      return mathKids(el, ctx);
  }
}

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const M_NS = "http://schemas.openxmlformats.org/officeDocument/2006/math";
export const eqToken = (i: number) => `LTXCIEQ${i}Z`;

/**
 * Replace every OMML equation in document.xml with a plain-text placeholder
 * run, so mammoth (which drops OMML) keeps the equation's position. Returns
 * the rewritten XML and the LaTeX for each placeholder, in order.
 */
export function inlineOmmlEquations(
  xml: string, dom: DomImpl = defaultDom(), unsupported?: Set<string>,
): { xml: string; equations: Equation[] } {
  let doc: Document;
  try { doc = new dom.DOMParser().parseFromString(xml, "application/xml"); } catch { return { xml, equations: [] }; }
  if (!doc?.documentElement || doc.getElementsByTagName("parsererror").length) return { xml, equations: [] };
  const equations: Equation[] = [];
  const swap = (el: Element, display: boolean) => {
    let latex = "";
    try { latex = ommlToLatex(el, { unsupported }).trim(); } catch { /* keep empty */ }
    const run = doc.createElementNS(W_NS, "w:r");
    const t = doc.createElementNS(W_NS, "w:t");
    t.appendChild(doc.createTextNode(latex ? eqToken(equations.length) : ""));
    run.appendChild(t);
    el.parentNode?.replaceChild(run, el);
    if (latex) equations.push({ latex, display });
  };
  // Display equations first, so their inner oMath is not handled twice.
  Array.from(doc.getElementsByTagNameNS(M_NS, "oMathPara")).forEach((el) => swap(el, true));
  Array.from(doc.getElementsByTagNameNS(M_NS, "oMath")).forEach((el) => swap(el, false));
  return { xml: new dom.XMLSerializer().serializeToString(doc), equations };
}

// ── HTML (mammoth output) to LaTeX ───────────────────────────────────────

/** Remove leading and trailing line breaks: "\\" with nothing before it does not compile. */
function trimBreaks(s: string): string {
  let out = s.trim();
  for (;;) {
    const next = out
      .replace(/^(?:\\\\(?:\[[^\]]*\])?\s*)+/, "")
      .replace(/(?:\s*\\\\(?:\[[^\]]*\])?)+$/, "")
      // A break right inside a leading command: \textbf{\\ word}
      .replace(/^(\\[a-zA-Z]+\{)\s*(?:\\\\\s*)+/, "$1")
      .replace(/(?:\s*\\\\)+\s*\}$/, "}")
      .trim();
    if (next === out) return out;
    out = next;
  }
}

/** Width of a p{} column so that n of them, with their padding, fill \linewidth. */
function colWidth(n: number, span = 1): string {
  const one = Math.max(0.05, Math.floor((1 / n - 0.03) * 100) / 100);
  const w = Math.round((one * span + 0.03 * (span - 1)) * 100) / 100;
  return `p{${w}\\linewidth}`;
}

// Content a plain l/c/r cell (LR mode) cannot hold.
const BLOCK_IN_CELL = /\\begin\{|\\\[|\n\s*\n|\\newline|\\includegraphics|\\rule|\\par\b/;

export interface HtmlToLatexOptions {
  equations?: Equation[];
  parseHtml?: (html: string) => Document;
}

export interface HtmlToLatexResult {
  latex: string;
  stats: WordStats;
  unsupported: string[];
}

export function htmlToLatex(html: string, opts: HtmlToLatexOptions = {}): HtmlToLatexResult {
  const equations = opts.equations ?? [];
  const unsupported = new Set<string>();
  const s: WordStats = {
    headings: 0, paragraphs: 0, tables: 0, images: 0, lists: 0, links: 0, footnotes: 0, unresolvedImages: 0,
  };
  let imgCounter = 0;

  const esc = (text: string) => escapeText(text, unsupported);
  // \href{...}: hyperref reads the URL verbatim except for these; non-ASCII is percent-encoded.
  const escUrl = (url: string) => url
    .replace(/[^\x21-\x7e]/g, (c) => encodeURIComponent(c))
    .replace(/[\\%#{}]/g, (c) => (c === "\\" ? "/" : `\\${c}`));

  interface Ctx { inCell: boolean; inHeading: boolean; noNotes: boolean; inHead: boolean }
  const base: Ctx = { inCell: false, inHeading: false, noNotes: false, inHead: false };

  // Word footnotes: mammoth emits <sup><a href="#footnote-N">[N]</a></sup> in
  // the text and the notes as <li id="footnote-N"> at the end.
  const notes = new Map<string, Element>();

  const swapEquation = (text: string, ctx: Ctx) => text.replace(/LTXCIEQ(\d+)Z/g, (_, i) => {
    const eq = equations[Number(i)];
    if (!eq) return "";
    if (!eq.display || ctx.inHeading) return `$${eq.latex}$`;
    // A multi-line oMathPara cannot live in \[ \]: use gather* (amsmath).
    return eq.latex.includes(" \\\\ ")
      ? `\n\\begin{gather*}\n  ${eq.latex}\n\\end{gather*}\n`
      : `\n\\[\n  ${eq.latex}\n\\]\n`;
  });

  function heading(el: Element, cmd: string, ctx: Ctx): string {
    s.headings++;
    const hctx = { ...ctx, inHeading: true };
    const full = trimBreaks(kidsOf(el, hctx));
    // A footnote in a section title breaks hyperref's bookmarks and the table
    // of contents: give the short title without it.
    const short = full.includes("\\footnote") ? `[${trimBreaks(kidsOf(el, { ...hctx, noNotes: true }))}]` : "";
    return `\n\n\\${cmd}${short}{${full}}\n`;
  }

  function kidsOf(el: Node, ctx: Ctx): string {
    return Array.from(el.childNodes).map((n) => walk(n, ctx)).join("");
  }

  function table(el: Element, ctx: Ctx): string {
    s.tables++;
    const n = s.tables;
    const rows = descendants(el, (d) => name(d) === "tr")
      // Rows of a nested table belong to that table.
      .filter((r) => {
        let p = r.parentNode;
        while (p && name(p) !== "table") p = p.parentNode;
        return p === el;
      });
    const cellCtx: Ctx = { ...ctx, inCell: true, inHeading: false };
    const rendered = rows.map((r) => {
      const inHead = (r.parentNode && name(r.parentNode) === "thead") || false;
      return {
        inHead,
        cells: childElements(r).filter((c) => name(c) === "td" || name(c) === "th").map((c) => ({
          span: Math.max(1, Number(c.getAttribute("colspan")) || 1),
          text: trimBreaks(kidsOf(c, { ...cellCtx, inHead })),
        })),
      };
    });
    // Widest row, counting merged cells (colspan), sets the column count.
    const cols = Math.max(1, ...rendered.map((r) => r.cells.reduce((k, c) => k + c.span, 0)));
    const block = rendered.some((r) => r.cells.some((c) => BLOCK_IN_CELL.test(c.text)));
    const spec = block ? Array(cols).fill(colWidth(cols)).join("") : "l".repeat(cols);
    const lines = rendered.map((r, i) => {
      let width = 0;
      const cells = r.cells.map((c) => {
        width += c.span;
        const text = c.text.replace(/\n\s*\n/g, "\\par ").replace(/\s*\n\s*/g, " ").trim();
        return c.span > 1 ? `\\multicolumn{${c.span}}{${block ? colWidth(cols, c.span) : "l"}}{${text}}` : text;
      });
      while (width++ < cols) cells.push(""); // short rows still need every column
      const isHead = r.inHead || i === 0;
      const next = rendered[i + 1];
      const rule = isHead && !(next && next.inHead) && i < rendered.length - 1 ? "    \\midrule\n" : "";
      return `    ${cells.join(" & ")} \\\\\n${rule}`;
    }).join("");
    const tabular = `  \\begin{tabular}{${spec}}\n    \\toprule\n${lines}    \\bottomrule\n  \\end{tabular}\n`;
    // A float cannot sit inside a cell: a nested table is a bare tabular.
    if (ctx.inCell) return `\\begin{tabular}[t]{${spec}}\n    \\toprule\n${lines}    \\bottomrule\n  \\end{tabular}`;
    return (
      `\n\\begin{table}[htbp]\n  \\centering\n` +
      `  \\caption{Table ${n}}\n  \\label{tab:${n}}\n` +
      tabular +
      `\\end{table}\n`
    );
  }

  function walk(node: Node, ctx: Ctx): string {
    if (node.nodeType === TEXT) return swapEquation(esc(node.textContent ?? ""), ctx);
    if (node.nodeType !== ELEMENT) return "";
    const el = node as Element;
    const tag = name(el);
    const kids = () => kidsOf(el, ctx);

    switch (tag) {
      case "h1": return heading(el, "section", ctx);
      case "h2": return heading(el, "subsection", ctx);
      case "h3": return heading(el, "subsubsection", ctx);
      case "h4": case "h5": case "h6": return heading(el, "paragraph", ctx);
      case "p": {
        s.paragraphs++;
        const text = trimBreaks(kids());
        return text ? `\n${text}\n` : "";
      }
      case "strong": case "b": { const k = kids(); return k.trim() ? `\\textbf{${k}}` : k; }
      case "em": case "i": { const k = kids(); return k.trim() ? `\\emph{${k}}` : k; }
      case "u": { const k = kids(); return k.trim() ? `\\underline{${k}}` : k; }
      case "s": case "del": case "strike": { const k = kids(); return k.trim() ? `\\sout{${k}}` : k; }
      case "sup": {
        const ref = descendants(el, (d) => name(d) === "a" && /^#(foot|end)note-\d/.test(d.getAttribute("href") ?? ""))[0];
        const note = ref && notes.get(ref.getAttribute("href")!.slice(1));
        if (note) {
          if (ctx.noNotes) return "";
          s.footnotes++;
          return `\\footnote{${trimBreaks(kidsOf(note, { ...base }))}}`;
        }
        return `\\textsuperscript{${kids()}}`;
      }
      case "sub": return `\\textsubscript{${kids()}}`;
      case "code": return `\\texttt{${kids()}}`;
      case "pre": return `\n\\begin{verbatim}\n${(el.textContent ?? "").replace(/[^\x09\x0a\x20-\x7e]/g, "?")}\n\\end{verbatim}\n`;
      case "br":
        if (ctx.inHeading) return " ";
        return ctx.inCell ? "\\newline\n" : "\\\\\n";
      case "hr": return "\n\\noindent\\rule{\\linewidth}{0.4pt}\n";
      case "ul": case "ol": {
        const items = kids();
        if (!items.includes("\\item")) return items; // an empty list does not compile
        s.lists++;
        const env = tag === "ul" ? "itemize" : "enumerate";
        return `\n\\begin{${env}}\n${items}\\end{${env}}\n`;
      }
      case "li": return `  \\item ${trimBreaks(kids())}\n`;
      case "blockquote": return `\n\\begin{quote}\n${trimBreaks(kids())}\n\\end{quote}\n`;
      case "a": {
        s.links++;
        const href = el.getAttribute("href") ?? "";
        if (!href || href.startsWith("#")) return kids(); // internal anchors and backlinks
        return `\\href{${escUrl(href)}}{${kids()}}`;
      }
      case "img": {
        s.images++;
        s.unresolvedImages++;
        imgCounter++;
        if (ctx.inCell || ctx.inHeading) return `\\includegraphics[width=\\linewidth]{figure-${imgCounter}}`;
        const alt = el.getAttribute("alt") ?? "";
        return (
          `\n\\begin{figure}[htbp]\n` +
          `  \\centering\n` +
          `  \\includegraphics[width=0.8\\textwidth]{figure-${imgCounter}}\n` +
          `  \\caption{${esc(alt || `Figure ${imgCounter}`)}}\n` +
          `  \\label{fig:${imgCounter}}\n` +
          `\\end{figure}\n`
        );
      }
      case "table": return table(el, ctx);
      default: return kids();
    }
  }

  const doc = (opts.parseHtml ?? ((h: string) => new DOMParser().parseFromString(h, "text/html")))(html);
  const root = doc.getElementsByTagName("body")[0] ?? doc.documentElement;
  descendants(root, (d) => name(d) === "li" && /^(foot|end)note-\d/.test(d.getAttribute("id") ?? "")).forEach((li) => {
    descendants(li, (a) => name(a) === "a" && /^#(foot|end)note-ref-/.test(a.getAttribute("href") ?? ""))
      .forEach((a) => a.parentNode?.removeChild(a));
    notes.set(li.getAttribute("id")!, li);
    const list = li.parentNode;
    list?.removeChild(li);
    if (list && !descendants(list, (d) => name(d) === "li").length) list.parentNode?.removeChild(list);
  });
  const body = kidsOf(root, base).replace(/\n{3,}/g, "\n\n");

  const packages = [
    "\\usepackage[utf8]{inputenc}",
    "\\usepackage[T1]{fontenc}",
    "\\usepackage{amsmath,amssymb}",
    "\\usepackage{graphicx}",
    "\\usepackage{booktabs}",
    // normalem: keep \emph as italics (plain ulem would underline it).
    ...(body.includes("\\sout") ? ["\\usepackage[normalem]{ulem}"] : []),
    // hyperref last: it patches the commands of the packages loaded before it.
    "\\usepackage{hyperref}",
  ];

  const latex = [
    "\\documentclass[12pt,a4paper]{article}",
    ...packages,
    "",
    "\\begin{document}",
    "",
    body.trim(),
    "",
    "\\end{document}",
    "",
  ].join("\n");

  return { latex, stats: s, unsupported: [...unsupported] };
}

/** The document body of a converted file (between \begin{document} and \end{document}). */
export function latexBody(latex: string): string {
  const m = latex.match(/\\begin\{document\}\n([\s\S]*?)\n\\end\{document\}/);
  return (m ? m[1] : latex).trim();
}

export interface DocxResult extends HtmlToLatexResult {
  equations: number;
  warnings: string[];
}

interface ZipLike {
  file(path: string): { async(type: "text"): Promise<string> } | null;
  file(path: string, data: string): unknown;
  generateAsync(o: { type: "arraybuffer" }): Promise<ArrayBuffer>;
}

/**
 * Full .docx conversion. The caller passes JSZip and a mammoth call, so the
 * browser can load them lazily and tests can run them in Node.
 */
export async function docxToLatex(
  data: ArrayBuffer,
  deps: {
    loadZip: (data: ArrayBuffer) => Promise<ZipLike>;
    toHtml: (data: ArrayBuffer) => Promise<{ value: string; messages: { type: string; message: string }[] }>;
    dom?: DomImpl;
    parseHtml?: (html: string) => Document;
  },
): Promise<DocxResult> {
  const unsupportedMath = new Set<string>();
  let equations: Equation[] = [];
  let buffer = data;
  try {
    const zip = await deps.loadZip(data);
    const xml = await zip.file("word/document.xml")?.async("text");
    if (xml) {
      const res = inlineOmmlEquations(xml, deps.dom, unsupportedMath);
      if (res.equations.length) {
        equations = res.equations;
        zip.file("word/document.xml", res.xml);
        buffer = await zip.generateAsync({ type: "arraybuffer" });
      }
    }
  } catch { /* unreadable zip or XML: convert without equations */ }

  const { value: html, messages } = await deps.toHtml(buffer);
  const res = htmlToLatex(html, { equations, parseHtml: deps.parseHtml });
  const unsupported = [...new Set([...res.unsupported, ...unsupportedMath])];
  const warnings = messages.filter((m) => m.type === "warning" || m.type === "error").map((m) => m.message).slice(0, 8);
  if (unsupported.length) {
    warnings.unshift(
      `pdfLaTeX cannot typeset ${unsupported.map((c) => `"${c}"`).join(", ")}: replaced with "?". ` +
      "Fix them by hand, or compile with XeLaTeX or LuaLaTeX and keep the original characters.",
    );
  }
  return { ...res, unsupported, equations: equations.length, warnings };
}

// ── Sample shown on the Word to LaTeX page ───────────────────────────────
// The HTML mammoth produces for a short Word paragraph, and the equation
// LaTeX the OMML step produces for it. lib/__tests__/word-latex.test.ts
// checks that WORD_SAMPLE_LATEX is exactly what the converter outputs.
export const WORD_SAMPLE_HTML =
  '<h1>Results<sup><a href="#footnote-1" id="footnote-ref-1">[1]</a></sup></h1>' +
  "<p>The loss falls <strong>below 0.1</strong> after 40 epochs, with LTXCIEQ0Z for every run.</p>" +
  '<ol><li id="footnote-1"><p>Measured on the validation set. <a href="#footnote-ref-1">\u2191</a></p></li></ol>';
export const WORD_SAMPLE_OMML =
  "<m:oMath><m:sSup><m:e><m:r><m:t>σ</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup>" +
  "<m:r><m:t>≤</m:t></m:r><m:f><m:num><m:r><m:t>1</m:t></m:r></m:num><m:den><m:r><m:t>n</m:t></m:r></m:den></m:f></m:oMath>";
export const WORD_SAMPLE_LATEX =
  "\\section[Results]{Results\\footnote{Measured on the validation set.}}\n\n" +
  "The loss falls \\textbf{below 0.1} after 40 epochs, with $\\sigma^{2}\\leq \\frac{1}{n}$ for every run.";
