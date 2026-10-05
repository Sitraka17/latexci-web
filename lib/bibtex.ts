/**
 * lib/bibtex.ts — BibTeX parser, cleaner, formatter
 * Handles nested braces, multiple entry types, author normalization.
 */

export interface BibEntry {
  type: string;          // article, book, inproceedings…
  key: string;           // citation key
  fields: Record<string, string>;
  /**
   * Fields whose value must be written without braces: an undefined macro
   * such as `month = jan`, or a concatenation that still references one
   * (`month = jan # "~15"`). The stored value is then the raw expression.
   */
  bare?: string[];
}

export interface CleanOptions {
  sort?: "key" | "year" | "type" | "none";
  removeDuplicates?: boolean;
  stripFields?: string[];           // e.g. ["abstract","file","url"]
  normalizeAuthors?: boolean;
  uppercaseTypes?: boolean;
}

export interface CleanResult {
  output: string;
  stats: { total: number; removed: number; fieldsStripped: number };
  warnings: string[];
}

// ── Parser ──────────────────────────────────────────────────────────────────

/** Read a brace-balanced substring starting just after the opening `{`. */
function readBraced(src: string, start: number): { value: string; end: number } {
  let depth = 1;
  let i = start;
  while (i < src.length && depth > 0) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") depth--;
    if (depth > 0) i++;
  }
  // If depth never reached 0 (unmatched brace), i === src.length.
  // Clamp end to src.length so callers never step past the buffer.
  return { value: src.slice(start, i), end: Math.min(i + 1, src.length) };
}

/**
 * Read a quoted substring starting just after `"`. A `"` inside braces does
 * not end the value (BibTeX rule: `"M{\"u}ller"`).
 */
function readQuoted(src: string, start: number): { value: string; end: number } {
  let i = start;
  let depth = 0;
  while (i < src.length && !(src[i] === '"' && depth === 0)) {
    if (src[i] === "\\") i++; // skip escaped char
    else if (src[i] === "{") depth++;
    else if (src[i] === "}") depth = Math.max(0, depth - 1);
    i++;
  }
  // If no closing `"` found (malformed BibTeX), i === src.length.
  // Clamp end to src.length so callers never step past the buffer.
  return { value: src.slice(start, Math.min(i, src.length)), end: Math.min(i + 1, src.length) };
}

interface Macro { value: string; bare: boolean }
type Piece =
  | { kind: "lit"; text: string }
  | { kind: "num"; text: string }
  | { kind: "macro"; text: string };

/**
 * Parse `name = value` pairs. A value is one or more pieces joined by `#`:
 * `{braced}`, `"quoted"`, a number, or a macro name. Macros defined by
 * `@string` are expanded; unknown macros (jan, feb, ...) stay bare.
 */
function parseFieldList(
  body: string,
  macros: Map<string, Macro>,
): Array<{ name: string; value: string; bare: boolean }> {
  const out: Array<{ name: string; value: string; bare: boolean }> = [];
  let i = 0;
  while (i < body.length) {
    // Skip whitespace & commas
    while (i < body.length && /[\s,]/.test(body[i])) i++;
    if (i >= body.length) break;

    // Read field name
    const nameStart = i;
    while (i < body.length && /[a-zA-Z0-9_\-:.+]/.test(body[i])) i++;
    const name = body.slice(nameStart, i).toLowerCase().trim();
    if (!name) { i++; continue; }

    // Skip whitespace then `=`
    while (i < body.length && /\s/.test(body[i])) i++;
    if (body[i] !== "=") continue;
    i++; // skip `=`

    const pieces: Piece[] = [];
    for (;;) {
      while (i < body.length && /\s/.test(body[i])) i++;
      if (i >= body.length) break;
      if (body[i] === "{") {
        const r = readBraced(body, i + 1);
        pieces.push({ kind: "lit", text: r.value });
        i = r.end;
      } else if (body[i] === '"') {
        const r = readQuoted(body, i + 1);
        pieces.push({ kind: "lit", text: r.value });
        i = r.end;
      } else {
        const start = i;
        while (i < body.length && !/[\s,#{}"()]/.test(body[i])) i++;
        const text = body.slice(start, i);
        if (!text) break;
        pieces.push({ kind: /^\d+$/.test(text) ? "num" : "macro", text });
      }
      while (i < body.length && /\s/.test(body[i])) i++;
      if (body[i] === "#") { i++; continue; }
      break;
    }
    if (pieces.length === 0) continue;

    const resolved = pieces.map(p => {
      if (p.kind !== "macro") return { text: p.text, bare: false, raw: p.kind === "num" ? p.text : `{${p.text}}` };
      const m = macros.get(p.text.toLowerCase());
      if (m && !m.bare) return { text: m.value, bare: false, raw: `{${m.value}}` };
      if (m) return { text: m.value, bare: true, raw: m.value };
      return { text: p.text, bare: true, raw: p.text };
    });
    if (resolved.some(r => r.bare)) {
      out.push({ name, value: resolved.map(r => r.raw).join(" # "), bare: true });
    } else {
      out.push({ name, value: resolved.map(r => r.text).join(""), bare: false });
    }
  }
  return out;
}

/** Index of the delimiter closing an entry opened with `{` or `(`. */
function findEntryEnd(src: string, start: number, close: "}" | ")"): number {
  let depth = 0;
  let inQuote = false;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (c === "\\") { i++; continue; }
    if (c === "{") depth++;
    else if (c === "}") {
      if (depth === 0 && close === "}") return i;
      depth = Math.max(0, depth - 1);
    } else if (c === '"' && depth === 0 && close === ")") inQuote = !inQuote;
    else if (c === ")" && close === ")" && depth === 0 && !inQuote) return i;
  }
  return src.length;
}

export function parseBibTeX(src: string): BibEntry[] {
  const entries: BibEntry[] = [];
  const macros = new Map<string, Macro>();
  // Strip line comments
  const cleaned = src.replace(/^%[^\n]*/gm, "");
  let i = 0;

  while (i < cleaned.length) {
    const at = cleaned.indexOf("@", i);
    if (at === -1) break;
    i = at + 1;

    // Read type
    const typeStart = i;
    while (i < cleaned.length && /[a-zA-Z]/.test(cleaned[i])) i++;
    const type = cleaned.slice(typeStart, i).toLowerCase();
    if (!type) continue;

    // Skip whitespace, then the entry delimiter: `{...}` or `(...)`
    while (i < cleaned.length && /\s/.test(cleaned[i])) i++;
    const open = cleaned[i];
    if (open !== "{" && open !== "(") continue;
    const close = open === "{" ? "}" : ")";
    const end = findEntryEnd(cleaned, i + 1, close);
    const body = cleaned.slice(i + 1, end);
    i = end + 1;

    if (type === "comment" || type === "preamble") continue;
    if (type === "string") {
      for (const f of parseFieldList(body, macros)) {
        macros.set(f.name, { value: f.value, bare: f.bare });
      }
      continue;
    }

    // Citation key: up to the first comma
    const comma = body.indexOf(",");
    const key = (comma === -1 ? body : body.slice(0, comma)).trim();
    if (!key) continue;
    const list = parseFieldList(comma === -1 ? "" : body.slice(comma + 1), macros);

    const fields: Record<string, string> = {};
    const bare: string[] = [];
    for (const f of list) {
      fields[f.name] = f.value;
      if (f.bare && !bare.includes(f.name)) bare.push(f.name);
      else if (!f.bare && bare.includes(f.name)) bare.splice(bare.indexOf(f.name), 1);
    }
    entries.push(bare.length ? { type, key, fields, bare } : { type, key, fields });
  }

  return entries;
}

// ── Formatter ────────────────────────────────────────────────────────────────

const FIELD_ORDER = [
  "author", "editor", "title", "booktitle", "journal", "year", "volume",
  "number", "pages", "month", "publisher", "address", "institution",
  "school", "howpublished", "edition", "series", "doi", "isbn", "issn",
  "url", "note", "abstract", "keywords",
];

export function formatEntry(e: BibEntry, uppercaseType = true, keepOrder = false): string {
  const type = uppercaseType ? e.type.toUpperCase() : e.type;
  const bare = new Set(e.bare ?? []);
  const sorted = keepOrder ? Object.entries(e.fields) : Object.entries(e.fields).sort(([a], [b]) => {
    const ai = FIELD_ORDER.indexOf(a);
    const bi = FIELD_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  const lines = sorted.map(([k, v]) =>
    bare.has(k) ? `  ${k.padEnd(12)} = ${v}` : `  ${k.padEnd(12)} = {${v}}`);
  return `@${type}{${e.key},\n${lines.join(",\n")}\n}`;
}

// ── Author normalization ─────────────────────────────────────────────────────

/** Split on whitespace at brace depth 0 (so `{World Health Organization}` is one token). */
function topLevelTokens(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "\\" && i + 1 < s.length) { cur += c + s[++i]; continue; }
    if (c === "{") depth++;
    else if (c === "}") depth = Math.max(0, depth - 1);
    if (depth === 0 && /\s/.test(c)) {
      if (cur) out.push(cur);
      cur = "";
    } else cur += c;
  }
  if (cur) out.push(cur);
  return out;
}

/** True when the comma sits at brace depth 0. */
function hasTopLevelComma(s: string): boolean {
  let depth = 0;
  for (const c of s) {
    if (c === "{") depth++;
    else if (c === "}") depth = Math.max(0, depth - 1);
    else if (c === "," && depth === 0) return true;
  }
  return false;
}

/** Normalize "First von Last" → "von Last, First"; braced names stay intact. */
function normalizeAuthorName(name: string): string {
  name = name.trim();
  if (!name) return name;
  if (hasTopLevelComma(name)) return name; // already "Last, First"
  const parts = topLevelTokens(name);
  if (parts.length < 2) return name;       // single token or one braced group
  // A lowercase particle (von, van der, de) starts the family name.
  let lastStart = parts.length - 1;
  for (let k = 1; k < parts.length - 1; k++) {
    if (/^[a-z]/.test(parts[k])) { lastStart = k; break; }
  }
  const last = parts.slice(lastStart).join(" ");
  const first = parts.slice(0, lastStart).join(" ");
  return `${last}, ${first}`;
}

/** Split an author list on `and` at brace depth 0 only. */
function splitAuthors(raw: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === "{") depth++;
    else if (c === "}") depth = Math.max(0, depth - 1);
    else if (depth === 0 && /\s/.test(c)) {
      const m = raw.slice(i).match(/^\s+and\s+/i);
      if (m) {
        out.push(raw.slice(start, i));
        i += m[0].length - 1;
        start = i + 1;
      }
    }
  }
  out.push(raw.slice(start));
  return out;
}

export function normalizeAuthors(raw: string): string {
  return splitAuthors(raw)
    .map(normalizeAuthorName)
    .join(" and ");
}

// ── Deduplication ────────────────────────────────────────────────────────────

function entryFingerprint(e: BibEntry): string {
  const doi = e.fields.doi?.toLowerCase().trim();
  if (doi) return `doi:${doi}`;
  const title = e.fields.title?.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
  if (title) return `title:${title}`;
  return `key:${e.key}`;
}

// ── Main clean function ──────────────────────────────────────────────────────

export function cleanBibTeX(src: string, opts: CleanOptions = {}): CleanResult {
  const warnings: string[] = [];
  let entries = parseBibTeX(src);
  const total = entries.length;

  if (!total) {
    warnings.push("No BibTeX entries found. Make sure your input starts with @article{, @book{, etc.");
  }

  // Strip unwanted fields
  let fieldsStripped = 0;
  const strip = (opts.stripFields ?? []).map(f => f.toLowerCase());
  if (strip.length > 0) {
    for (const e of entries) {
      for (const f of strip) {
        if (f in e.fields) {
          delete e.fields[f];
          fieldsStripped++;
        }
      }
    }
  }

  // Normalize authors
  if (opts.normalizeAuthors) {
    for (const e of entries) {
      if (e.fields.author) e.fields.author = normalizeAuthors(e.fields.author);
      if (e.fields.editor) e.fields.editor = normalizeAuthors(e.fields.editor);
    }
  }

  // Deduplicate
  let removed = 0;
  if (opts.removeDuplicates) {
    const seen = new Map<string, string>();
    const deduped: BibEntry[] = [];
    for (const e of entries) {
      const fp = entryFingerprint(e);
      if (seen.has(fp)) {
        warnings.push(`Duplicate removed: @${e.type}{${e.key}} (same as ${seen.get(fp)})`);
        removed++;
      } else {
        seen.set(fp, e.key);
        deduped.push(e);
      }
    }
    entries = deduped;
  }

  // Sort
  if (opts.sort === "key") {
    entries.sort((a, b) => a.key.localeCompare(b.key));
  } else if (opts.sort === "year") {
    entries.sort((a, b) => {
      const ay = parseInt(a.fields.year ?? "0");
      const by = parseInt(b.fields.year ?? "0");
      return by - ay; // descending
    });
  } else if (opts.sort === "type") {
    entries.sort((a, b) => a.type.localeCompare(b.type) || a.key.localeCompare(b.key));
  }

  const upper = opts.uppercaseTypes !== false;
  const output = entries.map(e => formatEntry(e, upper)).join("\n\n");
  return { output, stats: { total, removed, fieldsStripped }, warnings };
}
