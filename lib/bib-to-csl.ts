/**
 * lib/bib-to-csl.ts: BibTeX entries (parsed by lib/bibtex.ts) to CSL-JSON
 * items, the input of citeproc-js. Pure functions, no I/O.
 *
 * Text fields go through latexToText(): accents and special letters become
 * Unicode, `--` an en dash, \emph{} italics, and braced words in a title are
 * protected from case changes (`<span class="nocase">`, which citeproc honours).
 */
import { parseBibTeX, splitAuthors, splitNameParts, type BibEntry } from "./bibtex";
import { normalizeDoi } from "./bib-escape";
import { styleById, type StyleId } from "./csl-styles";

// ── CSL-JSON types ───────────────────────────────────────────────────────────

export interface CslName {
  family?: string;
  given?: string;
  "non-dropping-particle"?: string;
  suffix?: string;
  literal?: string;
}

export interface CslDate {
  "date-parts"?: number[][];
  season?: number;
  literal?: string;
}

export interface CslItem {
  id: string;
  type: string;
  title?: string;
  author?: CslName[];
  editor?: CslName[];
  translator?: CslName[];
  issued?: CslDate;
  accessed?: CslDate;
  "container-title"?: string;
  "collection-title"?: string;
  "collection-number"?: string;
  "event-title"?: string;
  "event-place"?: string;
  volume?: string;
  issue?: string;
  number?: string;
  "chapter-number"?: string;
  page?: string;
  publisher?: string;
  "publisher-place"?: string;
  edition?: string | number;
  genre?: string;
  status?: string;
  DOI?: string;
  URL?: string;
  ISBN?: string;
  ISSN?: string;
}

export interface MapWarning { key: string; message: string }

export interface MapOptions {
  style: StyleId;
  /** Convert titles to sentence case with the BibTeX rule (braced text kept). */
  sentenceCase?: boolean;
}

// ── LaTeX to text ────────────────────────────────────────────────────────────

const ACCENTS: Record<string, string> = {
  "'": "́", "`": "̀", "^": "̂", '"': "̈", "~": "̃",
  "=": "̄", ".": "̇", u: "̆", v: "̌", H: "̋",
  c: "̧", k: "̨", r: "̊", d: "̣", b: "̱",
};
const LETTER_ACCENTS = new Set(["u", "v", "H", "c", "k", "r", "d", "b"]);

const LETTERS: Record<string, string> = {
  ss: "ß", SS: "SS", ae: "æ", AE: "Æ", oe: "œ", OE: "Œ", aa: "å", AA: "Å",
  o: "ø", O: "Ø", l: "ł", L: "Ł", i: "ı", j: "ȷ", dh: "ð", DH: "Ð",
  th: "þ", TH: "Þ", dj: "đ", DJ: "Đ", ng: "ŋ", NG: "Ŋ",
};

const SYMBOLS: Record<string, string> = {
  ldots: "…", dots: "…", textellipsis: "…", textendash: "–", textemdash: "\u2014",
  S: "§", P: "¶", textsection: "§", textparagraph: "¶", copyright: "©", textcopyright: "©",
  textregistered: "®", texttrademark: "™", pounds: "£", textsterling: "£", euro: "€",
  texteuro: "€", textdegree: "°", textquoteleft: "‘", textquoteright: "’",
  textquotedblleft: "“", textquotedblright: "”", guillemotleft: "«", guillemotright: "»",
  textless: "<", textgreater: ">", textbackslash: "\\", textasciitilde: "~",
  textasciicircum: "^", textunderscore: "_", textbar: "|", slash: "/", textbullet: "•",
  textperiodcentered: "·", dag: "†", ddag: "‡", textdagger: "†", textdaggerdbl: "‡",
  LaTeX: "LaTeX", TeX: "TeX", BibTeX: "BibTeX", LaTeXe: "LaTeX2e", XeTeX: "XeTeX",
  textordfeminine: "ª", textordmasculine: "º", textexclamdown: "¡", textquestiondown: "¿",
};

/** `\X` where X is not a letter. */
const CONTROL_SYMBOLS: Record<string, string> = {
  "&": "&", "%": "%", "$": "$", "#": "#", "_": "_", "{": "{", "}": "}",
  " ": " ", ",": " ", ";": " ", ":": " ", "!": "", "-": "", "/": "", "@": "", "\\": " ",
};

const MATH: Record<string, string> = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", varepsilon: "ε", zeta: "ζ",
  eta: "η", theta: "θ", vartheta: "ϑ", iota: "ι", kappa: "κ", lambda: "λ", mu: "μ", nu: "ν",
  xi: "ξ", pi: "π", rho: "ρ", sigma: "σ", tau: "τ", upsilon: "υ", phi: "ϕ", varphi: "φ",
  chi: "χ", psi: "ψ", omega: "ω", Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Xi: "Ξ",
  Pi: "Π", Sigma: "Σ", Upsilon: "Υ", Phi: "Φ", Psi: "Ψ", Omega: "Ω",
  times: "×", pm: "±", mp: "∓", cdot: "·", leq: "≤", le: "≤", geq: "≥", ge: "≥", neq: "≠",
  ne: "≠", approx: "≈", sim: "∼", infty: "∞", to: "→", rightarrow: "→", leftarrow: "←",
  partial: "∂", nabla: "∇", sum: "∑", prod: "∏", int: "∫", in: "∈", ell: "ℓ", circ: "∘",
  ast: "∗", star: "⋆", prime: "′", sqrt: "√", log: "log", ln: "ln", exp: "exp", sin: "sin",
  cos: "cos", max: "max", min: "min", lim: "lim",
};

type Wrap = "i" | "b" | "sc" | "sup" | "sub" | "";
const WRAPPERS: Record<string, Wrap> = {
  textit: "i", emph: "i", textsl: "i", mkbibemph: "i", mkbibitalic: "i",
  textbf: "b", mkbibbold: "b", textsc: "sc", textsuperscript: "sup", mkbibsuperscript: "sup",
  textsubscript: "sub",
  textrm: "", textup: "", textnormal: "", textsf: "", texttt: "", textmd: "", mbox: "",
  hbox: "", text: "", url: "", nolinkurl: "", path: "", NoCaseChange: "", ensuremath: "",
};
const SWITCHES: Record<string, Wrap> = {
  em: "i", it: "i", itshape: "i", sl: "i", slshape: "i", bf: "b", bfseries: "b",
  sc: "sc", scshape: "sc", rm: "", upshape: "", normalfont: "", rmfamily: "", sffamily: "",
  ttfamily: "", mdseries: "", tt: "", sf: "", small: "", footnotesize: "", large: "",
  Large: "", normalsize: "", relax: "", protect: "",
};

const OPEN: Record<Exclude<Wrap, "">, string> = {
  i: "<i>", b: "<b>", sc: '<span style="font-variant:small-caps;">', sup: "<sup>", sub: "<sub>",
};
const CLOSE: Record<Exclude<Wrap, "">, string> = {
  i: "</i>", b: "</b>", sc: "</span>", sup: "</sup>", sub: "</sub>",
};

export interface TextOptions {
  /** Emit citeproc's micro-HTML (<i>, <b>, nocase spans). Off for names and plain fields. */
  markup?: boolean;
  /** Braced groups at the top level are protected from case changes (titles). */
  protectCase?: boolean;
}

export interface TextResult {
  text: string;
  /** Commands the converter does not know; their argument (if any) is kept. */
  unknown: string[];
}

/** Index of the `}` closing the `{` at `i` (or the end of the string). */
function closeBrace(s: string, i: number): number {
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === "\\") { j++; continue; }
    if (s[j] === "{") depth++;
    else if (s[j] === "}" && --depth === 0) return j;
  }
  return s.length;
}

/** Apply a combining accent to the first letter of `base`. */
function accent(mark: string, base: string): string {
  const b = base.replace(/^ı/, "i").replace(/^ȷ/, "j");
  if (!b) return "";
  const first = Array.from(b)[0];
  return (first + ACCENTS[mark]).normalize("NFC") + b.slice(first.length);
}

function wrap(kind: Wrap, inner: string, markup: boolean): string {
  if (!kind || !markup || !inner) return inner;
  return OPEN[kind] + inner + CLOSE[kind];
}

function mathToText(src: string, unknown: Set<string>, markup: boolean): string {
  let out = "";
  let i = 0;
  const arg = (): string => {
    while (src[i] === " ") i++;
    if (src[i] === "{") {
      const end = closeBrace(src, i);
      const inner = src.slice(i + 1, end);
      i = end + 1;
      return mathToText(inner, unknown, markup);
    }
    if (src[i] === "\\") {
      const m = src.slice(i).match(/^\\([a-zA-Z]+|.)/);
      if (m) { i += m[0].length; return MATH[m[1]] ?? m[1]; }
    }
    return src[i++] ?? "";
  };
  while (i < src.length) {
    const c = src[i];
    if (c === "\\") {
      const m = src.slice(i).match(/^\\([a-zA-Z]+|.)/);
      if (!m) { i++; continue; }
      i += m[0].length;
      const name = m[1];
      if (name in MATH) out += MATH[name];
      else if (name in CONTROL_SYMBOLS) out += CONTROL_SYMBOLS[name];
      else if (/^(?:mathrm|mathit|mathbf|mathsf|mathtt|mathcal|mathbb|text|textrm|operatorname|boldsymbol|mbox)$/.test(name)) out += arg();
      else if (name === "frac") { const a = arg(); const b = arg(); out += `${a}/${b}`; }
      else { unknown.add(`\\${name}`); }
      continue;
    }
    if (c === "^" || c === "_") { i++; out += wrap(c === "^" ? "sup" : "sub", arg(), markup); continue; }
    if (c === "{" || c === "}") { i++; continue; }
    out += c;
    i++;
  }
  return out;
}

/**
 * Convert a BibTeX field value to text: Unicode accents, dashes, quotes,
 * italics as <i>, and top-level braces as nocase spans when `protectCase`.
 */
export function latexToText(src: string, opts: TextOptions = {}): TextResult {
  const unknown = new Set<string>();
  const markup = opts.markup ?? false;

  function convert(s: string, top: boolean): string {
    let out = "";
    let i = 0;
    // Read one argument: a braced group, a control sequence, or one character.
    const readArg = (skipSpace: boolean): string => {
      if (skipSpace) while (s[i] === " ") i++;
      if (s[i] === "{") {
        const end = closeBrace(s, i);
        const inner = s.slice(i + 1, end);
        i = end + 1;
        return inner;
      }
      if (s[i] === "\\") {
        const m = s.slice(i).match(/^\\([a-zA-Z]+|.)/);
        if (m) { i += m[0].length; return m[0]; }
      }
      return s[i] === undefined ? "" : s[i++];
    };
    while (i < s.length) {
      const c = s[i];
      if (c === "\\") {
        const m = s.slice(i).match(/^\\([a-zA-Z]+|[^a-zA-Z])/);
        if (!m) { i++; continue; }
        const name = m[1];
        i += m[0].length;
        const isWord = /^[a-zA-Z]/.test(name);
        if (name in ACCENTS && (!isWord || LETTER_ACCENTS.has(name))) {
          // \'e  \'{e}  \"{\i}  \c{c}  \v s
          if (isWord && s[i] !== "{" && s[i] !== " ") { unknown.add(`\\${name}`); continue; }
          out += accent(name, convert(readArg(isWord), false));
          continue;
        }
        if (isWord) while (s[i] === " " || s[i] === "\t" || s[i] === "\n") i++;
        if (!isWord) { out += CONTROL_SYMBOLS[name] ?? name; continue; }
        if (name in LETTERS) { if (s.startsWith("{}", i)) i += 2; out += LETTERS[name]; continue; }
        if (name in SYMBOLS) { if (s.startsWith("{}", i)) i += 2; out += SYMBOLS[name]; continue; }
        if (name in WRAPPERS) {
          const raw = readArg(false);
          const inner = name === "url" || name === "nolinkurl" || name === "path" ? raw : convert(raw, false);
          out += wrap(WRAPPERS[name], inner, markup);
          continue;
        }
        if (name === "href") { readArg(false); out += convert(readArg(true), false); continue; }
        if (name === "enquote" || name === "mkbibquote") { out += `“${convert(readArg(false), false)}”`; continue; }
        if (name === "MakeUppercase" || name === "uppercase") { out += convert(readArg(false), false).toUpperCase(); continue; }
        if (name === "MakeLowercase" || name === "lowercase") { out += convert(readArg(false), false).toLowerCase(); continue; }
        if (name in SWITCHES) {
          // A switch applies to the rest of the current group: {\em text}.
          return out + wrap(SWITCHES[name], convert(s.slice(i), false), markup);
        }
        // Unknown command: keep its argument, if any.
        unknown.add(`\\${name}`);
        if (s[i] === "{") out += convert(readArg(false), false);
        continue;
      }
      if (c === "{") {
        const end = closeBrace(s, i);
        const inner = s.slice(i + 1, end);
        i = end + 1;
        // `{\'e}` and `{\em x}` are "special characters": no case protection.
        const text = convert(inner, false);
        const protect = top && opts.protectCase && markup && !inner.startsWith("\\") && /\p{L}/u.test(text);
        out += protect ? `<span class="nocase">${text}</span>` : text;
        continue;
      }
      if (c === "}") { i++; continue; }
      if (c === "$") {
        let end = i + 1;
        while (end < s.length && s[end] !== "$") { if (s[end] === "\\") end++; end++; }
        const math = mathToText(s.slice(i + 1, end), unknown, markup);
        i = end + 1;
        out += top && opts.protectCase && markup ? `<span class="nocase">${math}</span>` : math;
        continue;
      }
      if (c === "-" && s.startsWith("---", i)) { out += "\u2014"; i += 3; continue; }
      if (c === "-" && s.startsWith("--", i)) { out += "–"; i += 2; continue; }
      if (c === "`" && s[i + 1] === "`") { out += "“"; i += 2; continue; }
      if (c === "'" && s[i + 1] === "'") { out += "”"; i += 2; continue; }
      if (c === "`") { out += "‘"; i++; continue; }
      if (c === "~") { out += " "; i++; continue; }
      out += c;
      i++;
    }
    return out;
  }

  const text = convert(src, true).replace(/\s+/g, " ").trim();
  return { text, unknown: [...unknown] };
}

// ── Sentence case (BibTeX rule) ──────────────────────────────────────────────

/**
 * Lowercase a LaTeX title outside braces, BibTeX-style ("t" in change.case$),
 * for styles that print titles in sentence case (APA). The first word and the
 * first word after a colon, question mark or exclamation mark start with a
 * capital. Braced text, math, command names, and words that look like
 * acronyms or brand names (DNA, COVID-19, iPhone, LaTeX) are left alone.
 */
export function sentenceCase(title: string): string {
  // Split at depth-0 whitespace, keeping the separators.
  const parts: string[] = [];
  let depth = 0;
  let cur = "";
  for (let i = 0; i < title.length; i++) {
    const c = title[i];
    if (c === "\\" && i + 1 < title.length) { cur += c + title[++i]; continue; }
    if (c === "{") depth++;
    else if (c === "}") depth = Math.max(0, depth - 1);
    if (depth === 0 && /\s/.test(c)) {
      if (cur) parts.push(cur);
      parts.push(c);
      cur = "";
    } else cur += c;
  }
  if (cur) parts.push(cur);

  let capitalNext = true;
  return parts.map((w) => {
    if (/^\s$/.test(w)) return w;
    const startCap = capitalNext;
    capitalNext = /[:?!]["'”’)]*$/.test(w);
    // Letters at depth 0, outside math and command names. A hyphenated
    // compound is judged part by part: "Domain-Specific" is lowercased,
    // "COVID-19" and "Non-DNA" are kept.
    const plain = depth0Letters(w);
    const keep = plain.split(/[-–\u2014/]/).some((seg) => {
      const caps = (seg.match(/\p{Lu}/gu) ?? []).length;
      return caps >= 2 ||
        (caps >= 1 && /\p{N}/u.test(seg)) ||
        /^\P{L}*\p{L}+\p{Lu}/u.test(seg); // capital after the first letter: iPhone, LaTeX
    }) || /^\P{L}*I(?:['’]\p{L}+)?\P{L}*$/u.test(plain); // the pronoun I
    if (keep) return w;
    return recase(w, startCap);
  }).join("");
}

/** The letters of a word that a case change may touch. */
function depth0Letters(w: string): string {
  let out = "";
  let depth = 0;
  let math = false;
  for (let i = 0; i < w.length; i++) {
    const c = w[i];
    if (c === "\\") { const m = w.slice(i).match(/^\\([a-zA-Z]+|.)/); i += (m?.[0].length ?? 1) - 1; continue; }
    if (c === "$") { math = !math; continue; }
    if (c === "{") { depth++; continue; }
    if (c === "}") { depth = Math.max(0, depth - 1); continue; }
    if (depth === 0 && !math) out += c;
  }
  return out;
}

/** Lowercase depth-0 letters; the first letter becomes a capital when `cap`. */
function recase(w: string, cap: boolean): string {
  let out = "";
  let depth = 0;
  let math = false;
  let first = true;
  for (let i = 0; i < w.length; i++) {
    const c = w[i];
    if (c === "\\") {
      const m = w.slice(i).match(/^\\([a-zA-Z]+|.)/);
      const cmd = m?.[0] ?? c;
      out += cmd;
      i += cmd.length - 1;
      // An accent command's letter (\'E) is the word's letter.
      if (m && m[1] in ACCENTS && i + 1 < w.length && /\p{L}/u.test(w[i + 1]) && depth === 0 && !math) {
        const l = w[++i];
        out += first && cap ? l.toUpperCase() : l.toLowerCase();
        first = false;
      }
      continue;
    }
    if (c === "$") { math = !math; out += c; continue; }
    if (c === "{") {
      depth++;
      // A braced special character at the start ({\'E}cole) counts as the first letter.
      if (depth === 1 && w[i + 1] === "\\") first = false;
      out += c;
      continue;
    }
    if (c === "}") { depth = Math.max(0, depth - 1); out += c; continue; }
    if (depth > 0 || math || !/\p{L}/u.test(c)) { out += c; continue; }
    out += first && cap ? c.toUpperCase() : c.toLowerCase();
    first = false;
  }
  return out;
}

// ── Names ────────────────────────────────────────────────────────────────────

const plain = (s: string) => latexToText(s).text;

/** One BibTeX name to a CSL name. */
export function bibNameToCsl(raw: string): CslName {
  const p = splitNameParts(raw);
  if (p.literal !== undefined) return { literal: plain(p.literal) };
  const name: CslName = {};
  const family = plain(p.last);
  if (family) name.family = family;
  const given = plain(p.first);
  if (given) name.given = given;
  const von = plain(p.von);
  if (von) name["non-dropping-particle"] = von;
  const jr = plain(p.jr);
  if (jr) name.suffix = jr;
  if (!name.family && name.given) return { literal: name.given };
  return name;
}

/** An author or editor list. "and others" becomes CSL's et al. marker (dropped). */
export function parseNames(raw: string): CslName[] {
  return splitAuthors(raw)
    .map((n) => n.trim())
    .filter((n) => n && n.toLowerCase() !== "others")
    .map(bibNameToCsl);
}

// ── Dates ────────────────────────────────────────────────────────────────────

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const SEASONS: Record<string, number> = { spring: 1, summer: 2, autumn: 3, fall: 3, winter: 4 };

function monthOf(raw: string): { month?: number; day?: number; season?: number } {
  const s = raw.toLowerCase().replace(/[{}"#~]/g, " ").trim();
  if (!s) return {};
  const season = Object.keys(SEASONS).find((k) => s.startsWith(k));
  if (season) return { season: SEASONS[season] };
  const num = s.match(/^(\d{1,2})\b/);
  let month: number | undefined;
  if (num) month = Number(num[1]);
  else {
    const idx = MONTHS.indexOf(s.slice(0, 3));
    if (idx >= 0) month = idx + 1;
  }
  if (!month || month < 1 || month > 12) return {};
  // `oct # "~31"` or "October 31": the day, when given.
  const day = s.replace(/^\d{1,2}\b/, "").match(/\b(\d{1,2})\b/);
  return day ? { month, day: Number(day[1]) } : { month };
}

/** `2019`, `2019-10`, `2019-10-31` (biblatex date); ranges keep their start. */
function isoDate(raw: string): number[] | null {
  const m = raw.trim().match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?/);
  if (!m) return null;
  return [Number(m[1]), ...(m[2] ? [Number(m[2])] : []), ...(m[3] ? [Number(m[3])] : [])];
}

function issuedOf(f: Record<string, string>): { date?: CslDate; status?: string; problem?: string } {
  if (f.date) {
    const parts = isoDate(f.date);
    if (parts) return { date: { "date-parts": [parts] } };
  }
  const year = plain(f.year ?? "").trim();
  if (!year) return {};
  if (/^(in press|forthcoming|submitted|in preparation)$/i.test(year)) return { status: year.toLowerCase() };
  if (/^n\.\s?d\.?$/i.test(year)) return {};
  const y = year.match(/^(\d{4})$/) ?? year.match(/\b(\d{4})\b/);
  if (!y) return { date: { literal: year }, problem: `year "${year}" is not a number` };
  const parts = [Number(y[1])];
  const { month, day, season } = monthOf(f.month ?? "");
  const extraDay = f.day && /^\d{1,2}$/.test(f.day.trim()) ? Number(f.day) : undefined;
  if (month) parts.push(month);
  if (month && (day ?? extraDay)) parts.push((day ?? extraDay)!);
  const date: CslDate = { "date-parts": [parts] };
  if (season) date.season = season;
  return { date, problem: y[0] !== year ? `year "${year}" read as ${y[1]}` : undefined };
}

// ── Entry types ──────────────────────────────────────────────────────────────

const TYPE_MAP: Record<string, string> = {
  article: "article-journal",
  book: "book", mvbook: "book", booklet: "pamphlet", manual: "book", proceedings: "book",
  mvproceedings: "book", collection: "book", mvcollection: "book",
  inbook: "chapter", incollection: "chapter", inreference: "entry-encyclopedia",
  inproceedings: "paper-conference", conference: "paper-conference",
  phdthesis: "thesis", mastersthesis: "thesis", thesis: "thesis",
  techreport: "report", report: "report",
  online: "webpage", electronic: "webpage", www: "webpage",
  unpublished: "manuscript", misc: "document", dataset: "dataset", software: "software",
  patent: "patent", periodical: "periodical",
};

export const SUPPORTED_TYPES = Object.keys(TYPE_MAP);

const ORDINALS = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"];

/** "2", "2nd", "Second", "2nd ed." -> 2; anything else is kept as text. */
function editionOf(raw: string): string | number {
  const s = raw.trim().replace(/\.$/, "");
  const n = s.match(/^(\d{1,3})(?:st|nd|rd|th)?(?:\s+(?:ed|edition))?$/i);
  if (n) return Number(n[1]);
  const w = s.match(/^(\p{L}+)(?:\s+(?:ed|edition))?$/iu);
  if (w) {
    const idx = ORDINALS.indexOf(w[1].toLowerCase());
    if (idx >= 0) return idx + 1;
  }
  return s;
}

/** First URL in a field such as `howpublished = {\url{https://...}}`. */
function urlIn(s: string | undefined): string | undefined {
  if (!s) return undefined;
  const m = s.match(/\\url\{([^}]*)\}/) ?? s.match(/https?:\/\/\S+/);
  if (!m) return undefined;
  return (m[1] ?? m[0]).replace(/[}.,;]+$/, "");
}

/**
 * MLA abbreviates academic publishers: "University Press" -> "UP",
 * "University of Chicago Press" -> "U of Chicago P", "Northwestern University"
 * (a thesis institution) -> "Northwestern U", as in the Style Center samples.
 */
export function mlaPublisher(name: string): string {
  if (!/\bUniversity\b/.test(name)) return name;
  if (/\bUniversity Press\b/.test(name)) return name.replace(/\bUniversity Press\b/g, "UP");
  return name.replace(/\bUniversity\b/g, "U").replace(/\bPress\b/g, "P");
}

/** Pages: `--` to an en dash, and a single `-` between two page numbers. */
function pagesOf(raw: string): string {
  return plain(raw)
    .replace(/(\d)\s*-\s*(\p{L}{0,3}\d)/gu, "$1–$2")
    .replace(/\s*–\s*/g, "–");
}

/** The fields a style needs for each CSL type; a missing one is reported. */
const REQUIRED: Record<string, Array<[string, string]>> = {
  "article-journal": [["container-title", "journal"], ["issued", "year"]],
  book: [["publisher", "publisher"], ["issued", "year"]],
  pamphlet: [["issued", "year"]],
  chapter: [["container-title", "booktitle"], ["publisher", "publisher"], ["issued", "year"]],
  "paper-conference": [["container-title", "booktitle"], ["issued", "year"]],
  thesis: [["publisher", "school"], ["issued", "year"]],
  report: [["publisher", "institution"], ["issued", "year"]],
  webpage: [["URL", "url"]],
  manuscript: [["issued", "year"]],
  document: [["issued", "year"]],
  dataset: [["issued", "year"]],
};

/** Map one parsed BibTeX entry to a CSL-JSON item, with its warnings. */
export function entryToCsl(e: BibEntry, opts: MapOptions): { item: CslItem; warnings: string[] } {
  const style = styleById(opts.style);
  const warnings: string[] = [];
  const unknown = new Set<string>();
  const f: Record<string, string> = {};
  for (const [k, v] of Object.entries(e.fields)) {
    // A bare macro (`month = jan`) is kept as written; quotes from `#` joins dropped.
    f[k] = e.bare?.includes(k) ? v.replace(/"/g, "") : v;
  }
  const bibType = e.type.toLowerCase();
  let type = TYPE_MAP[bibType];
  // BibTeX @inbook without booktitle is "pages or a chapter of a book": the book.
  if (bibType === "inbook" && !f.booktitle) type = "book";
  // @misc with a URL is how most .bib files record a web page.
  if (bibType === "misc" && (f.url || urlIn(f.howpublished))) type = "webpage";
  if (!type) {
    type = "document";
    warnings.push(`@${e.type} is not a standard entry type; formatted as a generic document.`);
  }
  const sentence = opts.sentenceCase ?? style.sentenceCase;
  const text = (raw: string | undefined, title = false): string | undefined => {
    if (raw === undefined || !raw.trim()) return undefined;
    const r = latexToText(title && sentence ? sentenceCase(raw) : raw, { markup: true, protectCase: title });
    r.unknown.forEach((u) => unknown.add(u));
    return r.text || undefined;
  };
  const plainText = (raw: string | undefined): string | undefined => {
    if (raw === undefined || !raw.trim()) return undefined;
    const r = latexToText(raw);
    r.unknown.forEach((u) => unknown.add(u));
    return r.text || undefined;
  };

  const item: CslItem = { id: e.key, type };

  // Title (+ biblatex subtitle).
  const titleRaw = f.title && f.subtitle ? `${f.title}: ${f.subtitle}` : f.title;
  const title = text(titleRaw, true);
  if (title) item.title = title;

  // Names.
  if (f.author) item.author = parseNames(f.author);
  if (f.editor) item.editor = parseNames(f.editor);
  if (f.translator) item.translator = parseNames(f.translator);
  if (/\band\s+others\s*$/i.test(f.author ?? "") && item.author) {
    warnings.push("the author list ends with \"and others\": only the named authors are printed.");
  }

  // Dates.
  const issued = issuedOf(f);
  if (issued.date) item.issued = issued.date;
  if (issued.status) item.status = issued.status;
  if (issued.problem) warnings.push(issued.problem + ".");
  if (f.urldate) {
    const parts = isoDate(f.urldate);
    if (parts) item.accessed = { "date-parts": [parts] };
  }

  // Container.
  const journal = f.journal ?? f.journaltitle;
  const booktitle = f.booktitle ?? f.maintitle;
  if (type === "article-journal" || type === "periodical") {
    const j = text(journal);
    if (j) item["container-title"] = j;
  } else if (type === "chapter" || type === "paper-conference" || type === "entry-encyclopedia") {
    const b = text(booktitle, true);
    if (b) item["container-title"] = b;
  } else if (type === "webpage") {
    const site = f.organization ?? f.publisher ?? (urlIn(f.howpublished) ? undefined : f.howpublished) ?? journal;
    const s = text(site);
    if (s) item["container-title"] = s;
  }

  // Series. APA sets a numbered series in front of the volume title of a
  // proceedings book ("Lecture notes in computer science: Vol. 11353.
  // Learning and intelligent optimization"); the other styles print it with
  // CSL's collection variables.
  const series = f.series ? text(f.series, true) : undefined;
  const isMonograph = type !== "article-journal" && type !== "periodical";
  if (series && isMonograph) {
    const isProceedings = bibType === "inproceedings" || bibType === "conference" || bibType === "proceedings";
    if (opts.style === "apa" && isProceedings && f.volume) {
      const vol = plainText(f.volume);
      if (type === "paper-conference" && item["container-title"]) {
        item["container-title"] = `${series}: Vol. ${vol}. ${item["container-title"]}`;
      } else if (item.title) {
        item.title = `${series}: Vol. ${vol}. ${item.title}`;
      }
    } else {
      item["collection-title"] = series;
      if (f.volume) item["collection-number"] = plainText(f.volume);
      else if (f.number && type !== "report") item["collection-number"] = plainText(f.number);
    }
  } else if (f.volume) {
    item.volume = plainText(f.volume);
  }

  // Numbers.
  if (type === "article-journal" || type === "periodical") {
    const issue = plainText(f.number ?? f.issue);
    if (issue) item.issue = issue;
  } else if (f.number && !series) {
    const n = plainText(f.number);
    if (n) item.number = n;
  }
  if (f.chapter) item["chapter-number"] = plainText(f.chapter);
  if (f.pages) item.page = pagesOf(f.pages);
  if (f.edition) item.edition = editionOf(plainText(f.edition) ?? "");

  // Publisher.
  let publisher = f.publisher;
  if (type === "thesis") publisher = f.school ?? f.institution ?? f.publisher;
  else if (type === "report") publisher = f.institution ?? f.publisher;
  else if (bibType === "manual" || bibType === "proceedings") publisher = f.publisher ?? f.organization;
  else if (type === "paper-conference") publisher = f.publisher ?? f.organization;
  // A web page's site name is its container; a publisher only when both are given.
  if (type !== "webpage" || (f.organization && f.publisher)) {
    const p = plainText(publisher);
    if (p) item.publisher = opts.style === "mla" ? mlaPublisher(p) : p;
  }
  const place = plainText(f.address ?? f.location);
  if (place) item["publisher-place"] = place;
  if (f.eventtitle) item["event-title"] = text(f.eventtitle);
  if (f.venue) item["event-place"] = plainText(f.venue);

  // Genre: the `type` field wins, as in BibTeX.
  if (f.type) item.genre = plainText(f.type);
  else if (bibType === "phdthesis") item.genre = style.phdThesis;
  else if (bibType === "mastersthesis") item.genre = style.mastersThesis;
  else if (bibType === "unpublished") item.genre = "Unpublished manuscript";

  // Identifiers.
  if (f.doi) item.DOI = normalizeDoi(f.doi.replace(/\\_/g, "_"));
  const url = f.url ? f.url.replace(/\\([_%&#])/g, "$1").trim() : urlIn(f.howpublished);
  if (url && !(item.DOI && /doi\.org\//i.test(url))) {
    // MLA 9th ed. 5.96: http:// and https:// are usually omitted (DOIs keep https://doi.org/).
    item.URL = opts.style === "mla" ? url.replace(/^https?:\/\//i, "") : url;
  }
  if (f.isbn) item.ISBN = plainText(f.isbn);
  if (f.issn) item.ISSN = plainText(f.issn);


  // Warnings: missing fields this type needs.
  if (!item.title) warnings.push("no title.");
  if (!item.author?.length && !item.editor?.length) {
    warnings.push("no author or editor: the style moves the title to the author position.");
  }
  for (const [csl, bib] of REQUIRED[item.type] ?? []) {
    if (csl === "issued") {
      if (!item.issued && !item.status) {
        warnings.push(opts.style === "mla"
          ? "no year: MLA leaves the date out, add it if the work has one."
          : `no year: ${style.short} prints "n.d." (no date).`);
      }
      continue;
    }
    if (!(csl in item)) warnings.push(`no ${bib} field, which ${style.short} prints for this type.`);
  }
  if (item.type === "chapter" && !item.page && (opts.style === "apa" || opts.style === "mla")) {
    warnings.push(`no pages: ${style.short} gives the page range of a chapter.`);
  }
  if (item.type === "article-journal" && !item.volume && !item.issue) warnings.push("no volume or number.");
  if (unknown.size) {
    warnings.push(`unknown LaTeX command${unknown.size > 1 ? "s" : ""} ${[...unknown].join(", ")}: the argument is kept, the command dropped.`);
  }
  return { item, warnings };
}

/** Parse a .bib source and map every entry; warnings carry the citation key. */
export function bibToCsl(src: string, opts: MapOptions): { items: CslItem[]; warnings: MapWarning[] } {
  const entries = parseBibTeX(src);
  const items: CslItem[] = [];
  const warnings: MapWarning[] = [];
  const seen = new Set<string>();
  for (const e of entries) {
    if (seen.has(e.key)) {
      warnings.push({ key: e.key, message: "duplicate citation key: only the first entry is formatted." });
      continue;
    }
    seen.add(e.key);
    const r = entryToCsl(e, opts);
    items.push(r.item);
    for (const m of r.warnings) warnings.push({ key: e.key, message: m });
  }
  return { items, warnings };
}
