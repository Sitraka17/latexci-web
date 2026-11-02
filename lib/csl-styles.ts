/**
 * lib/csl-styles.ts: the citation styles offered by the BibTeX formatter.
 * Each one is an official CSL style from github.com/citation-style-language/styles,
 * served unchanged from public/csl/ (see public/csl/README.md).
 */

export type StyleId = "apa" | "mla" | "chicago" | "chicago-notes" | "ieee" | "harvard";

export interface StyleInfo {
  id: StyleId;
  /** Label in the style selector. */
  label: string;
  /** Short name used in buttons and file names. */
  short: string;
  /** File in public/csl/. */
  file: string;
  /** Title of the CSL file, as written in its <info><title>. */
  cslTitle: string;
  /** Default locale of the style (the en-GB styles need the en-GB locale file). */
  locale: "en-US" | "en-GB";
  /** Note style: the in-text example is a footnote. */
  note: boolean;
  /** Order of the list, as the style sorts it. */
  order: string;
  /** Name of the list in a paper. */
  listName: string;
  /**
   * Label of a thesis when the entry has no `type` field. The CSL styles print
   * the CSL `genre` variable verbatim, so the wording of each guide is set here.
   */
  phdThesis: string;
  mastersThesis: string;
  /** BibTeX titles are converted to sentence case by default (APA). */
  sentenceCase: boolean;
}

export const STYLES: StyleInfo[] = [
  {
    id: "apa", label: "APA 7th edition", short: "APA", file: "apa.csl",
    cslTitle: "APA Style 7th edition", locale: "en-US", note: false,
    order: "alphabetical by the surname of the first author, then by year",
    listName: "References",
    phdThesis: "Doctoral dissertation", mastersThesis: "Master's thesis", sentenceCase: true,
  },
  {
    id: "mla", label: "MLA 9th edition", short: "MLA", file: "modern-language-association.csl",
    cslTitle: "MLA Handbook 9th edition (in-text citations)", locale: "en-US", note: false,
    order: "alphabetical by the surname of the first author, then by title",
    listName: "Works Cited",
    phdThesis: "PhD dissertation", mastersThesis: "MA thesis", sentenceCase: false,
  },
  {
    id: "chicago", label: "Chicago 18th, author-date", short: "Chicago", file: "chicago-author-date.csl",
    cslTitle: "Chicago Manual of Style 18th edition (author-date)", locale: "en-US", note: false,
    order: "alphabetical by the surname of the first author, then by year",
    listName: "References",
    phdThesis: "PhD diss.", mastersThesis: "Master's thesis", sentenceCase: false,
  },
  {
    id: "chicago-notes", label: "Chicago 18th, notes and bibliography", short: "Chicago notes",
    file: "chicago-notes-bibliography.csl",
    cslTitle: "Chicago Manual of Style 18th edition (notes and bibliography)", locale: "en-US", note: true,
    order: "alphabetical by the surname of the first author, then by title",
    listName: "Bibliography",
    phdThesis: "PhD diss.", mastersThesis: "Master's thesis", sentenceCase: false,
  },
  {
    id: "ieee", label: "IEEE", short: "IEEE", file: "ieee.csl",
    cslTitle: "IEEE Reference Guide version 11.29.2023", locale: "en-US", note: false,
    order: "numbered in order of first citation (here, the order of your file)",
    listName: "References",
    phdThesis: "Ph.D. dissertation", mastersThesis: "M.S. thesis", sentenceCase: false,
  },
  {
    id: "harvard", label: "Harvard (Cite Them Right 12th)", short: "Harvard", file: "harvard-cite-them-right.csl",
    cslTitle: "Cite Them Right 12th edition (author-date/Harvard)", locale: "en-GB", note: false,
    order: "alphabetical by the surname of the first author, then by year",
    listName: "Reference list",
    phdThesis: "PhD thesis", mastersThesis: "MA thesis", sentenceCase: false,
  },
];

export function styleById(id: string): StyleInfo {
  return STYLES.find((s) => s.id === id) ?? STYLES[0];
}
