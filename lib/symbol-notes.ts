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
  "iff": {
    variants: [
      { code: "\\iff", pkg: "", use: "\"If and only if\": a long double arrow with extra space on both sides. Built into LaTeX." },
      { code: "\\Leftrightarrow", pkg: "", use: "Shorter double arrow, common inside formulas." },
      { code: "\\Longleftrightarrow", pkg: "", use: "Same arrow as \\iff, without the added spacing." },
      { code: "\\text{iff}", pkg: "amsmath", use: "The abbreviation spelled out." },
    ],
    pitfall: "\\iff needs no package: it is defined in LaTeX itself as \;\\Longleftrightarrow\;, which is why it looks wider than \\Longleftrightarrow.",
    example: { code: "x^2 = 1 \\iff x = \\pm 1", pkg: "" },
  },
  "hbar Planck": {
    variants: [
      { code: "\\hbar", pkg: "", use: "Reduced Planck constant, h divided by 2 pi." },
      { code: "\\hslash", pkg: "amssymb", use: "Variant with a slanted stroke." },
      { code: "\\frac{h}{2\\pi}", pkg: "", use: "Written out in full." },
    ],
    pitfall: "\\bar{h} puts a bar above the letter instead of across its stem; use \\hbar.",
    example: { code: "E = \\hbar \\omega", pkg: "" },
  },
  "delta": {
    variants: [
      { code: "\\delta", pkg: "", use: "Lowercase: Dirac delta, small variations." },
      { code: "\\Delta", pkg: "", use: "Capital: differences, Laplacian, discriminant." },
      { code: "\\partial", pkg: "", use: "Curly d for partial derivatives (often confused with delta)." },
      { code: "\\varDelta", pkg: "amsmath", use: "Italic capital delta." },
    ],
    pitfall: "Partial derivatives use \\partial, not \\delta.",
    example: { code: "\\Delta x = x_1 - x_0", pkg: "" },
  },
  "lambda": {
    variants: [
      { code: "\\lambda", pkg: "", use: "Lowercase: eigenvalues, wavelength, rates." },
      { code: "\\Lambda", pkg: "", use: "Capital lambda." },
      { code: "\\boldsymbol{\\lambda}", pkg: "amsmath", use: "Bold, for a vector of parameters." },
      { code: "\\uplambda", pkg: "upgreek", use: "Upright lambda, as ISO style asks for constants." },
    ],
    pitfall: "\\mathbf{\\lambda} stays thin: \\mathbf only changes Latin letters and digits. Use \\boldsymbol (amsmath) or \\bm (bm).",
    example: { code: "A v = \\lambda v", pkg: "" },
  },
  "sigma": {
    variants: [
      { code: "\\sigma", pkg: "", use: "Standard deviation, stress, singular values." },
      { code: "\\Sigma", pkg: "", use: "Capital: covariance matrix." },
      { code: "\\sum", pkg: "", use: "Summation sign: larger, with proper limits." },
      { code: "\\varsigma", pkg: "", use: "Final-form sigma." },
    ],
    pitfall: "Write sums with \\sum, not \\Sigma: \\sum is sized for display math and places limits above and below.",
    example: { code: "\\sum_{i=1}^{n} (x_i - \\mu)^2 = n \\sigma^2", pkg: "" },
  },
  "rightleftharpoons": {
    variants: [
      { code: "\\rightleftharpoons", pkg: "", use: "Equilibrium or reversible reaction." },
      { code: "\\ce{A + B <=> C}", pkg: "mhchem", use: "Chemistry: mhchem draws the arrow and sets formulas upright." },
      { code: "\\xrightleftharpoons[k_2]{k_1}", pkg: "mathtools", use: "Stretchy, with rate constants above and below." },
      { code: "\\leftrightharpoons", pkg: "amssymb", use: "Mirror image." },
    ],
    example: { code: "\\mathrm{N_2 + 3H_2 \\rightleftharpoons 2NH_3}", pkg: "" },
  },
  "min": {
    variants: [
      { code: "\\min_{x \\in X} f(x)", pkg: "", use: "Minimum, with the constraint underneath in display math." },
      { code: "\\operatorname*{arg\\,min}_{x} f(x)", pkg: "amsmath", use: "Argmin: where the minimum is reached." },
      { code: "\\inf_{x \\in X} f(x)", pkg: "", use: "Infimum, when the minimum may not be attained." },
    ],
    pitfall: "min(a, b) typed without the backslash is set as the italic product m i n.",
    example: { code: "\\min(a, b) \\le \\max(a, b)", pkg: "" },
  },
  "copyright": {
    variants: [
      { code: "\\textcopyright", pkg: "", use: "Copyright sign in text.", text: true },
      { code: "\\copyright", pkg: "", use: "Older command, same sign.", text: true },
      { code: "©", pkg: "", use: "Typed directly: fine with UTF-8 input, the default since 2018.", text: true },
    ],
    pitfall: "These are text commands. Inside a formula write \\text{\\textcopyright} (amsmath).",
  },
  "forall": {
    variants: [
      { code: "\\forall", pkg: "", use: "Universal quantifier." },
      { code: "\\exists", pkg: "", use: "Existential quantifier." },
      { code: "\\exists!", pkg: "", use: "There exists a unique." },
      { code: "\\nexists", pkg: "amssymb", use: "There does not exist." },
    ],
    example: { code: "\\forall \\varepsilon > 0, \\exists \\delta > 0", pkg: "" },
  },
  "AND": {
    variants: [
      { code: "\\land", pkg: "", use: "Logical and." },
      { code: "\\wedge", pkg: "", use: "Same glyph, name used for the wedge product." },
      { code: "\\&", pkg: "", use: "The ampersand character in text.", text: true },
      { code: "\\text{ and }", pkg: "amsmath", use: "The word, inside a formula." },
    ],
    pitfall: "A bare & separates columns in tables and align; write \\& to print the character.",
    example: { code: "p \\land q \\implies p", pkg: "amsmath" },
  },
  "lcm": {
    variants: [
      { code: "\\operatorname{lcm}(a, b)", pkg: "amsmath", use: "Upright, with operator spacing." },
      { code: "\\DeclareMathOperator{\\lcm}{lcm}", pkg: "amsmath", use: "In the preamble, then write \\lcm(a, b).", preamble: true },
      { code: "\\gcd(a, b)", pkg: "", use: "Its partner, which is built in." },
    ],
    pitfall: "Unlike \\gcd, standard LaTeX has no \\lcm: it fails with \"Undefined control sequence\" until you declare it.",
    example: { code: "\\operatorname{lcm}(4, 6) = 12", pkg: "amsmath" },
  },
  "mathcal D": {
    variants: [
      { code: "\\mathcal{D}", pkg: "", use: "Calligraphic D: a dataset, a distribution, a domain." },
      { code: "\\mathscr{D}", pkg: "mathrsfs", use: "Script D, more ornate." },
      { code: "\\mathfrak{D}", pkg: "amssymb", use: "Fraktur D." },
      { code: "\\mathbb{D}", pkg: "amssymb", use: "Blackboard D, e.g. the unit disc." },
    ],
    pitfall: "\\mathcal only has capital letters: \\mathcal{d} prints a wrong glyph.",
    example: { code: "X \\sim \\mathcal{D}", pkg: "" },
  },
  "section": {
    variants: [
      { code: "\\S", pkg: "", use: "Section sign, in text or math.", text: true },
      { code: "\\S\\,3.2", pkg: "", use: "Referring to a section, with a thin space.", text: true },
      { code: "\\textsection", pkg: "", use: "Explicit text-mode command.", text: true },
    ],
  },
  "pounds": {
    variants: [
      { code: "\\pounds", pkg: "", use: "Pound sterling, in text or math.", text: true },
      { code: "\\textsterling", pkg: "", use: "Explicit text-mode command.", text: true },
      { code: "£", pkg: "", use: "Typed directly with UTF-8 input.", text: true },
    ],
  },
  "oplus": {
    variants: [
      { code: "\\oplus", pkg: "", use: "Direct sum, XOR: a binary operator." },
      { code: "\\bigoplus_{i=1}^{n} V_i", pkg: "", use: "Large operator with limits." },
      { code: "\\otimes", pkg: "", use: "Tensor product, its usual companion." },
    ],
    example: { code: "V \\oplus W", pkg: "" },
  },
  "little o": {
    variants: [
      { code: "o(n)", pkg: "", use: "Little-o is simply the letter o." },
      { code: "O(n \\log n)", pkg: "", use: "Big-O." },
      { code: "\\mathcal{O}(n)", pkg: "", use: "Calligraphic big-O, a common style." },
      { code: "\\Theta(n)", pkg: "", use: "Theta, the tight bound." },
    ],
    pitfall: "Do not use \\circ (a ring operator) for little-o, and \\mathcal{o} does not exist: calligraphic letters are capitals only.",
    example: { code: "f(n) = o(g(n))", pkg: "" },
  },
};

export function noteFor(name: string): SymbolNote | undefined {
  return SYMBOL_NOTES[name];
}
