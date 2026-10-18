// Reproduce the /orcid-to-latex-cv worked example:
//   node scripts/seo-cv/run-orcid.mjs
// Reads ORCID's documented test record (Josiah Carberry, 0000-0002-1825-0097)
// from the public API, records what the summaries and the full works contain,
// builds two publication lists (plain LaTeX from the summaries, biblatex from
// the BibTeX stored in the full works), compiles both with YToTech and writes
// lib/seo-cv/orcid-results.json for the page.
import { join } from "node:path";
import { compile, save, writeJson, extract, render, shown, clean } from "./compile.mjs";
import { tex } from "../../lib/cv.ts";

const ID = "0000-0002-1825-0097";
const API = `https://pub.orcid.org/v3.0/${ID}`;
const ROOT = join(import.meta.dirname, "../..");
const OUT = join(import.meta.dirname, "out");

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "latexci/1.0 (https://latexci.com)" } });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

// 1. The works list (summaries), the call the latexci CV builder makes.
const works = await getJson(`${API}/works`);
const groups = works.group;
const summaries = groups.flatMap((g) => g["work-summary"]);
const first = groups.map((g) => g["work-summary"][0]);
const doiOf = (ids) => (ids?.["external-id"] ?? []).find((x) => x["external-id-type"] === "doi")?.["external-id-value"] ?? "";
const rows = first.map((s) => ({
  putCode: s["put-code"],
  type: s.type,
  year: s["publication-date"]?.year?.value ?? "",
  title: s.title?.title?.value ?? "",
  journal: s["journal-title"]?.value ?? "",
  doi: doiOf(s["external-ids"]),
  source: s.source?.["source-name"]?.value ?? "",
  sources: groups.find((g) => g["work-summary"][0] === s)["work-summary"].length,
}));
const summaryKeys = Object.keys(first[0]);

// 2. The full works (bulk endpoint, up to 100 put-codes per call).
const bulk = await getJson(`${API}/works/${rows.map((r) => r.putCode).join(",")}`);
const full = bulk.bulk.map((b) => b.work);
const fullRows = full.map((w) => ({
  putCode: w["put-code"],
  contributors: (w.contributors?.contributor ?? []).map((c) => c["credit-name"]?.value ?? ""),
  citationType: w.citation?.["citation-type"] ?? "",
  citation: w.citation?.["citation-value"] ?? "",
}));
const fullKeys = Object.keys(full[0]);

// 3. DOI content negotiation for one DOI, to compare with ORCID's stored copy.
const probeDoi = "10.5555/12345679";
const neg = await fetch(`https://doi.org/${probeDoi}`, { headers: { Accept: "application/x-bibtex" }, redirect: "follow" });
const doiBibtex = (await neg.text()).trim();

// 4a. Plain LaTeX list from the summaries: newest year first, one
// enumerate per year, DOI as a link. Authors are not in the summaries.
const byYear = new Map();
for (const r of [...rows].sort((a, b) => b.year.localeCompare(a.year) || a.title.localeCompare(b.title))) {
  if (!byYear.has(r.year)) byYear.set(r.year, []);
  byYear.get(r.year).push(r);
}
const items = [...byYear.entries()].map(([year, rs]) =>
  `\\subsection*{${year}}\n\\begin{enumerate}\n` +
  rs.map((r) => `  \\item \\textit{${tex(r.title)}}.` +
    (r.journal ? `\n    ${tex(r.journal)}.` : "") +
    (r.doi ? `\\newline\n    DOI~\\href{https://doi.org/${r.doi}}{\\nolinkurl{${r.doi}}}` : "")).join("\n") +
  "\n\\end{enumerate}").join("\n");
const plainDoc = String.raw`\documentclass[10pt]{article}
\usepackage[paperwidth=15cm,paperheight=13cm,margin=0.7cm]{geometry}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usepackage{enumitem}
\usepackage{xurl}
\usepackage[hidelinks]{hyperref}
\setlist[enumerate]{nosep,leftmargin=*}
\pagestyle{empty}
\begin{document}
% <show>
\section*{Publications}
` + items + `
% </show>
\\end{document}
`;

// 4b. biblatex from the BibTeX ORCID stores with each full work. The keys
// clash (two "Carberry_2008", two "Carberry_2012"), so each entry is
// re-keyed by its ORCID put-code before use.
const bib = fullRows.map((f) => f.citation.trim().replace(/^@(\w+)\{\s*[^,]*,/, `@$1{orcid${f.putCode},`)).join("\n\n") + "\n";
const keys = fullRows.map((f) => (f.citation.match(/^@\w+\{\s*([^,]*),/) ?? [])[1]);
const bibDoc = String.raw`\documentclass[10pt]{article}
\usepackage[paperwidth=15cm,paperheight=13cm,margin=0.7cm]{geometry}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usepackage[hidelinks]{hyperref}
% <show>
\usepackage[style=authoryear, sorting=ydnt, maxbibnames=99,
            uniquename=false, uniquelist=false, url=false]{biblatex}
\addbibresource{orcid.bib}
\begin{document}
\nocite{*}
\printbibliography[type=article, title={Journal articles}]
% </show>
\pagestyle{empty}
\end{document}
`;

const results = { meta: { ranOn: new Date().toISOString().slice(0, 10), orcid: ID, api: API } };
results.summary = {
  groups: groups.length, summaries: summaries.length, summaryKeys, fullKeys,
  rows, fullRows: fullRows.map(({ citation, ...r }) => ({ ...r, citationKey: (citation.match(/^@\w+\{\s*([^,]*),/) ?? [])[1] ?? "" })),
  firstSummary: first[0],
  duplicateKeys: keys.filter((k, i) => keys.indexOf(k) !== i),
};
results.doi = { doi: probeDoi, status: neg.status, bibtex: doiBibtex, orcidCopy: fullRows.find((f) => f.citation.includes(probeDoi))?.citation ?? "" };

for (const [id, src, extra] of [["orcid-plain", plainDoc, []], ["orcid-biblatex", bibDoc, [["orcid.bib", bib]]]]) {
  process.stdout.write(`${id} ... `);
  const pdf = await compile(src, extra);
  const pdfPath = join(OUT, `${id}.pdf`);
  save(pdfPath, pdf);
  const size = render(pdfPath, join(ROOT, `public/guides/cv/${id}.png`), 150);
  results[id] = { source: clean(src), shown: shown(src), text: extract(pdfPath), png: `/guides/cv/${id}.png`, size };
  console.log("ok");
}
results["orcid-biblatex"].bib = bib;

writeJson(join(ROOT, "lib/seo-cv/orcid-results.json"), results);
console.log(results.summary.groups, "groups;", results.summary.summaries, "summaries; duplicate keys", results.summary.duplicateKeys);
