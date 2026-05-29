/**
 * lib/bibtex.ts — BibTeX parser, cleaner, formatter
 * Handles nested braces, multiple entry types, author normalization.
 */

export interface BibEntry {
  type: string;          // article, book, inproceedings…
  key: string;           // citation key
  fields: Record<string, string>;
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
  return { value: src.slice(start, i), end: i + 1 };
}

/** Read a quoted substring starting just after `"`. */
function readQuoted(src: string, start: number): { value: string; end: number } {
  let i = start;
  while (i < src.length && src[i] !== '"') {
    if (src[i] === "\\") i++; // skip escaped char
    i++;
  }
  return { value: src.slice(start, i), end: i + 1 };
}

/** Parse key=value fields from the body string after `@type{key,`. */
function parseFields(body: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let i = 0;
  while (i < body.length) {
    // Skip whitespace & commas
    while (i < body.length && /[\s,]/.test(body[i])) i++;
    if (i >= body.length) break;

    // Read field name
    const nameStart = i;
    while (i < body.length && /[a-zA-Z0-9_\-]/.test(body[i])) i++;
    const name = body.slice(nameStart, i).toLowerCase().trim();
    if (!name) { i++; continue; }

    // Skip whitespace then `=`
    while (i < body.length && /\s/.test(body[i])) i++;
    if (body[i] !== "=") continue;
    i++; // skip `=`

    // Skip whitespace
    while (i < body.length && /\s/.test(body[i])) i++;

    // Read value
    let value = "";
    if (body[i] === "{") {
      const r = readBraced(body, i + 1);
      value = r.value;
      i = r.end;
    } else if (body[i] === '"') {
      const r = readQuoted(body, i + 1);
      value = r.value;
      i = r.end;
    } else {
      // Bare value (number or @string reference)
      const start = i;
      while (i < body.length && !/[\s,}]/.test(body[i])) i++;
      value = body.slice(start, i).trim();
    }

    if (name) fields[name] = value;
  }
  return fields;
}

export function parseBibTeX(src: string): BibEntry[] {
  const entries: BibEntry[] = [];
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
    if (["comment", "preamble"].includes(type)) continue;
    if (type === "string") { i++; continue; }

    // Skip whitespace
    while (i < cleaned.length && /\s/.test(cleaned[i])) i++;
    if (cleaned[i] !== "{") continue;
    i++; // skip `{`

    // Read citation key (up to first comma)
    const keyStart = i;
    while (i < cleaned.length && cleaned[i] !== "," && cleaned[i] !== "}") i++;
    const key = cleaned.slice(keyStart, i).trim();
    if (!key) continue;
    if (cleaned[i] === ",") i++; // skip comma

    // Read everything until the matching closing `}`
    const bodyStart = i;
    let depth = 1;
    while (i < cleaned.length && depth > 0) {
      if (cleaned[i] === "{") depth++;
      else if (cleaned[i] === "}") depth--;
      if (depth > 0) i++;
    }
    const body = cleaned.slice(bodyStart, i);
    i++; // skip closing `}`

    const fields = parseFields(body);
    entries.push({ type, key, fields });
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

export function formatEntry(e: BibEntry, uppercaseType = true): string {
  const type = uppercaseType ? e.type.toUpperCase() : e.type;
  const sorted = Object.entries(e.fields).sort(([a], [b]) => {
    const ai = FIELD_ORDER.indexOf(a);
    const bi = FIELD_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  const lines = sorted.map(([k, v]) => `  ${k.padEnd(12)} = {${v}}`);
  return `@${type}{${e.key},\n${lines.join(",\n")}\n}`;
}

// ── Author normalization ─────────────────────────────────────────────────────

/** Normalize "First Last" → "Last, First" */
function normalizeAuthorName(name: string): string {
  name = name.trim();
  if (!name) return name;
  if (name.includes(",")) return name; // already "Last, First"
  const parts = name.split(/\s+/);
  if (parts.length < 2) return name;
  const last = parts[parts.length - 1];
  const first = parts.slice(0, -1).join(" ");
  return `${last}, ${first}`;
}

function normalizeAuthors(raw: string): string {
  return raw
    .split(/\s+and\s+/i)
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
