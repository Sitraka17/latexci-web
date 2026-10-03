// Editorial notes for the symbol pages Google already shows most (Search
// Console, Jun to Sep 2026). Each variant is verified with a real pdfLaTeX
// compile (TeX Live 2026) loading ONLY the listed packages: see
// lib/__tests__/symbol-notes.test.ts for the structural checks and the commit
// message for the compile run. Keyed by SymbolEntry.name.

export interface SymbolVariant {
  /** What to type. */
  code: string;
  /** Comma-separated packages, or "" when none is needed. */
  pkg: string;
  /** When to use it, one short sentence. */
  use: string;
  /** Goes in the preamble (e.g. \DeclareMathOperator), not in the formula. */
  preamble?: boolean;
  /** Text-mode command (not inside $...$). */
  text?: boolean;
}

export interface SymbolNote {
  /** First variant = the recommended one. */
  variants: SymbolVariant[];
  /** A frequent mistake, stated plainly. */
  pitfall?: string;
  /** A realistic formula; `render` is a KaTeX-safe stand-in when needed. */
  example?: { code: string; pkg: string; render?: string };
}

export const SYMBOL_NOTES: Record<string, SymbolNote> = {
  "indicator function": {
    variants: [
      { code: "\\mathds{1}", pkg: "dsfont", use: "The usual choice: a crisp vector double-struck 1." },
      { code: "\\mathbbm{1}", pkg: "bbm", use: "Same look, but bbm ships bitmap (Type 3) fonts, which can look blurry in PDF viewers." },
      { code: "\\mathbf{1}", pkg: "", use: "A bold 1, common in probability texts; needs no package." },
    ],
    pitfall:
      "\\mathbb{1} with amssymb does not give a double-struck one: the AMS blackboard-bold font only contains capital letters, so pdfLaTeX prints the wrong glyph. KaTeX and MathJax do draw it, which is why the mistake spreads through web snippets.",
    example: { code: "\\mathds{1}_{\\{X > 0\\}}", pkg: "dsfont", render: "\\text{𝟙}_{\\{X > 0\\}}" },
  },
  "normal distribution": {
    variants: [
      { code: "\\mathcal{N}(\\mu, \\sigma^2)", pkg: "", use: "The standard notation for a Gaussian with mean and variance." },
      { code: "X \\sim \\mathcal{N}(0, 1)", pkg: "", use: "\\sim reads \"is distributed as\"." },
      { code: "\\mathcal{N}_d(\\boldsymbol{\\mu}, \\boldsymbol{\\Sigma})", pkg: "amsmath", use: "Multivariate normal, with bold vector and matrix." },
    ],
    pitfall: "\\mathbb{N} is the set of natural numbers, not the normal distribution: use the calligraphic \\mathcal{N}.",
    example: { code: "X \\sim \\mathcal{N}(\\mu, \\sigma^2)", pkg: "" },
  },
  "degree celsius": {
    variants: [
      { code: "\\qty{20}{\\degreeCelsius}", pkg: "siunitx", use: "Best for measured values: correct spacing and consistent units (siunitx v3)." },
      { code: "20\\,^\\circ\\mathrm{C}", pkg: "", use: "Quick version in math mode, no package needed." },
      { code: "20\\,\\textdegree C", pkg: "", use: "In running text (outside math mode).", text: true },
    ],
    pitfall:
      "The widely copied ^\\circ\\text{C} needs amsmath for \\text; without it pdfLaTeX stops with \"Undefined control sequence\". \\mathrm{C} works everywhere.",
    example: { code: "T = 20\\,^\\circ\\mathrm{C}", pkg: "" },
  },
  "converges in probability": {
    variants: [
      { code: "\\xrightarrow{p}", pkg: "amsmath", use: "The arrow stretches to fit its label." },
      { code: "\\xrightarrow{\\mathbb{P}}", pkg: "amsmath, amssymb", use: "With a blackboard-bold P, as in many probability texts." },
      { code: "\\overset{p}{\\to}", pkg: "amsmath", use: "Label set over a fixed-length arrow." },
      { code: "\\stackrel{p}{\\to}", pkg: "", use: "Same idea with no package at all." },
    ],
    pitfall: "Use \\xrightarrow{d} for convergence in distribution and \\xrightarrow{\\text{a.s.}} for almost sure convergence (both need amsmath).",
    example: { code: "X_n \\xrightarrow{p} X", pkg: "amsmath" },
  },
  "equal": {
    variants: [
      { code: "=", pkg: "", use: "Equality." },
      { code: "\\neq", pkg: "", use: "Not equal." },
      { code: "\\approx", pkg: "", use: "Approximately equal." },
      { code: "\\equiv", pkg: "", use: "Identical, or congruent modulo n." },
      { code: "\\coloneqq", pkg: "mathtools", use: "\"Is defined as\" (:=) with the colon correctly centred." },
      { code: "\\stackrel{\\text{def}}{=}", pkg: "amsmath", use: "\"Equal by definition\", spelled out." },
    ],
    pitfall: "Typing := leaves the colon too low and badly spaced; \\coloneqq from mathtools fixes both.",
    example: { code: "f(x) \\coloneqq x^2 + 1", pkg: "mathtools", render: "f(x) := x^2 + 1" },
  },
  "rank": {
    variants: [
      { code: "\\operatorname{rank}(A)", pkg: "amsmath", use: "One-off use, upright with operator spacing." },
      { code: "\\DeclareMathOperator{\\rank}{rank}", pkg: "amsmath", use: "In the preamble, then write \\rank(A) everywhere.", preamble: true },
    ],
    pitfall: "Plain rank(A) is set in italics as if it were r times a times n times k; \\text{rank} loses the operator spacing.",
    example: { code: "\\operatorname{rank}(A) = n", pkg: "amsmath" },
  },
  "cong": {
    variants: [
      { code: "\\cong", pkg: "", use: "Isomorphic, or congruent in geometry." },
      { code: "\\simeq", pkg: "", use: "Homotopy equivalent, or asymptotically equal." },
      { code: "\\approxeq", pkg: "amssymb", use: "Approximately equal (with a bar)." },
      { code: "\\equiv", pkg: "", use: "Congruent modulo n." },
    ],
    example: { code: "G / \\ker\\varphi \\cong \\operatorname{im}\\varphi", pkg: "amsmath" },
  },
  "argmax": {
    variants: [
      { code: "\\operatorname*{argmax}", pkg: "amsmath", use: "The star puts subscripts underneath in display math." },
      { code: "\\DeclareMathOperator*{\\argmax}{arg\\,max}", pkg: "amsmath", use: "In the preamble, then write \\argmax_{x} f(x).", preamble: true },
    ],
    pitfall: "\\arg\\max sets two operators: the limit goes under max only, and the spacing is off.",
    example: { code: "\\operatorname*{argmax}_{x \\in X} f(x)", pkg: "amsmath" },
  },
};

export function noteFor(name: string): SymbolNote | undefined {
  return SYMBOL_NOTES[name];
}
