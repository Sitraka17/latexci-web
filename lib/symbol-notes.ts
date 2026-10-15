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
      { code: "\\DeclareMathOperator*{\\argmax}{argmax}", pkg: "amsmath", use: "In the preamble, then write \\argmax_{x} f(x).", preamble: true },
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
    pitfall: "\\iff needs no package: it is defined in LaTeX itself as \\;\\Longleftrightarrow\\;, which is why it looks wider than \\Longleftrightarrow.",
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
      description: "Lowercase \\delta, capital \\Delta and \\partial compared, plus the Kronecker delta, the Dirac delta, upright \\updelta and \\nabla vs \\Delta for the Laplacian.",
    },
    variants: [
      { code: "\\delta", pkg: "", use: "Lowercase: small variations, a radius in epsilon-delta proofs." },
      { code: "\\Delta", pkg: "", use: "Capital: a difference, the discriminant, or the Laplacian." },
      { code: "\\partial", pkg: "", use: "Curly d for partial derivatives (often confused with delta)." },
      { code: "\\delta_{ij}", pkg: "", use: "Kronecker delta: 1 when i = j, 0 otherwise." },
      { code: "\\delta(x)", pkg: "", use: "Dirac delta function, as in the integral of f(x) times delta(x)." },
      { code: "\\updelta", pkg: "upgreek", use: "Upright delta, as ISO style asks for the Dirac and Kronecker deltas." },
      { code: "\\varDelta", pkg: "amsmath", use: "Italic capital delta." },
    ],
    pitfall:
      "Partial derivatives use \\partial, not \\delta. For the Laplacian write \\Delta f or \\nabla^2 f, both standard; \\nabla f alone is the gradient, a vector, not the Laplacian.",
    example: { code: "\\sum_{j} \\delta_{ij} x_j = x_i", pkg: "" },
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
      { code: "\\operatorname*{argmin}_{x} f(x)", pkg: "amsmath", use: "Argmin: where the minimum is reached." },
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
  // ── Added 2026-10-16: the next most-searched symbols ─────────────────────
  "Delta": {
    seo: {
      title: "Capital Delta in LaTeX: \\Delta, \\varDelta, \\triangle",
      description: "\\Delta is the upright capital delta for a change or the Laplacian; \\varDelta is italic and \\triangle a shape. Each compiled, with lowercase \\delta.",
    },
    variants: [
      { code: "\\Delta", pkg: "", use: "Upright capital delta: a difference, the discriminant, the Laplacian." },
      { code: "\\varDelta", pkg: "amsmath", use: "Italic capital delta, when capitals are set like variables." },
      { code: "\\nabla^2", pkg: "", use: "The other common way to write the Laplacian." },
      { code: "\\triangle", pkg: "", use: "A triangle shape (geometry), not the Greek letter." },
      { code: "\\delta", pkg: "", use: "Lowercase delta, which has its own page." },
    ],
    pitfall:
      "\\triangle is a geometric shape with different proportions, not a capital delta. For the Laplacian pick \\Delta f or \\nabla^2 f and keep one throughout the document.",
    example: { code: "\\Delta f = \\frac{\\partial^2 f}{\\partial x^2} + \\frac{\\partial^2 f}{\\partial y^2}", pkg: "" },
  },
  "mathbb R": {
    seo: {
      title: "Real numbers in LaTeX: \\mathbb{R} needs amssymb",
      description: "\\mathbb{R} stops with Undefined control sequence until you load amssymb. The blackboard R, R^n, the positive reals and the bold \\mathbf{R} style, compiled.",
    },
    variants: [
      { code: "\\mathbb{R}", pkg: "amssymb", use: "The set of real numbers, blackboard bold." },
      { code: "\\mathbb{R}^n", pkg: "amssymb", use: "n-dimensional real space." },
      { code: "\\mathbb{R}_{>0}", pkg: "amssymb", use: "The positive reals." },
      { code: "\\mathbf{R}", pkg: "", use: "Bold R, the older style found in many textbooks; needs no package." },
    ],
    pitfall:
      "\\mathbb is not built in: load amssymb (or amsfonts). It also has capitals only, so \\mathbb{r} prints an unrelated symbol.",
    example: { code: "f\\colon \\mathbb{R}^n \\to \\mathbb{R}", pkg: "amssymb" },
  },
  "approx": {
    seo: {
      title: "Approximately equal in LaTeX: \\approx or \\simeq?",
      description: "\\approx for numbers, \\simeq for asymptotic equality, \\sim for the same order and \\cong for isomorphism. Which one to use, each compiled and ready to copy.",
    },
    variants: [
      { code: "\\approx", pkg: "", use: "Numerical approximation, as in pi is about 3.14." },
      { code: "\\simeq", pkg: "", use: "Asymptotically equal, or homotopy equivalent." },
      { code: "\\sim", pkg: "", use: "Same order of magnitude, or is distributed as." },
      { code: "\\approxeq", pkg: "amssymb", use: "Approximately equal, drawn with a bar underneath." },
      { code: "\\cong", pkg: "", use: "Congruent or isomorphic, not approximate." },
    ],
    pitfall:
      "Pasting the character ≈ into a formula fails under pdfLaTeX with \"Unicode character not set up for use with LaTeX\". Type \\approx.",
    example: { code: "\\pi \\approx 3.14159", pkg: "" },
  },
  "neq": {
    seo: {
      title: "Not equal in LaTeX: \\neq, \\ne and other negations",
      description: "\\neq and \\ne print the same sign. How to negate other relations: \\not\\equiv, and ready-made symbols from amssymb such as \\nleq, each one compiled.",
    },
    variants: [
      { code: "\\neq", pkg: "", use: "Not equal." },
      { code: "\\ne", pkg: "", use: "Short name for the same command." },
      { code: "\\not\\equiv", pkg: "", use: "Not congruent: \\not puts a slash through the next symbol." },
      { code: "\\nleq", pkg: "amssymb", use: "A ready-made negation, better drawn than \\not\\leq." },
    ],
    pitfall:
      "!= typed in a formula prints an exclamation mark and an equals sign, and a pasted ≠ fails under pdfLaTeX. Type \\neq.",
    example: { code: "x \\neq 0", pkg: "" },
  },
  "leq": {
    seo: {
      title: "Less than or equal in LaTeX: \\leq or \\leqslant?",
      description: "<= typed in a formula prints two symbols. Use \\leq (or \\le), or the slanted \\leqslant from amssymb; plus \\nleq and \\lesssim, each one compiled.",
    },
    variants: [
      { code: "\\leq", pkg: "", use: "Less than or equal; \\le is the same command." },
      { code: "\\leqslant", pkg: "amssymb", use: "Slanted form, usual in French and Russian texts." },
      { code: "\\nleq", pkg: "amssymb", use: "Not less than or equal." },
      { code: "\\lesssim", pkg: "amssymb", use: "Less than up to a constant." },
    ],
    pitfall: "<= typed in a formula prints a less-than sign followed by an equals sign, not a single symbol.",
    example: { code: "0 \\leq x \\leq 1", pkg: "" },
  },
  "geq": {
    seo: {
      title: "Greater than or equal in LaTeX: \\geq, \\geqslant",
      description: ">= typed in a formula prints two symbols. Use \\geq (or \\ge), or the slanted \\geqslant from amssymb; plus \\ngeq and \\gtrsim, each one compiled.",
    },
    variants: [
      { code: "\\geq", pkg: "", use: "Greater than or equal; \\ge is the same command." },
      { code: "\\geqslant", pkg: "amssymb", use: "Slanted form, usual in French and Russian texts." },
      { code: "\\ngeq", pkg: "amssymb", use: "Not greater than or equal." },
      { code: "\\gtrsim", pkg: "amssymb", use: "Greater than up to a constant." },
    ],
    pitfall: ">= typed in a formula prints a greater-than sign followed by an equals sign, not a single symbol.",
    example: { code: "n \\geq 1", pkg: "" },
  },
  "infty": {
    seo: {
      title: "Infinity in LaTeX: \\infty, not \\inf",
      description: "\\inf is the infimum and prints inf; infinity is \\infty. With limits, sums and integrals to infinity, minus infinity and \\aleph_0, each one compiled.",
    },
    variants: [
      { code: "\\infty", pkg: "", use: "Infinity." },
      { code: "-\\infty", pkg: "", use: "Minus infinity." },
      { code: "\\lim_{x \\to \\infty} f(x)", pkg: "", use: "A limit at infinity, with the condition underneath in display math." },
      { code: "\\sum_{n=1}^{\\infty} a_n", pkg: "", use: "An infinite series." },
      { code: "\\aleph_0", pkg: "", use: "A cardinal number, when the infinity is a size." },
    ],
    pitfall: "\\inf is the infimum operator, not infinity: it prints the word inf.",
    example: { code: "\\int_0^{\\infty} e^{-x}\\,dx = 1", pkg: "" },
  },
  "sum": {
    seo: {
      title: "Sum in LaTeX: \\sum with limits above and below",
      description: "\\sum puts limits to the side in inline math. \\limits, \\displaystyle and \\substack (amsmath) for limits above, below and on two lines, compiled.",
    },
    variants: [
      { code: "\\sum_{i=1}^{n} x_i", pkg: "", use: "Limits above and below in display math, to the side inline." },
      { code: "\\sum\\limits_{i=1}^{n} x_i", pkg: "", use: "Limits above and below even in inline math." },
      { code: "\\displaystyle\\sum_{i=1}^{n} x_i", pkg: "", use: "Full display size inside a line of text." },
      { code: "\\sum_{\\substack{i < j \\\\ i \\neq k}} a_{ij}", pkg: "amsmath", use: "A condition on two lines under the sign." },
    ],
    pitfall: "\\Sigma is the Greek letter: it does not grow in display math and its limits go to the side. Write sums with \\sum.",
    example: { code: "\\sum_{k=1}^{n} k = \\frac{n(n+1)}{2}", pkg: "" },
  },
  "integral": {
    seo: {
      title: "Integral in LaTeX: \\int, limits and the dx space",
      description: "\\int_a^b f(x)\\,dx with the thin space before dx, \\limits, double and contour integrals and an upright d, each one compiled with its package.",
    },
    variants: [
      { code: "\\int_a^b f(x)\\,dx", pkg: "", use: "Definite integral; \\, adds a thin space before dx." },
      { code: "\\int\\limits_a^b f(x)\\,dx", pkg: "", use: "Limits above and below the sign." },
      { code: "\\iint_D f\\,dA", pkg: "amsmath", use: "Double integral, correctly spaced (\\iiint for triple)." },
      { code: "\\oint_C \\mathbf{F} \\cdot d\\mathbf{r}", pkg: "", use: "Contour integral." },
      { code: "\\int f(x)\\,\\mathrm{d}x", pkg: "", use: "Upright d, as ISO style asks." },
    ],
    pitfall:
      "Without \\, the dx runs into the integrand, and \\int\\int leaves a gap between the signs: use \\iint from amsmath.",
    example: { code: "\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}", pkg: "" },
  },
  "partial": {
    seo: {
      title: "Partial derivative in LaTeX: \\partial, not \\delta",
      description: "The curly d is \\partial. Partial derivatives as fractions, second and mixed derivatives, the subscript shorthand and \\pdv from the physics package.",
    },
    variants: [
      { code: "\\frac{\\partial f}{\\partial x}", pkg: "", use: "First partial derivative." },
      { code: "\\frac{\\partial^2 f}{\\partial x \\, \\partial y}", pkg: "", use: "Mixed second derivative." },
      { code: "\\partial_x f", pkg: "", use: "Subscript shorthand, common in physics." },
      { code: "\\pdv{f}{x}", pkg: "physics", use: "Shortcut from the physics package." },
    ],
    pitfall: "\\delta and d are not partial derivatives: the curly symbol is \\partial.",
    example: {
      code: "\\frac{\\partial^2 u}{\\partial t^2} = c^2 \\frac{\\partial^2 u}{\\partial x^2}",
      pkg: "",
    },
  },
  "nabla gradient": {
    seo: {
      title: "Nabla in LaTeX: \\nabla for gradient, div and curl",
      description: "\\nabla f is the gradient, \\nabla \\cdot F the divergence, \\nabla \\times F the curl and \\nabla^2 the Laplacian. Bold nabla included, each one compiled.",
    },
    variants: [
      { code: "\\nabla f", pkg: "", use: "Gradient of a scalar field." },
      { code: "\\nabla \\cdot \\mathbf{F}", pkg: "", use: "Divergence." },
      { code: "\\nabla \\times \\mathbf{F}", pkg: "", use: "Curl." },
      { code: "\\nabla^2 f", pkg: "", use: "Laplacian, also written \\Delta f." },
      { code: "\\boldsymbol{\\nabla}", pkg: "amsmath", use: "Bold nabla, when vectors are bold." },
    ],
    pitfall: "\\nabla f alone is the gradient, a vector. The Laplacian is \\nabla^2 f or \\Delta f, a scalar.",
    example: { code: "\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\varepsilon_0}", pkg: "" },
  },
  "epsilon": {
    seo: {
      title: "Epsilon in LaTeX: \\epsilon or \\varepsilon?",
      description: "\\epsilon is the lunate form, \\varepsilon the curly one most analysis texts use, and \\in is set membership. How to switch all of them in one line.",
    },
    variants: [
      { code: "\\epsilon", pkg: "", use: "Lunate epsilon, closer to the set-membership sign." },
      { code: "\\varepsilon", pkg: "", use: "Curly epsilon, the usual one in analysis." },
      { code: "\\renewcommand{\\epsilon}{\\varepsilon}", pkg: "", use: "In the preamble: every \\epsilon prints the curly form.", preamble: true },
      { code: "\\in", pkg: "", use: "Set membership: a relation, not a letter." },
    ],
    pitfall:
      "\\in is set membership, not an epsilon: it looks alike but is spaced as a relation. For a small quantity use \\epsilon or \\varepsilon.",
    example: { code: "|x - a| < \\epsilon", pkg: "" },
  },
  "varepsilon": {
    seo: {
      title: "Varepsilon in LaTeX: \\varepsilon vs \\epsilon",
      description: "\\varepsilon is the curly epsilon of analysis texts, \\epsilon the lunate one. Mixing them looks like two variables; upright \\upvarepsilon included.",
    },
    variants: [
      { code: "\\varepsilon", pkg: "", use: "Curly epsilon, as in epsilon-delta proofs." },
      { code: "\\epsilon", pkg: "", use: "Lunate epsilon." },
      { code: "\\upvarepsilon", pkg: "upgreek", use: "Upright curly epsilon, for constants such as permittivity." },
      { code: "\\in", pkg: "", use: "Set membership, often mistaken for an epsilon." },
    ],
    pitfall: "Pick one form: a document that mixes \\epsilon and \\varepsilon reads as if it used two different variables.",
    example: { code: "\\forall \\varepsilon > 0, \\exists \\delta > 0", pkg: "" },
  },
  "phi": {
    seo: {
      title: "Phi in LaTeX: \\phi, \\varphi and capital \\Phi",
      description: "\\phi is the straight-stroke phi, \\varphi the loopy one most texts prefer, \\Phi the capital. And why \\phi is not the empty set, each one compiled.",
    },
    variants: [
      { code: "\\phi", pkg: "", use: "Straight-stroke phi: the golden ratio, a phase." },
      { code: "\\varphi", pkg: "", use: "Loopy phi: angles, Euler's totient, test functions." },
      { code: "\\Phi", pkg: "", use: "Capital: the normal CDF, magnetic flux." },
      { code: "\\emptyset", pkg: "", use: "The empty set, which is not a phi." },
    ],
    pitfall: "\\phi is a Greek letter, not the empty set: write \\emptyset, or \\varnothing (amssymb) for the round form.",
    example: { code: "\\phi = \\frac{1 + \\sqrt{5}}{2}", pkg: "" },
  },
  "varphi": {
    seo: {
      title: "Varphi in LaTeX: \\varphi vs \\phi",
      description: "\\varphi is the loopy phi used for angles and Euler's totient, \\phi the straight one. Upright \\upvarphi, and why neither is the empty set, compiled.",
    },
    variants: [
      { code: "\\varphi", pkg: "", use: "Loopy phi, the usual one in most texts." },
      { code: "\\phi", pkg: "", use: "Straight-stroke phi." },
      { code: "\\upvarphi", pkg: "upgreek", use: "Upright loopy phi." },
      { code: "\\varnothing", pkg: "amssymb", use: "The empty set, round form: not a phi." },
    ],
    pitfall: "Neither \\varphi nor \\phi is the empty set: write \\emptyset or \\varnothing.",
    example: { code: "\\varphi(n) = n \\prod_{p \\mid n} \\left(1 - \\frac{1}{p}\\right)", pkg: "" },
  },
  "theta": {
    seo: {
      title: "Theta in LaTeX: \\theta, \\vartheta and \\Theta",
      description: "Lowercase \\theta for angles and parameters, the cursive \\vartheta, capital \\Theta for tight bounds, and \\hat{\\theta} for an estimator, each compiled.",
    },
    variants: [
      { code: "\\theta", pkg: "", use: "Angles, model parameters." },
      { code: "\\vartheta", pkg: "", use: "Cursive variant, for a second angle or a different parameter." },
      { code: "\\Theta", pkg: "", use: "Capital: tight bound Theta(n), a parameter space." },
      { code: "\\hat{\\theta}", pkg: "", use: "An estimator of theta." },
    ],
    pitfall: "Big-Theta notation uses the capital, \\Theta(n log n); the lowercase \\theta(n) is a function named theta.",
    example: { code: "x = r\\cos\\theta, \\quad y = r\\sin\\theta", pkg: "" },
  },
  "pm": {
    seo: {
      title: "Plus-minus in LaTeX: \\pm, \\mp and \\textpm",
      description: "\\pm and \\mp in formulas, \\textpm in running text. Why +- typed in a formula goes wrong, with the quadratic formula as a worked example.",
    },
    variants: [
      { code: "\\pm", pkg: "", use: "Plus or minus, in math." },
      { code: "\\mp", pkg: "", use: "Minus or plus, paired with \\pm." },
      { code: "\\textpm", pkg: "", use: "Plus-minus in running text, e.g. 5 \\textpm{} 1 cm.", text: true },
      { code: "\\pm 0.5", pkg: "", use: "A tolerance after a value." },
    ],
    pitfall: "+- typed in a formula prints two separate signs, a plus and then a minus, instead of one ±. Type \\pm.",
    example: { code: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}", pkg: "" },
  },
  "cdot": {
    seo: {
      title: "Multiplication dot in LaTeX: \\cdot, not a period",
      description: "\\cdot is the centred dot for products; a period sits on the baseline. \\cdots for centred ellipses, \\times for the cross, each one compiled.",
    },
    variants: [
      { code: "\\cdot", pkg: "", use: "Centred dot: products, dot products." },
      { code: "\\cdots", pkg: "", use: "Centred ellipsis, as in a_1 + \\cdots + a_n." },
      { code: "\\ldots", pkg: "", use: "Ellipsis on the baseline, for lists such as x_1, \\ldots, x_n." },
      { code: "\\times", pkg: "", use: "Cross: dimensions, cross products." },
    ],
    pitfall: "A period . sits on the baseline, and \\cdot\\cdot\\cdot is badly spaced: write \\cdot for one dot and \\cdots for three.",
    example: { code: "\\mathbf{u} \\cdot \\mathbf{v} = u_1 v_1 + \\cdots + u_n v_n", pkg: "" },
  },
  "times": {
    seo: {
      title: "Times symbol in LaTeX: \\times, \\cdot or \\ast?",
      description: "\\times for dimensions and cross products, \\cdot for ordinary products, \\ast for convolution and \\otimes for tensors. And why not the letter x.",
    },
    variants: [
      { code: "\\times", pkg: "", use: "Cross: dimensions, cross products, Cartesian products." },
      { code: "\\cdot", pkg: "", use: "Ordinary multiplication and dot products." },
      { code: "\\ast", pkg: "", use: "Convolution." },
      { code: "\\otimes", pkg: "", use: "Tensor product." },
    ],
    pitfall: "The letter x is not a multiplication sign: in a formula it prints an italic variable. Type \\times.",
    example: { code: "A \\in \\mathbb{R}^{m \\times n}", pkg: "amssymb" },
  },
  "to": {
    seo: {
      title: "\\to in LaTeX: the arrow for limits and maps",
      description: "\\to and \\rightarrow print the same arrow. When to use \\mapsto, \\longrightarrow or a labelled \\xrightarrow{f} (amsmath) instead, each compiled.",
    },
    variants: [
      { code: "\\to", pkg: "", use: "Limits and function signatures." },
      { code: "\\rightarrow", pkg: "", use: "The same arrow, longer name." },
      { code: "\\mapsto", pkg: "", use: "Where an element goes: x maps to x squared." },
      { code: "\\longrightarrow", pkg: "", use: "A longer arrow." },
      { code: "\\xrightarrow{f}", pkg: "amsmath", use: "An arrow with a label that stretches to fit." },
    ],
    pitfall: "-> typed in a formula prints a minus sign and a greater-than sign.",
    example: { code: "f\\colon A \\to B, \\quad x \\mapsto x^2", pkg: "" },
  },
  "rightarrow": {
    seo: {
      title: "Right arrow in LaTeX: \\rightarrow, \\to, \\Rightarrow",
      description: "\\rightarrow and \\to are the same arrow; \\Rightarrow is the double arrow for implication. Longer and labelled arrows too, each one compiled.",
    },
    variants: [
      { code: "\\rightarrow", pkg: "", use: "Single right arrow." },
      { code: "\\to", pkg: "", use: "Short name for the same arrow." },
      { code: "\\Rightarrow", pkg: "", use: "Double arrow: implication." },
      { code: "\\longrightarrow", pkg: "", use: "A longer single arrow." },
      { code: "\\xrightarrow{n \\to \\infty}", pkg: "amsmath", use: "Labelled arrow that stretches to fit." },
    ],
    pitfall: "\\Rightarrow (double) means implies; for a limit or a map use the single \\rightarrow or \\to.",
    example: { code: "x_n \\rightarrow 0", pkg: "" },
  },
  "implies": {
    seo: {
      title: "Implies in LaTeX: \\implies or \\Rightarrow?",
      description: "\\implies needs amsmath and adds space around a long arrow; \\Rightarrow is built in and short. Plus \\impliedby and \\iff, each one compiled.",
    },
    variants: [
      { code: "\\implies", pkg: "amsmath", use: "Long double arrow with space on both sides, for logic in display math." },
      { code: "\\Rightarrow", pkg: "", use: "Short double arrow, built in." },
      { code: "\\impliedby", pkg: "amsmath", use: "The converse, pointing left." },
      { code: "\\iff", pkg: "", use: "If and only if." },
    ],
    pitfall: "\\implies comes from amsmath: without it pdfLaTeX stops with \"Undefined control sequence\". \\Rightarrow works everywhere.",
    example: { code: "x > 2 \\implies x^2 > 4", pkg: "amsmath" },
  },
  "Rightarrow": {
    seo: {
      title: "Double arrow in LaTeX: \\Rightarrow vs \\implies",
      description: "\\Rightarrow is the short double arrow, built in; \\implies (amsmath) is longer and spaced. \\Leftrightarrow and \\Longrightarrow too, each compiled.",
    },
    variants: [
      { code: "\\Rightarrow", pkg: "", use: "Short double arrow, inside formulas." },
      { code: "\\implies", pkg: "amsmath", use: "Long and spaced, between whole statements." },
      { code: "\\Longrightarrow", pkg: "", use: "The long arrow without the added space." },
      { code: "\\Leftrightarrow", pkg: "", use: "Double arrow both ways." },
    ],
    pitfall: "\\Rightarrow is a relation and gets no extra space: between two long statements, \\implies reads better.",
    example: { code: "p \\Rightarrow q", pkg: "" },
  },
  "subseteq": {
    seo: {
      title: "Subset in LaTeX: \\subseteq, \\subset, \\subsetneq",
      description: "\\subset means proper subset in some books and any subset in others. \\subseteq and \\subsetneq (amssymb) leave no doubt; negations included.",
    },
    variants: [
      { code: "\\subseteq", pkg: "", use: "Subset or equal." },
      { code: "\\subsetneq", pkg: "amssymb", use: "Proper subset, unambiguous." },
      { code: "\\subset", pkg: "", use: "Subset; proper or not depends on the author." },
      { code: "\\nsubseteq", pkg: "amssymb", use: "Not a subset." },
      { code: "\\supseteq", pkg: "", use: "Superset or equal." },
    ],
    pitfall: "Readers disagree on whether \\subset allows equality: write \\subseteq or \\subsetneq.",
    example: { code: "\\mathbb{N} \\subseteq \\mathbb{Z} \\subseteq \\mathbb{Q}", pkg: "amssymb" },
  },
  "emptyset": {
    seo: {
      title: "Empty set in LaTeX: \\emptyset or \\varnothing?",
      description: "\\emptyset is the built-in slashed zero; \\varnothing (amssymb) is the round form many prefer. Why \\phi and \\O are not the empty set, compiled.",
    },
    variants: [
      { code: "\\emptyset", pkg: "", use: "Built in: a slashed zero." },
      { code: "\\varnothing", pkg: "amssymb", use: "Round form, closer to most textbooks." },
      { code: "\\{\\}", pkg: "", use: "A pair of braces, also correct." },
    ],
    pitfall: "\\phi and \\varphi are Greek letters, and \\O is the Danish letter in text: none of them is the empty set.",
    example: { code: "A \\cap B = \\emptyset", pkg: "" },
  },
  "varnothing": {
    seo: {
      title: "Varnothing in LaTeX: the round empty set",
      description: "\\varnothing draws the round empty set and needs amssymb; \\emptyset is the built-in slashed zero. When each fits, and what not to use, compiled.",
    },
    variants: [
      { code: "\\varnothing", pkg: "amssymb", use: "Round empty set." },
      { code: "\\emptyset", pkg: "", use: "Slashed zero, built in." },
      { code: "\\renewcommand{\\emptyset}{\\varnothing}", pkg: "amssymb", use: "In the preamble: every \\emptyset prints the round form.", preamble: true },
    ],
    pitfall: "\\varnothing needs amssymb: without it pdfLaTeX stops with \"Undefined control sequence\".",
    example: { code: "A \\cap B = \\varnothing", pkg: "amssymb" },
  },
  "sim": {
    seo: {
      title: "Tilde in LaTeX math: \\sim, \\tilde and \\widetilde",
      description: "A bare ~ is a non-breaking space, not a tilde. \\sim for distributed as, \\tilde and \\widetilde as accents, \\textasciitilde in text, compiled.",
    },
    variants: [
      { code: "\\sim", pkg: "", use: "Is distributed as, or is similar to." },
      { code: "\\tilde{x}", pkg: "", use: "Tilde accent over one letter." },
      { code: "\\widetilde{xy}", pkg: "", use: "Wide tilde over several letters." },
      { code: "\\textasciitilde", pkg: "", use: "A tilde character in running text, e.g. in a URL.", text: true },
    ],
    pitfall: "A bare ~ is a non-breaking space in LaTeX, not a tilde: in math use \\sim, in text \\textasciitilde.",
    example: { code: "X \\sim \\mathcal{N}(0, 1)", pkg: "" },
  },
  "probability E": {
    seo: {
      title: "Expected value in LaTeX: \\mathbb{E} or \\operatorname",
      description: "A plain E[X] is set as an italic variable. \\mathbb{E} (amssymb), an upright \\operatorname{E}, a subscripted expectation and a one-line macro, compiled.",
    },
    variants: [
      { code: "\\mathbb{E}[X]", pkg: "amssymb", use: "Blackboard E, the most common style." },
      { code: "\\operatorname{E}[X]", pkg: "amsmath", use: "Upright E, as in many statistics journals." },
      { code: "\\mathbb{E}_{X \\sim p}[f(X)]", pkg: "amssymb", use: "With the distribution in the subscript." },
      { code: "\\newcommand{\\E}{\\mathbb{E}}", pkg: "amssymb", use: "In the preamble, then write \\E[X].", preamble: true },
    ],
    pitfall: "E[X] with a plain E is set in italics like a variable named E. \\mathbb{E} also needs amssymb.",
    example: { code: "\\mathbb{E}[X] = \\sum_{x} x \\, P(X = x)", pkg: "amssymb" },
  },
  "hat": {
    seo: {
      title: "Hat in LaTeX: \\hat, \\widehat and estimators",
      description: "\\hat covers one letter, \\widehat stretches over several. Hats on Greek letters, unit vectors with \\hat{\\imath}, and the circumflex in text, compiled.",
    },
    variants: [
      { code: "\\hat{x}", pkg: "", use: "Hat over one letter: an estimator, a unit vector." },
      { code: "\\widehat{xy}", pkg: "", use: "Wide hat over several letters." },
      { code: "\\hat{\\beta}", pkg: "", use: "An estimated coefficient." },
      { code: "\\hat{\\imath}", pkg: "", use: "Unit vector: \\imath drops the dot under the hat." },
      { code: "\\^{o}", pkg: "", use: "Circumflex in running text, as in r\\^{o}le.", text: true },
    ],
    pitfall: "\\hat works only in math mode; in text use \\^{o}, or type the accented letter directly.",
    example: { code: "\\hat{\\beta} = (X^\\top X)^{-1} X^\\top y", pkg: "" },
  },
  "bar": {
    seo: {
      title: "Bar over a letter in LaTeX: \\bar or \\overline?",
      description: "\\bar is a short accent for one letter, such as a sample mean; \\overline spans its whole argument. Conjugates, segments and macrons, compiled.",
    },
    variants: [
      { code: "\\bar{x}", pkg: "", use: "Short bar over one letter: the sample mean." },
      { code: "\\overline{AB}", pkg: "", use: "Bar over the whole argument: a segment." },
      { code: "\\overline{z + w}", pkg: "", use: "Complex conjugate of an expression." },
      { code: "\\={o}", pkg: "", use: "Macron in running text.", text: true },
    ],
    pitfall: "\\bar has a fixed width, so over two or more letters it looks too short: use \\overline.",
    example: { code: "\\bar{x} = \\frac{1}{n} \\sum_{i=1}^{n} x_i", pkg: "" },
  },
  "vec": {
    seo: {
      title: "Vector in LaTeX: \\vec, \\mathbf or \\boldsymbol?",
      description: "\\vec draws an arrow over one letter, \\mathbf sets it bold, \\boldsymbol is needed for Greek. \\overrightarrow for segments, each one compiled.",
    },
    variants: [
      { code: "\\vec{v}", pkg: "", use: "Arrow over one letter, common in physics." },
      { code: "\\mathbf{v}", pkg: "", use: "Bold upright, common in engineering and linear algebra." },
      { code: "\\boldsymbol{\\mu}", pkg: "amsmath", use: "Bold Greek or bold italic letters." },
      { code: "\\overrightarrow{AB}", pkg: "", use: "Arrow over several letters: the vector from A to B." },
    ],
    pitfall: "\\vec draws a short arrow sized for one letter; over AB use \\overrightarrow. And \\mathbf leaves Greek letters thin.",
    example: { code: "\\vec{F} = m \\vec{a}", pkg: "" },
  },
  "mathcal L": {
    seo: {
      title: "Calligraphic L in LaTeX: \\mathcal{L} and \\mathscr{L}",
      description: "\\mathcal{L} for a Lagrangian, a loss or the Laplace transform; \\mathscr{L} (mathrsfs) for a script L; \\ell for a lowercase script l. Compiled.",
    },
    variants: [
      { code: "\\mathcal{L}", pkg: "", use: "Lagrangian, loss function, Laplace transform." },
      { code: "\\mathscr{L}", pkg: "mathrsfs", use: "Script L, more ornate." },
      { code: "\\ell", pkg: "", use: "Script lowercase l, e.g. a loss per example." },
      { code: "\\mathcal{L}(\\theta)", pkg: "", use: "A loss as a function of the parameters." },
    ],
    pitfall: "\\mathcal only has capitals: \\mathcal{l} prints a wrong glyph. For a lowercase script l use \\ell.",
    example: { code: "\\mathcal{L}(\\theta) = -\\sum_{i=1}^{n} \\log p_\\theta(x_i)", pkg: "" },
  },
  "checkmark": {
    seo: {
      title: "Check mark in LaTeX: \\checkmark and \\ding{51}",
      description: "A pasted ✓ fails under pdfLaTeX. \\checkmark (amssymb) works in text and math; pifont gives \\ding{51} and the cross \\ding{55}. Each compiled.",
    },
    variants: [
      { code: "\\checkmark", pkg: "amssymb", use: "Check mark, in text or math." },
      { code: "\\ding{51}", pkg: "pifont", use: "Zapf Dingbats check mark, in text.", text: true },
      { code: "\\ding{55}", pkg: "pifont", use: "The matching cross mark.", text: true },
    ],
    pitfall: "Pasting ✓ fails under pdfLaTeX with \"Unicode character not set up for use with LaTeX\". Type \\checkmark.",
    example: { code: "\\checkmark", pkg: "amssymb" },
  },
};

export function noteFor(name: string): SymbolNote | undefined {
  return SYMBOL_NOTES[name];
}
