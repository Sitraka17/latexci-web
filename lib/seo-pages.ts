// Helpers for the programmatic per-symbol and per-template pages.
// Kept free of `katex` so app/sitemap.ts can import the slug lists without
// pulling the math renderer into the sitemap module graph.
import LZString from "lz-string";
import { SYMBOLS, type SymbolEntry } from "@/lib/symbols";
import { TEMPLATES, type Template } from "@/lib/templates";

function baseSlug(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Symbol slugs ──────────────────────────────────────────────────────────
// Deterministic + collision-free. SYMBOLS order is stable, so the first symbol
// to claim a slug keeps it and later collisions get a numeric suffix — the URL
// for a given symbol therefore never changes between builds.
const _slugBySymbol = new Map<SymbolEntry, string>();
const _symbolBySlug = new Map<string, SymbolEntry>();
{
  const used = new Set<string>();
  for (const sym of SYMBOLS) {
    let slug =
      baseSlug(sym.name) || baseSlug(sym.command.replace(/\\/g, "")) || "symbol";
    if (used.has(slug)) {
      let n = 2;
      while (used.has(`${slug}-${n}`)) n++;
      slug = `${slug}-${n}`;
    }
    used.add(slug);
    _slugBySymbol.set(sym, slug);
    _symbolBySlug.set(slug, sym);
  }
}

// Canonical slug per \command: the first symbol (in data order) to use a given
// command owns the canonical URL. Symbols that repeat a command in another
// category (e.g. \Omega as both "Omega" and "ohm", or the exact \nabla dup)
// point their canonical at that primary page, so Google consolidates the ~27
// near-duplicate pages instead of treating them as competing duplicates.
const _primarySlugByCommand = new Map<string, string>();
for (const sym of SYMBOLS) {
  if (!_primarySlugByCommand.has(sym.command)) {
    _primarySlugByCommand.set(sym.command, _slugBySymbol.get(sym)!);
  }
}
/** The URL a symbol should declare as canonical (may be another symbol's slug). */
export function canonicalSlug(sym: SymbolEntry): string {
  return _primarySlugByCommand.get(sym.command) ?? _slugBySymbol.get(sym)!;
}
/** Only the primary (canonical) slugs — one per distinct command; for the sitemap. */
export function canonicalSymbolSlugs(): string[] {
  return [..._primarySlugByCommand.values()];
}

export function symbolSlug(sym: SymbolEntry): string {
  return _slugBySymbol.get(sym)!;
}
export function symbolBySlug(slug: string): SymbolEntry | undefined {
  return _symbolBySlug.get(slug);
}
export function allSymbolSlugs(): string[] {
  return [..._symbolBySlug.keys()];
}
export function relatedSymbols(sym: SymbolEntry, n = 14): SymbolEntry[] {
  return SYMBOLS.filter((s) => s.category === sym.category && s !== sym).slice(0, n);
}
export function symbolsByCategory(): { category: string; symbols: SymbolEntry[] }[] {
  const seen: string[] = [];
  for (const s of SYMBOLS) if (!seen.includes(s.category)) seen.push(s.category);
  return seen.map((category) => ({
    category,
    symbols: SYMBOLS.filter((s) => s.category === category),
  }));
}

// ── Templates ─────────────────────────────────────────────────────────────
export function templateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
export function allTemplateIds(): string[] {
  return TEMPLATES.map((t) => t.id);
}
export function relatedTemplates(t: Template, n = 4): Template[] {
  const same = TEMPLATES.filter((x) => x.category === t.category && x.id !== t.id);
  const rest = TEMPLATES.filter((x) => x.category !== t.category && x.id !== t.id);
  return [...same, ...rest].slice(0, n);
}
/** Deep-link that loads a template's source into the live editor (hash, client-decoded). */
export function templateEditorHref(t: Template): string {
  return `/tools/preview#s=${LZString.compressToEncodedURIComponent(t.source)}`;
}
/** Package names from \usepackage{...} lines — used for the "what's included" list. */
export function templatePackages(t: Template): string[] {
  const out = new Set<string>();
  for (const m of t.source.matchAll(/\\usepackage(?:\[[^\]]*\])?\{([^}]*)\}/g)) {
    for (const p of m[1].split(",")) {
      const name = p.trim();
      if (name) out.add(name);
    }
  }
  return [...out];
}
export function templateDocumentClass(t: Template): string | null {
  return t.source.match(/\\documentclass(?:\[[^\]]*\])?\{([^}]*)\}/)?.[1] ?? null;
}
