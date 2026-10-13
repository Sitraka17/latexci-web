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
  /**
   * Search snippet. These pages rank 5 to 9 for "X latex" but a title that
   * already gives the command earns no click (Search Console, Oct 2026). The
   * title names the choice or the trap the page settles; the description says
   * it concretely. Title at most 55 characters (the layout adds " | latexci").
   */
  seo?: { title: string; description: string };
}

export const SYMBOL_NOTES: Record<string, SymbolNote> = {
  "indicator function": {
    seo: {
      title: "Indicator function in LaTeX: why \\mathbb{1} fails",
      description: "\\mathbb{1} prints the wrong glyph under pdfLaTeX. Three ways that work, \\mathds{1}, \\mathbbm{1} and \\mathbf{1}, each compiled, with its package.",
    },
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
    seo: {
      title: "Normal distribution in LaTeX: \\mathcal{N}(\\mu,\\sigma^2)",
      description: "Write X \\sim \\mathcal{N}(\\mu, \\sigma^2), not \\mathbb{N} (the natural numbers). Univariate, standard and multivariate forms, compiled and ready to copy.",
    },
    variants: [
      { code: "\\mathcal{N}(\\mu, \\sigma^2)", pkg: "", use: "The standard notation for a Gaussian with mean and variance." },
      { code: "X \\sim \\mathcal{N}(0, 1)", pkg: "", use: "\\sim reads \"is distributed as\"." },
      { code: "\\mathcal{N}_d(\\boldsymbol{\\mu}, \\boldsymbol{\\Sigma})", pkg: "amsmath", use: "Multivariate normal, with bold vector and matrix." },
    ],
    pitfall: "\\mathbb{N} is the set of natural numbers, not the normal distribution: use the calligraphic \\mathcal{N}.",
    example: { code: "X \\sim \\mathcal{N}(\\mu, \\sigma^2)", pkg: "" },
  },
  "degree celsius": {
    seo: {
      title: "Degree Celsius in LaTeX: a °C that always compiles",
      description: "The copied ^\\circ\\text{C} fails without amsmath. Three forms that compile: siunitx \\qty{20}{\\degreeCelsius}, ^\\circ\\mathrm{C} and \\textdegree C.",
    },
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
    seo: {
      title: "Convergence in probability in LaTeX: \\xrightarrow{p}",
      description: "Arrow with a p above it: \\xrightarrow{p} (amsmath), plus \\overset and \\stackrel variants, and the arrows for convergence in distribution and almost surely.",
    },
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
    seo: {
      title: "Equals signs in LaTeX: =, \\neq, \\approx, \\equiv, :=",
      description: "Typing := leaves the colon too low: use \\coloneqq. Not equal, approximately equal, equivalent and equal by definition, each with the package it needs.",
    },
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
    seo: {
      title: "Rank of a matrix in LaTeX: \\operatorname{rank}",
      description: "Plain rank(A) is set in italics like a product of letters. \\operatorname{rank} or a \\DeclareMathOperator line fixes the font and the spacing.",
    },
    variants: [
      { code: "\\operatorname{rank}(A)", pkg: "amsmath", use: "One-off use, upright with operator spacing." },
      { code: "\\DeclareMathOperator{\\rank}{rank}", pkg: "amsmath", use: "In the preamble, then write \\rank(A) everywhere.", preamble: true },
    ],
    pitfall: "Plain rank(A) is set in italics as if it were r times a times n times k; \\text{rank} loses the operator spacing.",
    example: { code: "\\operatorname{rank}(A) = n", pkg: "amsmath" },
  },
  "cong": {
    seo: {
      title: "Congruent in LaTeX: \\cong, \\simeq, \\approxeq, \\equiv",
      description: "Which symbol for congruent, isomorphic or equivalent: \\cong, \\simeq, \\approxeq (amssymb) and \\equiv side by side, rendered and ready to copy.",
    },
    variants: [
      { code: "\\cong", pkg: "", use: "Isomorphic, or congruent in geometry." },
      { code: "\\simeq", pkg: "", use: "Homotopy equivalent, or asymptotically equal." },
      { code: "\\approxeq", pkg: "amssymb", use: "Approximately equal (with a bar)." },
      { code: "\\equiv", pkg: "", use: "Congruent modulo n." },
    ],
    example: { code: "G / \\ker\\varphi \\cong \\operatorname{im}\\varphi", pkg: "amsmath" },
  },
  "argmax": {
    seo: {
      title: "argmax in LaTeX: put the subscript under both words",
      description: "\\arg\\max puts the subscript under max only. \\operatorname*{argmax} or \\DeclareMathOperator* centres it under the whole operator in display math.",
    },
    variants: [
      { code: "\\operatorname*{argmax}", pkg: "amsmath", use: "The star puts subscripts underneath in display math." },
      { code: "\\DeclareMathOperator*{\\argmax}{arg\\,max}", pkg: "amsmath", use: "In the preamble, then write \\argmax_{x} f(x).", preamble: true },
    ],
    pitfall: "\\arg\\max sets two operators: the limit goes under max only, and the spacing is off.",
    example: { code: "\\operatorname*{argmax}_{x \\in X} f(x)", pkg: "amsmath" },
  },
  "iff": {
    seo: {
      title: "If and only if in LaTeX: \\iff or \\Leftrightarrow?",
      description: "\\iff needs no package and is wider than \\Leftrightarrow because it adds space on both sides. The four ways to write if and only if, compared.",
    },
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
    seo: {
      title: "h-bar in LaTeX: \\hbar, \\hslash, and why not \\bar{h}",
      description: "\\bar{h} puts the bar above the letter, not across it. Use \\hbar for the reduced Planck constant, or \\hslash (amssymb) for the slanted stroke.",
    },
    variants: [
      { code: "\\hbar", pkg: "", use: "Reduced Planck constant, h divided by 2 pi." },
      { code: "\\hslash", pkg: "amssymb", use: "Variant with a slanted stroke." },
      { code: "\\frac{h}{2\\pi}", pkg: "", use: "Written out in full." },
    ],
    pitfall: "\\bar{h} puts a bar above the letter instead of across its stem; use \\hbar.",
    example: { code: "E = \\hbar \\omega", pkg: "" },
  },
  "delta": {
    seo: {
      title: "Delta in LaTeX: \\delta, \\Delta or \\partial?",
      description: "Lowercase \\delta, capital \\Delta, the partial-derivative \\partial and the italic \\varDelta: which to use where, rendered and ready to copy.",
    },
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
    seo: {
      title: "Lambda in LaTeX: \\lambda, \\Lambda and a bold lambda",
      description: "\\mathbf{\\lambda} stays thin, because \\mathbf skips Greek letters. Use \\boldsymbol{\\lambda}; plus capital \\Lambda and upright \\uplambda.",
    },
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
    seo: {
      title: "Sigma in LaTeX: \\sigma, \\Sigma or \\sum?",
      description: "Write sums with \\sum, not \\Sigma: only \\sum grows in display math and takes limits. Lowercase \\sigma, final \\varsigma and capital \\Sigma compared.",
    },
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
    seo: {
      title: "\\rightleftharpoons in LaTeX: equilibrium arrows",
      description: "Chemical equilibrium three ways: \\rightleftharpoons in math, \\ce{A + B <=> C} with mhchem, and \\xrightleftharpoons with rate constants on the arrows.",
    },
    variants: [
      { code: "\\rightleftharpoons", pkg: "", use: "Equilibrium or reversible reaction." },
      { code: "\\ce{A + B <=> C}", pkg: "mhchem", use: "Chemistry: mhchem draws the arrow and sets formulas upright." },
      { code: "\\xrightleftharpoons[k_2]{k_1}", pkg: "mathtools", use: "Stretchy, with rate constants above and below." },
      { code: "\\leftrightharpoons", pkg: "amssymb", use: "Mirror image." },
    ],
    example: { code: "\\mathrm{N_2 + 3H_2 \\rightleftharpoons 2NH_3}", pkg: "" },
  },
  "min": {
    seo: {
      title: "min in LaTeX: \\min with the subscript underneath",
      description: "min(a, b) without the backslash is set as the italic product m i n. \\min_{x \\in X} f(x), argmin with the subscript centred, and \\inf, ready to copy.",
    },
    variants: [
      { code: "\\min_{x \\in X} f(x)", pkg: "", use: "Minimum, with the constraint underneath in display math." },
      { code: "\\operatorname*{arg\\,min}_{x} f(x)", pkg: "amsmath", use: "Argmin: where the minimum is reached." },
      { code: "\\inf_{x \\in X} f(x)", pkg: "", use: "Infimum, when the minimum may not be attained." },
    ],
    pitfall: "min(a, b) typed without the backslash is set as the italic product m i n.",
    example: { code: "\\min(a, b) \\le \\max(a, b)", pkg: "" },
  },
  "copyright": {
    seo: {
      title: "Copyright symbol in LaTeX: \\textcopyright (©)",
      description: "\\textcopyright and \\copyright are text commands: inside a formula they need \\text{...}. The three ways to print ©, including typing it directly.",
    },
    variants: [
      { code: "\\textcopyright", pkg: "", use: "Copyright sign in text.", text: true },
      { code: "\\copyright", pkg: "", use: "Older command, same sign.", text: true },
      { code: "©", pkg: "", use: "Typed directly: fine with UTF-8 input, the default since 2018.", text: true },
    ],
    pitfall: "These are text commands. Inside a formula write \\text{\\textcopyright} (amsmath).",
  },
  "forall": {
    seo: {
      title: "For all in LaTeX: \\forall, \\exists, \\exists!, \\nexists",
      description: "The quantifiers in one place: \\forall, \\exists, unique existence \\exists! and \\nexists (amssymb), rendered and ready to copy.",
    },
    variants: [
      { code: "\\forall", pkg: "", use: "Universal quantifier." },
      { code: "\\exists", pkg: "", use: "Existential quantifier." },
      { code: "\\exists!", pkg: "", use: "There exists a unique." },
      { code: "\\nexists", pkg: "amssymb", use: "There does not exist." },
    ],
    example: { code: "\\forall \\varepsilon > 0, \\exists \\delta > 0", pkg: "" },
  },
  "AND": {
    seo: {
      title: "Logical AND in LaTeX: \\land, \\wedge or \\&?",
      description: "\\land and \\wedge print the same symbol; a bare & breaks tables and align, so write \\&. Plus the word and inside a formula with \\text.",
    },
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
    seo: {
      title: "lcm in LaTeX: why \\lcm is undefined, and the fix",
      description: "\\gcd exists but \\lcm does not: pdfLaTeX stops with Undefined control sequence. Use \\operatorname{lcm} or one \\DeclareMathOperator line.",
    },
    variants: [
      { code: "\\operatorname{lcm}(a, b)", pkg: "amsmath", use: "Upright, with operator spacing." },
      { code: "\\DeclareMathOperator{\\lcm}{lcm}", pkg: "amsmath", use: "In the preamble, then write \\lcm(a, b).", preamble: true },
      { code: "\\gcd(a, b)", pkg: "", use: "Its partner, which is built in." },
    ],
    pitfall: "Unlike \\gcd, standard LaTeX has no \\lcm: it fails with \"Undefined control sequence\" until you declare it.",
    example: { code: "\\operatorname{lcm}(4, 6) = 12", pkg: "amsmath" },
  },
  "mathcal D": {
    seo: {
      title: "Calligraphic D in LaTeX: \\mathcal, \\mathscr, \\mathfrak",
      description: "Four fancy D letters and the package each needs: \\mathcal{D}, \\mathscr{D} (mathrsfs), \\mathfrak{D} and \\mathbb{D}. Capitals only for \\mathcal.",
    },
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
    seo: {
      title: "Section sign in LaTeX: \\S and \\textsection (§)",
      description: "\\S prints the section sign in text and in math. How to write a reference such as § 3.2 with the right space, and the \\textsection alternative.",
    },
    variants: [
      { code: "\\S", pkg: "", use: "Section sign, in text or math.", text: true },
      { code: "\\S\\,3.2", pkg: "", use: "Referring to a section, with a thin space.", text: true },
      { code: "\\textsection", pkg: "", use: "Explicit text-mode command.", text: true },
    ],
  },
  "pounds": {
    seo: {
      title: "Pound sign in LaTeX: \\pounds or \\textsterling (£)",
      description: "Three ways to print the pound sterling sign: \\pounds, \\textsterling, or typing it directly in a UTF-8 file. Rendered, ready to copy.",
    },
    variants: [
      { code: "\\pounds", pkg: "", use: "Pound sterling, in text or math.", text: true },
      { code: "\\textsterling", pkg: "", use: "Explicit text-mode command.", text: true },
      { code: "£", pkg: "", use: "Typed directly with UTF-8 input.", text: true },
    ],
  },
  "oplus": {
    seo: {
      title: "\\oplus in LaTeX: direct sum, XOR and \\bigoplus",
      description: "The circled plus for a direct sum or XOR is \\oplus; \\bigoplus is the large operator with limits, and \\otimes its tensor counterpart.",
    },
    variants: [
      { code: "\\oplus", pkg: "", use: "Direct sum, XOR: a binary operator." },
      { code: "\\bigoplus_{i=1}^{n} V_i", pkg: "", use: "Large operator with limits." },
      { code: "\\otimes", pkg: "", use: "Tensor product, its usual companion." },
    ],
    example: { code: "V \\oplus W", pkg: "" },
  },
  "little o": {
    seo: {
      title: "Little-o in LaTeX: o(n), O(n), \\mathcal{O}, \\Theta",
      description: "Little-o is a plain italic o, not \\circ, and \\mathcal{o} does not exist. Big-O, calligraphic O and Theta notation written the standard way.",
    },
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
