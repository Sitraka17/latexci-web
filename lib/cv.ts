// CV builder: structured form data -> a complete, compilable LaTeX document.
// The two layouts reuse the macros of the existing "cv" (academic) and
// "cv-photo" (industry) templates, so the output matches what the template
// pages show. Pure functions: no DOM, unit-tested in lib/__tests__/cv*.test.ts.
//
// Text extraction matters as much as looks: recruiters' applicant tracking
// systems read the PDF as text, so every entry is set in a single flow (date on
// the same line as its title), glyphs map to Unicode (glyphtounicode) and the
// PDF carries a title, author and language.

export type CvLayout = "academic" | "industry";
export type CvLang = "en" | "fr";
export type PubType = "" | "journal" | "conference" | "preprint";

export interface CvEntry {
  dates: string;
  title: string;
  org: string;
  location: string;
  /** One bullet / line per line of text. */
  details: string;
}

export interface CvPublication {
  authors: string;
  title: string;
  venue: string;
  year: string;
  doi: string;
  /** Optional; when any publication has a type, the list is grouped by type. */
  type?: PubType;
  /** French CV only: the title is English, so babel french must not touch it. */
  english?: boolean;
}

/** Optional list sections, one item per line of text. */
export const EXTRA_SECTIONS = ["grants", "teaching", "talks", "awards", "service", "references"] as const;
export type ExtraSection = (typeof EXTRA_SECTIONS)[number];

export interface CvData {
  layout: CvLayout;
  lang: CvLang;
  photo: boolean;
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  orcid: string;
  summary: string;
  education: CvEntry[];
  experience: CvEntry[];
  publications: CvPublication[];
  /** "Label: item, item" per line, e.g. "Programming: Python, R". */
  skills: string;
  languages: string;
  // Fields added after the first release: optional, so older saved drafts load.
  github?: string;
  /** Industry layout: tighter margins and leading to fit one page. */
  onePage?: boolean;
  /** The user's name as it appears in author lists, set in bold there. */
  pubName?: string;
  grants?: string;
  teaching?: string;
  talks?: string;
  awards?: string;
  service?: string;
  references?: string;
  extraTitle?: string;
  extra?: string;
}

const LABELS = {
  en: {
    profile: "Profile", education: "Education", experience: "Experience",
    publications: "Publications", skills: "Skills", languages: "Languages",
    grants: "Grants and fellowships", teaching: "Teaching and supervision", talks: "Invited talks",
    awards: "Awards", service: "Service", references: "References", additional: "Additional information",
    journal: "Journal articles", conference: "Conference papers", preprint: "Preprints", other: "Other publications",
    babel: "english",
  },
  fr: {
    profile: "Profil", education: "Formation", experience: "Expérience professionnelle",
    publications: "Publications", skills: "Compétences", languages: "Langues",
    grants: "Financements et bourses", teaching: "Enseignement et encadrement", talks: "Conférences invitées",
    awards: "Prix et distinctions", service: "Responsabilités collectives", references: "Références", additional: "Divers",
    journal: "Articles de revues", conference: "Actes de conférences", preprint: "Prépublications", other: "Autres publications",
    babel: "english,french",
  },
} as const;

const SPECIALS: Record<string, string> = {
  "\\": "\\textbackslash{}",
  "{": "\\{",
  "}": "\\}",
  "$": "\\$",
  "&": "\\&",
  "#": "\\#",
  "_": "\\_",
  "%": "\\%",
  "~": "\\textasciitilde{}",
  "^": "\\textasciicircum{}",
};

// Characters pdfLaTeX (utf8 + T1) cannot typeset directly but that people do
// type in CVs: Greek letters (gene names, "β-catenin") and common symbols.
const GREEK = "α:alpha β:beta γ:gamma δ:delta ε:epsilon ζ:zeta η:eta θ:theta ι:iota κ:kappa λ:lambda μ:mu ν:nu ξ:xi π:pi ρ:rho σ:sigma τ:tau υ:upsilon φ:phi χ:chi ψ:psi ω:omega Γ:Gamma Δ:Delta Θ:Theta Λ:Lambda Ξ:Xi Π:Pi Σ:Sigma Υ:Upsilon Φ:Phi Ψ:Psi Ω:Omega";
const MAPPED: Record<string, string> = {
  ...Object.fromEntries(GREEK.split(" ").map((p) => { const [c, n] = p.split(":"); return [c, `\\ensuremath{\\${n}}`]; })),
  "±": "\\ensuremath{\\pm}", "×": "\\ensuremath{\\times}", "÷": "\\ensuremath{\\div}",
  "≤": "\\ensuremath{\\leq}", "≥": "\\ensuremath{\\geq}", "≠": "\\ensuremath{\\neq}", "≈": "\\ensuremath{\\approx}",
  "→": "\\ensuremath{\\rightarrow}", "←": "\\ensuremath{\\leftarrow}", "∞": "\\ensuremath{\\infty}",
  "µ": "\\ensuremath{\\mu}", "€": "\\texteuro{}",
};
// Typographic punctuation that utf8 + T1 handles natively (dashes, quotes,
// daggers, bullet, ellipsis, per mille, single guillemets).
const PUNCT = new Set("\u2013\u2014\u2018\u2019\u201a\u201c\u201d\u201e\u2020\u2021\u2022\u2026\u2030\u2039\u203a");

/** True if pdfLaTeX (utf8 + T1) can typeset the character as-is. */
function typesettable(ch: string): boolean {
  const c = ch.codePointAt(0)!;
  return c <= 0x17f || PUNCT.has(ch);
}

/**
 * Escape free text so it is typeset literally (never interpreted as LaTeX).
 * Characters pdfLaTeX cannot typeset become "?" so the document always
 * compiles; the UI lists them via unsupportedChars().
 */
export function tex(s: string | undefined): string {
  let out = "";
  // NFC first: macOS pastes "é" as e + combining accent, which would become "e?".
  for (const ch of (s ?? "").normalize("NFC").trim()) out += SPECIALS[ch] ?? MAPPED[ch] ?? (typesettable(ch) ? ch : "?");
  return out;
}

/** Distinct characters in the form that tex() had to replace with "?". */
export function unsupportedChars(d: CvData): string[] {
  const found = new Set<string>();
  const scan = (v: unknown): void => {
    if (typeof v === "string") {
      for (const ch of v) if (!(ch in SPECIALS) && !(ch in MAPPED) && !typesettable(ch) && ch.trim()) found.add(ch);
    } else if (Array.isArray(v)) v.forEach(scan);
    else if (v && typeof v === "object") Object.values(v).forEach(scan);
  };
  scan(d);
  return [...found];
}

/**
 * Normalise a date range as typed ("Sept. 2021 – June 2024", "2019-2023",
 * "2023 - present") into LaTeX ("--" for the en dash) and translate
 * "present" / "aujourd'hui" to the CV language. Returns escaped LaTeX.
 */
export function texDates(s: string | undefined, lang: CvLang): string {
  let v = (s ?? "").normalize("NFC").trim();
  if (!v) return "";
  v = lang === "fr"
    ? v.replace(/\b(present|now|today|current)\b/gi, "aujourd'hui")
    : v.replace(/aujourd['\u2019]hui|à ce jour|en cours/gi, "present");
  // En and em dashes, or a hyphen with a space on either side, are ranges.
  v = v.replace(/\s*[\u2013\u2014]\s*|\s+-+\s*|\s*-+\s+/g, (m) => (/\s/.test(m) ? " -- " : "--"));
  // An unspaced hyphen between a year and a year or "present" is a range too.
  v = v.replace(/(\d{4})-(?=\d{4}\b|present|aujourd)/gi, "$1--");
  return tex(v);
}

/** Escape a URL for the first argument of \href (only % and # need it there). */
function texUrl(url: string): string {
  return url.trim().replace(/[\\{}\s]/g, "").replace(/%/g, "\\%").replace(/#/g, "\\#");
}

function withScheme(url: string): string {
  const u = url.trim();
  if (!u) return "";
  return /^[a-z]+:/i.test(u) ? u : `https://${u}`;
}

function displayUrl(url: string): string {
  return url.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");
}

/** "+33 6 12 34 56 78" or "0033 6..." -> "tel:+33612345678". */
function telUrl(phone: string): string {
  let p = phone.replace(/[^\d+]/g, "");
  if (p.startsWith("00")) p = `+${p.slice(2)}`;
  return `tel:${p[0] === "+" ? "+" : ""}${p.replace(/\+/g, "")}`;
}

/** "jsmith", "github.com/jsmith" or the full URL -> "github.com/jsmith". */
function githubPath(g: string): string {
  const v = displayUrl(g).replace(/^@/, "");
  return /github\.com/i.test(v) ? v : `github.com/${v}`;
}

function lines(s: string | undefined): string[] {
  return (s ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
}

function hasEntry(e: CvEntry): boolean {
  return [e.dates, e.title, e.org, e.location, e.details].some((v) => (v ?? "").trim());
}

function hasPub(p: CvPublication): boolean {
  return [p.title, p.venue, p.doi].some((v) => (v ?? "").trim());
}

function contactItems(d: CvData): string[] {
  const items: string[] = [];
  if (d.email.trim()) items.push(`\\href{mailto:${texUrl(d.email)}}{${tex(d.email)}}`);
  if (d.phone.trim()) items.push(`\\href{${texUrl(telUrl(d.phone))}}{${tex(d.phone)}}`);
  if (d.location.trim()) items.push(tex(d.location));
  if (d.website.trim()) items.push(`\\href{${texUrl(withScheme(d.website))}}{${tex(displayUrl(d.website))}}`);
  if (d.linkedin.trim()) items.push(`\\href{${texUrl(withScheme(d.linkedin))}}{${tex(displayUrl(d.linkedin))}}`);
  if (d.github?.trim()) {
    const g = githubPath(d.github);
    items.push(`\\href{${texUrl(`https://${g}`)}}{${tex(g)}}`);
  }
  if (d.orcid.trim()) items.push(`\\href{https://orcid.org/${texUrl(d.orcid)}}{ORCID~${tex(d.orcid)}}`);
  // \mbox: an item (e.g. "ORCID 0000-...") never splits across two lines.
  return items.map((i) => `\\mbox{${i}}`);
}

/** Contact items on one line, or two balanced lines when there are many. */
function contactLines(d: CvData, sep: string): string {
  const items = contactItems(d);
  if (items.length <= 3) return items.join(sep);
  const half = Math.ceil(items.length / 2);
  return `${items.slice(0, half).join(sep)}\\\\[0.15em]\n  ${items.slice(half).join(sep)}`;
}

/** Shared preamble lines: fonts, Unicode text extraction, PDF metadata. */
function preamble(d: CvData, geometry: string, extra: string[]): string[] {
  const L = LABELS[d.lang];
  const name = tex(d.name) || "Your Name";
  const meta = [`pdftitle={CV ${name}}`, `pdfauthor={${name}}`];
  if (d.headline.trim()) meta.push(`pdfsubject={${tex(d.headline)}}`);
  meta.push(`pdflang=${d.lang}`);
  return [
    "\\usepackage[T1]{fontenc}",
    "\\usepackage[utf8]{inputenc}",
    "\\usepackage{lmodern}",
    "% Map every glyph to Unicode so the PDF text can be copied and parsed",
    "\\input{glyphtounicode}\\pdfgentounicode=1",
    `\\usepackage[${L.babel}]{babel}`,
    ...(d.lang === "fr" ? ["\\frenchsetup{StandardItemLabels=true}"] : []),
    "\\usepackage{geometry}",
    `\\geometry{${geometry}}`,
    "\\usepackage[hidelinks]{hyperref}",
    `\\hypersetup{${meta.join(", ")}}`,
    "\\usepackage{enumitem}",
    "\\usepackage{xcolor}",
    ...extra,
    "\\usepackage{needspace}",
    "\\usepackage{microtype}",
    "\\pagestyle{empty}",
    "\\setlength{\\parindent}{0pt}",
  ];
}

// ── Publications ──────────────────────────────────────────────────────────────
const REGEX_SPECIALS = /[.*+?^${}()|[\]\\]/g;

/** Escaped author string with every occurrence of the user's name in bold. */
export function texAuthors(authors: string, pubName?: string): string {
  const a = tex(authors);
  const name = tex(pubName);
  if (!a || !name) return a;
  const re = new RegExp(`(?<!\\p{L})${name.replace(REGEX_SPECIALS, "\\$&")}(?!\\p{L})`, "gu");
  return a.replace(re, (m) => `\\textbf{${m}}`);
}

/** Sort key: the first four-digit year; "in press" and the like come first. */
function pubYear(p: CvPublication): number {
  if (/press|forthcoming|accepted|à paraître|sous presse/i.test(p.year ?? "")) return 9999;
  const m = /\d{4}/.exec(p.year ?? "");
  return m ? Number(m[0]) : -1;
}

/** Publications with content, newest first (stable for equal years). */
export function sortPublications(pubs: CvPublication[]): CvPublication[] {
  return pubs
    .filter(hasPub)
    .map((p, i) => ({ p, i }))
    .sort((a, b) => pubYear(b.p) - pubYear(a.p) || a.i - b.i)
    .map((x) => x.p);
}

const PUB_ORDER = ["journal", "conference", "preprint", ""] as const;

/** Sorted publications, grouped by type when at least one has a type. */
export function groupPublications(pubs: CvPublication[], lang: CvLang): { heading: string; items: CvPublication[] }[] {
  const sorted = sortPublications(pubs);
  if (!sorted.length) return [];
  if (!sorted.some((p) => p.type)) return [{ heading: "", items: sorted }];
  const L = LABELS[lang];
  return PUB_ORDER
    .map((t) => ({ heading: t ? L[t] : L.other, items: sorted.filter((p) => (p.type ?? "") === t) }))
    .filter((g) => g.items.length);
}

function formatPublication(p: CvPublication, d: CvData): string {
  const parts: string[] = [];
  const year = tex(p.year);
  if (p.authors.trim()) parts.push(`${texAuthors(p.authors, d.pubName)}${year ? ` (${year})` : ""}.`);
  else if (year) parts.push(`(${year}).`);
  if (p.title.trim()) {
    const t = tex(p.title).replace(/\.$/, "");
    parts.push(`${d.lang === "fr" && p.english ? `\\foreignlanguage{english}{${t}}` : t}.`);
  }
  if (p.venue.trim()) parts.push(`\\textit{${tex(p.venue)}}.`);
  if (p.doi.trim()) {
    const doi = p.doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
    parts.push(`\\href{https://doi.org/${texUrl(doi)}}{\\texttt{doi:${tex(doi)}}}`);
  }
  return parts.join(" ");
}

function publications(d: CvData, sect: string, sub: (h: string) => string): string[] {
  const groups = groupPublications(d.publications, d.lang);
  if (!groups.length) return [];
  const out = [`${sect}{${LABELS[d.lang].publications}}`];
  for (const g of groups) {
    if (g.heading) out.push(sub(g.heading));
    out.push("\\begin{enumerate}[leftmargin=*, itemsep=2pt, topsep=3pt]");
    for (const p of g.items) out.push(`  \\item ${formatPublication(p, d)}`);
    out.push("\\end{enumerate}");
  }
  out.push("");
  return out;
}

// ── Optional list sections ────────────────────────────────────────────────────
function extraSections(d: CvData, sect: string, list: string): string[] {
  const L = LABELS[d.lang];
  const out: string[] = [];
  const block = (title: string, items: string[], bullets: boolean) => {
    if (!items.length) return;
    out.push(`${sect}{${title}}`);
    if (bullets) out.push(`\\begin{itemize}[${list}]`, ...items.map((l) => `  \\item ${tex(l)}`), "\\end{itemize}", "");
    else out.push(`${items.map(tex).join("\\\\\n")}\\par`, "");
  };
  for (const k of EXTRA_SECTIONS) block(L[k], lines(d[k]), k !== "references");
  block(tex(d.extraTitle) || L.additional, lines(d.extra), true);
  return out;
}

function skillRows(skills: string): { label: string; items: string }[] {
  return lines(skills).map((l) => {
    const i = l.indexOf(":");
    return i > 0 ? { label: l.slice(0, i).trim(), items: l.slice(i + 1).trim() } : { label: "", items: l };
  });
}

// ── Academic layout (macros from the "cv" template) ───────────────────────────
function academic(d: CvData): string {
  const L = LABELS[d.lang];
  const out: string[] = [
    "\\documentclass[11pt,a4paper]{article}",
    ...preamble(d, "top=1.9cm, bottom=2cm, left=2.2cm, right=2.2cm", []),
    "",
    "\\definecolor{navy}{RGB}{0,51,102}",
    "\\definecolor{mygray}{RGB}{95,100,110}",
    "",
    "% Section heading: small caps, navy, ruled; never alone at a page foot",
    "\\newcommand{\\cvsect}[1]{%",
    "  \\par\\needspace{4\\baselineskip}%",
    "  \\vspace{0.75em}%",
    "  {\\large\\bfseries\\color{navy}\\scshape #1}%",
    "  \\\\[-0.55em]%",
    "  {\\color{navy!55}\\hrule height 0.6pt}%",
    "  \\vspace{0.3em}%",
    "}",
    "\\newcommand{\\cvsub}[1]{\\par\\needspace{3\\baselineskip}\\vspace{0.2em}{\\bfseries\\itshape #1}\\par}",
    "",
    "% \\cventry{dates}{title}{institution}{location}{details}",
    "% One flow, the date on the title line, so text extraction keeps them together.",
    "\\newcommand{\\cventry}[5]{%",
    "  \\par\\noindent{\\bfseries #2}\\hfill{\\small\\color{mygray}#1}\\\\*%",
    "  {\\small\\itshape\\color{mygray}#3\\ifx&#4&\\else, #4\\fi}%",
    "  \\ifx&#5&\\else\\\\*{\\small #5}\\fi\\par",
    "  \\vspace{0.38em}%",
    "}",
    "",
    "\\begin{document}",
    "",
    "\\begin{center}",
    `  {\\Huge\\bfseries\\color{navy} ${tex(d.name) || "Your Name"}}\\\\[0.35em]`,
  ];
  if (d.headline.trim()) out.push(`  {\\large ${tex(d.headline)}}\\\\[0.3em]`);
  if (contactItems(d).length) out.push(`  \\small ${contactLines(d, " \\quad\\textbullet\\quad ")}`);
  out.push("\\end{center}", "", "{\\color{navy}\\rule{\\linewidth}{1.2pt}}", "");

  if (d.summary.trim()) out.push(`\\cvsect{${L.profile}}`, tex(d.summary), "");

  const entries = (title: string, list: CvEntry[]) => {
    const items = list.filter(hasEntry);
    if (!items.length) return;
    out.push(`\\cvsect{${title}}`);
    for (const e of items) {
      const det = lines(e.details).map(tex).join("\\\\ ");
      out.push(`\\cventry{${texDates(e.dates, d.lang)}}{${tex(e.title)}}{${tex(e.org)}}{${tex(e.location)}}{${det}}`);
    }
    out.push("");
  };
  entries(L.education, d.education);
  entries(L.experience, d.experience);

  out.push(...publications(d, "\\cvsect", (h) => `\\cvsub{${h}}`));
  out.push(...extraSections(d, "\\cvsect", "leftmargin=1.2em, itemsep=1pt, topsep=2pt"));

  const skills = skillRows(d.skills);
  if (skills.length || d.languages.trim()) {
    out.push(`\\cvsect{${L.skills}}`, "\\begin{tabular}{@{}lp{0.72\\linewidth}}");
    for (const s of skills) out.push(`  \\textbf{${tex(s.label)}} & ${tex(s.items)}\\\\`);
    if (d.languages.trim()) out.push(`  \\textbf{${L.languages}} & ${tex(d.languages)}\\\\`);
    out.push("\\end{tabular}", "");
  }

  out.push("\\end{document}", "");
  return out.join("\n");
}

// ── Industry layout (macros from the "cv-photo" template) ─────────────────────
// Order recruiters scan: profile, skills, experience, education, the rest.
function industry(d: CvData): string {
  const L = LABELS[d.lang];
  const tight = !!d.onePage;
  const out: string[] = [
    "\\documentclass[10pt,a4paper]{article}",
    ...preamble(
      d,
      tight ? "top=1cm, bottom=1cm, left=1.3cm, right=1.3cm" : "top=1.3cm, bottom=1.4cm, left=1.6cm, right=1.6cm",
      ["\\usepackage{graphicx}"],
    ),
    ...(tight ? ["\\linespread{0.95}"] : []),
    "",
    "\\definecolor{accent}{RGB}{30, 90, 180}",
    "",
    "% Section heading: title, then a rule underneath; never alone at a page foot",
    "\\newcommand{\\sect}[1]{%",
    "  \\par\\needspace{4\\baselineskip}%",
    `  \\vspace{${tight ? "0.5em" : "0.7em"}}%`,
    "  {\\bfseries\\large\\color{accent} #1}\\par\\nointerlineskip\\vspace{2pt}%",
    `  {\\color{accent}\\rule{\\linewidth}{1.2pt}}\\par\\vspace{${tight ? "0.25em" : "0.35em"}}%`,
    "}",
    "\\newcommand{\\sectsub}[1]{\\par\\needspace{3\\baselineskip}{\\small\\bfseries #1}\\par}",
    "",
    "% \\job{title}{dates}{organisation}{location}",
    "\\newcommand{\\job}[4]{%",
    "  \\par\\needspace{3\\baselineskip}%",
    "  {\\bfseries #1}\\hfill{\\small\\itshape\\color{gray}#2}\\\\*%",
    "  {\\small\\color{gray}#3\\ifx&#4&\\else{} \\textbullet{} #4\\fi}%",
    "}",
    "",
    "\\begin{document}",
    "",
    `\\begin{minipage}[c]{${d.photo ? "0.76" : "1.0"}\\linewidth}`,
    `  {\\fontsize{25}{27}\\selectfont\\bfseries\\color{accent} ${tex(d.name) || "Your Name"}}\\\\[0.3em]`,
  ];
  if (d.headline.trim()) out.push(`  {\\large ${tex(d.headline)}}\\\\[0.35em]`);
  if (contactItems(d).length) out.push(`  \\small ${contactLines(d, " \\enspace\\textbar\\enspace ")}`);
  out.push("\\end{minipage}");
  if (d.photo) {
    out.push(
      "\\hfill",
      "\\begin{minipage}[c]{0.2\\linewidth}",
      "  \\raggedleft",
      "  % Upload photo.jpg next to this file, then replace the \\fbox line with:",
      "  % \\includegraphics[width=3cm]{photo.jpg}",
      "  \\fbox{\\rule{0pt}{3.6cm}\\hspace{2.8cm}}",
      "\\end{minipage}",
    );
  }
  out.push("", "\\vspace{0.4em}", "{\\color{accent}\\rule{\\linewidth}{1.8pt}}", "");

  if (d.summary.trim()) out.push(`\\sect{${L.profile}}`, `{\\small ${tex(d.summary)}\\par}`, "");

  // Skills as plain lines ("Programming: Python, SQL"): parsers read them in order.
  const skills = skillRows(d.skills);
  if (skills.length || d.languages.trim()) {
    const rows = skills.map((s) => (s.label ? `\\textbf{${tex(s.label)}:} ${tex(s.items)}` : tex(s.items)));
    if (d.languages.trim()) rows.push(`\\textbf{${L.languages}:} ${tex(d.languages)}`);
    out.push(`\\sect{${L.skills}}`, "{\\small", rows.join("\\\\[2pt]\n"), "\\par}", "");
  }

  const jobs = (title: string, list: CvEntry[]) => {
    const items = list.filter(hasEntry);
    if (!items.length) return;
    out.push(`\\sect{${title}}`, "");
    items.forEach((e, i) => {
      if (i) out.push(`\\vspace{${tight ? "0.3em" : "0.4em"}}`);
      const org = e.org.trim() ? tex(e.org) : "";
      out.push(`\\job{${tex(e.title)}}{${texDates(e.dates, d.lang)}}{${org}}{${tex(e.location)}}`);
      const det = lines(e.details);
      if (det.length) {
        out.push("\\begin{itemize}[noitemsep, topsep=3pt, leftmargin=1.2em]");
        for (const l of det) out.push(`  \\item ${tex(l)}`);
        out.push("\\end{itemize}");
      }
      out.push("");
    });
  };
  jobs(L.experience, d.experience);
  jobs(L.education, d.education);

  out.push(...publications(d, "\\sect", (h) => `\\sectsub{${h}}`));
  out.push(...extraSections(d, "\\sect", "noitemsep, topsep=2pt, leftmargin=1.2em"));

  out.push("\\end{document}", "");
  return out.join("\n");
}

export function generateCv(d: CvData): string {
  return d.layout === "academic" ? academic(d) : industry(d);
}

/** Advice for the one-page industry CV, or "" when the content looks fine. */
export function lengthWarning(d: CvData): string {
  if (d.layout !== "industry") return "";
  const jobs = d.experience.filter(hasEntry);
  if (jobs.length > 5 || jobs.some((e) => lines(e.details).length > 6)) {
    return "Recruiters expect one page, two after about ten years of experience.";
  }
  return "";
}

export const EMPTY_ENTRY: CvEntry = { dates: "", title: "", org: "", location: "", details: "" };
export const EMPTY_PUB: CvPublication = { authors: "", title: "", venue: "", year: "", doi: "", type: "", english: false };

const EMPTY_EXTRAS = {
  github: "", onePage: false, pubName: "",
  grants: "", teaching: "", talks: "", awards: "", service: "", references: "", extraTitle: "", extra: "",
};

export const EMPTY_CV: CvData = {
  layout: "academic", lang: "en", photo: false,
  name: "", headline: "", email: "", phone: "", location: "", website: "", linkedin: "", orcid: "",
  summary: "", education: [{ ...EMPTY_ENTRY }], experience: [{ ...EMPTY_ENTRY }], publications: [],
  skills: "", languages: "", ...EMPTY_EXTRAS,
};

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

/**
 * Turn anything read from localStorage (a draft from any earlier version, or
 * garbage) into a complete CvData. Missing new fields get empty defaults, never
 * example content.
 */
export function normalizeCv(raw: unknown): CvData {
  const r = obj(raw);
  const entry = (e: unknown): CvEntry => {
    const o = obj(e);
    return { dates: str(o.dates), title: str(o.title), org: str(o.org), location: str(o.location), details: str(o.details) };
  };
  const pub = (p: unknown): CvPublication => {
    const o = obj(p);
    const type = (["journal", "conference", "preprint"] as const).find((t) => t === o.type) ?? "";
    return { authors: str(o.authors), title: str(o.title), venue: str(o.venue), year: str(o.year), doi: str(o.doi), type, english: o.english === true };
  };
  const out: Record<string, unknown> = { ...EMPTY_CV };
  for (const [k, def] of Object.entries(EMPTY_CV)) {
    if (typeof def !== "object" && typeof r[k] === typeof def) out[k] = r[k];
  }
  out.layout = r.layout === "industry" ? "industry" : "academic";
  out.lang = r.lang === "fr" ? "fr" : "en";
  out.education = Array.isArray(r.education) ? r.education.map(entry) : [{ ...EMPTY_ENTRY }];
  out.experience = Array.isArray(r.experience) ? r.experience.map(entry) : [{ ...EMPTY_ENTRY }];
  out.publications = Array.isArray(r.publications) ? r.publications.map(pub) : [];
  return out as unknown as CvData;
}

export const EXAMPLE_CV: CvData = {
  ...EMPTY_EXTRAS,
  layout: "academic",
  lang: "en",
  photo: false,
  name: "Dr Jane Smith",
  headline: "Postdoctoral Researcher, Computational Neuroscience",
  email: "j.smith@university.edu",
  phone: "+44 20 0000 0000",
  location: "Oxford, UK",
  website: "janesmith.github.io",
  linkedin: "",
  github: "janesmith",
  orcid: "0000-0002-1825-0097",
  summary:
    "Computational modelling of neural circuits, Bayesian inference in sensory processing and machine learning for neuroimaging.",
  education: [
    { dates: "Oct. 2019 – Sept. 2023", title: "Ph.D. in Computational Neuroscience", org: "University of Cambridge", location: "Cambridge, UK", details: "Thesis: Probabilistic models of predictive coding in visual cortex" },
    { dates: "Sept. 2017 – June 2019", title: "M.Sc. in Mathematics", org: "Imperial College London", location: "London, UK", details: "" },
  ],
  experience: [
    { dates: "Oct. 2023 – present", title: "Postdoctoral Research Fellow", org: "University of Oxford", location: "Oxford, UK", details: "Built a Bayesian decoder that cut analysis time for 7T fMRI data by 40%\nLeads a team of 3 PhD students and 2 master's interns" },
  ],
  pubName: "Smith, J.",
  publications: [
    { authors: "Smith, J. & Researcher, A.", title: "Efficient coding with correlated neural noise", venue: "PLOS Computational Biology", year: "2023", doi: "", type: "journal", english: false },
    { authors: "Chen, L., Smith, J. & Okafor, N.", title: "Predictive coding as amortised inference", venue: "Advances in Neural Information Processing Systems (NeurIPS)", year: "2024", doi: "", type: "conference", english: false },
    { authors: "Smith, J.", title: "Sparse priors for laminar fMRI", venue: "bioRxiv", year: "2025", doi: "", type: "preprint", english: false },
  ],
  grants: "2023 – 2025: Marie Skłodowska-Curie Postdoctoral Fellowship (EUR 215,000)",
  teaching: "2024: Lecturer, Bayesian Models of Cognition (M.Sc., 40 students)\n2020 – 2022: Supervisor, Part II Neuroscience, University of Cambridge",
  talks: "2024: Gatsby Computational Neuroscience Unit, London",
  awards: "2023: Best Thesis Prize, Cambridge Neuroscience",
  service: "Reviewer for PLOS Computational Biology and NeurIPS",
  references: "Prof. Alan Turner, University of Cambridge, a.turner@cam.ac.uk",
  skills: "Programming: Python, PyTorch, JAX, R\nTools: Git, LaTeX, Slurm, Docker",
  languages: "English (native), French (B2)",
};

export const EXAMPLE_CV_FR: CvData = {
  ...EMPTY_EXTRAS,
  layout: "academic",
  lang: "fr",
  photo: false,
  name: "Camille Moreau",
  headline: "Docteure en statistique, data scientist",
  email: "camille.moreau@exemple.fr",
  phone: "+33 6 12 34 56 78",
  location: "Lyon, France",
  website: "",
  linkedin: "linkedin.com/in/camille-moreau",
  github: "cmoreau",
  orcid: "",
  summary:
    "Statisticienne spécialisée dans les séries temporelles et la prévision de la demande ; six ans d'expérience entre recherche publique et industrie.",
  education: [
    { dates: "oct. 2017 – déc. 2020", title: "Doctorat en mathématiques appliquées", org: "Université Claude Bernard Lyon 1", location: "Lyon", details: "Thèse : modèles bayésiens hiérarchiques pour la prévision de consommation électrique" },
    { dates: "sept. 2015 – juin 2017", title: "Master Statistique et science des données", org: "ENSAI", location: "Rennes", details: "" },
  ],
  experience: [
    { dates: "mars 2022 – aujourd'hui", title: "Data scientist senior", org: "Enedis", location: "Lyon", details: "Réduit de 18 % l'erreur de prévision journalière sur 35 millions de compteurs\nEncadre une équipe de 4 data scientists et 2 alternants\nMis en production un pipeline de prévision suivi en continu (MLflow, Airflow)" },
    { dates: "janv. 2021 – févr. 2022", title: "Ingénieure de recherche", org: "Inria", location: "Grenoble", details: "Développé une bibliothèque Python open source de prévision probabiliste (1 200 étoiles sur GitHub)" },
  ],
  pubName: "Moreau, C.",
  publications: [
    { authors: "Moreau, C., Durand, P. & Lefèvre, H.", title: "Hierarchical forecasting of electricity demand: a Bayesian approach", venue: "International Journal of Forecasting", year: "2022", doi: "", type: "journal", english: true },
    { authors: "Moreau, C. & Bernard, T.", title: "Prévision probabiliste de la consommation : une étude comparative", venue: "Journées de statistique de la SFdS", year: "2021", doi: "", type: "conference", english: false },
  ],
  teaching: "2018 – 2020 : travaux dirigés de probabilités, licence 2 (64 h par an)",
  awards: "2021 : prix de thèse de la Société française de statistique",
  skills: "Programmation : Python, R, SQL\nOutils : Git, Docker, Airflow, MLflow",
  languages: "Français (langue maternelle), anglais (C1), espagnol (B1)",
};

/** The example matching the CV language. */
export function exampleFor(lang: CvLang): CvData {
  return lang === "fr" ? EXAMPLE_CV_FR : EXAMPLE_CV;
}
