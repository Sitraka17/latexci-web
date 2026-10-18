// Reproduce the /latex-resume-ats experiments:
//   node scripts/seo-cv/run-ats.mjs
// Compiles every test document (scripts/seo-cv/ats-docs.mjs) and the CV
// builder's two English examples with YToTech, extracts the text with
// pdftotext, renders page 1 to public/guides/cv/, and writes
// lib/seo-cv/ats-results.json, which the page reads. Nothing on the page is
// typed by hand: rerun this script after changing a document.
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { ATS_DOCS } from "./ats-docs.mjs";
import { compile, save, writeJson, extract, render, pages, shown, clean, codepoints, tool } from "./compile.mjs";
import { generateCv, EXAMPLE_CV } from "../../lib/cv.ts";

const ROOT = join(import.meta.dirname, "../..");
const OUT = join(import.meta.dirname, "out");
const PNG = join(ROOT, "public/guides/cv");

const docs = { ...ATS_DOCS };
docs["builder-academic"] = generateCv({ ...EXAMPLE_CV, layout: "academic" });
docs["builder-industry"] = generateCv({ ...EXAMPLE_CV, layout: "industry", onePage: true });
docs["builder-industry-iws"] = docs["builder-industry"].replace("\\pagestyle{empty}", "\\pdfinterwordspaceon\n\\pagestyle{empty}");

const results = {};
for (const [id, src] of Object.entries(docs)) {
  process.stdout.write(`${id} ... `);
  const pdf = await compile(src);
  const pdfPath = join(OUT, `${id}.pdf`);
  save(pdfPath, pdf);
  const text = extract(pdfPath);
  const layout = extract(pdfPath, ["-layout", "-l", "1"]).replace(/[ \t]+$/gm, "");
  const py = execFileSync("python3", ["-I", join(import.meta.dirname, "pypdf_text.py"), pdfPath], { encoding: "utf8" }).replace(/\s+$/, "");
  const r = {
    source: clean(src), shown: shown(src), text, layout, pypdf: py,
    // Does each font dictionary carry a /ToUnicode map (what
    // \pdfgentounicode=1 is meant to add)?
    fonts: JSON.parse(execFileSync("python3", ["-I", join(import.meta.dirname, "tounicode.py"), pdfPath], { encoding: "utf8" })),
    pages: pages(pdfPath), bytes: pdf.length, codepoints: codepoints(text), pypdfCodepoints: codepoints(py),
  };
  if (!id.startsWith("builder") && id !== "banner" && id !== "preamble") {
    r.size = render(pdfPath, join(PNG, `${id}.png`), 150);
    r.png = `/guides/cv/${id}.png`;
  }
  if (id === "preamble") {
    r.info = execFileSync("pdfinfo", [pdfPath], { encoding: "utf8" })
      .split("\n").filter((l) => /^(Title|Author|Producer|Creator):/.test(l)).join("\n");
  }
  results[id] = r;
  console.log(`${r.pages} page(s), ${text.length} chars`);
}

const meta = {
  ranOn: new Date().toISOString().slice(0, 10),
  engine: results.banner.text.trim(),
  extractor: tool("pdftotext"),
  extractor2: "pypdf " + execFileSync("python3", ["-I", "-c", "import pypdf; print(pypdf.__version__)"], { encoding: "utf8" }).trim(),
  service: "https://latex.ytotech.com/builds/sync (compiler: pdflatex)",
};
writeJson(join(ROOT, "lib/seo-cv/ats-results.json"), { meta, results });
console.log(meta);
