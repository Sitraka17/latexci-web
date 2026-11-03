/**
 * lib/bib-format.ts: format a .bib file in a citation style with citeproc-js
 * and the official CSL styles. The loader supplies citeproc, the style and the
 * locale, so the same code runs in the browser (fetch from /csl/, dynamic
 * import) and in Node (tests, build-time examples read from public/csl/).
 */
import type { CitationItem, Engine } from "citeproc";
import { bibToCsl, type CslItem } from "./bib-to-csl";
import { styleById, type StyleId } from "./csl-styles";
import type { CitationForm, FormatResult, FormattedEntry } from "./bib-output";

export type { CitationForm, FormatResult, FormattedEntry } from "./bib-output";
export { toRichHtml, toPlainText, toHtmlDocument } from "./bib-output";

export interface FormatterLoader {
  citeproc(): Promise<{ Engine: typeof Engine }>;
  /** Contents of public/csl/<file>. */
  file(name: string): Promise<string>;
}

// ── Sanitising ───────────────────────────────────────────────────────────────

const SAFE_STYLE = /^(?:font-variant:\s*(?:small-caps|normal)|font-style:\s*(?:italic|normal)|font-weight:\s*(?:bold|normal)|text-decoration:\s*(?:underline|none)|vertical-align:\s*(?:sup|sub|baseline));?$/;

/**
 * Keep only the inline tags citeproc emits (i, b, sup, sub, span with a
 * formatting style). citeproc already escapes the text it is given; this is
 * a second gate before the HTML reaches innerHTML or the clipboard.
 */
export function sanitizeCslHtml(html: string): string {
  return html.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g, (_, slash: string, tag: string, attrs: string) => {
    const t = tag.toLowerCase();
    if (t === "i" || t === "b" || t === "sup" || t === "sub" || t === "em" || t === "strong") return `<${slash}${t}>`;
    if (t === "span") {
      if (slash) return "</span>";
      const style = attrs.match(/style="([^"]*)"/)?.[1]?.trim() ?? "";
      return SAFE_STYLE.test(style) ? `<span style="${style}">` : "<span>";
    }
    return "";
  });
}

/** Text content of an HTML fragment (for entries rendered as HTML only). */
function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

/** Split citeproc's `<div class="csl-entry">` (with left-margin for numbered styles). */
function splitEntry(raw: string): { label: string; body: string } {
  const inner = raw.trim().replace(/^<div class="csl-entry">/, "").replace(/<\/div>$/, "").trim();
  const left = inner.match(/^<div class="csl-left-margin">([\s\S]*?)<\/div>\s*<div class="csl-right-inline">([\s\S]*?)<\/div>$/);
  if (left) return { label: left[1].trim(), body: left[2].trim() };
  return { label: "", body: inner };
}

// ── Formatter ────────────────────────────────────────────────────────────────

interface EngineSlot {
  engine: Engine;
  items: Map<string, CslItem>;
}

/**
 * Keeps one citeproc engine per style: building an engine parses the whole
 * CSL file, which is the slow part; formatting a list afterwards is fast.
 */
export class BibFormatter {
  private slots = new Map<StyleId, Promise<EngineSlot>>();
  private run = 0;

  constructor(private load: FormatterLoader) {}

  private slot(id: StyleId): Promise<EngineSlot> {
    let p = this.slots.get(id);
    if (!p) {
      p = (async () => {
        const style = styleById(id);
        const [CSL, xml, enUS, enGB] = await Promise.all([
          this.load.citeproc(),
          this.load.file(style.file),
          this.load.file("locales-en-US.xml"),
          style.locale === "en-GB" ? this.load.file("locales-en-GB.xml") : Promise.resolve(""),
        ]);
        const items = new Map<string, CslItem>();
        const sys = {
          retrieveLocale: (lang: string) => (lang === "en-GB" && enGB ? enGB : enUS),
          retrieveItem: (key: string) => items.get(key),
        };
        return { engine: new CSL.Engine(sys, xml, style.locale, true), items };
      })();
      p.catch(() => this.slots.delete(id));
      this.slots.set(id, p);
    }
    return p;
  }

  /** Load the engine of a style ahead of the first format() call. */
  async prepare(id: StyleId): Promise<void> {
    await this.slot(id);
  }

  async format(src: string, styleId: StyleId, opts: { sentenceCase?: boolean } = {}): Promise<FormatResult> {
    const style = styleById(styleId);
    const { items, warnings } = bibToCsl(src, { style: style.id, sentenceCase: opts.sentenceCase });
    const { engine, items: store } = await this.slot(style.id);

    // Fresh ids on every run: citeproc caches items by id, and an edited entry
    // keeps its citation key.
    const prefix = `r${++this.run}:`;
    store.clear();
    const ids: string[] = [];
    const keyOf = new Map<string, string>();
    for (const it of items) {
      const id = prefix + it.id;
      store.set(id, { ...it, id });
      ids.push(id);
      keyOf.set(id, it.id);
    }
    engine.updateItems(ids);
    if (!ids.length) {
      return { style: style.id, entries: [], layout: { hangingIndent: false, lineSpacing: 1, entrySpacing: 0 }, citations: [], warnings };
    }

    engine.setOutputFormat("html");
    const html = engine.makeBibliography();
    engine.setOutputFormat("text");
    const text = engine.makeBibliography();
    if (!html || !text) throw new Error(`${style.short} has no bibliography`);
    const [meta, htmlEntries] = html;
    const textEntries = text[1];

    const entries: FormattedEntry[] = htmlEntries.map((raw, n) => {
      const id = meta.entry_ids[n]?.[0] ?? "";
      const { label, body } = splitEntry(raw);
      let plain = textEntries[n]?.trim() ?? decodeEntities(body.replace(/<[^>]+>/g, ""));
      if (label && plain.startsWith(decodeEntities(label))) plain = plain.slice(decodeEntities(label).length).trim();
      return { id: keyOf.get(id) ?? id, label: decodeEntities(label), html: sanitizeCslHtml(body), text: plain };
    });

    // In-text examples, with the first page of the entry as the locator.
    engine.setOutputFormat("html");
    const citations = meta.entry_ids.map(([id]) => {
      const item = store.get(id);
      const page = item?.page?.match(/^[\p{L}]{0,3}\d+/u)?.[0];
      const at = (extra: Partial<CitationItem> = {}): CitationItem =>
        ({ id, ...(page ? { locator: page, label: "page" } : {}), ...extra });
      const cite = (list: CitationItem[]) => sanitizeCslHtml(engine.makeCitationCluster(list));
      const forms: CitationForm[] = [];
      const add = (label: string, h: string) => {
        if (!h || h.includes("NO_PRINTED_FORM")) return;
        forms.push({ label, html: h, text: decodeEntities(h.replace(/<[^>]+>/g, "")) });
      };
      if (style.note) {
        add("First note", `1. ${cite([at()])}`);
        add("Later notes", `2. ${cite([at({ position: 1 })])}`);
      } else if (style.id === "ieee") {
        add("Citation", cite([{ id }]));
        if (page) add("With a page", cite([at()]));
      } else {
        add("Parenthetical", cite([page && style.id === "mla" ? at() : { id }]));
        if (page && style.id !== "mla") add("With a page", cite([at()]));
        const author = cite([{ id, "author-only": true }]);
        const rest = cite([page && style.id === "mla" ? at({ "suppress-author": true }) : { id, "suppress-author": true }]);
        if (author && rest && !rest.includes("NO_PRINTED_FORM") && !author.includes("NO_PRINTED_FORM")) {
          add("Narrative", `${author} ${rest}`);
        }
      }
      return { id: keyOf.get(id) ?? id, forms };
    });

    return {
      style: style.id,
      entries,
      layout: {
        hangingIndent: Boolean(meta.hangingindent),
        lineSpacing: meta.linespacing ?? 1,
        entrySpacing: meta.entryspacing ?? 0,
      },
      citations,
      warnings,
    };
  }
}
