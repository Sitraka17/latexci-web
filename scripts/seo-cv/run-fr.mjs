// Reproduce the figures of /cv-latex (French page):
//   node scripts/seo-cv/run-fr.mjs
// 1. French punctuation with and without babel french (same source text).
// 2. The CV builder's French example, industry layout, one page.
// Compiles with YToTech, extracts with pdftotext, renders PNGs to
// public/guides/cv/ and writes lib/seo-cv/fr-results.json.
import { join } from "node:path";
import { compile, save, writeJson, extract, render, pages, shown, clean, codepoints } from "./compile.mjs";
import { generateCv, EXAMPLE_CV_FR } from "../../lib/cv.ts";

const ROOT = join(import.meta.dirname, "../..");
const OUT = join(import.meta.dirname, "out");

// Typed WITHOUT the spaces before ; : ! ? to see what babel french adds.
// \og ... \fg{} is babel french's command for guillemets; the English
// version types the guillemets directly, since \og does not exist there.
const body = (q) => String.raw`% <show>
Langues: français, anglais; disponible en janvier!\par
Pourquoi ce poste? ${q}\par
% </show>
`;
const doc = (lang) => String.raw`\documentclass[11pt]{article}
\usepackage[paperwidth=12cm,paperheight=2.4cm,margin=0.5cm]{geometry}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usepackage[${lang}]{babel}
\pagestyle{empty}
\setlength{\parindent}{0pt}
\begin{document}
` + body(lang === "french" ? "\\og Pour la recherche appliquée.\\fg{}" : "«Pour la recherche appliquée.»") + "\\end{document}\n";

const itemize = (setup) => String.raw`\documentclass[11pt]{article}
\usepackage[paperwidth=7cm,paperheight=2.2cm,margin=0.5cm]{geometry}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usepackage[french]{babel}
% <show>
${setup}% </show>
\pagestyle{empty}
\begin{document}
\begin{itemize}
  \item Python, R, SQL
  \item Git, Docker
\end{itemize}
\end{document}
`;

const docs = {
  "fr-babel": doc("french"),
  "fr-english": doc("english"),
  "fr-preamble": String.raw`\documentclass[10pt,a4paper]{article}
% <show>
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usepackage[french]{babel}
\input{glyphtounicode}\pdfgentounicode=1
\usepackage[hidelinks]{hyperref}
\hypersetup{pdftitle={CV de Camille Moreau}, pdfauthor={Camille Moreau}, pdflang={fr}}
% </show>
\pagestyle{empty}
\begin{document}
Camille Moreau\par
Data scientist
\end{document}
`,
  // List labels: what babel french does to itemize, and the builder's setting.
  "fr-itemize": itemize(""),
  "fr-itemize-std": itemize("\\frenchsetup{StandardItemLabels=true}\n"),
  "builder-fr-industry": generateCv({ ...EXAMPLE_CV_FR, layout: "industry", onePage: true }),
  "builder-fr-academic": generateCv({ ...EXAMPLE_CV_FR, layout: "academic" }),
};

const results = { meta: { ranOn: new Date().toISOString().slice(0, 10) } };
for (const [id, src] of Object.entries(docs)) {
  process.stdout.write(`${id} ... `);
  const pdf = await compile(src);
  const pdfPath = join(OUT, `${id}.pdf`);
  save(pdfPath, pdf);
  const text = extract(pdfPath);
  const r = { source: clean(src), shown: shown(src), text, pages: pages(pdfPath), codepoints: codepoints(text) };
  if (id !== "fr-preamble") {
    const full = id.startsWith("builder"); // whole A4 page at 100 dpi, cropped to the ink
    r.size = render(pdfPath, join(ROOT, `public/guides/cv/${id}.png`), full ? 100 : 150);
    r.png = `/guides/cv/${id}.png`;
  }
  results[id] = r;
  console.log(`${r.pages} page(s)`);
}
writeJson(join(ROOT, "lib/seo-cv/fr-results.json"), results);
