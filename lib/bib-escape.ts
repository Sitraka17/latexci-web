/**
 * lib/bib-escape.ts: shared helpers for the citation lookup routes
 * (arXiv, DOI, PubMed, ISBN). Pure functions, no I/O, edge-runtime safe.
 */

// ── XML / HTML entities ──────────────────────────────────────────────────────

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
};

/**
 * Decode XML entities in a single pass, so "&amp;lt;" becomes "&lt;" (one
 * level), never "<". Unknown named entities are left untouched.
 */
export function decodeXmlEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, body: string) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X"
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return m;
      try { return String.fromCodePoint(code); } catch { return m; }
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? m;
  });
}

/**
 * Author names from each <author> block. Only the <name> child is read:
 * stripping the block's tags first (the old behaviour) glued the
 * <arxiv:affiliation> text onto the name.
 */
export function arxivAuthors(entry: string): string[] {
  const out: string[] = [];
  const re = /<author\b[^>]*>([\s\S]*?)<\/author>/gi;
  let m;
  while ((m = re.exec(entry)) !== null) {
    const name = m[1].match(/<name\b[^>]*>([\s\S]*?)<\/name>/i)?.[1] ?? "";
    const clean = decodeXmlEntities(name.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
    if (clean) out.push(clean);
  }
  return out;
}

// ── LaTeX escaping ───────────────────────────────────────────────────────────

/** True when every `{` has a matching `}` (backslash-escaped braces ignored). */
export function bracesBalanced(s: string): boolean {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "\\") { i++; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth < 0) return false;
  }
  return depth === 0;
}

export interface EscapeOptions {
  /**
   * Keep balanced `$...$` segments as math (arXiv / CrossRef titles often
   * carry real TeX). When the number of unescaped `$` is odd, every `$` is
   * escaped instead.
   */
  keepMath?: boolean;
}

/**
 * Escape the LaTeX specials that break a .bib field (& % $ # _ and a bare ^)
 * in one pass. Already-escaped sequences (`\&`, `\_`, ...) are kept as is, so
 * the function is idempotent. Balanced braces are kept (they are BibTeX
 * grouping); if the braces are unbalanced every brace is escaped so the field
 * can never swallow the rest of the entry.
 */
export function escapeLatex(input: string, opts: EscapeOptions = {}): string {
  const s = input;
  const escapeBraces = !bracesBalanced(s);

  // Positions of unescaped `$` that delimit math when keepMath is on.
  let mathDelims: Set<number> | null = null;
  if (opts.keepMath) {
    const pos: number[] = [];
    for (let i = 0; i < s.length; i++) {
      if (s[i] === "\\") { i++; continue; }
      if (s[i] === "$") pos.push(i);
    }
    if (pos.length > 0 && pos.length % 2 === 0) mathDelims = new Set(pos);
  }

  let out = "";
  let inMath = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "\\") {
      const next = s[i + 1];
      if (next === undefined) { out += "\\textbackslash{}"; continue; }
      // Already escaped special (\&, \{ ...) or a TeX command: copy the pair.
      out += c + next; i++; continue;
    }
    if (mathDelims?.has(i)) { inMath = !inMath; out += c; continue; }
    if (inMath) { out += c; continue; }
    if (c === "&" || c === "%" || c === "$" || c === "#" || c === "_") { out += "\\" + c; continue; }
    if (c === "^") { out += "\\^{}"; continue; }
    if (escapeBraces && (c === "{" || c === "}")) { out += "\\" + c; continue; }
    out += c;
  }
  return out;
}

/** Decode entities, collapse whitespace, then LaTeX-escape a text field. */
export function bibText(raw: string, opts: EscapeOptions = {}): string {
  return escapeLatex(decodeXmlEntities(raw).replace(/\s+/g, " ").trim(), opts);
}

/** Make a citation key safe: letters (any script), digits, `_ : -` only. */
export function safeKeyPart(s: string): string {
  return s.normalize("NFC").replace(/[^\p{L}\p{N}_:-]/gu, "");
}

// ── DOI ──────────────────────────────────────────────────────────────────────

/**
 * Strip the common DOI wrappers: "doi:", "DOI ", https://doi.org/,
 * http://dx.doi.org/, doi.org/ (with or without scheme or www).
 */
export function normalizeDoi(raw: string): string {
  let d = raw.trim()
    .replace(/^(?:https?:\/\/)?(?:www\.)?(?:dx\.)?doi\.org\//i, "")
    .replace(/^doi(?:\s*:\s*|\s+)(?=10\.)/i, "");
  if (/%2f/i.test(d)) {
    try { d = decodeURIComponent(d); } catch { /* keep as typed */ }
  }
  return d.trim();
}

// ── ISBN ─────────────────────────────────────────────────────────────────────

export type IsbnResult = { ok: true; isbn: string } | { ok: false; reason: string };

/**
 * Normalise an ISBN-10 / ISBN-13. A leading label ("ISBN", "ISBN-13:",
 * "ISBN10", "urn:isbn:") is removed first so its digits never leak into the
 * number; then spaces and hyphens are dropped and the check digit verified.
 */
export function parseIsbn(raw: string): IsbnResult {
  const body = raw.trim()
    .replace(/^(?:urn:)?isbn(?:[\s-]?(?:10|13))?\s*:?\s*/i, "")
    .replace(/[\s‐-―-]/g, "")
    .toUpperCase();
  if (/^\d{9}[\dX]$/.test(body)) {
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      const v = body[i] === "X" ? 10 : Number(body[i]);
      sum += (10 - i) * v;
    }
    return sum % 11 === 0 ? { ok: true, isbn: body } : { ok: false, reason: "ISBN-10 check digit does not match" };
  }
  if (/^\d{13}$/.test(body)) {
    if (!/^97[89]/.test(body)) return { ok: false, reason: "ISBN-13 must start with 978 or 979" };
    let sum = 0;
    for (let i = 0; i < 13; i++) sum += Number(body[i]) * (i % 2 === 0 ? 1 : 3);
    return sum % 10 === 0 ? { ok: true, isbn: body } : { ok: false, reason: "ISBN-13 check digit does not match" };
  }
  return { ok: false, reason: "must be 10 or 13 digits" };
}

// ── PubMed authors ───────────────────────────────────────────────────────────

const SUFFIXES = /^(Jr|Sr|II|III|IV|V|VI)\.?$/;
const INITIALS = /^\p{Lu}{1,4}$/u;

export interface PubmedAuthor { name: string; authtype?: string }

/**
 * Convert a PubMed esummary author into a BibTeX name.
 *   "Polack FP"          -> "Polack, F. P."
 *   "Pérez Marc G"       -> "Pérez Marc, G."
 *   "Frenck RW Jr"       -> "Frenck, Jr, R. W."
 *   "de Azevedo WF Jr"   -> "de Azevedo, Jr, W. F."
 *   CollectiveName group -> "{C4591001 Clinical Trial Group}"
 * Returns the escaped name plus the family name (for cite keys).
 */
export function pubmedAuthor(a: PubmedAuthor): { bib: string; family: string } {
  const name = decodeXmlEntities(a.name ?? "").replace(/\s+/g, " ").trim();
  if (!name) return { bib: "", family: "" };
  if (a.authtype === "CollectiveName") {
    return { bib: `{${escapeLatex(name)}}`, family: name.split(" ")[0] };
  }
  const tokens = name.split(" ");
  let suffix = "";
  if (tokens.length >= 3 && SUFFIXES.test(tokens[tokens.length - 1]) && INITIALS.test(tokens[tokens.length - 2])) {
    suffix = tokens.pop()!.replace(/\.$/, "");
  }
  if (tokens.length >= 2 && INITIALS.test(tokens[tokens.length - 1])) {
    const initials = Array.from(tokens.pop()!).map(ch => `${ch}.`).join(" ");
    const family = tokens.join(" ");
    const parts = [family, suffix, initials].filter(Boolean).map(p => escapeLatex(p));
    return { bib: parts.join(", "), family: tokens.filter(t => !/^\p{Ll}/u.test(t)).join("") || family };
  }
  // No recognisable initials: keep the name verbatim as one unit.
  return { bib: `{${escapeLatex(name)}}`, family: tokens[0] };
}

// ── Title capitals ───────────────────────────────────────────────────────────

/** Two or more capitals, or a capital plus a digit: DNA, mRNA, COVID-19, GPU. */
function needsProtection(word: string): boolean {
  const caps = (word.match(/\p{Lu}/gu) ?? []).length;
  return caps >= 2 || (caps >= 1 && /\p{N}/u.test(word));
}

/**
 * Brace the words of an (already escaped) title whose capitals a BibTeX style
 * would lowercase: `DNA` -> `{DNA}`, `BNT162b2` -> `{BNT162b2}`. Text already
 * inside braces, `$...$` math and TeX command names are left alone, so the
 * function never double-wraps and is idempotent.
 */
export function protectTitleCaps(title: string): string {
  let out = "";
  let depth = 0;
  let inMath = false;
  let i = 0;
  while (i < title.length) {
    const c = title[i];
    if (c === "\\") {
      // Copy a control word (\LaTeX) or a control symbol (\&) verbatim.
      const cmd = title.slice(i).match(/^\\(?:[A-Za-z]+|[\s\S])/)?.[0] ?? c;
      out += cmd;
      i += cmd.length;
      continue;
    }
    if (c === "$") { inMath = !inMath; out += c; i++; continue; }
    if (!inMath && c === "{") { depth++; out += c; i++; continue; }
    if (!inMath && c === "}") { depth = Math.max(0, depth - 1); out += c; i++; continue; }
    if (inMath || depth > 0) { out += c; i++; continue; }
    const w = title.slice(i).match(/^[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/u)?.[0];
    if (w) {
      out += needsProtection(w) ? `{${w}}` : w;
      i += w.length;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

// ── Journal names ────────────────────────────────────────────────────────────

const SMALL_WORDS = new Set([
  "a", "an", "the", "and", "or", "nor", "but", "of", "in", "on", "at", "to",
  "for", "by", "with", "from", "as", "per", "via", "vs", "de", "des", "du",
  "la", "le", "les", "et", "für", "und", "der", "die", "das",
]);

/**
 * NLM writes full journal names in sentence case ("The New England journal
 * of medicine"). Capitalise every word except small ones, which stay
 * lowercase unless they come first or after a colon, period or parenthesis.
 * Existing capitals are kept (JAMA, BMJ).
 */
export function titleCaseJournal(name: string): string {
  let first = true;
  return name.replace(/\p{L}[\p{L}'’]*|[:.(]/gu, (w) => {
    if (w === ":" || w === "." || w === "(") { first = true; return w; }
    const small = !first && SMALL_WORDS.has(w.toLowerCase());
    first = false;
    if (small) return w.toLowerCase();
    return w[0].toUpperCase() + w.slice(1);
  });
}

// ── Book editions ────────────────────────────────────────────────────────────

const ORDINAL_WORDS = [
  "", "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh",
  "Eighth", "Ninth", "Tenth", "Eleventh", "Twelfth",
];

/**
 * Normalise an edition statement for BibTeX, whose styles print
 * "<edition> edition": "2nd ed." -> "Second", "3rd edition" -> "Third",
 * "Revised edition" -> "Revised". Anything else is kept as given.
 */
export function normalizeEdition(raw: string): string {
  const s = raw.replace(/\s+/g, " ").trim().replace(/[.,;:]+$/, "");
  if (!s) return "";
  const num = s.match(/^(\d{1,3})(?:st|nd|rd|th|e|ème|\.)?(?=$|[\s.,])/i);
  if (num) {
    const n = Number(num[1]);
    return ORDINAL_WORDS[n] ?? `${n}th`;
  }
  const word = s.match(/^(\p{L}+)\s+(?:ed\.?|edition|édition)$/iu);
  if (word) return word[1][0].toUpperCase() + word[1].slice(1).toLowerCase();
  return s;
}

/**
 * Edition statement embedded in a title or subtitle ("Second Edition",
 * "3rd ed."), normalised, or "" when there is none.
 */
export function editionFromText(text: string): string {
  const m = text.match(
    /\b(?:\d{1,3}(?:st|nd|rd|th)?|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|revised|updated|expanded)\s+(?:ed\.|edition)(?=$|[\s,;:)])/i,
  );
  return m ? normalizeEdition(m[0]) : "";
}
