// Shared helpers for the CV guide experiments (scripts/seo-cv/run-*.mjs).
// compile(): LaTeX source -> PDF through the YToTech compile service, the same
// service latexci uses for PDF export. extract(): pdftotext (poppler), i.e.
// "what a text extractor sees". render(): pdftoppm, a PNG of page 1.
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const ENDPOINT = "https://latex.ytotech.com/builds/sync";

/** Show only the part of a source between "% <show>" and "% </show>". */
export function shown(src) {
  const m = src.match(/% <show>\n([\s\S]*?)% <\/show>\n/);
  if (!m) return src.trim();
  // Re-indent: drop the common leading whitespace of the excerpt.
  const lines = m[1].replace(/\n$/, "").split("\n");
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return lines.map((l) => l.slice(indent)).join("\n");
}

/** Full source without the show markers (what is actually compiled). */
export function clean(src) {
  return src.replace(/^% <\/?show>\n/gm, "");
}

export async function compile(src, extra = [], compiler = "pdflatex") {
  const body = {
    compiler,
    resources: [{ main: true, content: clean(src) }, ...extra.map(([path, content]) => ({ path, content }))],
  };
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const buf = Buffer.from(await res.arrayBuffer());
    if (res.ok && buf.subarray(0, 4).toString() === "%PDF") return buf;
    if (attempt === 3) throw new Error(`compile failed (${res.status}): ${buf.toString().slice(0, 1500)}`);
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
}

/** Results file; U+2014 is written as a JSON escape so the repo text stays free of it. */
export function writeJson(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(obj, null, 2).replace(/\u2014/g, "\\u2014") + "\n");
}

export function save(path, buf) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, buf);
}

/** pdftotext in its default mode (reading order), page 1 only unless all. */
export function extract(pdfPath, args = []) {
  return execFileSync("pdftotext", ["-enc", "UTF-8", ...args, pdfPath, "-"], { encoding: "utf8" })
    .replace(/\f/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+$/, "");
}

export function pages(pdfPath) {
  const info = execFileSync("pdfinfo", [pdfPath], { encoding: "utf8" });
  return Number(info.match(/Pages:\s+(\d+)/)[1]);
}

export function render(pdfPath, pngPath, dpi = 150, trim = true) {
  mkdirSync(dirname(pngPath), { recursive: true });
  execFileSync("pdftoppm", ["-r", String(dpi), "-png", "-singlefile", "-f", "1", pdfPath, pngPath.replace(/\.png$/, "")]);
  const size = execFileSync("python3", ["-I", join(import.meta.dirname, "trim.py"), pngPath, trim ? "28" : "0"], { encoding: "utf8" });
  return JSON.parse(size);
}

/** Non-ASCII characters in a string, as "c U+XXXX" (for the result tables). */
export function codepoints(s) {
  const seen = new Map();
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (cp > 0x7e && !seen.has(ch)) seen.set(ch, `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`);
  }
  return [...seen.entries()].map(([ch, cp]) => ({ ch, cp }));
}

export function tool(cmd) {
  const r = spawnSync(cmd, ["-v"], { encoding: "utf8" });
  return (r.stdout + r.stderr).split("\n")[0];
}
