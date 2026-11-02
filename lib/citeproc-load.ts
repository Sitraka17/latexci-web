/**
 * lib/citeproc-load.ts: evaluate citeproc-js from its unmodified source.
 *
 * citeproc-js must not go through the bundler's minifier: its page-range code
 * shares loop counters between closures, and SWC's minifier (webpack and
 * Turbopack alike) moves `pos = 1` above the call that changes it. Chicago
 * then throws on every page range and MLA prints "348–358" for "348–58".
 * So the file is served as is from public/vendor/citeproc/ (a copy of
 * node_modules/citeproc/citeproc_commonjs.js, kept identical by a test) and
 * evaluated here, in the browser and at build time alike.
 */
import type { Engine } from "citeproc";

export const CITEPROC_VERSION = "2.4.63";
export const CITEPROC_FILE = `citeproc-${CITEPROC_VERSION}.js`;

export type CiteprocModule = { Engine: typeof Engine };

/** Run the CommonJS source and return its exports (the CSL object). */
export function evalCiteproc(source: string): CiteprocModule {
  const mod: { exports: unknown } = { exports: {} };
  // The source is a file we ship, not user input.
  const factory = new Function("module", "exports", `${source}\n//# sourceURL=${CITEPROC_FILE}`);
  factory(mod, mod.exports);
  const csl = mod.exports as Partial<CiteprocModule>;
  if (typeof csl?.Engine !== "function") throw new Error("citeproc-js did not load");
  return csl as CiteprocModule;
}
