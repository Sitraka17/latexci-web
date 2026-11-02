/**
 * lib/bib-format-node.ts: loader for BibFormatter on the server (build-time
 * examples on the tool pages) and in tests. Reads the same files the browser
 * downloads: the styles in public/csl/ and citeproc-js in public/vendor/.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { BibFormatter, type FormatterLoader } from "./bib-format";
import { CITEPROC_FILE, evalCiteproc, type CiteprocModule } from "./citeproc-load";

let citeproc: Promise<CiteprocModule> | null = null;

export const nodeLoader: FormatterLoader = {
  citeproc: () => {
    citeproc ??= readFile(join(process.cwd(), "public/vendor/citeproc", CITEPROC_FILE), "utf8").then(evalCiteproc);
    return citeproc;
  },
  file: (name) => readFile(join(process.cwd(), "public/csl", name.replace(/[^a-zA-Z0-9.-]/g, "")), "utf8"),
};

let shared: BibFormatter | null = null;

/** One formatter per process, so each style's engine is built once. */
export function nodeFormatter(): BibFormatter {
  shared ??= new BibFormatter(nodeLoader);
  return shared;
}
