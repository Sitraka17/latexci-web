/**
 * Client-side LaTeX to HTML converter, two-pass renderer.
 *
 * Pre-pass: verbatim material is set aside, comments are dropped, and every
 *   definition in the WHOLE source (preamble included) is collected:
 *   \newcommand, \def, \newenvironment, \DeclareMathOperator, \newtheorem,
 *   \numberwithin. Macros and environments are expanded in the body;
 *   math operators are returned as KaTeX macros.
 *
 * Pass 1 (prescan): walk the body in document order with one set of LaTeX
 *   counters to number sections, equations (row by row in align/gather),
 *   figures, tables, algorithms and theorem-like environments; build the
 *   label map (key -> number + kind) and the citation map.
 *
 * Pass 2 (render): replace block elements with HTML placeholders, run
 *   processInline() on plain text, split paragraphs, restore. \ref, \eqref,
 *   \cref and \cite use the maps from Pass 1.
 */

export interface ParseWarning { env: string; reason: string; }

export interface LatexHtmlResult {
  html: string;
  warnings: ParseWarning[];
  /** KaTeX macros collected from the source (\DeclareMathOperator). */
  macros: Record<string, string>;
}

// Environments that are not rendered specially but whose content is shown
// as-is (no warning, no label).
const TRANSPARENT_ENVS = new Set([
  "document", "titlepage", "subequations", "sloppypar", "landscape", "samepage",
  "singlespace", "onehalfspace", "doublespace", "spacing", "otherlanguage", "small",
  "footnotesize", "scriptsize", "large", "Large", "normalsize", "tabbing", "split",
  "matrix", "pmatrix", "bmatrix", "vmatrix", "array", "cases", "frontmatter",
  "mainmatter", "backmatter", "appendices", "refsection", "adjustbox", "threeparttable",
  "tablenotes", "savenotes", "spacing", "raggedright", "raggedleft", "Center",
]);

// Theorem-like environments rendered even without a \newtheorem declaration
// (unnumbered, as in a class that predefines them).
const BUILTIN_THM: Record<string, string> = {
  theorem: "Theorem", lemma: "Lemma", proposition: "Proposition", corollary: "Corollary",
  definition: "Definition", remark: "Remark", example: "Example", proof: "Proof",
  conjecture: "Conjecture", claim: "Claim", assumption: "Assumption", notation: "Notation",
  exercise: "Exercise", problem: "Problem", solution: "Solution", hypothesis: "Hypothesis",
  observation: "Observation", fact: "Fact",
};

// Placeholder tokens: cannot appear in valid LaTeX
const PH = (n: number) => `\x00B${n}\x00`;

// ── Escaped characters (\% \$ \& \# \_ \{ \}) ─────────────────────────────
// Escapes are swapped for private-use characters BEFORE any rule that reacts
// to the bare character ($ math, % comments, & cell split, {} arguments), then
// restored at the very end: as the plain character in HTML output, or as the
// original "\X" sequence where LaTeX source must survive (math, verbatim).
// Characters inside \url{} / \href{url} are protected the same way but are
// literal in both modes (LaTeX does not treat % # & ~ as special there); the
// same literal slots carry the output of \textbackslash, \~{} and \^{}.
const ESC_CHARS = "%$&#_{}";
const ESC_BASE = 0xe100;     // \X escapes
const LIT_CHARS = "%&#~^\\";
const LIT_BASE = 0xe110;     // literal characters (URL arguments, symbols)
const lit = (c: string) => String.fromCharCode(LIT_BASE + LIT_CHARS.indexOf(c));
const ESC_RANGE = /[\ue100-\ue11f]/g;

function protectEscapes(src: string): string {
  // Strip any stray private-use characters from the input so they cannot be
  // mistaken for our own placeholders.
  src = src.replace(ESC_RANGE, "");
  const urlLit = (s: string) => s.replace(/[%&#~]/g, lit);
  src = src.replace(/\\url\{([^}]*)\}/g, (_, u: string) => `\\url{${urlLit(u)}}`);
  src = src.replace(/\\href\{([^}]*)\}/g, (_, u: string) => `\\href{${urlLit(u)}}`);
  // "\\" (line break) is consumed first so "\\%" stays a break plus a comment.
  return src.replace(/\\\\|\\([%$&#_{}])/g, (m, c: string | undefined) =>
    c ? String.fromCharCode(ESC_BASE + ESC_CHARS.indexOf(c)) : m
  );
}

/** Restore protected characters. "html" gives display text, "raw" gives LaTeX source. */
function restoreEscapes(text: string, mode: "html" | "raw"): string {
  return text.replace(ESC_RANGE, (ch) => {
    const code = ch.charCodeAt(0);
    if (code >= LIT_BASE) {
      const c = LIT_CHARS[code - LIT_BASE] ?? "";
      return mode === "html" && c === "&" ? "&amp;" : c;
    }
    const c = ESC_CHARS[code - ESC_BASE] ?? "";
    if (mode === "raw") return `\\${c}`;
    return c === "&" ? "&amp;" : c;
  });
}

// ── Text-mode accents and special letters ─────────────────────────────────
const ACCENT_MARKS: Record<string, string> = {
  "'": "\u0301", "`": "\u0300", "^": "\u0302", '"': "\u0308", "~": "\u0303",
  "=": "\u0304", ".": "\u0307", u: "\u0306", v: "\u030C", H: "\u030B",
  c: "\u0327", k: "\u0328", r: "\u030A", d: "\u0323", b: "\u0331",
};
const SPECIAL_LETTERS: Record<string, string> = {
  ss: "ß", ae: "æ", AE: "Æ", oe: "œ", OE: "Œ", aa: "å", AA: "Å",
  o: "ø", O: "Ø", l: "ł", L: "Ł", i: "ı", j: "ȷ",
};

function accented(mark: string, base: string): string {
  // Dotless i/j take the accent as plain i/j (NFC has no composed dotless form).
  const b = base === "\\i" ? "i" : base === "\\j" ? "j" : base;
  if (!b) return mark === "~" || mark === "^" ? lit(mark) : mark;
  return (b + ACCENT_MARKS[mark]).normalize("NFC");
}

function renderAccents(text: string): string {
  // Symbol accents: \'e \'{e} \"o \^o \`a \~n \=a \.z  (also \'\i, \'{\i}).
  // "\\" is matched first so a line break followed by ' is left alone.
  text = text.replace(
    /\\\\|\\(['`^"~=.])(?:\{(\\[ij](?![a-zA-Z])|[a-zA-Z]?)\}|(\\[ij](?![a-zA-Z])|[a-zA-Z]))/g,
    (m, mark: string | undefined, braced: string | undefined, bare: string | undefined) =>
      mark ? accented(mark, braced ?? bare ?? "") : m
  );
  // Letter accents need braces: \c{c} \v{s} \u{g} \H{o} \k{a} \r{a} \d{o} \b{o}
  text = text.replace(
    /\\([cvuHkrdb])\{(\\[ij](?![a-zA-Z])|[a-zA-Z])\}/g,
    (_, mark: string, base: string) => accented(mark, base)
  );
  // Special letters: \ss{} \ae \o \l \i ... (a control word eats trailing spaces)
  text = text.replace(
    /\\(ss|ae|AE|oe|OE|aa|AA|o|O|l|L|i|j)(?![a-zA-Z])(?:\{\}|[ \t]+)?/g,
    (_, w: string) => SPECIAL_LETTERS[w]
  );
  return text
    .replace(/\\textbackslash(?![a-zA-Z])(?:\{\})?/g, lit("\\"))
    .replace(/\\textasciitilde(?![a-zA-Z])(?:\{\})?/g, lit("~"))
    .replace(/\\textasciicircum(?![a-zA-Z])(?:\{\})?/g, lit("^"));
}

// ── Balanced argument readers ─────────────────────────────────────────────
// Every command argument is read with these instead of `\{([^}]*)\}`, so a
// caption such as \caption{Effect of $\alpha_{t}$} is not cut at the first }.

const MAX_ARG = 60_000;

/** Index of the `}` matching the `{` at `i`, or -1. */
function matchBrace(s: string, i: number): number {
  if (s[i] !== "{") return -1;
  let d = 0;
  const lim = Math.min(s.length, i + MAX_ARG);
  for (let j = i; j < lim; j++) {
    const c = s[j];
    if (c === "{") d++;
    else if (c === "}") { d--; if (d === 0) return j; }
  }
  return -1;
}

/** Index of the `]` closing the `[` at `i` (braces nest), or -1. */
function matchBracket(s: string, i: number): number {
  if (s[i] !== "[") return -1;
  let d = 0;
  const lim = Math.min(s.length, i + 4000);
  for (let j = i + 1; j < lim; j++) {
    const c = s[j];
    if (c === "{") d++;
    else if (c === "}") d--;
    else if (c === "]" && d <= 0) return j;
    else if (c === "\n" && s[j + 1] === "\n") return -1;
  }
  return -1;
}

/** Skip spaces and at most one newline (a blank line ends an argument list). */
function skipWs(s: string, i: number): number {
  let nl = false;
  while (i < s.length) {
    const c = s[i];
    if (c === " " || c === "\t" || c === "\r") i++;
    else if (c === "\n" && !nl) { nl = true; i++; }
    else break;
  }
  return i;
}

interface CmdMatch {
  start: number; end: number; name: string; star: boolean;
  opt: (string | undefined)[]; req: string[];
}

/** Parse `*`, up to nOpt [..] and exactly nReq {..} arguments after a command name. */
function parseArgs(s: string, start: number, p: number, name: string, nOpt: number, nReq: number): CmdMatch | null {
  let star = false;
  if (s[p] === "*") { star = true; p++; }
  const opt: (string | undefined)[] = [];
  for (let k = 0; k < nOpt; k++) {
    const q = skipWs(s, p);
    if (s[q] === "[") {
      const e = matchBracket(s, q);
      if (e >= 0) { opt.push(s.slice(q + 1, e)); p = e + 1; continue; }
    }
    opt.push(undefined);
  }
  const req: string[] = [];
  for (let k = 0; k < nReq; k++) {
    const q = skipWs(s, p);
    const e = matchBrace(s, q);
    if (e < 0) return null;
    req.push(s.slice(q + 1, e));
    p = e + 1;
  }
  return { start, end: p, name, star, opt, req };
}

/** All occurrences of \name (alternation allowed) with their arguments. */
function scanCmds(s: string, names: string, nOpt: number, nReq: number): CmdMatch[] {
  const re = new RegExp(`\\\\(${names})(?![a-zA-Z])`, "g");
  const out: CmdMatch[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const c = parseArgs(s, m.index, m.index + m[0].length, m[1], nOpt, nReq);
    if (c) { out.push(c); re.lastIndex = c.end; }
  }
  return out;
}

/**
 * Replace \name[opt]{req}... with fn(match). Returns null from fn to leave a
 * match untouched. Runs extra passes so nested calls (\textbf{\textbf{x}})
 * are all converted, outermost first, which keeps the HTML balanced.
 */
function replaceCmd(
  s: string, names: string, nReq: number,
  fn: (m: CmdMatch) => string | null, nOpt = 0,
): string {
  const re = new RegExp(`\\\\(${names})(?![a-zA-Z])`, "g");
  for (let pass = 0; pass < 12; pass++) {
    re.lastIndex = 0;
    let out = "", last = 0, changed = false;
    let m: RegExpExecArray | null;
    while ((m = re.exec(s)) !== null) {
      const c = parseArgs(s, m.index, m.index + m[0].length, m[1], nOpt, nReq);
      if (!c) continue;
      const r = fn(c);
      if (r === null) continue;
      out += s.slice(last, c.start) + r;
      last = c.end;
      re.lastIndex = c.end;
      changed = true;
    }
    if (!changed) return s;
    s = out + s.slice(last);
  }
  return s;
}

/** Split at `sep` occurrences that sit outside braces and nested environments. */
function splitTop(s: string, sep: "\\\\" | "&"): string[] {
  const parts: string[] = [];
  let depth = 0, env = 0, last = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === "\\") {
      if (s.startsWith("\\begin{", i)) { env++; i += 6; continue; }
      if (s.startsWith("\\end{", i)) { env--; i += 4; continue; }
      if (s[i + 1] === "\\") {
        if (sep === "\\\\" && depth === 0 && env <= 0) { parts.push(s.slice(last, i)); last = i + 2; }
        i++;
        continue;
      }
      if (sep === "\\\\" && depth === 0 && env <= 0 && s.startsWith("\\tabularnewline", i)) {
        parts.push(s.slice(last, i)); last = i + 15; i += 14; continue;
      }
      i++; // skip the escaped character
      continue;
    }
    else if (sep === "&" && c === "&" && depth === 0 && env <= 0) { parts.push(s.slice(last, i)); last = i + 1; }
  }
  parts.push(s.slice(last));
  return parts;
}

// ── Definitions (preamble + body) ─────────────────────────────────────────

interface UserMacro { nargs: number; def?: string; body: string; }
interface UserEnv { nargs: number; def?: string; begin: string; end: string; }
interface ThmDef { label: string; counter: string | null; within?: string; }
interface Defs {
  macros: Map<string, UserMacro>;
  envs: Map<string, UserEnv>;
  mathOps: Record<string, string>;
  theorems: Map<string, ThmDef>;
  numberWithin: Map<string, string>;
}

const DEF_RE = /\\(newcommand|renewcommand|providecommand|DeclareRobustCommand|newenvironment|renewenvironment|DeclareMathOperator|newtheorem|def|gdef|numberwithin|counterwithin|theoremstyle|newcolumntype|let)(?![a-zA-Z])(\*?)/g;

/**
 * Collect every definition in `src` into `d` and return `src` with the
 * definitions removed. Called on the preamble and on the body, so a macro,
 * operator or theorem declared before \begin{document} is not lost.
 */
function extractDefs(src: string, d: Defs): string {
  const spans: Array<[number, number]> = [];
  const re = new RegExp(DEF_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const kw = m[1];
    const star = m[2] === "*";
    let i = m.index + m[0].length;
    const readName = (): string | null => {
      i = skipWs(src, i);
      if (src[i] === "{") {
        const e = matchBrace(src, i);
        if (e < 0) return null;
        const n = src.slice(i + 1, e).trim();
        i = e + 1;
        return n;
      }
      if (src[i] === "\\") {
        let j = i + 1;
        while (j < src.length && /[a-zA-Z@]/.test(src[j])) j++;
        if (j === i + 1) j++;
        const n = src.slice(i, j);
        i = j;
        return n;
      }
      return null;
    };
    const readOpt = (): string | undefined => {
      const q = skipWs(src, i);
      if (src[q] !== "[") return undefined;
      const e = matchBracket(src, q);
      if (e < 0) return undefined;
      i = e + 1;
      return src.slice(q + 1, e);
    };
    const readReq = (): string | null => {
      const q = skipWs(src, i);
      const e = matchBrace(src, q);
      if (e < 0) return null;
      i = e + 1;
      return src.slice(q + 1, e);
    };

    let ok = true;
    switch (kw) {
      case "newcommand": case "renewcommand": case "providecommand": case "DeclareRobustCommand": {
        const name = readName();
        const n = readOpt();
        const def = readOpt();
        const body = name ? readReq() : null;
        if (!name || body === null) { ok = false; break; }
        if (/^\\[a-zA-Z@]+$/.test(name) && !(kw === "providecommand" && d.macros.has(name))) {
          d.macros.set(name, { nargs: Math.min(parseInt(n ?? "0", 10) || 0, 9), def, body });
        }
        break;
      }
      case "newenvironment": case "renewenvironment": {
        const name = readReq();
        const n = readOpt();
        const def = readOpt();
        const begin = name !== null ? readReq() : null;
        const end = begin !== null ? readReq() : null;
        if (name === null || begin === null || end === null) { ok = false; break; }
        if (/^[a-zA-Z@*]+$/.test(name.trim())) {
          d.envs.set(name.trim(), { nargs: Math.min(parseInt(n ?? "0", 10) || 0, 9), def, begin, end });
        }
        break;
      }
      case "DeclareMathOperator": {
        const name = readName();
        const body = name ? readReq() : null;
        if (!name || body === null) { ok = false; break; }
        if (/^\\[a-zA-Z]+$/.test(name)) d.mathOps[name] = `\\operatorname${star ? "*" : ""}{${body}}`;
        break;
      }
      case "newtheorem": {
        const name = readReq();
        const shared = name !== null ? readOpt() : undefined;
        const label = name !== null ? readReq() : null;
        if (name === null || label === null) { ok = false; break; }
        const within = shared === undefined ? readOpt() : undefined;
        const env = name.trim();
        d.theorems.set(env, {
          label: label.trim(),
          counter: star ? null : (shared?.trim() || env),
          within: within?.trim(),
        });
        break;
      }
      case "def": case "gdef": {
        i = skipWs(src, i);
        if (src[i] !== "\\") { ok = false; break; }
        let j = i + 1;
        while (j < src.length && /[a-zA-Z@]/.test(src[j])) j++;
        const name = src.slice(i, j);
        const brace = src.indexOf("{", j);
        if (brace < 0 || brace - j > 30) { ok = false; break; }
        const params = src.slice(j, brace);
        if (!/^(?:#\d)*$/.test(params.replace(/\s/g, ""))) { ok = false; break; }
        i = brace;
        const body = readReq();
        if (body === null || name.length < 2) { ok = false; break; }
        d.macros.set(name, { nargs: (params.match(/#/g) || []).length, body });
        break;
      }
      case "numberwithin": case "counterwithin": {
        readOpt();
        const a = readReq();
        const b = a !== null ? readReq() : null;
        if (a === null || b === null) { ok = false; break; }
        d.numberWithin.set(a.trim(), b.trim());
        break;
      }
      case "theoremstyle": if (readReq() === null) ok = false; break;
      case "newcolumntype": {
        if (readName() === null) { ok = false; break; }
        readOpt();
        if (readReq() === null) ok = false;
        break;
      }
      case "let": {
        if (readName() === null) { ok = false; break; }
        i = skipWs(src, i);
        if (src[i] === "=") i++;
        if (readName() === null) ok = false;
        break;
      }
    }
    if (!ok) continue;
    spans.push([m.index, i]);
    re.lastIndex = i;
  }
  let out = "";
  let last = 0;
  for (const [s, e] of spans) { out += src.slice(last, s); last = e; }
  return out + src.slice(last);
}

/**
 * Expand user macros (\newcommand, \def). Longest names first so \cvsect is
 * matched before \cv; a first argument with a default value ([n][default])
 * is optional at the call site. Expansion is bounded (calls can nest, and a
 * chain of doubling macros would otherwise grow ~2^N and freeze the tab).
 */
function expandUserMacros(src: string, macros: Map<string, UserMacro>): string {
  if (macros.size === 0) return src;
  let out = src;
  const MAX_EXPANDED = Math.max(out.length * 12, 200_000);
  const names = [...macros.keys()].sort((a, b) => b.length - a.length);
  for (let pass = 0; pass < 8; pass++) {
    if (out.length > MAX_EXPANDED) break;
    let changed = false;
    for (const name of names) {
      const macro = macros.get(name)!;
      let result = "";
      let idx = 0;
      while (idx < out.length) {
        if (result.length > MAX_EXPANDED) { result += out.slice(idx); break; }
        const at = out.indexOf(name, idx);
        if (at === -1) { result += out.slice(idx); break; }
        // Don't match a prefix of a longer command name (e.g. \cv vs \cvsect),
        // nor the tail of a line break (\\R is "\\" then "R").
        const after = out[at + name.length];
        if ((after && /[a-zA-Z@]/.test(after)) || (at > 0 && out[at - 1] === "\\")) {
          result += out.slice(idx, at + name.length);
          idx = at + name.length;
          continue;
        }
        let p = at + name.length;
        const args: string[] = [];
        let ok = true;
        let k = 0;
        if (macro.def !== undefined && macro.nargs > 0) {
          if (out[p] === "[") {
            const e = matchBracket(out, p);
            if (e < 0) ok = false;
            else { args.push(out.slice(p + 1, e)); p = e + 1; }
          } else {
            args.push(macro.def);
          }
          k = 1;
        }
        for (; ok && k < macro.nargs; k++) {
          while (out[p] === " ") p++;
          const close = matchBrace(out, p);
          if (close < 0) { ok = false; break; }
          args.push(out.slice(p + 1, close));
          p = close + 1;
        }
        if (!ok) { // not enough args present: leave call untouched
          result += out.slice(idx, at + name.length);
          idx = at + name.length;
          continue;
        }
        const expanded = macro.body.replace(/#(\d)/g, (_, dd: string) => args[+dd - 1] ?? "");
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

/** Expand \newenvironment definitions: \begin{x}{a} -> begin code, \end{x} -> end code. */
function expandUserEnvs(src: string, envs: Map<string, UserEnv>): string {
  if (envs.size === 0) return src;
  const MAX = Math.max(src.length * 6, 200_000);
  for (let pass = 0; pass < 4; pass++) {
    let changed = false;
    for (const [name, env] of envs) {
      const open = `\\begin{${name}}`;
      const close = `\\end{${name}}`;
      let idx = 0;
      let result = "";
      while (idx < src.length) {
        const at = src.indexOf(open, idx);
        if (at < 0) { result += src.slice(idx); break; }
        let p = at + open.length;
        const args: string[] = [];
        let k = 0;
        if (env.def !== undefined && env.nargs > 0) {
          if (src[p] === "[") {
            const e = matchBracket(src, p);
            if (e >= 0) { args.push(src.slice(p + 1, e)); p = e + 1; } else args.push(env.def);
          } else args.push(env.def);
          k = 1;
        }
        for (; k < env.nargs; k++) {
          const q = skipWs(src, p);
          const e = matchBrace(src, q);
          if (e < 0) break;
          args.push(src.slice(q + 1, e));
          p = e + 1;
        }
        result += src.slice(idx, at) + env.begin.replace(/#(\d)/g, (_, dd: string) => args[+dd - 1] ?? "");
        idx = p;
        changed = true;
      }
      src = result.split(close).join(env.end);
      if (src.length > MAX) return src;
    }
    if (!changed) break;
  }
  return src;
}

// ── Math environments ─────────────────────────────────────────────────────

const MATH_ENV_NAMES = "equation|align|gather|multline|alignat|flalign|eqnarray";
const MATH_ENVS = new Set(MATH_ENV_NAMES.split("|"));
const SINGLE_ROW_MATH = new Set(["equation", "multline"]);

interface MathInfo {
  rows: string[];                 // cleaned rows (no \label / \tag / \nonumber)
  numbered: boolean[];            // row gets the next equation number
  custom: (string | null)[];      // \tag{...} given by the author
  labels: string[][];             // \label keys per row
  cols: string;                   // alignat column count
}

/** Shared by prescan and render, so both see exactly the same rows. */
function analyzeMath(env: string, star: boolean, content: string): MathInfo {
  let cols = "";
  if (env === "alignat") {
    const m = content.match(/^\s*\{(\d+)\}/);
    if (m) { cols = m[1]; content = content.slice(m[0].length); }
  }
  const raw = SINGLE_ROW_MATH.has(env)
    ? [content]
    : splitTop(content, "\\\\").filter((r) => r.replace(/\\(?:label|tag)\*?\{[^}]*\}|\\(?:nonumber|notag)\b/g, "").trim() || /\\label\{/.test(r));
  if (raw.length === 0) raw.push("");
  const info: MathInfo = { rows: [], numbered: [], custom: [], labels: [], cols: cols || "1" };
  for (let r of raw) {
    const labels = [...r.matchAll(/\\label\{([^}]*)\}/g)].map((m) => m[1].trim());
    const tag = scanCmds(r, "tag", 0, 1)[0];
    const unnumbered = star || /\\(?:nonumber|notag)(?![a-zA-Z])/.test(r);
    r = r.replace(/\\label\{[^}]*\}/g, "").replace(/\\(?:nonumber|notag)(?![a-zA-Z])/g, "");
    if (tag) r = r.slice(0, tag.start) + r.slice(tag.end);
    if (env === "eqnarray") r = r.replace(/&([^&]*)&/, "&$1");
    info.rows.push(r.trim());
    info.numbered.push(!unnumbered && !tag);
    info.custom.push(tag ? tag.req[0].trim() : null);
    info.labels.push(labels);
  }
  return info;
}

// ── LaTeX counters ────────────────────────────────────────────────────────

class Counters {
  vals = new Map<string, number>();
  parent = new Map<string, string>();
  appendixTop: string | null = null;

  step(name: string) {
    this.vals.set(name, (this.vals.get(name) ?? 0) + 1);
    this.resetChildren(name, new Set([name]));
  }
  private resetChildren(name: string, seen: Set<string>) {
    for (const [child, par] of this.parent) {
      if (par === name && !seen.has(child)) {
        seen.add(child);
        this.vals.set(child, 0);
        this.resetChildren(child, seen);
      }
    }
  }
  fmt(name: string, depth = 0): string {
    const v = this.vals.get(name) ?? 0;
    const own = this.appendixTop === name ? alphaLabel(v).toUpperCase() : String(v);
    const p = this.parent.get(name);
    return p && depth < 6 ? `${this.fmt(p, depth + 1)}.${own}` : own;
  }
}

function alphaLabel(n: number): string {
  let s = "";
  while (n > 0) { n--; s = String.fromCharCode(97 + (n % 26)) + s; n = Math.floor(n / 26); }
  return s || "0";
}

function romanLabel(n: number): string {
  if (n <= 0 || n > 3999) return String(n);
  const map: Array<[number, string]> = [[1000, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"], [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]];
  let s = "";
  for (const [v, r] of map) while (n >= v) { s += r; n -= v; }
  return s;
}

// ── Pass 1: prescan ────────────────────────────────────────────────────────

interface LabelInfo { num: string; kind: string; }

interface PrescanResult {
  labels: Map<string, LabelInfo>;
  citeMap: Map<string, number>;
  citeAuthorMap: Map<string, string>;
  bibHtml: string;
  queues: Map<string, Array<string | null>>;
  mathQueue: Array<Array<string | null>>;
  toc: Array<{ level: number; num: string; title: string }>;
}

const FLOAT_QUEUE: Record<string, { queue: string; counter: string; kind: string }> = {
  figure: { queue: "figure", counter: "figure", kind: "Figure" },
  "figure*": { queue: "figure", counter: "figure", kind: "Figure" },
  wrapfigure: { queue: "figure", counter: "figure", kind: "Figure" },
  table: { queue: "table", counter: "table", kind: "Table" },
  "table*": { queue: "table", counter: "table", kind: "Table" },
  longtable: { queue: "longtable", counter: "table", kind: "Table" },
  algorithm: { queue: "algorithm", counter: "algorithm", kind: "Algorithm" },
};

const SEC_LEVEL: Record<string, number> = { chapter: 0, section: 1, subsection: 2, subsubsection: 3 };

function thmInfo(env: string, defs: Defs): ThmDef | null {
  const d = defs.theorems.get(env);
  if (d) return d;
  const b = BUILTIN_THM[env];
  return b ? { label: b, counter: null } : null;
}

function prescanDocument(body: string, defs: Defs, hasChapters: boolean): PrescanResult {
  const labels = new Map<string, LabelInfo>();
  const queues = new Map<string, Array<string | null>>();
  const push = (q: string, v: string | null) => {
    if (!queues.has(q)) queues.set(q, []);
    queues.get(q)!.push(v);
  };
  const mathQueue: Array<Array<string | null>> = [];
  const toc: PrescanResult["toc"] = [];

  const C = new Counters();
  if (hasChapters) for (const n of ["section", "equation", "figure", "table", "algorithm"]) C.parent.set(n, "chapter");
  C.parent.set("subsection", "section");
  C.parent.set("subsubsection", "subsection");
  for (const [env, t] of defs.theorems) if (t.counter === env && t.within) C.parent.set(env, t.within);
  for (const [a, b] of defs.numberWithin) C.parent.set(a, b);

  let current: LabelInfo | null = null;
  const stack: Array<LabelInfo | null> = [];

  const TOK = /\\(chapter|section|subsection|subsubsection)(?![a-zA-Z])|\\begin\{([^}]+)\}|\\end\{([^}]+)\}|\\label\{([^}]*)\}|\\appendix(?![a-zA-Z])/g;
  let m: RegExpExecArray | null;
  while ((m = TOK.exec(body)) !== null) {
    if (m[1]) {
      const c = parseArgs(body, m.index, m.index + m[0].length, m[1], 1, 1);
      if (!c) continue;
      TOK.lastIndex = c.end;
      if (c.star) continue;
      C.step(m[1]);
      const num = C.fmt(m[1]);
      push("sec", num);
      toc.push({ level: SEC_LEVEL[m[1]], num, title: c.opt[0] ?? c.req[0] });
      const isTop = C.appendixTop === m[1];
      current = { num, kind: isTop ? "Appendix" : m[1] === "chapter" ? "Chapter" : "Section" };
    } else if (m[2] !== undefined) {
      const full = m[2];
      const star = full.endsWith("*");
      const base = star ? full.slice(0, -1) : full;
      const after = m.index + m[0].length;
      if (MATH_ENVS.has(base)) {
        const endTag = `\\end{${full}}`;
        const e = body.indexOf(endTag, after);
        if (e < 0) continue;
        const info = analyzeMath(base, star, body.slice(after, e));
        const tags = info.rows.map((_, r) => {
          if (info.custom[r] !== null) return info.custom[r];
          if (!info.numbered[r]) return null;
          C.step("equation");
          return C.fmt("equation");
        });
        mathQueue.push(tags);
        info.labels.forEach((keys, r) => {
          const t = tags[r];
          if (t) for (const k of keys) labels.set(k, { num: t, kind: "equation" });
        });
        TOK.lastIndex = e + endTag.length;
      } else if (FLOAT_QUEUE[full]) {
        const f = FLOAT_QUEUE[full];
        const endTag = `\\end{${full}}`;
        const e = body.indexOf(endTag, after);
        if (e < 0) continue;
        const content = body.slice(after, e);
        const subs: string[] = [];
        const main = content.replace(/\\begin\{subfigure\}([\s\S]*?)\\end\{subfigure\}/g, (_, c: string) => { subs.push(c); return ""; });
        let num: string | null = null;
        if (/\\caption(?![a-zA-Z])/.test(main)) { C.step(f.counter); num = C.fmt(f.counter); }
        push(f.queue, num);
        if (num) {
          for (const lm of main.matchAll(/\\label\{([^}]*)\}/g)) labels.set(lm[1].trim(), { num, kind: f.kind });
          subs.forEach((s, k) => {
            for (const lm of s.matchAll(/\\label\{([^}]*)\}/g)) labels.set(lm[1].trim(), { num: `${num}${alphaLabel(k + 1)}`, kind: f.kind });
          });
        }
        TOK.lastIndex = e + endTag.length;
      } else {
        const t = thmInfo(full, defs);
        if (t) {
          let num: string | null = null;
          if (t.counter) { C.step(t.counter); num = C.fmt(t.counter); }
          push(`thm:${full}`, num);
          stack.push(current);
          if (num) current = { num, kind: processInlineStatic(t.label) };
        }
      }
    } else if (m[3] !== undefined) {
      if (thmInfo(m[3], defs) && stack.length) current = stack.pop() ?? null;
    } else if (m[4] !== undefined) {
      if (current) labels.set(m[4].trim(), current);
    } else {
      const top = hasChapters ? "chapter" : "section";
      C.vals.set(top, 0);
      C.appendixTop = top;
    }
  }

  // Bibliography entries
  const citeMap = new Map<string, number>();
  const citeAuthorMap = new Map<string, string>();
  let bibN = 0;
  const bibBlock = body.match(/\\begin\{thebibliography\}(?:\{[^}]*\})?([\s\S]*?)\\end\{thebibliography\}/);
  const bibHtmlParts: string[] = [];
  if (bibBlock) {
    for (const chunk of bibBlock[1].split(/(?=\\bibitem)/)) {
      const km = chunk.match(/\\bibitem(?:\[([^\]]*)\])?\{([^}]*)\}([\s\S]*)/);
      if (!km) continue;
      const key = km[2].trim();
      const text = km[3].replace(/\n+/g, " ").trim();
      const n = ++bibN;
      citeMap.set(key, n);
      // natbib label "Jones et al.(2017)" becomes "Jones et al. (2017)"
      if (km[1]) citeAuthorMap.set(key, processInlineStatic(km[1].trim().replace(/\((\d{4}[a-z]?)\)$/, " ($1)")));
      bibHtmlParts.push(
        `<div class="bib-entry"><span class="bib-num">[${n}]</span>` +
        `<span class="bib-text">${processInlineStatic(text)}</span></div>`
      );
    }
  }
  const bibHtml = bibHtmlParts.length
    ? `<div class="bib-section"><h2 class="bib-heading">References</h2>${bibHtmlParts.join("")}</div>`
    : "";

  return { labels, citeMap, citeAuthorMap, bibHtml, queues, mathQueue, toc };
}

// ── Tables ────────────────────────────────────────────────────────────────

/** Column alignments from a tabular spec: l c r p{} m{} b{} X S @{} !{} | *{n}{..} >{} <{}. */
function parseColSpec(spec: string, depth = 0): string[] {
  const out: string[] = [];
  let i = 0;
  const skipGroup = (from: number) => {
    const q = skipWs(spec, from);
    const e = matchBrace(spec, q);
    return e >= 0 ? e + 1 : from;
  };
  while (i < spec.length && out.length < 200) {
    const c = spec[i];
    if (c === "l" || c === "c" || c === "r") { out.push(c); i++; }
    else if (c === "p" || c === "m" || c === "b") { out.push("l"); i = skipGroup(i + 1); }
    else if (c === "X" || c === "L" || c === "J") { out.push("l"); i++; }
    else if (c === "C") { out.push("c"); i++; }
    else if (c === "R") { out.push("r"); i++; }
    else if (c === "S") {
      out.push("c"); i++;
      if (spec[i] === "[") { const e = matchBracket(spec, i); i = e >= 0 ? e + 1 : i; }
    }
    else if (c === "@" || c === "!" || c === ">" || c === "<") i = Math.max(skipGroup(i + 1), i + 1);
    else if (c === "*") {
      const q1 = skipWs(spec, i + 1);
      const e1 = matchBrace(spec, q1);
      const q2 = e1 >= 0 ? skipWs(spec, e1 + 1) : -1;
      const e2 = q2 >= 0 ? matchBrace(spec, q2) : -1;
      if (e2 < 0) { i++; continue; }
      const n = Math.min(parseInt(spec.slice(q1 + 1, e1), 10) || 0, 100);
      const sub = depth < 4 ? parseColSpec(spec.slice(q2 + 1, e2), depth + 1) : [];
      for (let k = 0; k < n && out.length < 200; k++) out.push(...sub);
      i = e2 + 1;
    }
    else if (c === "\\") {
      let j = i + 1;
      while (j < spec.length && /[a-zA-Z]/.test(spec[j])) j++;
      i = Math.max(j, i + 2);
    }
    else if (c === "{") { const e = matchBrace(spec, i); i = e >= 0 ? e + 1 : i + 1; }
    else i++; // | : spaces
  }
  return out;
}

const RULE_RE = /\\(?:specialrule\s*\{[^}]*\}\s*\{[^}]*\}\s*\{[^}]*\}|(?:cmidrule|cline)(?:\s*\[[^\]]*\])?(?:\s*\([^)]*\))?\s*\{[^}]*\}|hhline\s*\{[^}]*\}|rowcolor(?:\s*\[[^\]]*\])?\s*\{[^}]*\}|noalign\s*\{[^}]*\}|(?:toprule|midrule|bottomrule|hline|hdashline|firsthline|lasthline|addlinespace|morecmidrules)(?![a-zA-Z])(?:\s*\[[^\]]*\])?)/g;

function renderTabular(spec: string, content: string, inline: (s: string) => string): string {
  const aligns = parseColSpec(spec);
  const alignStyle = (a: string | undefined) =>
    a === "c" ? ' style="text-align:center"' : a === "r" ? ' style="text-align:right"' : "";

  type Row = { cells: string[]; ruleBefore: boolean };
  const rows: Row[] = [];
  let pendingRule = false;
  for (const raw of splitTop(content, "\\\\")) {
    let sawRule = false;
    const r = raw.replace(RULE_RE, (m) => {
      if (/^\\(?:midrule|hline|hdashline)/.test(m)) sawRule = true;
      return "";
    });
    if (!r.trim()) { if (sawRule) pendingRule = true; continue; }
    rows.push({ cells: splitTop(r, "&"), ruleBefore: pendingRule || sawRule });
    pendingRule = false;
  }
  if (rows.length === 0) return "<table></table>";

  // Header = rows above the first rule that follows a content row (booktabs
  // \midrule or \hline); without one, the first row.
  let headerCount = 1;
  const firstRule = rows.findIndex((row, k) => k > 0 && row.ruleBefore);
  if (firstRule > 0 && firstRule <= 3) headerCount = firstRule;

  const cover: number[] = [];
  const renderRow = (row: Row, header: boolean) => {
    const tag = header ? "th" : "td";
    let col = 0;
    let html = "";
    for (const rawCell of row.cells) {
      const cell = rawCell.trim();
      if ((cover[col] ?? 0) > 0 && !cell) { col++; continue; }
      let span = 1;
      let rowspan = 1;
      let align = aligns[col];
      let body = cell;
      const mc = cell.match(/^\\multicolumn\s*\{(\d+)\}/);
      if (mc) {
        const c = parseArgs(cell, 0, "\\multicolumn".length, "multicolumn", 0, 3);
        if (c) {
          span = Math.max(1, Math.min(parseInt(c.req[0], 10) || 1, 100));
          align = parseColSpec(c.req[1])[0] ?? align;
          body = c.req[2].trim();
        }
      }
      const mr = body.match(/^\\multirow\s*(?:\[[^\]]*\])?\s*\{(-?\d+)\}\s*(?:\[[^\]]*\])?\s*\{[^}]*\}\s*(?:\[[^\]]*\])?\s*/);
      if (mr) {
        const e = matchBrace(body, mr[0].length);
        if (e >= 0) {
          const nr = parseInt(mr[1], 10) || 1;
          if (nr > 1) rowspan = Math.min(nr, 50);
          body = body.slice(mr[0].length + 1, e);
        }
      }
      const attrs = (span > 1 ? ` colspan="${span}"` : "") + (rowspan > 1 ? ` rowspan="${rowspan}"` : "") + alignStyle(align);
      html += `<${tag}${attrs}>${inline(body)}</${tag}>`;
      if (rowspan > 1) for (let k = 0; k < span; k++) cover[col + k] = rowspan;
      col += span;
    }
    for (let k = 0; k < cover.length; k++) if (cover[k] > 0) cover[k]--;
    return `<tr>${html}</tr>`;
  };

  let tbl = "<table>";
  const head = rows.slice(0, headerCount).map((r) => renderRow(r, true)).join("");
  const bodyRows = rows.slice(headerCount).map((r) => renderRow(r, false)).join("");
  tbl += `<thead>${head}</thead>`;
  tbl += bodyRows ? `<tbody>${bodyRows}</tbody>` : "";
  return tbl + "</table>";
}

// ── siunitx ───────────────────────────────────────────────────────────────

const SI_PREFIX: Record<string, string> = {
  yocto: "y", zepto: "z", atto: "a", femto: "f", pico: "p", nano: "n", micro: "µ",
  milli: "m", centi: "c", deci: "d", deca: "da", deka: "da", hecto: "h", kilo: "k",
  mega: "M", giga: "G", tera: "T", peta: "P", exa: "E",
};
const SI_UNIT: Record<string, string> = {
  metre: "m", meter: "m", second: "s", kilogram: "kg", gram: "g", ampere: "A", kelvin: "K",
  mole: "mol", candela: "cd", celsius: "°C", degreeCelsius: "°C", percent: "%", hertz: "Hz",
  newton: "N", pascal: "Pa", joule: "J", watt: "W", coulomb: "C", volt: "V", farad: "F",
  ohm: "Ω", siemens: "S", weber: "Wb", tesla: "T", henry: "H", lumen: "lm", lux: "lx",
  becquerel: "Bq", gray: "Gy", sievert: "Sv", katal: "kat", radian: "rad", steradian: "sr",
  litre: "L", liter: "L", hour: "h", minute: "min", day: "d", degree: "°", arcminute: "′",
  arcsecond: "″", hectare: "ha", tonne: "t", electronvolt: "eV", dalton: "Da", bel: "B",
  decibel: "dB", neper: "Np", bar: "bar", angstrom: "Å", byte: "B", bit: "bit",
  astronomicalunit: "au", atomicmassunit: "u", mmHg: "mmHg", calorie: "cal", year: "yr",
};
const SUP_CHARS: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "-": "⁻", "−": "⁻", "+": "⁺",
};

function sup(x: string): string {
  const t = x.trim();
  if (t && [...t].every((c) => SUP_CHARS[c])) return [...t].map((c) => SUP_CHARS[c]).join("");
  return `<sup>${t}</sup>`;
}

function siLiteral(u: string): string {
  return u
    .replace(/\^\s*\{([^{}]*)\}|\^\s*(-?\d+|\S)/g, (_, a: string | undefined, b: string | undefined) => sup(a ?? b ?? ""))
    .replace(/(?<=[^\s\d])[.~](?=[^\s\d])/g, " ")
    .replace(/[{}]/g, "")
    .trim();
}

function siUnit(u: string): string {
  if (!/\\[a-zA-Z]/.test(u)) return siLiteral(u);
  const num: string[] = [];
  const den: string[] = [];
  let prefix = "", pow = "", per = false;
  let last: { arr: string[]; idx: number } | null = null;
  const re = /\\([a-zA-Z]+)\s*(?:\{([^{}]*)\})?|([^\\\s]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(u)) !== null) {
    const cmd = m[1];
    if (cmd) {
      if (SI_PREFIX[cmd] !== undefined) prefix += SI_PREFIX[cmd];
      else if (cmd === "per") per = true;
      else if (cmd === "square") pow = "2";
      else if (cmd === "cubic") pow = "3";
      else if (cmd === "raiseto") pow = m[2] ?? "";
      else if (cmd === "squared" || cmd === "cubed" || cmd === "tothe") {
        const p = cmd === "squared" ? "2" : cmd === "cubed" ? "3" : (m[2] ?? "");
        if (last) last.arr[last.idx] += sup(p);
      }
      else {
        const sym = SI_UNIT[cmd] ?? (m[2] !== undefined ? siLiteral(m[2]) : cmd);
        const arr = per ? den : num;
        arr.push(prefix + sym + (pow ? sup(pow) : ""));
        last = { arr, idx: arr.length - 1 };
        prefix = ""; pow = ""; per = false;
      }
    } else if (m[3]) {
      const arr = per ? den : num;
      arr.push(prefix + siLiteral(m[3]));
      last = { arr, idx: arr.length - 1 };
      prefix = ""; per = false;
    }
  }
  let out = num.join(" ");
  if (den.length) out = `${out || "1"}/${den.length > 1 ? `(${den.join(" ")})` : den[0]}`;
  return out;
}

function groupDigits(d: string): string {
  return d.length >= 5 ? d.replace(/\B(?=(\d{3})+(?!\d))/g, "\u2009") : d;
}

function siNum(n: string): string {
  let t = n.trim().replace(/\s+/g, "");
  t = t.replace(/\\pm|\+-/g, " ± ").replace(/\\times|x(?=\d)/g, " × ");
  return t.split(/( [±×] )/).map((part) => {
    if (/^ [±×] $/.test(part)) return part;
    const e = part.match(/^([+-]?)(\d*)(?:[.,](\d+))?[eE]([+-]?\d+)$/);
    const fmt = (sign: string, int: string, frac?: string) =>
      (sign === "-" ? "−" : sign) + groupDigits(int) + (frac !== undefined ? "." + frac : "");
    if (e) {
      const mant = e[2] || e[3] ? fmt(e[1], e[2] || "0", e[3]) : (e[1] === "-" ? "−" : "");
      return `${mant ? mant + " × " : ""}10${sup(e[4])}`;
    }
    const d = part.match(/^([+-]?)(\d+)(?:[.,](\d+))?$/);
    return d ? fmt(d[1], d[2], d[3]) : part.replace(/^-/, "−");
  }).join("");
}

function siJoin(value: string, unit: string): string {
  if (!unit) return value;
  return /^[°′″](?!C)/.test(unit) ? value + unit : `${value} ${unit}`;
}

function renderSiunitx(text: string): string {
  const wrap = (s: string) => `<span class="si" style="white-space:nowrap">${s}</span>`;
  const list = (items: string[]) =>
    items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
  text = replaceCmd(text, "qtyrange|SIrange", 3, (c) => {
    const u = siUnit(c.req[2]);
    return wrap(`${siJoin(siNum(c.req[0]), u)} to ${siJoin(siNum(c.req[1]), u)}`);
  }, 1);
  text = replaceCmd(text, "qtylist|SIlist", 2, (c) => {
    const u = siUnit(c.req[1]);
    return list(c.req[0].split(";").map((v) => siJoin(siNum(v), u)));
  }, 1);
  text = replaceCmd(text, "qty|SI", 2, (c) => wrap(siJoin(siNum(c.req[0]), siUnit(c.req[1]))), 1);
  text = replaceCmd(text, "numrange", 2, (c) => `${siNum(c.req[0])} to ${siNum(c.req[1])}`, 1);
  text = replaceCmd(text, "numlist", 1, (c) => list(c.req[0].split(";").map(siNum)), 1);
  text = replaceCmd(text, "unit|si", 1, (c) => wrap(siUnit(c.req[0])), 1);
  text = replaceCmd(text, "num", 1, (c) => wrap(siNum(c.req[0])), 1);
  text = replaceCmd(text, "ang", 1, (c) => {
    const [d, mi, s] = c.req[0].split(";").map((x) => x.trim());
    return wrap((d ? siNum(d) + "°" : "") + (mi ? siNum(mi) + "′" : "") + (s ? siNum(s) + "″" : ""));
  }, 1);
  return text;
}

// ── Lists ─────────────────────────────────────────────────────────────────

interface ListItem { label?: string; body: string; }

/** Split list content at top-level \item, reading an optional [label]. */
function splitItems(items: string): ListItem[] {
  const out: ListItem[] = [];
  const re = /\\item(?![a-zA-Z])/g;
  const starts: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(items)) !== null) starts.push(m.index);
  starts.forEach((s, k) => {
    let p = s + 5;
    const end = k + 1 < starts.length ? starts[k + 1] : items.length;
    let label: string | undefined;
    const q = skipWs(items, p);
    if (items[q] === "[") {
      const e = matchBracket(items, q);
      if (e >= 0 && e < end) { label = items.slice(q + 1, e); p = e + 1; }
    }
    out.push({ label, body: items.slice(p, end) });
  });
  return out;
}

/** List label template from enumitem `label=...` or the enumerate package short form. */
function listTemplate(opts: string | undefined, ordered: boolean): { tpl: string | null; start: number } {
  if (!opts || !opts.trim()) return { tpl: null, start: 1 };
  if (/=/.test(opts)) {
    let tpl: string | null = null;
    let start = 1;
    for (const kv of splitTop(opts.replace(/,/g, "&"), "&")) {
      const eq = kv.indexOf("=");
      if (eq < 0) continue;
      const k = kv.slice(0, eq).trim();
      let v = kv.slice(eq + 1).trim();
      if (v.startsWith("{") && matchBrace(v, 0) === v.length - 1) v = v.slice(1, -1);
      if (k === "label") tpl = v;
      if (k === "start") start = parseInt(v, 10) || 1;
    }
    return { tpl, start };
  }
  if (!ordered) return { tpl: null, start: 1 };
  // Short form: [(a)] [i.] [A)] [1.]: the first counter letter outside braces.
  let depth = 0;
  for (let i = 0; i < opts.length; i++) {
    const c = opts[i];
    if (c === "\\") { while (i + 1 < opts.length && /[a-zA-Z]/.test(opts[i + 1])) i++; continue; }
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (depth === 0 && "aAiI1".includes(c)) {
      const tok = { a: "\\alph*", A: "\\Alph*", i: "\\roman*", I: "\\Roman*", "1": "\\arabic*" }[c]!;
      return { tpl: opts.slice(0, i) + tok + opts.slice(i + 1), start: 1 };
    }
  }
  return { tpl: null, start: 1 };
}

function fillTemplate(tpl: string, n: number): string {
  return tpl
    .replace(/\\alph\*?/g, alphaLabel(n))
    .replace(/\\Alph\*?/g, alphaLabel(n).toUpperCase())
    .replace(/\\roman\*?/g, romanLabel(n))
    .replace(/\\Roman\*?/g, romanLabel(n).toUpperCase())
    .replace(/\\arabic\*?/g, String(n));
}

const labelledLi = (label: string, body: string) =>
  `<li style="list-style:none;position:relative">` +
  `<span class="item-label" style="position:absolute;right:calc(100% + 0.45em);white-space:nowrap">${label}</span> ` +
  `${body}</li>`;

// ── Pass 2: main renderer ─────────────────────────────────────────────────

// Hard ceiling on the source we will parse client-side. The renderer runs
// synchronously in a React render path, so an oversized (often hostile)
// document would freeze the tab. Well above any realistic paper (~80 KB is the
// PDF-compile cap), so legitimate documents are unaffected.
const MAX_SOURCE_CHARS = 400_000;

interface InlineCtx {
  labels: Map<string, LabelInfo>;
  citeMap: Map<string, number>;
  citeAuthorMap: Map<string, string>;
  footnotes: string[];
  nextFoot: () => number;
}

export function latexToHtml(src: string): LatexHtmlResult {
  const warnings: ParseWarning[] = [];
  const blocks = new Map<string, string>();
  let n = 0;
  const block = (html: string) => { const p = PH(n++); blocks.set(p, html); return p; };
  // Inline tokens (\verb, \lstinline) survive every later rule untouched.
  const inlineTokens: string[] = [];
  const inlineTok = (html: string) => { inlineTokens.push(html); return `\x00I${inlineTokens.length - 1}\x00`; };

  if (src.length > MAX_SOURCE_CHARS) {
    return {
      html:
        `<div class="preview-notice"><p class="preview-notice-title">Document too large to preview</p>` +
        `<p class="preview-notice-sub">This document exceeds ${Math.round(MAX_SOURCE_CHARS / 1000)}k characters. ` +
        `Trim it or use PDF export to compile the full source.</p></div>`,
      warnings: [{ env: "document", reason: "Source exceeds preview size limit" }],
      macros: {},
    };
  }

  // Protect \% \$ \& ... before any rule can react to the bare character.
  const all = protectEscapes(src);
  let preamble = "";
  let body: string;
  const bi = all.indexOf("\\begin{document}");
  if (bi >= 0) {
    preamble = all.slice(0, bi);
    const rest = all.slice(bi + "\\begin{document}".length);
    const ei = rest.indexOf("\\end{document}");
    body = ei >= 0 ? rest.slice(0, ei) : rest;
  } else {
    body = all;
  }

  // ── Verbatim material first: nothing below may touch it ─────────────────
  const codeHtml = (c: string) => escapeAttr(escapeHtml(restoreEscapes(c, "raw")));
  body = body.replace(/\\begin\{(verbatim\*?|Verbatim|lstlisting|minted)\}([\s\S]*?)\\end\{\1\}/g, (_, env: string, c: string) => {
    let code = c;
    if (env === "lstlisting" || env === "Verbatim") code = code.replace(/^[ \t]*\[[^\]\n]*\]/, "");
    if (env === "minted") code = code.replace(/^[ \t]*(?:\[[^\]\n]*\])?[ \t]*\{[^}\n]*\}/, "");
    return block(`<pre class="verbatim"><code>${codeHtml(code.replace(/^[ \t]*\n/, "").replace(/\n[ \t]*$/, ""))}</code></pre>`);
  });
  body = body.replace(/\\verb\*?([^a-zA-Z\s*])([^\n]*?)\1/g, (_, _d: string, c: string) => inlineTok(`<code>${codeHtml(c)}</code>`));
  body = body.replace(
    /\\(?:lstinline(?:\[[^\]\n]*\])?|mintinline(?:\[[^\]\n]*\])?\{[^}\n]*\})(?:\{([^}\n]*)\}|([^a-zA-Z\s{[])([^\n]*?)\2)/g,
    (_, a: string | undefined, _d: string | undefined, b: string | undefined) => inlineTok(`<code>${codeHtml(a ?? b ?? "")}</code>`)
  );

  // ── Comments (escaped \% was protected, so every bare % starts one) ─────
  const stripComments = (s: string) => s.replace(/%[^\n]*(?:\n(?![ \t]*\n)[ \t]*)?/g, "");
  preamble = stripComments(preamble);
  body = stripComments(body);
  body = body.replace(/\\begin\{comment\}[\s\S]*?\\end\{comment\}/g, "");
  body = body.replace(/\\iffalse(?![a-zA-Z])[\s\S]*?\\fi(?![a-zA-Z])/g, "");
  // Neutralise "\\[<len>]" line breaks. The "\[" inside "\\[1cm]" would
  // otherwise be misread as a display-math opener.
  body = body.replace(/\\\\\*?\s*\[[^\]]*\]/g, "\\\\ ");

  // ── Definitions from the whole source ───────────────────────────────────
  const defs: Defs = { macros: new Map(), envs: new Map(), mathOps: {}, theorems: new Map(), numberWithin: new Map() };
  extractDefs(preamble, defs);
  body = extractDefs(body, defs);
  body = expandUserEnvs(body, defs.envs);
  body = expandUserMacros(body, defs.macros);

  const hasChapters = /\\chapter\s*(?:\[[^\]]*\]\s*)?\{/.test(body);

  // ── Prescan ──────────────────────────────────────────────────────────────
  const scan = prescanDocument(body, defs, hasChapters);
  const { labels, citeMap, citeAuthorMap, bibHtml, queues, mathQueue, toc } = scan;
  const take = (q: string) => queues.get(q)?.shift() ?? null;

  // Theorem numbers are attached to each \begin{...} now, in document order,
  // because the innermost-first wrapper loop does not visit them in that order.
  const thmNums: Array<string | null> = [];
  body = body.replace(/\\begin\{([^}]+)\}/g, (m, env: string) => {
    if (!thmInfo(env, defs)) return m;
    thmNums.push(take(`thm:${env}`));
    return `${m}\x01${thmNums.length - 1}\x01`;
  });

  let footN = 0;
  const footnoteList: string[] = [];
  const ctx: InlineCtx = { labels, citeMap, citeAuthorMap, footnotes: footnoteList, nextFoot: () => ++footN };
  const inline = (text: string) => processInline(text, ctx);

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
    warnings.push({ env: docClass || "beamer", reason: "Presentation class: the preview shows an outline; use PDF export to compile the real slides" });

    const slideCount = (body.match(/\\begin\{frame\}/g) || []).length;
    const deckTitle = extractBracedContent(src, "title");

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
        `<div class="preview-notice-head">${label} detected</div>` +
        `<p>The live preview renders <strong>article-style LaTeX</strong> (text &amp; math). ` +
        `It can't reproduce slides, overlays, TikZ, or tcolorbox, but your document looks valid. ` +
        `Use <strong>↓ PDF</strong> in the toolbar to compile the real ${slideCount} slide${slideCount === 1 ? "" : "s"}.</p>` +
        (deckTitle ? `<p class="preview-notice-sub">“${escapeForDisplay(deckTitle)}”</p>` : "") +
      `</div>` +
      (outline ? `<div class="beamer-outline-head">Deck outline · ${slideCount} slide${slideCount === 1 ? "" : "s"}</div>${outline}` : "");

    return { html: restoreEscapes(notice, "html"), warnings, macros: { ...defs.mathOps } };
  }

  // ── Preamble-style commands that produce no visible output ───────────────
  const drop = (names: string, nOpt: number, nReq: number) => {
    body = replaceCmd(body, names, nReq, () => "", nOpt);
  };
  drop("usepackage|RequirePackage|documentclass|geometry|pagestyle|thispagestyle|pagenumbering|selectlanguage|" +
    "bibliographystyle|addbibresource|nocite|graphicspath|sisetup|hypersetup|lstset|tikzset|pgfplotsset|" +
    "usetikzlibrary|newcounter|stepcounter|refstepcounter|fancyhf|fancyhead|fancyfoot|lhead|chead|rhead|" +
    "lfoot|cfoot|rfoot|captionsetup|setlist|setmainfont|setsansfont|setmonofont|urlstyle|linespread|" +
    "setstretch|hyphenation|newlength|DeclareGraphicsExtensions|counterwithout", 1, 1);
  drop("setlength|addtolength|setcounter|addtocounter|colorlet", 1, 2);
  drop("definecolor|addcontentsline|crefname|Crefname", 1, 3);
  body = body.replace(/\\(?:setlength|addtolength)\\[a-zA-Z]+\s*\{[^}]*\}/g, "");
  body = body.replace(/\\(?:onehalfspacing|doublespacing|singlespacing|maketitle|linenumbers|nolinenumbers|resetlinenumber|appendix|frontmatter|mainmatter|backmatter|allowdisplaybreaks|raggedbottom|flushbottom|sloppy|fussy|makeatletter|makeatother|protect)(?![a-zA-Z])/g, "");
  // \title{}, \author{}, \date{} inside the body (standard LaTeX puts them in
  // the preamble, but some templates don't): rendered in the header instead.
  drop("title|author|date", 1, 1);

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

  // Display math \[ ... \] and $$ ... $$ (not numbered)
  body = body.replace(/\\\[([\s\S]*?)\\\]/g, (_, m: string) => block(mathBlock(cleanMath(m))));
  body = body.replace(/\$\$([\s\S]*?)\$\$/g, (_, m: string) => block(mathBlock(cleanMath(m))));

  // Numbered and starred math environments, ONE pass in document order so the
  // equation numbers come from the prescan queue in the same order.
  body = body.replace(
    new RegExp(`\\\\begin\\{(${MATH_ENV_NAMES})(\\*?)\\}([\\s\\S]*?)\\\\end\\{\\1\\2\\}`, "g"),
    (_, env: string, star: string, content: string) => {
      const tags = mathQueue.shift() ?? [];
      const info = analyzeMath(env, star === "*", content);
      if (SINGLE_ROW_MATH.has(env)) {
        const tag = tags[0] ?? null;
        return block(tag ? numberedMathBlock(info.rows[0], tag) : mathBlock(info.rows[0]));
      }
      const rows = info.rows.map((r, i) => (tags[i] ? `${r} \\tag{${tags[i]}}` : r));
      const [open, close] = env === "gather"
        ? ["\\begin{gather*}", "\\end{gather*}"]
        : env === "alignat"
          ? [`\\begin{alignat*}{${info.cols}}`, "\\end{alignat*}"]
          : ["\\begin{align*}", "\\end{align*}"];
      return block(mathBlock(`${open}${rows.join(" \\\\\n")}${close}`));
    }
  );

  // Pictures the browser cannot draw
  body = body.replace(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g, () =>
    block(`<div class="fig-placeholder">TikZ picture: drawn when you compile to PDF</div>`)
  );
  body = body.replace(/\\begin\{pgfpicture\}[\s\S]*?\\end\{pgfpicture\}/g, () =>
    block(`<div class="fig-placeholder">PGF picture: drawn when you compile to PDF</div>`)
  );

  const tableCaption = (num: string | null, cap: string) =>
    `<strong>Table${num ? " " + num : ""}:</strong> ${inline(cap)}`;

  // longtable: caption becomes a numbered table caption, the rest a tabular
  body = body.replace(/\\begin\{longtable\}(\[[^\]]*\])?/g, "\\begin{longtable}");
  body = body.replace(/\\begin\{longtable\}([\s\S]*?)\\end\{longtable\}/g, (_, inner: string) => {
    const num = take("longtable");
    const specEnd = matchBrace(inner, skipWs(inner, 0));
    if (specEnd < 0) return inner;
    const specStart = skipWs(inner, 0);
    const spec = inner.slice(specStart, specEnd + 1);
    let content = inner.slice(specEnd + 1);
    const cap = scanCmds(content, "caption", 1, 1)[0];
    let capHtml = "";
    if (cap) {
      capHtml = block(`<div class="table-caption" style="display:block">${tableCaption(num, cap.req[0])}</div>`);
      content = content.slice(0, cap.start) + content.slice(cap.end).replace(/^\s*\\\\/, "");
    }
    content = content
      .replace(/\\(?:endhead|endfirsthead|endfoot|endlastfoot)(?![a-zA-Z])/g, "")
      .replace(/\\label\{[^}]*\}/g, "");
    return `${capHtml}\n\\begin{tabular}${spec}${content}\\end{tabular}`;
  });

  // Tabular family, innermost first (a tabular may sit inside a cell)
  {
    const OPEN = /\\begin\{(tabular\*?|tabularx|tabulary|tabu)\}/g;
    for (let guard = 0; guard < 500; guard++) {
      let lastM: RegExpExecArray | null = null;
      let mm: RegExpExecArray | null;
      OPEN.lastIndex = 0;
      while ((mm = OPEN.exec(body)) !== null) lastM = mm;
      if (!lastM) break;
      const env = lastM[1];
      const endTag = `\\end{${env}}`;
      const e = body.indexOf(endTag, lastM.index);
      if (e < 0) { body = body.slice(0, lastM.index) + body.slice(lastM.index + lastM[0].length); continue; }
      let p = lastM.index + lastM[0].length;
      const readGroup = () => {
        const q = skipWs(body, p);
        const ce = matchBrace(body, q);
        if (ce < 0 || ce > e) return null;
        p = ce + 1;
        return body.slice(q + 1, ce);
      };
      if (env !== "tabular" && env !== "tabu") readGroup(); // width
      const q = skipWs(body, p);
      if (body[q] === "[") { const be = matchBracket(body, q); if (be >= 0 && be < e) p = be + 1; }
      const spec = readGroup() ?? "";
      const html = renderTabular(spec, body.slice(p, e), inline);
      body = body.slice(0, lastM.index) + block(html) + body.slice(e + endTag.length);
    }
  }

  // Figure / figure* / wrapfigure (with subfigures)
  const imgPlaceholder = (file: string) =>
    `<div class="fig-placeholder">Figure: ${escapeHtml(file.trim()) || "image"}</div>`;
  body = body.replace(/\\begin\{(figure\*?|wrapfigure)\}([\s\S]*?)\\end\{\1\}/g, (_, env: string, inner: string) => {
    const num = take("figure");
    inner = env === "wrapfigure"
      ? inner.replace(/^\s*(?:\[[^\]]*\])?\s*\{[^}]*\}\s*(?:\[[^\]]*\])?\s*\{[^}]*\}/, "")
      : inner.replace(/^\s*\[[^\]]*\]/, "");
    const subs: string[] = [];
    inner = inner.replace(/\\begin\{subfigure\}(?:\[[^\]]*\])?(?:\{[^}]*\})?([\s\S]*?)\\end\{subfigure\}/g, (__, c: string) => {
      const letter = alphaLabel(subs.length + 1);
      const sc = scanCmds(c, "caption", 1, 1)[0];
      const imgs = scanCmds(c, "includegraphics", 1, 1).map((g) => imgPlaceholder(g.req[0])).join("");
      subs.push(
        `<div style="flex:1;min-width:10rem">${imgs || imgPlaceholder("subfigure")}` +
        `<figcaption>(${letter})${sc ? " " + inline(sc.req[0]) : ""}</figcaption></div>`
      );
      return "";
    });
    const cap = scanCmds(inner, "caption", 1, 1)[0];
    const imgs = scanCmds(inner, "includegraphics", 1, 1).map((g) => imgPlaceholder(g.req[0])).join("");
    const others = (inner.match(/\x00B\d+\x00/g) ?? []).join("");
    const subHtml = subs.length
      ? `<div style="display:flex;flex-wrap:wrap;gap:1rem;justify-content:center">${subs.join("")}</div>`
      : "";
    const content = imgs + others + subHtml || (cap ? "" : imgPlaceholder("figure"));
    const caption = cap
      ? `<figcaption><strong>Figure ${num ?? ""}:</strong> ${inline(cap.req[0])}</figcaption>`
      : "";
    return block(`<figure class="fig-block">${content}${caption}</figure>`);
  });

  // Table float: numbered caption where the author put it, then the tabular
  body = body.replace(/\\begin\{(table\*?)\}([\s\S]*?)\\end\{\1\}/g, (_, _env: string, inner: string) => {
    const num = take("table");
    inner = inner.replace(/^\s*\[[^\]]*\]/, "");
    const cap = scanCmds(inner, "caption", 1, 1)[0];
    if (cap) {
      const capHtml = block(`<div class="table-caption" style="display:block">${tableCaption(num, cap.req[0])}</div>`);
      inner = inner.slice(0, cap.start) + `\n${capHtml}\n` + inner.slice(cap.end);
    }
    inner = inner.replace(/\\label\{[^}]*\}/g, "").replace(/\\centering(?![a-zA-Z])/g, "");
    return block(`<div class="table-float">${splitParagraphs(inline(inner.trim()))}</div>`);
  });

  // Itemize / enumerate / description: innermost first so nesting works.
  {
    const LIST_RE = /\\begin\{(itemize|enumerate|description)\}((?:(?!\\begin\{(?:itemize|enumerate|description)\})[\s\S])*?)\\end\{\1\}/g;
    let prev = "";
    for (let guard = 0; guard < 60 && prev !== body; guard++) {
      prev = body;
      body = body.replace(LIST_RE, (_, kind: string, content: string) => {
        let opts: string | undefined;
        const q = skipWs(content, 0);
        if (content[q] === "[") {
          const e = matchBracket(content, q);
          if (e >= 0) { opts = content.slice(q + 1, e); content = content.slice(e + 1); }
        }
        const items = splitItems(content);
        if (kind === "description") {
          const dls = items.map((it) =>
            (it.label !== undefined ? `<dt><strong>${inline(it.label)}</strong></dt>` : "") + `<dd>${inline(it.body.trim())}</dd>`
          ).join("");
          return block(`<dl style="margin:0.75rem 0 0.75rem 1.5rem">${dls}</dl>`);
        }
        const ordered = kind === "enumerate";
        const { tpl, start } = listTemplate(opts, ordered);
        let count = start;
        const lis = items.map((it) => {
          const bodyHtml = inline(it.body.trim());
          if (it.label !== undefined) return labelledLi(inline(it.label), bodyHtml);
          const k = count++;
          if (tpl) return labelledLi(inline(fillTemplate(tpl, k)), bodyHtml);
          return `<li>${bodyHtml}</li>`;
        }).join("");
        const tag = ordered ? "ol" : "ul";
        const startAttr = ordered && start !== 1 && !tpl ? ` start="${start}"` : "";
        return block(`<${tag}${startAttr}>${lis}</${tag}>`);
      });
    }
  }

  // Algorithm float + algorithmic bodies
  const renderAlgorithm = (content: string, num: string | null) => {
    const cap = scanCmds(content, "caption", 1, 1)[0];
    if (cap) content = content.slice(0, cap.start) + content.slice(cap.end);
    const c = escapeHtml(content)
      .replace(/\\label\{[^}]*\}/g, "")
      .replace(/\\(?:begin|end)\{[^}]*\}(?:\[[^\]]*\])?/g, "")
      .replace(/\\(State|Statex|Procedure|EndProcedure|Function|EndFunction|Return|If|ElsIf|Else|EndIf|For|ForAll|EndFor|While|EndWhile|Repeat|Until|Loop|EndLoop|Require|Ensure|Input|Output|KwIn|KwOut|KwData|KwResult)(?![a-zA-Z])\s*/g,
        (_: string, kw: string) => `<strong>${kw.replace(/^Kw/, "").replace(/^Statex$/, "")}</strong> `)
      .replace(/\\(?:Comment|COMMENT)\{([^}]*)\}/g, '<em style="opacity:0.6"> ▷ $1</em>')
      .replace(/\\gets(?![a-zA-Z])/g, "←")
      .replace(/\\textbf\{([^}]*)\}/g, "<strong>$1</strong>")
      .replace(/\\emph\{([^}]*)\}/g, "<em>$1</em>")
      .replace(/\$([^$\n]+?)\$/g, (_, mth: string) => `<span class="math-inline" data-math="${encodeMath(mth)}"></span>`)
      .replace(/\\[a-zA-Z]+\*?\{([^}]*)\}/g, "$1")
      .replace(/\\[a-zA-Z]+\*?/g, "")
      .replace(/\{([^}]*)\}/g, "$1")
      .trim();
    const title = num || cap
      ? `Algorithm${num ? " " + num : ""}${cap ? ": " + inline(cap.req[0]) : ""}`
      : "Algorithm";
    return (
      `<div class="thm-box" style="font-family:'JetBrains Mono',monospace;font-size:0.85em">` +
      `<span class="thm-label">${title}</span><br>` +
      `<div style="white-space:pre-wrap;margin-top:0.5rem">${c}</div>` +
      `</div>`
    );
  };
  body = body.replace(/\\begin\{algorithm\}(?:\[[^\]]*\])?([\s\S]*?)\\end\{algorithm\}/g, (_, c: string) =>
    block(renderAlgorithm(c, take("algorithm")))
  );
  body = body.replace(/\\begin\{(algorithmic|algorithm2e|algorithmicx|algpseudocode)\}(?:\[[^\]]*\])?([\s\S]*?)\\end\{\1\}/g, (_, _e: string, c: string) =>
    block(renderAlgorithm(c, null))
  );

  // Bibliographies
  body = body.replace(/\\begin\{thebibliography\}[\s\S]*?\\end\{thebibliography\}/g, () => block(bibHtml || ""));
  body = replaceCmd(body, "bibliography", 1, (c) => {
    const files = c.req[0].split(",").map((f) => f.trim()).filter(Boolean)
      .map((f) => escapeHtml(f.endsWith(".bib") ? f : `${f}.bib`)).join(", ");
    return block(
      `<div class="bib-section"><h2 class="bib-heading">References</h2>` +
      `<p class="bib-note" style="font-size:0.85em;font-style:italic">Bibliography from ${files}: the entries are formatted when you compile to PDF.</p></div>`
    );
  });
  body = body.replace(/\\printbibliography(?:\[[^\]]*\])?/g, () =>
    block(`<div class="bib-section"><h2 class="bib-heading">References</h2>` +
      `<p class="bib-note" style="font-size:0.85em;font-style:italic">Bibliography: <code>\\printbibliography</code> is filled by biber when you compile to PDF.</p></div>`)
  );

  // ── Multi-file: \input / \include warning ────────────────────────────────
  body = replaceCmd(body, "input|include|subfile", 1, (c) => {
    const fname = c.req[0];
    warnings.push({ env: "\\input", reason: `Multi-file document: "${fname}" not loaded` });
    return block(
      `<div class="unknown-env">Note: <code>\\${c.name}{${escapeHtml(fname)}}</code> is a separate file. ` +
      `Paste the contents of <em>${escapeHtml(fname)}</em> here to preview it.</div>`
    );
  });

  // ── Sections: one pass in document order (numbers come from the prescan) ─
  body = replaceCmd(body, "part|chapter|section|subsection|subsubsection|paragraph|subparagraph", 1, (c) => {
    const t = inline(c.req[0]);
    const numbered = !c.star && c.name in SEC_LEVEL;
    const num = numbered ? take("sec") : null;
    switch (c.name) {
      case "part":
        return block(`<h1 class="chapter">${t}</h1>`);
      case "chapter": {
        const word = num && /^[A-Z]$/.test(num) ? "Appendix" : "Chapter";
        const head = num ? `<span class="sec-num" style="display:block;font-size:0.7em;font-weight:400;margin-bottom:0.35rem">${word} ${num}</span>` : "";
        return block(`<h1 class="chapter">${head}${t}</h1>`);
      }
      case "section": return block(`<h2>${num ? `<span class="sec-num">${num}</span> ` : ""}${t}</h2>`);
      case "subsection": return block(`<h3>${num ? `<span class="sec-num">${num}</span> ` : ""}${t}</h3>`);
      case "subsubsection": return block(`<h4>${num ? `<span class="sec-num">${num}</span> ` : ""}${t}</h4>`);
      default: return block(`<p style="margin-top:0.75rem"><strong>${t}</strong></p>`);
    }
  }, 1);

  // Table of contents from the prescan headings
  body = body.replace(/\\tableofcontents(?![a-zA-Z])/g, () => {
    if (!toc.length) return block(`<div class="toc-placeholder"><em>[Table of Contents]</em></div>`);
    const rows = toc.filter((e) => e.level <= 2).map((e) =>
      `<div style="margin-left:${(e.level - (hasChapters ? 0 : 1)) * 1.5}em${e.level === 0 ? ";font-weight:700;margin-top:0.4rem" : ""}">` +
      `<span class="sec-num">${e.num}</span> ${inline(e.title)}</div>`
    ).join("");
    return block(`<div class="toc"><h2>Contents</h2>${rows}</div>`);
  });
  body = body.replace(/\\(listoffigures|listoftables)(?![a-zA-Z])/g, () =>
    block(`<div class="toc-placeholder"><em>[List of Figures/Tables]</em></div>`)
  );

  // ── Wrapper environments, innermost first ────────────────────────────────
  const paras = (content: string) => splitParagraphs(inline(content.trim()));
  const withLead = (lead: string, content: string) => {
    const html = paras(content);
    if (/^<p>/.test(html) && html.indexOf("<p>", 3) < 0 && /<\/p>$/.test(html) && !/\x00B/.test(html)) {
      return `${lead} ${html.slice(3, -4)}`;
    }
    if (!html) return lead;
    return /^<p>/.test(html) ? `<p>${lead} ${html.slice(3)}` : `<p>${lead}</p>${html}`;
  };
  const stripLeadOpt = (content: string): [string | undefined, string] => {
    const q = skipWs(content, 0);
    if (content[q] !== "[") return [undefined, content];
    const e = matchBracket(content, q);
    return e < 0 ? [undefined, content] : [content.slice(q + 1, e), content.slice(e + 1)];
  };
  const stripLeadGroup = (content: string): [string | undefined, string] => {
    const q = skipWs(content, 0);
    const e = matchBrace(content, q);
    return e < 0 ? [undefined, content] : [content.slice(q + 1, e), content.slice(e + 1)];
  };

  const renderWrapper = (_m: string, env: string, content: string): string => {
    const thm = thmInfo(env, defs);
    if (thm) {
      const mk = content.match(/^\x01(\d+)\x01/);
      const num = mk ? thmNums[+mk[1]] : null;
      if (mk) content = content.slice(mk[0].length);
      const [opt, rest] = stripLeadOpt(content);
      const cls = env.replace(/[^a-zA-Z0-9_-]/g, "");
      if (env === "proof") {
        const lead = `<span class="thm-label">${opt ? inline(opt) : "Proof"}.</span>`;
        return block(`<div class="thm-box thm-proof">${withLead(lead, rest)}<span style="float:right">∎</span></div>`);
      }
      const lead = `<span class="thm-label">${inline(thm.label)}${num ? " " + num : ""}${opt ? ` (${inline(opt)})` : ""}.</span>`;
      return block(`<div class="thm-box thm-${cls}">${withLead(lead, rest)}</div>`);
    }
    switch (env) {
      case "abstract":
        return block(`<div class="abstract">${withLead("<strong>Abstract.</strong>", content)}</div>`);
      case "center": case "flushleft": case "flushright": {
        const align = env === "center" ? "center" : env === "flushleft" ? "left" : "right";
        return block(`<div style="text-align:${align}">${paras(content)}</div>`);
      }
      case "minipage": {
        let c = content;
        for (let k = 0; k < 3; k++) c = stripLeadOpt(c)[1];
        c = stripLeadGroup(c)[1];
        return block(`<div class="minipage" style="display:inline-block;vertical-align:top;max-width:100%">${paras(c)}</div>`);
      }
      case "multicols": case "multicols*":
        return block(`<div style="column-count:2;gap:2em">${paras(stripLeadGroup(content)[1])}</div>`);
      case "quote": case "quotation":
        return block(`<blockquote style="margin:1rem 2rem;font-style:italic">${paras(content)}</blockquote>`);
      case "verse":
        return block(`<div style="margin:1rem 2rem;font-style:italic;white-space:pre-line">${inline(content.trim())}</div>`);
      case "block": case "alertblock": case "exampleblock": {
        const [title, rest] = stripLeadGroup(content);
        return block(`<div class="thm-box"><span class="thm-label">${inline(title ?? "")}</span> ${paras(rest)}</div>`);
      }
    }
    if (TRANSPARENT_ENVS.has(env)) {
      // Drop the leading arguments of envs that take one ({max width=...}, {english}).
      const c = /^(?:adjustbox|spacing|otherlanguage)$/.test(env) ? stripLeadGroup(content)[1] : content;
      return `\n${c}\n`;
    }
    // Unknown environment: never drop its content; show it under a small label.
    if (!warnings.find((w) => w.env === env)) warnings.push({ env, reason: "Not supported in browser preview" });
    const [, rest] = stripLeadOpt(content);
    return block(
      `<div class="env-unknown" style="margin:0.9rem 0">` +
      `<div class="unknown-env" style="display:inline-block;font-size:0.72em;padding:0.05rem 0.45rem;margin-bottom:0.3rem">${escapeHtml(env)}</div>` +
      `${paras(rest)}</div>`
    );
  };
  {
    const WRAP_RE = /\\begin\{([^}]+)\}((?:(?!\\begin\{)[\s\S])*?)\\end\{\1\}/g;
    for (let guard = 0; guard < 60; guard++) {
      const next = body.replace(WRAP_RE, renderWrapper);
      if (next === body) break;
      body = next;
    }
  }
  body = body.replace(/\x01\d+\x01/g, "");

  // ── Phase 2: inline on remaining plain text ──────────────────────────────
  body = inline(body);

  // ── Phase 3: paragraph splitting ─────────────────────────────────────────
  body = splitParagraphs(body);

  // ── Phase 4: restore placeholders ───────────────────────────────────────
  // Reverse insertion order: inner placeholders (inserted first) are resolved
  // after the outer html that embeds them.
  for (const [ph, html] of [...blocks].reverse()) {
    body = body.split(ph).join(html);
  }

  // ── Phase 5: append footnotes ────────────────────────────────────────────
  if (footnoteList.length > 0) {
    const footHtml = footnoteList
      .map((txt, i) => `<div class="footnote-item"><sup class="footnote-num">${i + 1}</sup> ${txt}</div>`)
      .join("");
    body += `<div class="footnote-bar"><hr class="footnote-rule"/>${footHtml}</div>`;
  }

  let html = restoreEscapes(header + body, "html");
  html = html.replace(/\x00I(\d+)\x00/g, (_, k: string) => inlineTokens[+k] ?? "");
  // Placeholders whose html was dropped (e.g. inside a stripped command)
  html = html.replace(/\x00B\d+\x00/g, "");
  return { html, warnings, macros: { ...defs.mathOps } };
}

// ── Helper: paragraphs around block placeholders ─────────────────────────────
function splitParagraphs(body: string): string {
  return body
    .split(/\n[ \t]*\n/)
    .map((chunk) => {
      const t = chunk.trim();
      if (!t) return "";
      if (/^\x00B\d+\x00$/.test(t) || t.startsWith("<")) return t;
      // Block placeholders (headings, tables, lists, display math) never go
      // inside a <p>: split the chunk around them and wrap only the text runs.
      return t
        .split(/(\x00B\d+\x00)/)
        .map((part) => {
          if (/^\x00B\d+\x00$/.test(part)) return part;
          const inner = part.replace(/\n/g, " ").trim();
          if (!inner) return "";
          return inner.startsWith("<") ? inner : `<p>${inner}</p>`;
        })
        .filter(Boolean)
        .join("\n");
    })
    .filter(Boolean)
    .join("\n");
}

// ── Helper: math block HTML ──────────────────────────────────────────────────
function mathBlock(math: string): string {
  return `<div class="math-block" data-math="${encodeMath(math)}"></div>`;
}

function numberedMathBlock(math: string, num: string): string {
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
function sanitizeMathForKaTeX(math: string): string {
  // bm package: \bm{x} -> \boldsymbol{x}  (KaTeX supports boldsymbol, not bm)
  return math.replace(/\\bm\{/g, "\\boldsymbol{");
}

// ── Inline processing ─────────────────────────────────────────────────────────

const TEXT_SYMBOLS: Record<string, string> = {
  textbullet: "•", textdagger: "†", textdaggerdbl: "‡", dag: "†", ddag: "‡", S: "§", P: "¶",
  textsection: "§", textparagraph: "¶", copyright: "©", textcopyright: "©", textregistered: "®",
  texttrademark: "™", textdegree: "°", pounds: "£", textsterling: "£", euro: "€", texteuro: "€",
  textellipsis: "…", checkmark: "✓", textendash: "\u2013", textemdash: "\u2014", textquoteleft: "‘",
  textquoteright: "’", textquotedblleft: "“", textquotedblright: "”", guillemotleft: "«",
  guillemotright: "»", textless: "&lt;", textgreater: "&gt;", textbar: "|", textperiodcentered: "·",
  textmu: "µ", textonehalf: "½", textonequarter: "¼", textthreequarters: "¾", texttimes: "×",
};

const CITE_NAMES = "cite|citep|citet|citealt|citealp|citeauthor|citeyear|citeyearpar|citenum|parencite|textcite|autocite|footcite|supercite|Cite|Citep|Citet|Parencite|Textcite|Autocite|Citeauthor";

/** Static version (no labels, no footnote collection): bibliography text, labels */
function processInlineStatic(text: string, preEscaped = false): string {
  return processInline(text, {
    labels: new Map(), citeMap: new Map(), citeAuthorMap: new Map(), footnotes: [], nextFoot: () => 0,
  }, preEscaped);
}

const mathSpan = (m: string) => `<span class="math-inline" data-math="${encodeMath(m)}"></span>`;

function renderCite(c: CmdMatch, ctx: InlineCtx, rec: (s: string) => string): string {
  const keys = c.req[0].split(",").map((k) => k.trim()).filter(Boolean);
  const [o1, o2] = c.opt;
  const pre = o2 !== undefined ? o1 : undefined;
  const post = o2 !== undefined ? o2 : o1;
  const preH = pre?.trim() ? `${rec(pre.trim())} ` : "";
  const postH = post?.trim() ? `, ${rec(post.trim())}` : "";
  const num = (k: string) => { const v = ctx.citeMap.get(k); return v !== undefined ? String(v) : k; };
  const numeric = () => `<cite class="ref">[${preH}${keys.map(num).join(", ")}${postH}]</cite>`;
  const ay = keys.map((k) => ctx.citeAuthorMap.get(k));
  const allAy = keys.length > 0 && ay.every(Boolean);
  const split = (s: string): [string, string] => {
    const m = s.match(/^(.*?)\s*\(([^()]*)\)$/);
    return m ? [m[1], m[2]] : [s, ""];
  };
  const name = c.name.toLowerCase();
  if (!allAy) return numeric();
  const parts = ay.map((s) => split(s!));
  switch (name) {
    case "citep": case "parencite": case "autocite":
      return `<cite class="ref">(${preH}${parts.map(([a, y]) => (y ? `${a}, ${y}` : a)).join("; ")}${postH})</cite>`;
    case "citealt":
      return `<cite class="ref">${preH}${parts.map(([a, y]) => `${a} ${y}`.trim()).join("; ")}${postH}</cite>`;
    case "citealp":
      return `<cite class="ref">${preH}${parts.map(([a, y]) => (y ? `${a}, ${y}` : a)).join("; ")}${postH}</cite>`;
    case "citeauthor":
      return `<cite class="ref">${parts.map(([a]) => a).join("; ")}</cite>`;
    case "citeyear":
      return `<cite class="ref">${parts.map(([, y]) => y).join("; ")}</cite>`;
    case "citeyearpar":
      return `<cite class="ref">(${parts.map(([, y]) => y).join("; ")})</cite>`;
    case "citenum": case "supercite": case "footcite":
      return numeric();
    default: // cite, citet, textcite: author (year) in author-year mode
      return `<cite class="ref">${parts.map(([a, y], i) =>
        y ? `${a} (${i === 0 ? preH : ""}${y}${i === parts.length - 1 ? postH : ""})` : a
      ).join("; ")}</cite>`;
  }
}

function renderRef(c: CmdMatch, ctx: InlineCtx): string {
  const keys = c.req[0].split(",").map((k) => k.trim()).filter(Boolean);
  const unresolved = (k: string) => `<span class="ref unresolved" title="Unresolved: ${escapeAttr(k)}">??</span>`;
  const one = (k: string) => {
    const L = ctx.labels.get(k);
    if (!L) return unresolved(k);
    switch (c.name) {
      case "ref": case "labelcref": case "nameref":
        return `<span class="ref">${L.num}</span>`;
      case "eqref":
        return `<span class="ref">(${L.num})</span>`;
      case "pageref":
        return `<span class="ref" title="Page numbers are set when the PDF is compiled">?</span>`;
      default: // cref, Cref, autoref, vref
        return `<span class="ref">${L.kind === "equation" ? `Eq. (${L.num})` : `${L.kind} ${L.num}`}</span>`;
    }
  };
  const parts = keys.map(one);
  if (parts.length <= 1) return parts.join("") || unresolved("");
  return parts.length === 2 ? `${parts[0]} and ${parts[1]}` : `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

function processInline(text: string, ctx: InlineCtx, preEscaped = false): string {
  // ── Security: neutralize literal HTML from the (untrusted) document source ──
  // The rendered output is injected via dangerouslySetInnerHTML, so any raw
  // `<`, `>`, `&` in prose OR inside a command argument (e.g. \textbf{<script>})
  // must be escaped BEFORE the formatting rules below re-emit their captures
  // into HTML. Math is exempt: encodeMath() un-escapes the entities so KaTeX
  // still receives the raw characters. Quotes are intentionally NOT escaped so
  // smart-quote typography keeps working; attribute-context safety (href/title)
  // is handled at each of those sinks. `preEscaped` avoids double-escaping when
  // a caller (e.g. the \footnote handler) passes already-escaped content.
  if (!preEscaped) text = escapeHtml(text);
  const rec = (t: string) => processInline(t, ctx, true);

  // Inline math: $...$ and \( ... \)  ($$...$$ is handled as block in Phase 1)
  text = text.replace(/\$([^$\n]+?)\$/g, (_, m: string) => mathSpan(m));
  text = text.replace(/(?<!\\)\\\(([\s\S]+?)\\\)/g, (_, m: string) => mathSpan(m));
  text = replaceCmd(text, "ensuremath", 1, (c) => mathSpan(c.req[0]));

  // ── Footnotes, before any other rule so the note gets the full treatment ──
  text = replaceCmd(text, "footnote", 1, (c) => {
    const nf = ctx.nextFoot();
    // content is already HTML-escaped (escape-first); don't re-escape it.
    const note = rec(c.req[0]);
    ctx.footnotes.push(note);
    // Tooltip: the note as plain text (tags and placeholder tokens removed).
    const title = note.replace(/<[^>]*>/g, "").replace(/\x00[BI]\d+\x00/g, "").replace(/\s+/g, " ").trim();
    return `<sup class="footnote" title="${escapeAttr(title)}">${nf}</sup>`;
  }, 1);

  // siunitx before accents and typography (units contain ^ and ~)
  text = renderSiunitx(text);

  // Accents (\'e, \c{c}, \ss{} ...) before the typography rules eat ' and ~
  text = renderAccents(text);
  text = text.replace(/\\([a-zA-Z]+)(?![a-zA-Z])(?:\{\})?/g, (m, w: string) => TEXT_SYMBOLS[w] ?? m);

  // Text formatting: balanced arguments, outermost first, so nesting is kept.
  const wrap = (names: string, open: string, close: string) => {
    text = replaceCmd(text, names, 1, (c) => open + c.req[0] + close);
  };
  wrap("textbf", "<strong>", "</strong>");
  wrap("textit|emph|textsl", "<em>", "</em>");
  wrap("underline|uline", "<u>", "</u>");
  wrap("sout|st", "<s>", "</s>");
  wrap("texttt", "<code>", "</code>");
  wrap("textsc", '<span style="font-variant:small-caps">', "</span>");
  wrap("textsuperscript", "<sup>", "</sup>");
  wrap("textsubscript", "<sub>", "</sub>");
  wrap("textrm|textsf|textup|textnormal|textmd|text|mbox|fbox|hbox|shortstack|hl|mark", "", "");
  text = replaceCmd(text, "makecell", 1, (c) => c.req[0], 1);
  text = replaceCmd(text, "texorpdfstring", 2, (c) => c.req[0]);
  // \parbox[pos][height][inner]{width}{content} -> content (drop the box sizing
  // args, which otherwise leak as literal "[2.8cm]" text in photo-CV templates).
  text = replaceCmd(text, "parbox", 2, (c) => c.req[1], 3);
  text = replaceCmd(text, "makebox|framebox", 1, (c) => c.req[0], 2);
  text = replaceCmd(text, "resizebox", 3, (c) => c.req[2]);
  text = replaceCmd(text, "scalebox", 2, (c) => c.req[1]);

  // ── Citations ──────────────────────────────────────────────────────────────
  text = replaceCmd(text, CITE_NAMES, 1, (c) => renderCite(c, ctx, rec), 2);

  // ── Cross-references ──────────────────────────────────────────────────────
  text = replaceCmd(text, "crefrange|Crefrange", 2, (c) => {
    const a = ctx.labels.get(c.req[0].trim());
    const b = ctx.labels.get(c.req[1].trim());
    if (!a || !b) return `<span class="ref unresolved">??</span>`;
    return a.kind === "equation"
      ? `<span class="ref">Eqs. (${a.num}) to (${b.num})</span>`
      : `<span class="ref">${a.kind} ${a.num} to ${b.num}</span>`;
  });
  text = replaceCmd(text, "ref|eqref|cref|Cref|autoref|Autoref|vref|Vref|labelcref|nameref|pageref", 1, (c) => renderRef(c, ctx));
  text = text.replace(/\\label\{[^}]*\}/g, "");  // consume (already in map)

  // URLs and hrefs: safeHref blocks javascript:/data: schemes and any value that
  // could break out of the href="" attribute. u/label are already escaped for
  // `<>&` (escape-first); the visible label is safe HTML text as-is.
  text = replaceCmd(text, "url|nolinkurl", 1, (c) =>
    `<a href="${safeHref(c.req[0])}" target="_blank" rel="noopener noreferrer">${c.req[0]}</a>`);
  text = replaceCmd(text, "href", 2, (c) =>
    `<a href="${safeHref(c.req[0])}" target="_blank" rel="noopener noreferrer">${c.req[1]}</a>`);

  // Images outside a figure
  text = replaceCmd(text, "includegraphics", 1, (c) =>
    `<span class="fig-placeholder" style="display:inline-block;padding:0.5rem 0.9rem">Figure: ${c.req[0].trim()}</span>`, 1);

  // Author lists
  text = text.replace(/\\and(?![a-zA-Z])/g, " &amp; ");

  // Special symbols
  text = text.replace(/\\LaTeX(?![a-zA-Z])(?:\{\})?/g, "L<sup>a</sup>T<sub>e</sub>X");
  text = text.replace(/\\TeX(?![a-zA-Z])(?:\{\})?/g, "T<sub>e</sub>X");
  text = text.replace(/\\BibTeX(?![a-zA-Z])(?:\{\})?/g, "B<sub>IB</sub>T<sub>E</sub>X");
  text = text.replace(/\\today(?![a-zA-Z])/g, new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));

  // Typography
  text = text.replace(/---/g, "—");
  text = text.replace(/--/g, "–");
  text = text.replace(/``/g, "“");
  text = text.replace(/''/g, "”");
  text = text.replace(/`/g, "‘");
  text = text.replace(/(?<![a-zA-Z])'/g, "’");
  text = text.replace(/\\(?:ldots|dots|textellipsis)(?![a-zA-Z])(?:\{\})?/g, "…");

  // Spacing / line breaks: consume the optional \\[length] / \\* spacing arg
  text = text.replace(/\\\\\*?(?:\s*\[[^\]]*\])?/g, "<br>");
  text = text.replace(/\\(?:newline|linebreak)(?![a-zA-Z])/g, "<br>");
  text = text.replace(/\\,/g, "\u2009");
  text = text.replace(/\\[;:> ]/g, " ");
  text = text.replace(/\\[!/@-]/g, "");
  text = text.replace(/~/g, " ");
  text = replaceCmd(text, "vspace|hspace", 1, () => " ");
  text = text.replace(/\\(kern|mspace)\*?\{[^}]*\}/g, " ");
  text = text.replace(/\\(?:bigskip|medskip|smallskip|noindent|indent|centering|newpage|clearpage|cleardoublepage|pagebreak|nopagebreak|par|vfill|hfill|null|strut|quad|qquad)(?![a-zA-Z])/g, (m) =>
    /quad/.test(m) ? " " : "");

  // Rules
  text = replaceCmd(text, "rule", 2, () => "<hr>", 1);
  text = text.replace(/\\hrule(?:\s+height\s+[0-9.]+\s*[a-z]*)?(?![a-zA-Z])/g, "<hr>");

  // Thanks
  text = replaceCmd(text, "thanks", 1, () => "<sup>*</sup>");

  // \boxed{}, \bm{}, \substack{} in text mode: hand to KaTeX
  text = replaceCmd(text, "boxed", 1, (c) => mathSpan(`\\boxed{${c.req[0]}}`));
  text = replaceCmd(text, "bm", 1, (c) => mathSpan(`\\boldsymbol{${c.req[0]}}`));
  text = replaceCmd(text, "substack", 1, (c) => mathSpan(`\\substack{${c.req[0]}}`));

  // ── Colour commands ────────────────────────────────────────────────────────
  text = replaceCmd(text, "textcolor", 2, (c) => c.req[1], 1);
  text = replaceCmd(text, "fcolorbox", 3, (c) =>
    `<span style="border:1px solid var(--border);padding:0.1em 0.35em;border-radius:4px;font-size:0.82em">${c.req[2]}</span>`, 1);
  text = replaceCmd(text, "colorbox", 2, (c) => c.req[1], 1);
  text = replaceCmd(text, "color|pagecolor", 1, () => "", 1);
  text = text.replace(/\\normalcolor(?![a-zA-Z])/g, "");

  // ── Font size / weight / shape / alignment switches ──────────────────────
  text = text.replace(
    /\\(?:tiny|scriptsize|footnotesize|small|normalsize|large|Large|LARGE|huge|Huge|bfseries|itshape|upshape|slshape|scshape|mdseries|rmfamily|sffamily|ttfamily|normalfont|em|bf|it|rm|sf|tt|sc|raggedright|raggedleft|justifying)(?![a-zA-Z])/g, ""
  );

  // ── Fill commands ─────────────────────────────────────────────────────────
  text = text.replace(/\\dotfill(?![a-zA-Z])/g, '<span style="letter-spacing:0.15em">⋯⋯⋯⋯⋯⋯⋯⋯</span>');
  text = text.replace(/\\hrulefill(?![a-zA-Z])/g, '<span style="display:inline-block;flex:1;border-bottom:1px solid currentColor;min-width:2rem;margin:0 0.25rem;vertical-align:middle"></span>');

  // Stray environment markers (unclosed environments) and list items
  text = text.replace(/\\(?:begin|end)\{[^}]*\}/g, "");
  text = text.replace(/\\item(?![a-zA-Z])(?:\s*\[[^\]]*\])?/g, "");

  // ── Argument placeholders (#1, #2, ...) left over from un-stripped commands ──
  text = text.replace(/#\d/g, "");

  // Generic \cmd{arg} -> arg (last resort), innermost groups first
  for (let k = 0; k < 8; k++) {
    const next = text.replace(/\\[a-zA-Z]+\*?\{([^{}]*)\}/g, "$1");
    if (next === text) break;
    text = next;
  }
  text = text.replace(/\\[a-zA-Z]+\*?/g, "");
  for (let k = 0; k < 8; k++) {
    const next = text.replace(/\{([^{}]*)\}/g, "$1");
    if (next === text) break;
    text = next;
  }
  return text.replace(/[{}]/g, "");
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function encodeMath(math: string): string {
  // Math may have been HTML-escaped upstream (escape-first in processInline);
  // KaTeX needs the raw characters, so reverse the entity encoding here. This
  // is a no-op for block-phase math (which is never escaped).
  const raw = restoreEscapes(sanitizeMathForKaTeX(math), "raw")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
  return encodeURIComponent(raw.trim());
}

function safeHref(url: string): string {
  const u = url.trim();
  // Reject any value that could break out of the href="" attribute or smuggle
  // markup, regardless of scheme (defends the \url / \href attribute context).
  if (/["'<>`\s]/.test(u) || /&(?:quot|lt|gt|#\d);/i.test(u)) return "#";
  if (/^https?:\/\//i.test(u) || /^mailto:/i.test(u) || /^\//.test(u)) return u;
  return "#";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Escape a value for an HTML attribute context. Assumes `<>&` are already
 * escaped (escape-first) and only neutralizes the quote characters that could
 * otherwise terminate a `title="..."` / `href="..."` attribute.
 */
function escapeAttr(text: string): string {
  return text.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
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
  text = renderAccents(protectEscapes(text));
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
  // HTML-escape: \title / \author / \date land in element text via the header,
  // so literal markup in them must not survive to dangerouslySetInnerHTML.
  return restoreEscapes(escapeHtml(text.trim()), "html");
}
