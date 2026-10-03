// CV builder: structured form data -> a complete, compilable LaTeX document.
// The two layouts reuse the macros of the existing "cv" (academic) and
// "cv-photo" (industry) templates, so the output matches what the template
// pages show. Pure functions: no DOM, unit-tested in lib/__tests__/cv.test.ts.

export type CvLayout = "academic" | "industry";
export type CvLang = "en" | "fr";

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
}

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
}

const LABELS = {
  en: {
    profile: "Profile", education: "Education", experience: "Experience",
    publications: "Publications", skills: "Skills", languages: "Languages",
    photo: "Photo", babel: "english",
  },
  fr: {
    profile: "Profil", education: "Formation", experience: "Expérience professionnelle",
    publications: "Publications", skills: "Compétences", languages: "Langues",
    photo: "Photo", babel: "french",
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
// Typographic punctuation that utf8 + T1 handles natively.
const PUNCT = new Set("–—‘’‚“”„†‡•…‰‹›");

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
export function tex(s: string): string {
  let out = "";
  for (const ch of s.trim()) out += SPECIALS[ch] ?? MAPPED[ch] ?? (typesettable(ch) ? ch : "?");
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
  return url.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function lines(s: string): string[] {
  return s.split("\n").map((l) => l.trim()).filter(Boolean);
}

function hasEntry(e: CvEntry): boolean {
  return [e.dates, e.title, e.org, e.location, e.details].some((v) => v.trim());
}

function hasPub(p: CvPublication): boolean {
  return [p.title, p.venue, p.doi].some((v) => v.trim());
}

function contactItems(d: CvData): string[] {
  const items: string[] = [];
  if (d.email.trim()) items.push(`\\href{mailto:${texUrl(d.email)}}{${tex(d.email)}}`);
  if (d.phone.trim()) items.push(tex(d.phone));
  if (d.location.trim()) items.push(tex(d.location));
  if (d.website.trim()) items.push(`\\href{${texUrl(withScheme(d.website))}}{${tex(displayUrl(d.website))}}`);
  if (d.linkedin.trim()) items.push(`\\href{${texUrl(withScheme(d.linkedin))}}{${tex(displayUrl(d.linkedin))}}`);
  if (d.orcid.trim()) items.push(`\\href{https://orcid.org/${texUrl(d.orcid)}}{ORCID~${tex(d.orcid)}}`);
  // \mbox: an item (e.g. "ORCID 0000-...") never splits across two lines.
  return items.map((i) => `\\mbox{${i}}`);
}

/** Contact items on one line, or two balanced lines when there are many. */
function contactLines(d: CvData, sep: string): string {
  const items = contactItems(d);
  if (items.length <= 3) return items.join(sep);
  return `${items.slice(0, 3).join(sep)}\\\\[0.15em]\n  ${items.slice(3).join(sep)}`;
}

function formatPublication(p: CvPublication): string {
  const parts: string[] = [];
  if (p.authors.trim()) parts.push(`${tex(p.authors)}${p.year.trim() ? ` (${tex(p.year)})` : ""}.`);
  else if (p.year.trim()) parts.push(`(${tex(p.year)}).`);
  if (p.title.trim()) parts.push(`${tex(p.title)}.`);
  if (p.venue.trim()) parts.push(`\\textit{${tex(p.venue)}}.`);
  if (p.doi.trim()) {
    const doi = p.doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
    parts.push(`\\href{https://doi.org/${texUrl(doi)}}{\\texttt{doi:${tex(doi)}}}`);
  }
  return parts.join(" ");
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
    "\\usepackage[T1]{fontenc}",
    "\\usepackage[utf8]{inputenc}",
    `\\usepackage[${L.babel}]{babel}`,
    ...(d.lang === "fr" ? ["\\frenchsetup{StandardItemLabels=true}"] : []),
    "\\usepackage{geometry}",
    "\\geometry{top=1.9cm, bottom=2cm, left=2.2cm, right=2.2cm}",
    "\\usepackage[hidelinks]{hyperref}",
    "\\usepackage{enumitem}",
    "\\usepackage{xcolor}",
    "\\usepackage{microtype}",
    "\\pagestyle{empty}",
    "\\setlength{\\parindent}{0pt}",
    "",
    "\\definecolor{navy}{RGB}{0,51,102}",
    "\\definecolor{mygray}{RGB}{95,100,110}",
    "",
    "% Section heading: small caps, navy, ruled",
    "\\newcommand{\\cvsect}[1]{%",
    "  \\vspace{0.75em}%",
    "  {\\large\\bfseries\\color{navy}\\scshape #1}%",
    "  \\\\[-0.55em]%",
    "  {\\color{navy!55}\\hrule height 0.6pt}%",
    "  \\vspace{0.3em}%",
    "}",
    "",
    "% \\cventry{dates}{title}{institution}{location}{details}",
    "\\newcommand{\\cventry}[5]{%",
    "  \\noindent%",
    "  \\begin{minipage}[t]{0.17\\linewidth}%",
    "    \\raggedright\\small\\color{mygray}#1%",
    "  \\end{minipage}%",
    "  \\hfill%",
    "  \\begin{minipage}[t]{0.80\\linewidth}%",
    "    {\\bfseries #2}\\\\%",
    "    {\\small\\itshape\\color{mygray}#3\\ifx&#4&\\else, #4\\fi}%",
    "    \\ifx&#5&\\else\\\\\\small #5\\fi%",
    "  \\end{minipage}%",
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
      out.push(`\\cventry{${tex(e.dates)}}{${tex(e.title)}}{${tex(e.org)}}{${tex(e.location)}}{${det}}`);
    }
    out.push("");
  };
  entries(L.education, d.education);
  entries(L.experience, d.experience);

  const pubs = d.publications.filter(hasPub);
  if (pubs.length) {
    out.push(`\\cvsect{${L.publications}}`, "\\begin{enumerate}[leftmargin=*, itemsep=2pt, topsep=3pt]");
    for (const p of pubs) out.push(`  \\item ${formatPublication(p)}`);
    out.push("\\end{enumerate}", "");
  }

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
function industry(d: CvData): string {
  const L = LABELS[d.lang];
  const out: string[] = [
    "\\documentclass[10pt,a4paper]{article}",
    "\\usepackage[T1]{fontenc}",
    "\\usepackage[utf8]{inputenc}",
    `\\usepackage[${L.babel}]{babel}`,
    ...(d.lang === "fr" ? ["\\frenchsetup{StandardItemLabels=true}"] : []),
    "\\usepackage{geometry}",
    "\\geometry{top=1.3cm, bottom=1.4cm, left=1.6cm, right=1.6cm}",
    "\\usepackage[hidelinks]{hyperref}",
    "\\usepackage{enumitem}",
    "\\usepackage{xcolor}",
    "\\usepackage{tabularx}",
    "\\usepackage{graphicx}",
    "\\usepackage{microtype}",
    "\\pagestyle{empty}",
    "\\setlength{\\parindent}{0pt}",
    "",
    "\\definecolor{accent}{RGB}{30, 90, 180}",
    "",
    "% Skill tag (lightly shaded box)",
    "\\newcommand{\\skilltag}[1]{\\fcolorbox{accent!35}{accent!7}{\\strut\\small #1}}",
    "",
    "% Section heading: title, then a rule underneath",
    "\\newcommand{\\sect}[1]{%",
    "  \\par\\vspace{0.7em}%",
    "  {\\bfseries\\large\\color{accent} #1}\\par\\nointerlineskip\\vspace{2pt}%",
    "  {\\color{accent}\\rule{\\linewidth}{1.2pt}}\\par\\vspace{0.35em}%",
    "}",
    "",
    "% \\job{title}{dates}{organisation}{location}",
    "\\newcommand{\\job}[4]{%",
    "  {\\bfseries #1}\\hfill{\\small\\itshape\\color{gray}#2}\\\\%",
    "  {\\small\\color{gray}#3\\ifx&#4&\\else{} \\textbullet{} #4\\fi}%",
    "}",
    "",
    "\\begin{document}",
    "",
    `\\begin{minipage}[c]{${d.photo ? "0.72" : "1.0"}\\linewidth}`,
    `  {\\fontsize{25}{27}\\selectfont\\bfseries\\color{accent} ${tex(d.name) || "Your Name"}}\\\\[0.3em]`,
  ];
  if (d.headline.trim()) out.push(`  {\\large ${tex(d.headline)}}\\\\[0.35em]`);
  if (contactItems(d).length) out.push(`  \\small ${contactLines(d, " \\quad\\textbar\\quad ")}`);
  out.push("\\end{minipage}");
  if (d.photo) {
    out.push(
      "\\hfill",
      "\\begin{minipage}[c]{0.22\\linewidth}",
      "  \\centering",
      "  % Upload photo.jpg next to this file, then replace the box below with:",
      "  % \\includegraphics[width=\\linewidth]{photo.jpg}",
      `  \\fbox{\\parbox[c][2.8cm][c]{3cm}{\\centering\\small\\color{gray}${L.photo}}}`,
      "\\end{minipage}",
    );
  }
  out.push("", "\\vspace{0.4em}", "{\\color{accent}\\rule{\\linewidth}{1.8pt}}", "");

  if (d.summary.trim()) out.push("\\vspace{0.3em}", `{\\small ${tex(d.summary)}}`, "");

  const jobs = (title: string, list: CvEntry[]) => {
    const items = list.filter(hasEntry);
    if (!items.length) return;
    out.push(`\\sect{${title}}`, "");
    items.forEach((e, i) => {
      if (i) out.push("\\vspace{0.4em}");
      const org = e.org.trim() ? tex(e.org) : "";
      out.push(`\\job{${tex(e.title)}}{${tex(e.dates)}}{${org}}{${tex(e.location)}}`);
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

  const pubs = d.publications.filter(hasPub);
  if (pubs.length) {
    out.push(`\\sect{${L.publications}}`, "\\begin{enumerate}[leftmargin=*, itemsep=2pt, topsep=3pt]");
    for (const p of pubs) out.push(`  \\item ${formatPublication(p)}`);
    out.push("\\end{enumerate}", "");
  }

  const skills = skillRows(d.skills);
  if (skills.length || d.languages.trim()) {
    out.push(`\\sect{${L.skills}}`, "", "\\begin{tabularx}{\\linewidth}{@{}lX@{}}");
    for (const s of skills) {
      const tags = s.items.split(",").map((t) => t.trim()).filter(Boolean).map((t) => `\\skilltag{${tex(t)}}`).join(" ");
      out.push(`  \\textbf{${tex(s.label)}} & ${tags}\\\\[3pt]`);
    }
    if (d.languages.trim()) out.push(`  \\textbf{${L.languages}} & ${tex(d.languages)}\\\\`);
    out.push("\\end{tabularx}", "");
  }

  out.push("\\end{document}", "");
  return out.join("\n");
}

export function generateCv(d: CvData): string {
  return d.layout === "academic" ? academic(d) : industry(d);
}

export const EMPTY_ENTRY: CvEntry = { dates: "", title: "", org: "", location: "", details: "" };
export const EMPTY_PUB: CvPublication = { authors: "", title: "", venue: "", year: "", doi: "" };

export const EXAMPLE_CV: CvData = {
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
  orcid: "0000-0002-1825-0097",
  summary:
    "Computational modelling of neural circuits, Bayesian inference in sensory processing and machine learning for neuroimaging.",
  education: [
    { dates: "2019--2023", title: "Ph.D. in Computational Neuroscience", org: "University of Cambridge", location: "Cambridge, UK", details: "Thesis: Probabilistic models of predictive coding in visual cortex" },
    { dates: "2017--2019", title: "M.Sc. in Mathematics", org: "Imperial College London", location: "London, UK", details: "" },
  ],
  experience: [
    { dates: "2023--present", title: "Postdoctoral Research Fellow", org: "University of Oxford", location: "Oxford, UK", details: "Marie Curie Fellow, ERC funding\nLeads a team of 3 PhD students" },
  ],
  publications: [
    { authors: "Smith, J. & Researcher, A.", title: "Efficient coding with correlated neural noise", venue: "PLOS Computational Biology", year: "2023", doi: "" },
  ],
  skills: "Programming: Python, PyTorch, JAX, R\nTools: Git, LaTeX, Slurm, Docker",
  languages: "English (native), French (B2)",
};
