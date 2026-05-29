export interface SymbolEntry {
  name: string;       // human-readable: "alpha", "integral", "implies"
  command: string;    // LaTeX command: "\\alpha", "\\int"
  package: string;    // "base" | "amsmath" | "amssymb" | "mathtools" | etc.
  category: string;
  unicode: string;    // actual Unicode glyph for search
  description?: string;
}

export const CATEGORIES = [
  "Greek Lowercase",
  "Greek Uppercase",
  "Binary Operators",
  "Relations",
  "Arrows",
  "Logic",
  "Sets",
  "Calculus & Analysis",
  "Number Sets",
  "Accents",
  "Delimiters",
  "Misc Math",
  "Text Symbols",
] as const;

export type SymbolCategory = (typeof CATEGORIES)[number];

export const SYMBOLS: SymbolEntry[] = [
  // ── Greek Lowercase ──────────────────────────────────────────────
  { name: "alpha",      command: "\\alpha",      package: "base",    category: "Greek Lowercase", unicode: "α" },
  { name: "beta",       command: "\\beta",       package: "base",    category: "Greek Lowercase", unicode: "β" },
  { name: "gamma",      command: "\\gamma",      package: "base",    category: "Greek Lowercase", unicode: "γ" },
  { name: "delta",      command: "\\delta",      package: "base",    category: "Greek Lowercase", unicode: "δ" },
  { name: "epsilon",    command: "\\epsilon",    package: "base",    category: "Greek Lowercase", unicode: "ϵ" },
  { name: "varepsilon", command: "\\varepsilon", package: "base",    category: "Greek Lowercase", unicode: "ε", description: "variant epsilon" },
  { name: "zeta",       command: "\\zeta",       package: "base",    category: "Greek Lowercase", unicode: "ζ" },
  { name: "eta",        command: "\\eta",        package: "base",    category: "Greek Lowercase", unicode: "η" },
  { name: "theta",      command: "\\theta",      package: "base",    category: "Greek Lowercase", unicode: "θ" },
  { name: "vartheta",   command: "\\vartheta",   package: "base",    category: "Greek Lowercase", unicode: "ϑ", description: "variant theta" },
  { name: "iota",       command: "\\iota",       package: "base",    category: "Greek Lowercase", unicode: "ι" },
  { name: "kappa",      command: "\\kappa",      package: "base",    category: "Greek Lowercase", unicode: "κ" },
  { name: "lambda",     command: "\\lambda",     package: "base",    category: "Greek Lowercase", unicode: "λ" },
  { name: "mu",         command: "\\mu",         package: "base",    category: "Greek Lowercase", unicode: "μ" },
  { name: "nu",         command: "\\nu",         package: "base",    category: "Greek Lowercase", unicode: "ν" },
  { name: "xi",         command: "\\xi",         package: "base",    category: "Greek Lowercase", unicode: "ξ" },
  { name: "pi",         command: "\\pi",         package: "base",    category: "Greek Lowercase", unicode: "π" },
  { name: "varpi",      command: "\\varpi",      package: "base",    category: "Greek Lowercase", unicode: "ϖ", description: "variant pi" },
  { name: "rho",        command: "\\rho",        package: "base",    category: "Greek Lowercase", unicode: "ρ" },
  { name: "varrho",     command: "\\varrho",     package: "base",    category: "Greek Lowercase", unicode: "ϱ", description: "variant rho" },
  { name: "sigma",      command: "\\sigma",      package: "base",    category: "Greek Lowercase", unicode: "σ" },
  { name: "varsigma",   command: "\\varsigma",   package: "base",    category: "Greek Lowercase", unicode: "ς", description: "variant sigma (final sigma)" },
  { name: "tau",        command: "\\tau",        package: "base",    category: "Greek Lowercase", unicode: "τ" },
  { name: "upsilon",    command: "\\upsilon",    package: "base",    category: "Greek Lowercase", unicode: "υ" },
  { name: "phi",        command: "\\phi",        package: "base",    category: "Greek Lowercase", unicode: "ϕ" },
  { name: "varphi",     command: "\\varphi",     package: "base",    category: "Greek Lowercase", unicode: "φ", description: "variant phi (script)" },
  { name: "chi",        command: "\\chi",        package: "base",    category: "Greek Lowercase", unicode: "χ" },
  { name: "psi",        command: "\\psi",        package: "base",    category: "Greek Lowercase", unicode: "ψ" },
  { name: "omega",      command: "\\omega",      package: "base",    category: "Greek Lowercase", unicode: "ω" },

  // ── Greek Uppercase ───────────────────────────────────────────────
  { name: "Gamma",   command: "\\Gamma",   package: "base", category: "Greek Uppercase", unicode: "Γ" },
  { name: "Delta",   command: "\\Delta",   package: "base", category: "Greek Uppercase", unicode: "Δ" },
  { name: "Theta",   command: "\\Theta",   package: "base", category: "Greek Uppercase", unicode: "Θ" },
  { name: "Lambda",  command: "\\Lambda",  package: "base", category: "Greek Uppercase", unicode: "Λ" },
  { name: "Xi",      command: "\\Xi",      package: "base", category: "Greek Uppercase", unicode: "Ξ" },
  { name: "Pi",      command: "\\Pi",      package: "base", category: "Greek Uppercase", unicode: "Π" },
  { name: "Sigma",   command: "\\Sigma",   package: "base", category: "Greek Uppercase", unicode: "Σ" },
  { name: "Upsilon", command: "\\Upsilon", package: "base", category: "Greek Uppercase", unicode: "Υ" },
  { name: "Phi",     command: "\\Phi",     package: "base", category: "Greek Uppercase", unicode: "Φ" },
  { name: "Psi",     command: "\\Psi",     package: "base", category: "Greek Uppercase", unicode: "Ψ" },
  { name: "Omega",   command: "\\Omega",   package: "base", category: "Greek Uppercase", unicode: "Ω" },

  // ── Binary Operators ──────────────────────────────────────────────
  { name: "plus",          command: "+",            package: "base",    category: "Binary Operators", unicode: "+" },
  { name: "minus",         command: "-",            package: "base",    category: "Binary Operators", unicode: "−" },
  { name: "times",         command: "\\times",      package: "base",    category: "Binary Operators", unicode: "×", description: "cross product / multiplication" },
  { name: "div",           command: "\\div",        package: "base",    category: "Binary Operators", unicode: "÷" },
  { name: "cdot",          command: "\\cdot",       package: "base",    category: "Binary Operators", unicode: "⋅", description: "centered dot (scalar product)" },
  { name: "ast",           command: "\\ast",        package: "base",    category: "Binary Operators", unicode: "∗" },
  { name: "star",          command: "\\star",       package: "base",    category: "Binary Operators", unicode: "⋆" },
  { name: "circ",          command: "\\circ",       package: "base",    category: "Binary Operators", unicode: "∘", description: "function composition" },
  { name: "bullet",        command: "\\bullet",     package: "base",    category: "Binary Operators", unicode: "∙" },
  { name: "oplus",         command: "\\oplus",      package: "base",    category: "Binary Operators", unicode: "⊕", description: "direct sum / XOR" },
  { name: "ominus",        command: "\\ominus",     package: "base",    category: "Binary Operators", unicode: "⊖" },
  { name: "otimes",        command: "\\otimes",     package: "base",    category: "Binary Operators", unicode: "⊗", description: "tensor product" },
  { name: "oslash",        command: "\\oslash",     package: "base",    category: "Binary Operators", unicode: "⊘" },
  { name: "odot",          command: "\\odot",       package: "base",    category: "Binary Operators", unicode: "⊙" },
  { name: "cap",           command: "\\cap",        package: "base",    category: "Binary Operators", unicode: "∩", description: "set intersection" },
  { name: "cup",           command: "\\cup",        package: "base",    category: "Binary Operators", unicode: "∪", description: "set union" },
  { name: "sqcap",         command: "\\sqcap",      package: "base",    category: "Binary Operators", unicode: "⊓" },
  { name: "sqcup",         command: "\\sqcup",      package: "base",    category: "Binary Operators", unicode: "⊔" },
  { name: "vee",           command: "\\vee",        package: "base",    category: "Binary Operators", unicode: "∨", description: "logical OR" },
  { name: "wedge",         command: "\\wedge",      package: "base",    category: "Binary Operators", unicode: "∧", description: "logical AND" },
  { name: "setminus",      command: "\\setminus",   package: "base",    category: "Binary Operators", unicode: "∖", description: "set difference" },
  { name: "pm",            command: "\\pm",         package: "base",    category: "Binary Operators", unicode: "±", description: "plus or minus" },
  { name: "mp",            command: "\\mp",         package: "base",    category: "Binary Operators", unicode: "∓", description: "minus or plus" },
  { name: "amalg",         command: "\\amalg",      package: "base",    category: "Binary Operators", unicode: "⨿" },

  // ── Relations ─────────────────────────────────────────────────────
  { name: "equal",         command: "=",            package: "base",    category: "Relations", unicode: "=" },
  { name: "neq",           command: "\\neq",        package: "base",    category: "Relations", unicode: "≠", description: "not equal" },
  { name: "lt",            command: "<",            package: "base",    category: "Relations", unicode: "<" },
  { name: "gt",            command: ">",            package: "base",    category: "Relations", unicode: ">" },
  { name: "leq",           command: "\\leq",        package: "base",    category: "Relations", unicode: "≤", description: "less than or equal" },
  { name: "geq",           command: "\\geq",        package: "base",    category: "Relations", unicode: "≥", description: "greater than or equal" },
  { name: "leqslant",      command: "\\leqslant",   package: "amssymb", category: "Relations", unicode: "⩽", description: "slanted leq (preferred in many styles)" },
  { name: "geqslant",      command: "\\geqslant",   package: "amssymb", category: "Relations", unicode: "⩾", description: "slanted geq" },
  { name: "ll",            command: "\\ll",         package: "base",    category: "Relations", unicode: "≪", description: "much less than" },
  { name: "gg",            command: "\\gg",         package: "base",    category: "Relations", unicode: "≫", description: "much greater than" },
  { name: "equiv",         command: "\\equiv",      package: "base",    category: "Relations", unicode: "≡", description: "identical to / congruent" },
  { name: "sim",           command: "\\sim",        package: "base",    category: "Relations", unicode: "∼", description: "similar to / asymptotically equal" },
  { name: "simeq",         command: "\\simeq",      package: "base",    category: "Relations", unicode: "≃" },
  { name: "approx",        command: "\\approx",     package: "base",    category: "Relations", unicode: "≈", description: "approximately equal" },
  { name: "cong",          command: "\\cong",       package: "base",    category: "Relations", unicode: "≅", description: "congruent / isomorphic" },
  { name: "propto",        command: "\\propto",     package: "base",    category: "Relations", unicode: "∝", description: "proportional to" },
  { name: "perp",          command: "\\perp",       package: "base",    category: "Relations", unicode: "⊥", description: "perpendicular / bottom" },
  { name: "mid",           command: "\\mid",        package: "base",    category: "Relations", unicode: "∣", description: "divides" },
  { name: "nmid",          command: "\\nmid",       package: "amssymb", category: "Relations", unicode: "∤", description: "does not divide" },
  { name: "parallel",      command: "\\parallel",   package: "base",    category: "Relations", unicode: "∥" },
  { name: "prec",          command: "\\prec",       package: "base",    category: "Relations", unicode: "≺" },
  { name: "succ",          command: "\\succ",       package: "base",    category: "Relations", unicode: "≻" },
  { name: "preceq",        command: "\\preceq",     package: "base",    category: "Relations", unicode: "≼" },
  { name: "succeq",        command: "\\succeq",     package: "base",    category: "Relations", unicode: "≽" },
  { name: "subseteq",      command: "\\subseteq",   package: "base",    category: "Relations", unicode: "⊆" },
  { name: "supseteq",      command: "\\supseteq",   package: "base",    category: "Relations", unicode: "⊇" },
  { name: "subset",        command: "\\subset",     package: "base",    category: "Relations", unicode: "⊂" },
  { name: "supset",        command: "\\supset",     package: "base",    category: "Relations", unicode: "⊃" },
  { name: "sqsubseteq",    command: "\\sqsubseteq", package: "base",    category: "Relations", unicode: "⊑" },
  { name: "sqsupseteq",    command: "\\sqsupseteq", package: "base",    category: "Relations", unicode: "⊒" },
  { name: "in",            command: "\\in",         package: "base",    category: "Relations", unicode: "∈", description: "element of" },
  { name: "notin",         command: "\\notin",      package: "base",    category: "Relations", unicode: "∉", description: "not an element of" },
  { name: "ni",            command: "\\ni",         package: "base",    category: "Relations", unicode: "∋", description: "contains as member" },
  { name: "vdash",         command: "\\vdash",      package: "base",    category: "Relations", unicode: "⊢", description: "proves / turnstile" },
  { name: "models",        command: "\\models",     package: "base",    category: "Relations", unicode: "⊨", description: "models / satisfies" },

  // ── Arrows ────────────────────────────────────────────────────────
  { name: "to",                command: "\\to",                package: "base",    category: "Arrows", unicode: "→", description: "right arrow" },
  { name: "leftarrow",         command: "\\leftarrow",         package: "base",    category: "Arrows", unicode: "←" },
  { name: "rightarrow",        command: "\\rightarrow",        package: "base",    category: "Arrows", unicode: "→" },
  { name: "leftrightarrow",    command: "\\leftrightarrow",    package: "base",    category: "Arrows", unicode: "↔" },
  { name: "Leftarrow",         command: "\\Leftarrow",         package: "base",    category: "Arrows", unicode: "⇐" },
  { name: "Rightarrow",        command: "\\Rightarrow",        package: "base",    category: "Arrows", unicode: "⇒", description: "implies" },
  { name: "Leftrightarrow",    command: "\\Leftrightarrow",    package: "base",    category: "Arrows", unicode: "⇔", description: "if and only if" },
  { name: "iff",               command: "\\iff",               package: "amsmath", category: "Arrows", unicode: "⟺", description: "if and only if (wide)" },
  { name: "implies",           command: "\\implies",           package: "amsmath", category: "Arrows", unicode: "⟹", description: "implies (wide)" },
  { name: "uparrow",           command: "\\uparrow",           package: "base",    category: "Arrows", unicode: "↑" },
  { name: "downarrow",         command: "\\downarrow",         package: "base",    category: "Arrows", unicode: "↓" },
  { name: "updownarrow",       command: "\\updownarrow",       package: "base",    category: "Arrows", unicode: "↕" },
  { name: "nearrow",           command: "\\nearrow",           package: "base",    category: "Arrows", unicode: "↗" },
  { name: "searrow",           command: "\\searrow",           package: "base",    category: "Arrows", unicode: "↘" },
  { name: "swarrow",           command: "\\swarrow",           package: "base",    category: "Arrows", unicode: "↙" },
  { name: "nwarrow",           command: "\\nwarrow",           package: "base",    category: "Arrows", unicode: "↖" },
  { name: "mapsto",            command: "\\mapsto",            package: "base",    category: "Arrows", unicode: "↦", description: "maps to" },
  { name: "longmapsto",        command: "\\longmapsto",        package: "base",    category: "Arrows", unicode: "⟼" },
  { name: "hookrightarrow",    command: "\\hookrightarrow",    package: "base",    category: "Arrows", unicode: "↪", description: "injection / includes into" },
  { name: "twoheadrightarrow", command: "\\twoheadrightarrow", package: "base",    category: "Arrows", unicode: "↠", description: "surjection / onto" },
  { name: "rightharpoonup",    command: "\\rightharpoonup",    package: "base",    category: "Arrows", unicode: "⇀" },
  { name: "rightharpoondown",  command: "\\rightharpoondown",  package: "base",    category: "Arrows", unicode: "⇁" },
  { name: "rightleftharpoons", command: "\\rightleftharpoons", package: "base",    category: "Arrows", unicode: "⇌", description: "equilibrium (chemistry)" },
  { name: "dashrightarrow",    command: "\\dashrightarrow",    package: "amssymb", category: "Arrows", unicode: "⇢" },
  { name: "circlearrowleft",   command: "\\circlearrowleft",   package: "amssymb", category: "Arrows", unicode: "↺" },
  { name: "circlearrowright",  command: "\\circlearrowright",  package: "amssymb", category: "Arrows", unicode: "↻" },

  // ── Logic ─────────────────────────────────────────────────────────
  { name: "forall",    command: "\\forall",   package: "base",    category: "Logic", unicode: "∀", description: "for all / universal quantifier" },
  { name: "exists",    command: "\\exists",   package: "base",    category: "Logic", unicode: "∃", description: "there exists / existential quantifier" },
  { name: "nexists",   command: "\\nexists",  package: "amssymb", category: "Logic", unicode: "∄", description: "there does not exist" },
  { name: "neg",       command: "\\neg",      package: "base",    category: "Logic", unicode: "¬", description: "logical negation" },
  { name: "land",      command: "\\land",     package: "base",    category: "Logic", unicode: "∧", description: "logical AND (alias for \\wedge)" },
  { name: "lor",       command: "\\lor",      package: "base",    category: "Logic", unicode: "∨", description: "logical OR (alias for \\vee)" },
  { name: "top",       command: "\\top",      package: "base",    category: "Logic", unicode: "⊤", description: "true / tautology" },
  { name: "bot",       command: "\\bot",      package: "base",    category: "Logic", unicode: "⊥", description: "false / contradiction" },
  { name: "therefore", command: "\\therefore",package: "amssymb", category: "Logic", unicode: "∴", description: "therefore" },
  { name: "because",   command: "\\because",  package: "amssymb", category: "Logic", unicode: "∵", description: "because" },
  { name: "lozenge",   command: "\\lozenge",  package: "amssymb", category: "Logic", unicode: "◊", description: "diamond / modal possibility" },
  { name: "square",    command: "\\square",   package: "amssymb", category: "Logic", unicode: "□", description: "square / modal necessity" },

  // ── Sets ──────────────────────────────────────────────────────────
  { name: "emptyset",     command: "\\emptyset",    package: "base",    category: "Sets", unicode: "∅", description: "empty set" },
  { name: "varnothing",   command: "\\varnothing",  package: "amssymb", category: "Sets", unicode: "∅", description: "variant empty set (preferred)" },
  { name: "mathbb N",     command: "\\mathbb{N}",   package: "amssymb", category: "Sets", unicode: "ℕ", description: "natural numbers" },
  { name: "mathbb Z",     command: "\\mathbb{Z}",   package: "amssymb", category: "Sets", unicode: "ℤ", description: "integers" },
  { name: "mathbb Q",     command: "\\mathbb{Q}",   package: "amssymb", category: "Sets", unicode: "ℚ", description: "rational numbers" },
  { name: "mathbb R",     command: "\\mathbb{R}",   package: "amssymb", category: "Sets", unicode: "ℝ", description: "real numbers" },
  { name: "mathbb C",     command: "\\mathbb{C}",   package: "amssymb", category: "Sets", unicode: "ℂ", description: "complex numbers" },
  { name: "mathbb F",     command: "\\mathbb{F}",   package: "amssymb", category: "Sets", unicode: "𝔽", description: "finite field" },
  { name: "complement",   command: "^\\complement", package: "amssymb", category: "Sets", unicode: "∁", description: "set complement (superscript)" },
  { name: "cap bigcap",   command: "\\bigcap",      package: "base",    category: "Sets", unicode: "⋂", description: "big intersection" },
  { name: "cup bigcup",   command: "\\bigcup",      package: "base",    category: "Sets", unicode: "⋃", description: "big union" },

  // ── Calculus & Analysis ───────────────────────────────────────────
  { name: "integral",       command: "\\int",          package: "base",    category: "Calculus & Analysis", unicode: "∫", description: "integral" },
  { name: "double integral",command: "\\iint",         package: "amsmath", category: "Calculus & Analysis", unicode: "∬", description: "double integral" },
  { name: "triple integral",command: "\\iiint",        package: "amsmath", category: "Calculus & Analysis", unicode: "∭", description: "triple integral" },
  { name: "contour integral",command: "\\oint",        package: "base",    category: "Calculus & Analysis", unicode: "∮", description: "contour integral (line integral over closed curve)" },
  { name: "sum",            command: "\\sum",          package: "base",    category: "Calculus & Analysis", unicode: "∑", description: "summation" },
  { name: "prod",           command: "\\prod",         package: "base",    category: "Calculus & Analysis", unicode: "∏", description: "product" },
  { name: "coprod",         command: "\\coprod",       package: "base",    category: "Calculus & Analysis", unicode: "∐", description: "coproduct" },
  { name: "partial",        command: "\\partial",      package: "base",    category: "Calculus & Analysis", unicode: "∂", description: "partial derivative" },
  { name: "nabla",          command: "\\nabla",        package: "base",    category: "Calculus & Analysis", unicode: "∇", description: "nabla / gradient" },
  { name: "infty",          command: "\\infty",        package: "base",    category: "Calculus & Analysis", unicode: "∞", description: "infinity" },
  { name: "lim",            command: "\\lim",          package: "base",    category: "Calculus & Analysis", unicode: "lim", description: "limit" },
  { name: "limsup",         command: "\\limsup",       package: "base",    category: "Calculus & Analysis", unicode: "lim sup", description: "limit superior" },
  { name: "liminf",         command: "\\liminf",       package: "base",    category: "Calculus & Analysis", unicode: "lim inf", description: "limit inferior" },
  { name: "sup",            command: "\\sup",          package: "base",    category: "Calculus & Analysis", unicode: "sup", description: "supremum" },
  { name: "inf",            command: "\\inf",          package: "base",    category: "Calculus & Analysis", unicode: "inf", description: "infimum" },
  { name: "max",            command: "\\max",          package: "base",    category: "Calculus & Analysis", unicode: "max" },
  { name: "min",            command: "\\min",          package: "base",    category: "Calculus & Analysis", unicode: "min" },
  { name: "sqrt",           command: "\\sqrt{x}",      package: "base",    category: "Calculus & Analysis", unicode: "√", description: "square root" },
  { name: "frac",           command: "\\frac{a}{b}",   package: "base",    category: "Calculus & Analysis", unicode: "⁄", description: "fraction" },
  { name: "ldots",          command: "\\ldots",        package: "base",    category: "Calculus & Analysis", unicode: "…", description: "horizontal ellipsis (baseline)" },
  { name: "cdots",          command: "\\cdots",        package: "base",    category: "Calculus & Analysis", unicode: "⋯", description: "horizontal ellipsis (centered)" },
  { name: "vdots",          command: "\\vdots",        package: "base",    category: "Calculus & Analysis", unicode: "⋮", description: "vertical ellipsis" },
  { name: "ddots",          command: "\\ddots",        package: "base",    category: "Calculus & Analysis", unicode: "⋱", description: "diagonal ellipsis" },

  // ── Number Sets (mathbb shortcuts) ────────────────────────────────
  { name: "natural numbers",  command: "\\mathbb{N}", package: "amssymb", category: "Number Sets", unicode: "ℕ" },
  { name: "integers",         command: "\\mathbb{Z}", package: "amssymb", category: "Number Sets", unicode: "ℤ" },
  { name: "rational numbers", command: "\\mathbb{Q}", package: "amssymb", category: "Number Sets", unicode: "ℚ" },
  { name: "real numbers",     command: "\\mathbb{R}", package: "amssymb", category: "Number Sets", unicode: "ℝ" },
  { name: "complex numbers",  command: "\\mathbb{C}", package: "amssymb", category: "Number Sets", unicode: "ℂ" },
  { name: "prime numbers",    command: "\\mathbb{P}", package: "amssymb", category: "Number Sets", unicode: "ℙ" },

  // ── Accents ───────────────────────────────────────────────────────
  { name: "hat",      command: "\\hat{x}",     package: "base", category: "Accents", unicode: "x̂", description: "hat / estimate" },
  { name: "tilde",    command: "\\tilde{x}",   package: "base", category: "Accents", unicode: "x̃" },
  { name: "bar",      command: "\\bar{x}",     package: "base", category: "Accents", unicode: "x̄", description: "overbar / mean" },
  { name: "overline", command: "\\overline{x}",package: "base", category: "Accents", unicode: "x̄", description: "overline (longer than \\bar)" },
  { name: "vec",      command: "\\vec{x}",     package: "base", category: "Accents", unicode: "x⃗", description: "vector arrow" },
  { name: "dot",      command: "\\dot{x}",     package: "base", category: "Accents", unicode: "ẋ", description: "time derivative" },
  { name: "ddot",     command: "\\ddot{x}",    package: "base", category: "Accents", unicode: "ẍ", description: "second time derivative" },
  { name: "acute",    command: "\\acute{x}",   package: "base", category: "Accents", unicode: "x́" },
  { name: "grave",    command: "\\grave{x}",   package: "base", category: "Accents", unicode: "x̀" },
  { name: "check",    command: "\\check{x}",   package: "base", category: "Accents", unicode: "x̌", description: "háček / caron" },
  { name: "breve",    command: "\\breve{x}",   package: "base", category: "Accents", unicode: "x̆" },
  { name: "mathring", command: "\\mathring{x}",package: "base", category: "Accents", unicode: "x̊" },
  { name: "widehat",  command: "\\widehat{xy}",package: "base", category: "Accents", unicode: "x̂", description: "wide hat spanning multiple symbols" },

  // ── Delimiters ────────────────────────────────────────────────────
  { name: "left right parentheses", command: "\\left( \\right)", package: "base", category: "Delimiters", unicode: "()", description: "auto-sized parentheses" },
  { name: "left right brackets",    command: "\\left[ \\right]", package: "base", category: "Delimiters", unicode: "[]", description: "auto-sized square brackets" },
  { name: "left right braces",      command: "\\left\\{ \\right\\}", package: "base", category: "Delimiters", unicode: "{}", description: "auto-sized curly braces" },
  { name: "left right angle",       command: "\\langle \\rangle", package: "base", category: "Delimiters", unicode: "⟨⟩", description: "angle brackets / inner product" },
  { name: "left right floor",       command: "\\lfloor \\rfloor", package: "base", category: "Delimiters", unicode: "⌊⌋", description: "floor brackets" },
  { name: "left right ceiling",     command: "\\lceil \\rceil",   package: "base", category: "Delimiters", unicode: "⌈⌉", description: "ceiling brackets" },
  { name: "vert norm",              command: "\\| x \\|",          package: "base", category: "Delimiters", unicode: "‖x‖", description: "double vertical bar / norm" },
  { name: "abs",                    command: "| x |",              package: "base", category: "Delimiters", unicode: "|x|", description: "absolute value" },

  // ── Misc Math ─────────────────────────────────────────────────────
  { name: "hbar",       command: "\\hbar",      package: "base",    category: "Misc Math", unicode: "ℏ", description: "reduced Planck constant" },
  { name: "ell",        command: "\\ell",       package: "base",    category: "Misc Math", unicode: "ℓ", description: "script l" },
  { name: "wp",         command: "\\wp",        package: "base",    category: "Misc Math", unicode: "℘", description: "Weierstrass p" },
  { name: "Re",         command: "\\Re",        package: "base",    category: "Misc Math", unicode: "ℜ", description: "real part" },
  { name: "Im",         command: "\\Im",        package: "base",    category: "Misc Math", unicode: "ℑ", description: "imaginary part" },
  { name: "aleph",      command: "\\aleph",     package: "base",    category: "Misc Math", unicode: "ℵ", description: "aleph / cardinal number" },
  { name: "prime",      command: "x'",          package: "base",    category: "Misc Math", unicode: "′", description: "prime / derivative" },
  { name: "angle",      command: "\\angle",     package: "amssymb", category: "Misc Math", unicode: "∠" },
  { name: "triangle",   command: "\\triangle",  package: "base",    category: "Misc Math", unicode: "△", description: "triangle / Laplacian" },
  { name: "diamond",    command: "\\diamond",   package: "base",    category: "Misc Math", unicode: "⋄" },
  { name: "bigodot",    command: "\\bigodot",   package: "base",    category: "Misc Math", unicode: "⊙" },
  { name: "bigoplus",   command: "\\bigoplus",  package: "base",    category: "Misc Math", unicode: "⊕" },
  { name: "bigotimes",  command: "\\bigotimes", package: "base",    category: "Misc Math", unicode: "⊗", description: "big tensor product" },
  { name: "mathcal L",  command: "\\mathcal{L}",package: "base",    category: "Misc Math", unicode: "ℒ", description: "Lagrangian / Laplace transform" },
  { name: "mathcal H",  command: "\\mathcal{H}",package: "base",    category: "Misc Math", unicode: "ℋ", description: "Hilbert space / Hamiltonian" },
  { name: "mathcal F",  command: "\\mathcal{F}",package: "base",    category: "Misc Math", unicode: "ℱ", description: "Fourier transform" },
  { name: "dagger",     command: "\\dagger",    package: "base",    category: "Misc Math", unicode: "†", description: "dagger / adjoint operator" },
  { name: "ddagger",    command: "\\ddagger",   package: "base",    category: "Misc Math", unicode: "‡", description: "double dagger" },
  { name: "infty",      command: "\\infty",     package: "base",    category: "Misc Math", unicode: "∞" },
  { name: "degree",     command: "^\\circ",     package: "base",    category: "Misc Math", unicode: "°", description: "degree symbol" },

  // ── Text Symbols ──────────────────────────────────────────────────
  { name: "copyright",  command: "\\textcopyright",  package: "base", category: "Text Symbols", unicode: "©" },
  { name: "registered", command: "\\textregistered", package: "base", category: "Text Symbols", unicode: "®" },
  { name: "trademark",  command: "\\texttrademark",  package: "base", category: "Text Symbols", unicode: "™" },
  { name: "pounds",     command: "\\pounds",         package: "base", category: "Text Symbols", unicode: "£" },
  { name: "euro",       command: "\\texteuro",       package: "textcomp", category: "Text Symbols", unicode: "€" },
  { name: "dagger text",command: "\\dag",            package: "base", category: "Text Symbols", unicode: "†" },
  { name: "ddagger text",command: "\\ddag",          package: "base", category: "Text Symbols", unicode: "‡" },
  { name: "section",    command: "\\S",              package: "base", category: "Text Symbols", unicode: "§" },
  { name: "paragraph",  command: "\\P",              package: "base", category: "Text Symbols", unicode: "¶" },
  { name: "bullet text",command: "\\textbullet",     package: "base", category: "Text Symbols", unicode: "•" },
  { name: "asterism",   command: "\\ast",            package: "base", category: "Text Symbols", unicode: "∗" },
  { name: "ellipsis",   command: "\\dots",           package: "base", category: "Text Symbols", unicode: "…" },
  { name: "endash",     command: "--",               package: "base", category: "Text Symbols", unicode: "–", description: "en dash" },
  { name: "emdash",     command: "---",              package: "base", category: "Text Symbols", unicode: "—", description: "em dash" },
];

// ── Search helper ─────────────────────────────────────────────────────────────
export function searchSymbols(query: string): SymbolEntry[] {
  if (!query.trim()) return SYMBOLS;
  const q = query.toLowerCase().replace(/\\/g, "").trim();
  return SYMBOLS.filter((s) => {
    const cmd = s.command.toLowerCase().replace(/\\/g, "").replace(/[{}]/g, "");
    const name = s.name.toLowerCase();
    const uni = s.unicode.toLowerCase();
    const desc = (s.description || "").toLowerCase();
    return (
      name.includes(q) ||
      cmd.includes(q) ||
      uni.includes(q) ||
      desc.includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.package.toLowerCase().includes(q)
    );
  });
}
