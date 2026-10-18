// Test documents for /latex-resume-ats. Each pair differs in ONE thing; every
// other document uses the same preamble (T1, lmodern, glyphtounicode) so that
// only the variable under test changes. "% <show>" marks the excerpt printed
// on the page; the whole document is what gets compiled.

const head = (h, extra = "") => String.raw`\documentclass[10pt]{article}
\usepackage[paperwidth=15cm,paperheight=${h},margin=0.6cm]{geometry}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\input{glyphtounicode}\pdfgentounicode=1
${extra}\pagestyle{empty}
\setlength{\parindent}{0pt}
\begin{document}
`;
const tail = "\\end{document}\n";

const LIG_BODY = String.raw`% <show>
Zoë Müller, École Polytechnique, Zürich\par
Office efficiency: financial workflows, affine fitting\par
2019--2021 \textbullet\ Python $\to$ SQL \& C++\par
% </show>
`;
const lig = (preamble) => String.raw`\documentclass[11pt]{article}
\usepackage[paperwidth=12cm,paperheight=2.9cm,margin=0.5cm]{geometry}
${preamble}\pagestyle{empty}
\begin{document}
` + LIG_BODY + tail;

const SIDEBAR = String.raw`  \textbf{Skills}\par
  Python, SQL\par
  Spark, Airflow\par
  \medskip
  \textbf{Languages}\par
  English (native)\par
  French (C1)
`;
const MAIN = String.raw`  \textbf{Experience}\par
  \textbf{Data Engineer}, Acme Analytics\par
  Built the nightly billing pipeline\par
  Cut report latency from 6 h to 40 min\par
  \medskip
  \textbf{Data Analyst}, Northwind Bank\par
  Automated the monthly risk dashboard
`;

export const ATS_DOCS = {
  // 1. Ligatures and accents: font encoding x glyphtounicode.
  "lig-ot1": lig(""),
  "lig-ot1-g2u": lig("\\input{glyphtounicode}\\pdfgentounicode=1\n"),
  "lig-t1": lig("\\usepackage[T1]{fontenc}\n\\usepackage{lmodern}\n"),
  "lig-t1-g2u": lig("\\usepackage[T1]{fontenc}\n\\usepackage{lmodern}\n\\input{glyphtounicode}\\pdfgentounicode=1\n"),

  // 2. Two columns vs one flow (same words).
  "cols-minipage": head("6cm") + "% <show>\n\\begin{minipage}[t]{0.3\\linewidth}\n" + SIDEBAR +
    "\\end{minipage}\\hfill\n\\begin{minipage}[t]{0.66\\linewidth}\n" + MAIN + "\\end{minipage}\n% </show>\n" + tail,
  "cols-paracol": head("6cm", "\\usepackage{paracol}\n") + "% <show>\n\\columnratio{0.3}\n\\begin{paracol}{2}\n" + SIDEBAR +
    "\\switchcolumn\n" + MAIN + "\\end{paracol}\n% </show>\n" + tail,
  "cols-single": head("5.4cm") + String.raw`% <show>
\textbf{Experience}\par
\textbf{Data Engineer}, Acme Analytics\par
Built the nightly billing pipeline\par
Cut report latency from 6 h to 40 min\par
\textbf{Data Analyst}, Northwind Bank\par
Automated the monthly risk dashboard\par
\medskip
\textbf{Skills}\quad Python, SQL, Spark, Airflow\par
\textbf{Languages}\quad English (native), French (C1)
% </show>
` + tail,

  // 3. Icons vs labels.
  "icons-fa": head("2cm", "\\usepackage{fontawesome5}\n") + String.raw`% <show>
\faEnvelope\ jane.doe@example.com \quad
\faPhone\ +33 6 12 34 56 78 \quad
\faLinkedin\ in/janedoe \quad
\faGithub\ janedoe
% </show>
` + tail,
  "icons-plain": head("2cm") + String.raw`% <show>
Email: jane.doe@example.com \quad
Phone: +33 6 12 34 56 78 \quad
LinkedIn: in/janedoe \quad
GitHub: janedoe
% </show>
` + tail,

  // 4. Dates in their own column vs on the title line.
  "dates-tabular": head("4.2cm") + String.raw`% <show>
\begin{tabular}{@{}p{2.4cm}p{10.6cm}@{}}
  2021--2024 & \textbf{Data Engineer}, Acme Analytics\newline
               Built the nightly billing pipeline\newline
               Cut report latency from 6 h to 40 min \\[4pt]
  2019--2021 & \textbf{Data Analyst}, Northwind Bank\newline
               Automated the monthly risk dashboard
\end{tabular}
% </show>
` + tail,
  "dates-minipage": head("4.2cm") + String.raw`% <show>
\begin{minipage}[t]{2.4cm}
  2021--2024\par\vspace{3\baselineskip}
  2019--2021
\end{minipage}%
\begin{minipage}[t]{10.6cm}
  \textbf{Data Engineer}, Acme Analytics\par
  Built the nightly billing pipeline\par
  Cut report latency from 6 h to 40 min\par
  \textbf{Data Analyst}, Northwind Bank\par
  Automated the monthly risk dashboard
\end{minipage}
% </show>
` + tail,
  "dates-hfill": head("4.2cm") + String.raw`% <show>
\textbf{Data Engineer}, Acme Analytics \hfill 2021--2024\par
Built the nightly billing pipeline\par
Cut report latency from 6 h to 40 min\par
\smallskip
\textbf{Data Analyst}, Northwind Bank \hfill 2019--2021\par
Automated the monthly risk dashboard
% </show>
` + tail,

  "dates-inline": head("4.2cm") + String.raw`% <show>
\textbf{Data Engineer}, Acme Analytics, 2021--2024\par
Built the nightly billing pipeline\par
Cut report latency from 6 h to 40 min\par
\smallskip
\textbf{Data Analyst}, Northwind Bank, 2019--2021\par
Automated the monthly risk dashboard
% </show>
` + tail,

  // 5. The checklist preamble shown on the page, compiled on its own.
  "preamble": String.raw`\documentclass[10pt,a4paper]{article}
% <show>
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\input{glyphtounicode}\pdfgentounicode=1
\usepackage[hidelinks,pdfusetitle]{hyperref}
\hypersetup{pdftitle={Jane Doe, CV}, pdfauthor={Jane Doe}, pdflang={en}}
% </show>
\pagestyle{empty}
\begin{document}
Jane Doe\par
Data Engineer
\end{document}
`,

  // Engine version, printed into the PDF.
  "banner": String.raw`\documentclass{article}
\pagestyle{empty}
\begin{document}
\pdftexbanner\par
LaTeX \fmtversion\par
pdfgentounicode=\the\pdfgentounicode
\end{document}
`,
};

// 6. Same documents with real space characters in the PDF (pdfTeX primitive
// \pdfinterwordspaceon): does it stop words from being glued together?
const iws = (src) => src.replace("\\pagestyle{empty}", "\\pdfinterwordspaceon\n\\pagestyle{empty}");
ATS_DOCS["cols-single-iws"] = iws(ATS_DOCS["cols-single"]);
ATS_DOCS["dates-tabular-iws"] = iws(ATS_DOCS["dates-tabular"]);
