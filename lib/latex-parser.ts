/**
 * Client-side LaTeX → HTML converter.
 * Handles common LaTeX constructs. Math rendering is done separately via KaTeX.
 */

export function latexToHtml(src: string): string {
  // Extract body if \begin{document}...\end{document} exists
  const bodyMatch = src.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
  let body = bodyMatch ? bodyMatch[1] : src;

  // Remove preamble commands
  body = body.replace(/\\usepackage(\[.*?\])?\{.*?\}/g, "");
  body = body.replace(/\\documentclass(\[.*?\])?\{.*?\}/g, "");
  body = body.replace(/\\geometry\{.*?\}/g, "");

  // Title, author, date → extract for header
  const title = (src.match(/\\title\{([^}]*)\}/) || [])[1] || "";
  const author = (src.match(/\\author\{([^}]*)\}/) || [])[1] || "";
  const date = (src.match(/\\date\{([^}]*)\}/) || [])[1] || "";

  // Remove \maketitle, replace with header block
  body = body.replace(/\\maketitle/, "");

  let header = "";
  if (title) {
    header = `<h1>${escapeForDisplay(title)}</h1>`;
    if (author) header += `<p class="author" style="color:var(--fg-muted);margin-top:-0.5rem">${escapeForDisplay(author)}</p>`;
    if (date) header += `<p class="date" style="color:var(--fg-muted);font-size:0.9em">${escapeForDisplay(date.replace("\\today", new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })))}</p>`;
  }

  // Abstract
  body = body.replace(
    /\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/g,
    (_, content) =>
      `<blockquote style="font-style:italic"><strong>Abstract.</strong> ${processInline(content.trim())}</blockquote>`
  );

  // Sections
  body = body.replace(/\\section\*?\{([^}]*)\}/g, (_, t) => `<h2>${processInline(t)}</h2>`);
  body = body.replace(/\\subsection\*?\{([^}]*)\}/g, (_, t) => `<h3>${processInline(t)}</h3>`);
  body = body.replace(/\\subsubsection\*?\{([^}]*)\}/g, (_, t) => `<h4>${processInline(t)}</h4>`);

  // Display math: \[ ... \] and \begin{equation}...\end{equation} and align
  body = body.replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => `<div class="math-block" data-math="${encodeMath(m)}"></div>`);
  body = body.replace(/\\begin\{equation\*?\}([\s\S]*?)\\end\{equation\*?\}/g, (_, m) => `<div class="math-block" data-math="${encodeMath(m)}"></div>`);
  body = body.replace(/\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g, (_, m) => `<div class="math-block" data-math="${encodeMath("\\begin{aligned}" + m + "\\end{aligned}")}"></div>`);
  body = body.replace(/\\begin\{gather\*?\}([\s\S]*?)\\end\{gather\*?\}/g, (_, m) => `<div class="math-block" data-math="${encodeMath(m)}"></div>`);

  // Itemize / enumerate
  body = body.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (_, items) => {
    const lis = items.split(/\\item/).filter((s: string) => s.trim()).map((s: string) => `<li>${processInline(s.trim())}</li>`).join("");
    return `<ul>${lis}</ul>`;
  });
  body = body.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, (_, items) => {
    const lis = items.split(/\\item/).filter((s: string) => s.trim()).map((s: string) => `<li>${processInline(s.trim())}</li>`).join("");
    return `<ol>${lis}</ol>`;
  });

  // Tables (tabular)
  body = body.replace(/\\begin\{tabular\}(\{[^}]*\})([\s\S]*?)\\end\{tabular\}/g, (_, _spec, content) => {
    const rows = content.split("\\\\").map((r: string) => r.trim()).filter(Boolean);
    let html = "<table><tbody>";
    rows.forEach((row: string, i: number) => {
      if (row.startsWith("\\hline")) return;
      const cleanRow = row.replace(/\\hline/g, "").trim();
      const cells = cleanRow.split("&").map((c: string) => processInline(c.trim()));
      const tag = i === 0 ? "th" : "td";
      html += `<tr>${cells.map((c: string) => `<${tag}>${c}</${tag}>`).join("")}</tr>`;
    });
    html += "</tbody></table>";
    return html;
  });

  // Figures (just show a placeholder)
  body = body.replace(/\\begin\{figure\}[\s\S]*?\\end\{figure\}/g, (match) => {
    const caption = (match.match(/\\caption\{([^}]*)\}/) || [])[1] || "";
    const includegraphics = (match.match(/\\includegraphics(?:\[.*?\])?\{([^}]*)\}/) || [])[1] || "";
    return `<figure style="text-align:center;margin:1.5rem 0;padding:1rem;border:1px dashed var(--border);border-radius:8px">
      <div style="color:var(--fg-muted);font-size:0.85rem">📷 ${includegraphics || "figure"}</div>
      ${caption ? `<figcaption style="margin-top:0.5rem;font-size:0.9em;color:var(--fg-muted)">${processInline(caption)}</figcaption>` : ""}
    </figure>`;
  });

  // Code (verbatim, lstlisting)
  body = body.replace(/\\begin\{verbatim\}([\s\S]*?)\\end\{verbatim\}/g, (_, c) => `<pre><code>${escapeHtml(c)}</code></pre>`);
  body = body.replace(/\\begin\{lstlisting\}(\[.*?\])?([\s\S]*?)\\end\{lstlisting\}/g, (_, _opts, c) => `<pre><code>${escapeHtml(c)}</code></pre>`);

  // Remove remaining \begin{...}...\end{...} blocks we don't handle
  body = body.replace(/\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}/g, "");

  // Comments
  body = body.replace(/(?<!\\)%.*$/gm, "");

  // Process inline content
  body = processInline(body);

  // Paragraph breaks (double newline → <p>)
  body = body
    .split(/\n{2,}/)
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("<")) return trimmed; // already an HTML block
      return `<p>${trimmed.replace(/\n/g, " ")}</p>`;
    })
    .filter(Boolean)
    .join("\n");

  return header + body;
}

function processInline(text: string): string {
  // Inline math: $...$
  text = text.replace(/\$([^$]+)\$/g, (_, m) => `<span class="math-inline" data-math="${encodeMath(m)}"></span>`);

  // Text formatting
  text = text.replace(/\\textbf\{([^}]*)\}/g, "<strong>$1</strong>");
  text = text.replace(/\\textit\{([^}]*)\}/g, "<em>$1</em>");
  text = text.replace(/\\emph\{([^}]*)\}/g, "<em>$1</em>");
  text = text.replace(/\\underline\{([^}]*)\}/g, "<u>$1</u>");
  text = text.replace(/\\texttt\{([^}]*)\}/g, "<code>$1</code>");
  text = text.replace(/\\text\{([^}]*)\}/g, "$1");

  // References and citations (just show label)
  text = text.replace(/\\ref\{([^}]*)\}/g, "<span style='color:var(--accent)'>[ref]</span>");
  text = text.replace(/\\cite\{([^}]*)\}/g, "<span style='color:var(--accent)'>[$1]</span>");
  text = text.replace(/\\label\{[^}]*\}/g, "");

  // Footnotes
  text = text.replace(/\\footnote\{([^}]*)\}/g, "<sup style='color:var(--accent)' title='$1'>†</sup>");

  // Horizontal rules
  text = text.replace(/\\hline/g, "");
  text = text.replace(/\\hrulefill/g, "<hr>");
  text = text.replace(/\\rule\{[^}]*\}\{[^}]*\}/g, "<hr>");

  // Spacing commands
  text = text.replace(/\\(vspace|hspace)\{[^}]*\}/g, " ");
  text = text.replace(/\\(bigskip|medskip|smallskip|noindent|newpage|clearpage)/g, "");
  text = text.replace(/\\\\/g, "<br>");
  text = text.replace(/\\~/g, "&nbsp;");
  text = text.replace(/~/g, "&nbsp;");

  // Special characters
  text = text.replace(/\\LaTeX/g, "L<sup>a</sup>T<sub>e</sub>X");
  text = text.replace(/\\TeX/g, "T<sub>e</sub>X");
  text = text.replace(/---/g, "—");
  text = text.replace(/--/g, "–");
  text = text.replace(/``/g, "“");
  text = text.replace(/''/g, "”");

  // Clean up remaining commands
  text = text.replace(/\\[a-zA-Z]+\{([^}]*)\}/g, "$1");
  text = text.replace(/\\[a-zA-Z]+/g, "");
  text = text.replace(/\{([^}]*)\}/g, "$1");

  return text;
}

function encodeMath(math: string): string {
  return encodeURIComponent(math.trim());
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeForDisplay(text: string): string {
  return text.replace(/\\[a-zA-Z]+/g, "").trim();
}
