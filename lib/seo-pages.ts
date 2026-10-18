// Helpers for the programmatic per-symbol and per-template pages.
// Kept free of `katex` so app/sitemap.ts can import the slug lists without
// pulling the math renderer into the sitemap module graph.
import LZString from "lz-string";
import { SYMBOLS, CATEGORIES, type SymbolEntry, type SymbolCategory } from "@/lib/symbols";
import { noteFor } from "@/lib/symbol-notes";
import { clampDescription } from "@/lib/snippet";
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

const SLUG_OVERRIDES: Record<string, string> = {
  vDash: "double-turnstile",
  Vdash: "forces-vdash",
  "lVert rVert": "norm-lvert-rvert",
};

function collisionSlug(sym: SymbolEntry, slug: string): string {
  if (SLUG_OVERRIDES[sym.name]) return SLUG_OVERRIDES[sym.name];
  if (sym.category === "Greek Uppercase") return `capital-${slug}`;
  if (sym.category === "Arrows" && /^[A-Z]/.test(sym.name)) return `double-${slug}`;
  return slug;
}

// Human names for page titles. Data names are terse search keys ("hbar
// Planck", "AND"); searchers and SERP snippets need the usual name.
const DISPLAY_OVERRIDES: Record<string, string> = {
  "hbar Planck": "H-bar",
  iff: "If and only if",
  AND: "Logical AND",
  "dagger adjoint": "Dagger",
  "little o": "Little-o",
  lcm: "LCM",
  forall: "For all",
  "mathcal D": "Calligraphic D",
  rightleftharpoons: "Equilibrium arrow",
  "left right parentheses": "Big parentheses",
  "left right braces": "Big braces",
  section: "Section sign",
  pounds: "Pound sign",
  copyright: "Copyright symbol",
  vDash: "Double turnstile",
  Vdash: "Forces symbol",
  "lVert rVert": "Norm bars",
  "probability E": "Expected value E",
  "nabla gradient": "Nabla",
  Rightarrow: "Implies arrow",
  Leftarrow: "Double left arrow",
  Leftrightarrow: "Double left-right arrow",
  Longrightarrow: "Long implies arrow",
};

const FONT_NAMES: Record<string, string> = {
  bb: "Blackboard bold", cal: "Calligraphic", scr: "Script", frak: "Fraktur",
};

/** Name used in titles, H1 and links. */
export function displayName(sym: SymbolEntry): string {
  if (DISPLAY_OVERRIDES[sym.name]) return DISPLAY_OVERRIDES[sym.name];
  if (sym.category === "Greek Uppercase") return `Capital ${titleCase(sym.name.toLowerCase())}`;
  // Font-alphabet keys ("mathbb R") read as the name of the letter form.
  const font = sym.name.match(/^math(bb|cal|scr|frak) (\w)$/);
  if (font) return `${FONT_NAMES[font[1]]} ${font[2]}`;
  return titleCase(sym.name);
}

/** The other-case Greek letter (\delta <-> \Delta), if the data has it. */
export function caseCounterpart(sym: SymbolEntry): SymbolEntry | undefined {
  if (!sym.category.startsWith("Greek")) return undefined;
  const m = sym.command.match(/^\\([a-zA-Z])([a-z]+)$/);
  if (!m) return undefined;
  const first = m[1] === m[1].toUpperCase() ? m[1].toLowerCase() : m[1].toUpperCase();
  const target = `\\${first}${m[2]}`;
  return SYMBOLS.find((x) => x.command === target && x.category.startsWith("Greek"));
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
    // Readable alternatives for the case-only collisions (\delta vs \Delta,
    // \rightarrow vs \Rightarrow). These replaced numeric suffixes such as
    // delta-2 on 2026-10-05; next.config.ts 308-redirects the old URLs.
    if (used.has(slug)) slug = collisionSlug(sym, slug);
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
/** One symbol per canonical page, in data order, for a category. */
function canonicalMembers(category: string): SymbolEntry[] {
  const seen = new Set<string>();
  const out: SymbolEntry[] = [];
  for (const s of SYMBOLS) {
    if (s.category !== category) continue;
    const c = canonicalSlug(s);
    if (seen.has(c)) continue;
    seen.add(c);
    out.push(s);
  }
  return out;
}

/**
 * Neighbours in the same category: a window centred on the symbol, wrapping
 * round the category, so every symbol receives links from its neighbourhood
 * (the first fourteen of each category used to take them all).
 */
export function relatedSymbols(sym: SymbolEntry, n = 14): SymbolEntry[] {
  // One entry per canonical page, never the page itself (duplicate commands
  // share a canonical URL, so linking both would point twice at one page).
  const self = canonicalSlug(sym);
  const members = canonicalMembers(sym.category);
  const others = members.filter((s) => canonicalSlug(s) !== self);
  if (others.length <= n) return others;
  const at = Math.max(0, members.findIndex((s) => canonicalSlug(s) === self));
  const out: SymbolEntry[] = [];
  const m = members.length;
  for (let k = -Math.floor(n / 2); out.length < n; k++) {
    const s = members[(((at + k) % m) + m) % m];
    if (canonicalSlug(s) !== self && !out.includes(s)) out.push(s);
  }
  return out;
}

// Symbols readers mistake for one another; each group links its members to
// each other under "Often confused with". Keyed by SymbolEntry.name.
export const CONFUSABLE_GROUPS: string[][] = [
  ["delta", "partial", "nabla gradient", "Delta"],
  ["iff", "Leftrightarrow", "implies", "Rightarrow"],
  ["epsilon", "varepsilon", "in"],
  ["phi", "varphi", "emptyset", "varnothing"],
  ["mathbb R", "mathbb N", "normal distribution", "indicator function"],
  ["cdot", "times", "bullet"],
  ["approx", "sim", "simeq", "cong"],
  ["to", "rightarrow", "mapsto"],
  ["subseteq", "subset", "subsetneq"],
  ["leq", "leqslant", "geq"],
  ["hat", "widehat", "bar", "overline"],
  ["mathbb C", "quaternions", "octonions"],
];

const _byName = new Map<string, SymbolEntry>();
for (const s of SYMBOLS) if (!_byName.has(s.name)) _byName.set(s.name, s);
export function symbolByName(name: string): SymbolEntry | undefined {
  return _byName.get(name);
}

/** Up to `n` symbols of the same confusable group (other canonical pages). */
export function confusedWith(sym: SymbolEntry, n = 3): SymbolEntry[] {
  const group = CONFUSABLE_GROUPS.find((g) => g.includes(sym.name));
  if (!group) return [];
  const seen = new Set<string>([canonicalSlug(sym)]);
  const out: SymbolEntry[] = [];
  for (const name of group) {
    const s = symbolByName(name);
    if (!s || seen.has(canonicalSlug(s))) continue;
    seen.add(canonicalSlug(s));
    out.push(s);
    if (out.length >= n) break;
  }
  return out;
}

// ── Titles ────────────────────────────────────────────────────────────────
/** The layout appends " | latexci": titles fit 55 characters before it. */
export const TITLE_MAX = 55;

export function singleGlyph(sym: SymbolEntry): string | null {
  return sym.unicode && [...sym.unicode].length === 1 ? sym.unicode : null;
}

/** "Delta in LaTeX: \delta (δ)": answer first, glyph last so it reads cleanly. */
export function symbolPageTitle(sym: SymbolEntry): string {
  // Hand-written for the pages Search Console shows most (lib/symbol-notes.ts).
  const seo = noteFor(sym.name)?.seo;
  if (seo) return seo.title;
  const g = singleGlyph(sym);
  const name = displayName(sym);
  const base = `${name} in LaTeX: ${sym.command}${g ? ` (${g})` : ""}`;
  // Greek letters: name the other case too, the usual reason to open the page.
  const other = caseCounterpart(sym);
  const candidates = [
    other ? `${base} vs ${other.command} (${other.unicode})` : "",
    base,
    `${name} in LaTeX: ${sym.command}`,
    `${name} in LaTeX`,
  ];
  for (const t of candidates) if (t && t.length <= TITLE_MAX) return t;
  return `${name.slice(0, TITLE_MAX - 9).trim()} in LaTeX`;
}

// ── Category hubs: /tools/symbols/c/[category] ────────────────────────────
export function categorySlug(category: string): string {
  return baseSlug(category);
}
export function categoryBySlug(slug: string): SymbolCategory | undefined {
  return CATEGORIES.find((c) => categorySlug(c) === slug);
}
export function categoryHref(category: string): string {
  return `/tools/symbols/c/${categorySlug(category)}`;
}

interface Hub { title: string; h1: string; noun: string; lede: string }
const HUBS: Record<SymbolCategory, Hub> = {
  "Greek Lowercase": {
    h1: "Lowercase Greek letters in LaTeX", noun: "lowercase Greek letters",
    title: "Lowercase Greek letters in LaTeX: every command",
    lede: "Every lowercase Greek letter LaTeX knows, with the variant forms such as \\varepsilon and \\varphi. All are built in and work in math mode only.",
  },
  "Greek Uppercase": {
    h1: "Capital Greek letters in LaTeX", noun: "capital Greek letters",
    title: "Capital Greek letters in LaTeX: \\Delta, \\Sigma, \\Omega",
    lede: "LaTeX only defines the capitals that differ from Latin letters: a capital alpha is simply A. The eleven commands are upright and built in.",
  },
  "Binary Operators": {
    h1: "Binary operators in LaTeX", noun: "binary operators",
    title: "Binary operators in LaTeX: \\times, \\cdot, \\oplus",
    lede: "Symbols that combine two terms, such as \\times and \\oplus. LaTeX puts a medium space on each side of them, which plain characters do not get.",
  },
  "Relations": {
    h1: "Relation symbols in LaTeX", noun: "relation symbols",
    title: "Relation symbols in LaTeX: \\leq, \\approx, \\subseteq",
    lede: "Symbols that compare two terms, such as \\leq and \\approx. They get a thick space on each side, and a long inline formula may break after them.",
  },
  "Arrows": {
    h1: "Arrows in LaTeX", noun: "arrows",
    title: "Arrows in LaTeX: \\to, \\Rightarrow, \\mapsto and more",
    lede: "Single, double, long, hooked and labelled arrows. Most are built in; \\implies, \\xrightarrow and a few others need amsmath or amssymb.",
  },
  "Logic": {
    h1: "Logic symbols in LaTeX", noun: "logic symbols",
    title: "Logic symbols in LaTeX: \\forall, \\exists, \\neg",
    lede: "Quantifiers, connectives and turnstiles. The quantifiers and connectives are built in; \\nexists, \\therefore and \\vDash need amssymb.",
  },
  "Sets": {
    h1: "Set symbols in LaTeX", noun: "set symbols",
    title: "Set symbols in LaTeX: \\emptyset, \\bigcup, \\mathbb{N}",
    lede: "Empty sets, big unions and intersections, and the blackboard-bold number sets. \\mathbb and \\varnothing need amssymb.",
  },
  "Calculus & Analysis": {
    h1: "Calculus and analysis symbols in LaTeX", noun: "calculus and analysis symbols",
    title: "Calculus symbols in LaTeX: \\int, \\sum, \\partial",
    lede: "Integrals, sums, limits, roots, fractions and dots. All are built in except the multiple integrals and \\dfrac, which come from amsmath.",
  },
  "Operators": {
    h1: "Math operators in LaTeX", noun: "operator names",
    title: "Math operators in LaTeX: \\sin, \\log, \\operatorname",
    lede: "Function names set upright with operator spacing. Anything missing can be declared with \\operatorname or \\DeclareMathOperator from amsmath.",
  },
  "Number Sets": {
    h1: "Number sets in LaTeX", noun: "number sets",
    title: "Number sets in LaTeX: \\mathbb{R}, \\mathbb{N} and more",
    lede: "Natural, integer, rational, real and complex numbers in blackboard bold. Every one of them needs \\usepackage{amssymb}.",
  },
  "Statistics & Probability": {
    h1: "Statistics and probability symbols in LaTeX", noun: "statistics and probability symbols",
    title: "Statistics symbols in LaTeX: \\mathbb{E}, Var, iid",
    lede: "Expectation, variance, independence, distributions and modes of convergence, with the package each one needs.",
  },
  "Computer Science": {
    h1: "Computer science symbols in LaTeX", noun: "computer science symbols",
    title: "Computer science symbols in LaTeX: O(n), floor, NP",
    lede: "Asymptotic notation, Boolean logic, floors and ceilings, and complexity classes. None of them needs an extra package.",
  },
  "Physics": {
    h1: "Physics symbols in LaTeX", noun: "physics symbols",
    title: "Physics symbols in LaTeX: \\hbar, \\nabla, bra-ket",
    lede: "The reduced Planck constant, vector calculus, time derivatives and Dirac notation, as physicists write them.",
  },
  "Accents": {
    h1: "Math accents in LaTeX", noun: "math accents",
    title: "Math accents in LaTeX: \\hat, \\bar, \\vec, \\tilde",
    lede: "Hats, bars, arrows, dots and braces over or under a letter. Each takes an argument; the wide forms stretch over several letters.",
  },
  "Delimiters": {
    h1: "Delimiters in LaTeX", noun: "delimiters",
    title: "Delimiters in LaTeX: \\left, \\langle, floors and norms",
    lede: "Brackets that grow with their content through \\left and \\right, angle brackets, floors, ceilings, absolute values and norms.",
  },
  "Misc Math": {
    h1: "More math symbols in LaTeX", noun: "miscellaneous math symbols",
    title: "More math symbols in LaTeX: \\ell, \\aleph, \\mathcal",
    lede: "Letter-like symbols, calligraphic and script alphabets, big operators, music signs and card suits.",
  },
  "Text Symbols": {
    h1: "Text symbols in LaTeX", noun: "text symbols",
    title: "Text symbols in LaTeX: ©, €, §, dashes and quotes",
    lede: "Signs for running text rather than formulas: copyright, currencies, section and paragraph marks, dashes and quotation marks.",
  },
};

export function hubInfo(category: SymbolCategory): Hub & { description: string; count: number } {
  const h = HUBS[category];
  const count = SYMBOLS.filter((s) => s.category === category).length;
  return {
    ...h,
    count,
    description: clampDescription(
      `All ${count} ${h.noun} in one table: the glyph, the LaTeX command, the package it needs and a page for each. Free to copy, no signup.`,
    ),
  };
}

// ── One generated sentence for pages without an editorial note ────────────
// Text-mode counterparts: kernel commands (TS1 joined the kernel in 2020),
// each compiled with pdfLaTeX and no package.
const TEXT_EQUIV: Record<string, string> = {
  "\\pm": "\\textpm", "\\times": "\\texttimes", "\\div": "\\textdiv",
  "\\cdot": "\\textperiodcentered", "\\dagger": "\\textdagger", "\\ddagger": "\\textdaggerdbl",
  "\\bullet": "\\textbullet", "^\\circ": "\\textdegree", "\\mu": "\\textmu", "\\neg": "\\textlnot",
  "\\leftarrow": "\\textleftarrow", "\\rightarrow": "\\textrightarrow", "\\uparrow": "\\textuparrow",
  "\\downarrow": "\\textdownarrow",
};

// Commands that compile in text and in math alike (checked with pdfLaTeX).
const BOTH_MODES = new Set(["\\pounds", "\\S", "\\P", "\\dag", "\\ddag", "\\dots", "\\checkmark", "\\maltese"]);

const CATEGORY_SENTENCE: Record<SymbolCategory, string> = {
  "Greek Lowercase": "Greek letters work in math mode only: in running text write $CMD$, or load the textgreek package for upright text forms.",
  "Greek Uppercase": "CMD is upright by default, unlike the lowercase Greek letters; amsmath adds italic capitals such as \\varGamma.",
  "Binary Operators": "As a binary operator, CMD gets a medium space on each side; at the start of a formula LaTeX reads it as a sign and drops the space.",
  "Relations": "As a relation, CMD gets a thick space on each side, and a long inline formula may break after it.",
  "Arrows": "Arrows are relations in LaTeX, so CMD gets the same thick spacing as an equals sign.",
  "Logic": "CMD keeps its spacing inside a formula; for a word such as \"and\" in the middle of one, use \\text{ and } from amsmath.",
  "Sets": "Set notation lives in math mode: write $CMD$, even in the middle of a sentence.",
  "Calculus & Analysis": "In display math CMD takes its full size; inline it shrinks to fit the line, and \\displaystyle forces the large form.",
  "Operators": "CMD sets the name upright with operator spacing; typed as plain letters it would print in italics, as a product of variables.",
  "Number Sets": "The blackboard-bold letters come from the AMS fonts, so CMD needs \\usepackage{amssymb}.",
  "Statistics & Probability": "Notation varies between fields: whichever form of CMD you choose, define it once with \\newcommand and reuse it.",
  "Computer Science": "In pseudocode or running text, wrap CMD in $...$ so it keeps math spacing and fonts.",
  "Physics": "The physics and siunitx packages offer shortcuts for many formulas, but CMD works in plain LaTeX.",
  "Accents": "CMD is a math accent: it takes an argument and only works in math mode, while text accents such as \\'e are separate commands.",
  "Delimiters": "Write CMD; for delimiters that grow with their content wrap them in \\left and \\right, or pick a fixed size with \\bigl and \\bigr, often the better choice.",
  "Misc Math": "CMD is a math-mode symbol: in running text, wrap it in $...$.",
  "Text Symbols": "CMD is a text command: inside a formula it needs \\text{...} from amsmath.",
};

/** One sentence specific to the symbol and its category (pages without a note). */
export function symbolBlurb(sym: SymbolEntry): string {
  const cat = sym.category as SymbolCategory;
  const parts: string[] = [];
  let base = CATEGORY_SENTENCE[cat];
  if (cat === "Text Symbols" && !sym.command.startsWith("\\")) base = "Type CMD in running text, outside math mode.";
  else if (BOTH_MODES.has(sym.command)) base = "CMD works both in running text and inside a formula.";
  if (base) parts.push(base.replace(/CMD/g, sym.command));
  const text = TEXT_EQUIV[sym.command];
  if (text) parts.push(`In running text, outside math mode, the same sign is ${text}.`);
  const g = singleGlyph(sym);
  if (g) {
    parts.push(
      cat === "Text Symbols"
        ? `With XeLaTeX or LuaLaTeX you can also type ${g} directly.`
        : `With unicode-math under XeLaTeX or LuaLaTeX, typing ${g} in a formula gives the same symbol.`,
    );
  }
  const conf = confusedWith(sym, 1)[0];
  if (conf) parts.push(`Not to be confused with ${conf.command}${singleGlyph(conf) ? ` (${conf.unicode})` : ""}.`);
  return parts.join(" ");
}

/** Deep link that opens a minimal document around `body` in the live preview. */
export function previewHref(body: string, packages: string[] = []): string {
  const pkgs = [
    ...new Set(packages.flatMap((p) => p.split(",")).map((p) => p.trim()).filter((p) => p && p !== "base")),
  ];
  const doc = [
    "\\documentclass{article}",
    ...(pkgs.length ? [`\\usepackage{${pkgs.join(",")}}`] : []),
    "\\begin{document}",
    body,
    "\\end{document}",
    "",
  ].join("\n");
  return `/tools/preview#s=${LZString.compressToEncodedURIComponent(doc)}`;
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

// CV templates: titles in the words people search ("resume" in English,
// French for the French templates). Titles <= 55 chars (the layout appends
// " | latexci"), descriptions 110-158 chars; checked in lib/__tests__/cv-seo.test.ts.
export const CV_TEMPLATE_SEO: Record<string, { title: string; description: string }> = {
  cv: {
    title: "Academic CV LaTeX Template for Researchers (Free)",
    description: "Free academic CV template in LaTeX: education, positions, publications by type, grants, teaching and talks. Copy the source or edit it in the browser.",
  },
  "cv-photo": {
    title: "LaTeX Resume Template with Photo: One Page, Free",
    description: "Free one-page LaTeX resume template with an optional photo: experience with results, skills, projects. Copy the source or edit it in the browser.",
  },
  "cv-french-academic": {
    title: "Modèle de CV académique LaTeX en français (gratuit)",
    description: "Modèle de CV académique LaTeX gratuit en français : formation, publications par type, financements, enseignement, jurys. Source complète à copier.",
  },
  "cv-french-industry": {
    title: "Modèle de CV LaTeX professionnel en français",
    description: "Modèle de CV LaTeX professionnel en français : accroche, expériences chiffrées, compétences, langues, photo facultative. Gratuit, sans inscription.",
  },
  "cv-academic-photo": {
    title: "CV académique LaTeX avec photo : modèle gratuit",
    description: "CV académique LaTeX en français avec emplacement photo facultatif : formation, publications, enseignement, prix. Modèle gratuit, source complète.",
  },
};
