// Minimal typings for citeproc-js (npm `citeproc`), which ships none.
// Only the calls used by lib/bib-format.ts are declared.
declare module "citeproc" {
  export interface CiteprocSys {
    retrieveLocale(lang: string): string;
    retrieveItem(id: string): unknown;
  }
  export interface CitationItem {
    id: string;
    locator?: string;
    label?: string;
    position?: number;
    "author-only"?: boolean;
    "suppress-author"?: boolean;
  }
  export interface BibliographyMeta {
    hangingindent?: boolean | number;
    entryspacing?: number;
    linespacing?: number;
    "second-field-align"?: false | "flush" | "margin";
    entry_ids: string[][];
    bibstart: string;
    bibend: string;
  }
  export class Engine {
    constructor(sys: CiteprocSys, style: string, lang?: string, forceLang?: boolean);
    updateItems(ids: string[]): void;
    setOutputFormat(format: "html" | "text" | "rtf"): void;
    makeBibliography(): [BibliographyMeta, string[]] | false;
    makeCitationCluster(items: CitationItem[]): string;
  }
  const CSL: { Engine: typeof Engine };
  export default CSL;
}
