/**
 * lib/bib-output.ts: the formatted reference list as clipboard rich text,
 * plain text and a downloadable HTML file. Tiny and free of citeproc, so the
 * page can copy a list before the formatter has loaded.
 */
import type { MapWarning } from "./bib-to-csl";
import { styleById, type StyleId } from "./csl-styles";

export interface FormattedEntry {
  id: string;
  /** Number label of a numeric style ("[1]"), else "". */
  label: string;
  /** Entry as citeproc micro-HTML (italics, small caps), sanitised. */
  html: string;
  /** Same entry as plain text. */
  text: string;
}

export interface CitationForm { label: string; html: string; text: string }

export interface FormatResult {
  style: StyleId;
  entries: FormattedEntry[];
  layout: { hangingIndent: boolean; lineSpacing: number; entrySpacing: number };
  /** In-text citation examples, per entry id, in list order. */
  citations: { id: string; forms: CitationForm[] }[];
  warnings: MapWarning[];
}

/**
 * One paragraph per entry, with inline styles that Word and Google Docs keep
 * on paste: a 0.5 in hanging indent when the style asks for one (or a
 * numbered label), the style's line spacing, and its space between entries.
 */
export function toRichHtml(r: FormatResult): string {
  const indent = r.layout.hangingIndent || r.entries.some((e) => e.label);
  const ls = Math.round(r.layout.lineSpacing * 100);
  const after = r.layout.entrySpacing * 12 * r.layout.lineSpacing;
  const style = [
    "margin-top:0",
    `margin-bottom:${after}pt`,
    indent ? "margin-left:0.5in;text-indent:-0.5in" : "margin-left:0",
    `line-height:${ls}%`,
  ].join(";");
  return r.entries
    .map((e) => `<p style="${style}">${e.label ? `${e.label} ` : ""}${e.html}</p>`)
    .join("\n");
}

/** One entry per line. */
export function toPlainText(r: FormatResult): string {
  return r.entries.map((e) => (e.label ? `${e.label} ${e.text}` : e.text)).join("\n") + "\n";
}

/** A complete HTML file for the download button. */
export function toHtmlDocument(r: FormatResult): string {
  const style = styleById(r.style);
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    `<title>${style.listName} (${style.label})</title>`,
    "</head>",
    '<body style="font-family:\'Times New Roman\',Times,serif;font-size:12pt;max-width:6.5in;margin:1in auto;">',
    `<h1 style="font-size:12pt;text-align:center;font-weight:${style.id === "apa" ? "bold" : "normal"};">${style.listName}</h1>`,
    toRichHtml(r),
    "</body>",
    "</html>",
    "",
  ].join("\n");
}
