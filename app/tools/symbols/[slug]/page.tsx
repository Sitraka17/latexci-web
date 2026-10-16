import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import katex from "katex";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import CopyButton from "@/components/CopyButton";
import FavouriteButton from "@/components/FavouriteButton";
import { breadcrumbSchema } from "@/lib/breadcrumbs";
import type { SymbolEntry, SymbolCategory } from "@/lib/symbols";
import { noteFor } from "@/lib/symbol-notes";
import { clampDescription } from "@/lib/snippet";
import {
  allSymbolSlugs,
  symbolBySlug,
  symbolSlug,
  canonicalSlug,
  relatedSymbols,
  displayName,
  caseCounterpart,
  confusedWith,
  categoryHref,
  symbolBlurb,
  symbolPageTitle,
  previewHref,
  hubInfo,
} from "@/lib/seo-pages";

// Date the editorial notes were last revised (TechArticle dateModified).
const NOTES_MODIFIED = "2026-10-16";

export const dynamicParams = false;

export function generateStaticParams() {
  return allSymbolSlugs().map((slug) => ({ slug }));
}

// Build-time KaTeX → HTML. Returns null on any render failure so callers can
// fall back to the Unicode glyph instead of emitting KaTeX's red error markup.
function renderMath(tex: string, displayMode = false): string | null {
  try {
    return katex.renderToString(tex, { displayMode, throwOnError: true, strict: false, trust: false });
  } catch {
    return null;
  }
}

// The stored command already includes any argument it needs (accents are stored
// as \hat{x}, \vec{x}, … not the bare macro), so it renders standalone as-is.
function displayTex(sym: SymbolEntry): string {
  // `render` is a KaTeX-safe stand-in when the real command needs a package
  // KaTeX lacks (e.g. \mathds{1} from dsfont); the page always shows `command`.
  return sym.render ?? sym.command;
}

// A meaningful in-context example, only for categories where one template is
// reliably valid. renderMath is the ultimate backstop for any odd symbol.
const EXAMPLE: Record<string, (c: string) => string> = {
  "Greek Lowercase": (c) => `${c} \\in \\mathbb{R}`,
  "Greek Uppercase": (c) => `${c}(x) = ${c}_0`,
  "Binary Operators": (c) => `a ${c} b`,
  "Relations": (c) => `a ${c} b`,
  "Arrows": (c) => `A ${c} B`,
  "Logic": (c) => `p ${c} q`,
  "Sets": (c) => `A ${c} B`,
  "Number Sets": (c) => `x \\in ${c}`,
  "Operators": (c) => `${c}_{i=1}^{n} x_i`,
  "Calculus & Analysis": (c) => `${c} f(x)`,
  // Accents are stored complete (\hat{x}); the hero already shows them, so no
  // separate example is needed; appending anything would malform the command.
};

function pkgNote(pkg: string): string | null {
  if (!pkg || pkg === "base") return null;
  return `\\usepackage{${pkg}}`;
}

type Props = { params: Promise<{ slug: string }> };

function glyphOf(sym: SymbolEntry): string | null {
  return sym.unicode && [...sym.unicode].length === 1 ? sym.unicode : null;
}

const pageTitle = symbolPageTitle;

function describe(sym: SymbolEntry): string {
  const seo = noteFor(sym.name)?.seo;
  if (seo) return seo.description;
  const where = sym.package === "base" ? "no package needed" : `package ${sym.package}`;
  const note = noteFor(sym.name);
  const alts = note ? note.variants.slice(1).map((v) => v.code).join(", ") : "";
  const other = caseCounterpart(sym);
  const g = glyphOf(sym);
  return clampDescription(
    `Type ${sym.command} for ${displayName(sym).toLowerCase()}${g ? ` (${g})` : ""} in LaTeX, ${where}.` +
    (other ? ` ${other.category === "Greek Uppercase" ? "Capital" : "Lowercase"} form: ${other.command} (${other.unicode}).` : "") +
    (alts ? ` Alternatives that compile: ${alts}.` : "") +
    ` Copy it, see it rendered and browse related symbols. Free, no signup.`,
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sym = symbolBySlug(slug);
  if (!sym) return {};
  // Canonical points at the primary page for this command so duplicate-command
  // pages (e.g. \Omega as "Omega" and "ohm") consolidate instead of competing.
  const canonPath = `/tools/symbols/${canonicalSlug(sym)}`;
  return {
    // Answer first: searchers want the command, so it leads the title and description.
    title: pageTitle(sym),
    description: describe(sym),
    alternates: { canonical: canonPath },
    openGraph: {
      title: pageTitle(sym),
      description: noteFor(sym.name)?.seo?.description ?? `LaTeX code for ${sym.name} (${sym.unicode}): ${sym.command}.`,
      url: canonPath,
      type: "website",
    },
    twitter: { card: "summary_large_image", title: pageTitle(sym) },
  };
}

const wrap: CSSProperties = { maxWidth: 780, margin: "0 auto", padding: "2.5rem 1.5rem 3.5rem" };
const h2: CSSProperties = { color: "var(--fg)", fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em", margin: "2.5rem 0 0.9rem" };
const para: CSSProperties = { color: "var(--fg-muted)", fontSize: "0.95rem", lineHeight: 1.75, margin: "0 0 1rem" };
const codeStyle: CSSProperties = {
  fontFamily: "var(--font-mono), monospace", fontSize: "0.9em",
  background: "var(--surface2)", border: "1px solid var(--border)",
  borderRadius: 5, padding: "0.1em 0.4em",
};

export default async function SymbolPage({ params }: Props) {
  const { slug } = await params;
  const sym = symbolBySlug(slug);
  if (!sym) notFound();

  const name = displayName(sym);
  const other = caseCounterpart(sym);
  const hero = renderMath(displayTex(sym), true);
  const note = noteFor(sym.name);
  const isText = sym.category === "Text Symbols";
  // Shown code uses the real command; the render uses the KaTeX-safe stand-in.
  const exampleTex = note?.example?.code ?? EXAMPLE[sym.category]?.(sym.command) ?? null;
  const exampleRender = note?.example
    ? (note.example.render ?? note.example.code)
    : (EXAMPLE[sym.category]?.(displayTex(sym)) ?? null);
  const exampleHtml = exampleRender ? renderMath(exampleRender, true) : null;
  const related = relatedSymbols(sym);
  const pkg = pkgNote(sym.package);
  // Some "unicode" fields are words (e.g. operators like "argmax"), not a glyph.
  // Only treat a genuine single code point as a Unicode glyph worth showing.
  const isGlyph = !!sym.unicode && [...sym.unicode].length === 1;
  const codepoint = isGlyph
    ? "U+" + sym.unicode.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")
    : null;

  const faqs = [
    {
      q: `How do you write ${sym.name} (${sym.unicode}) in LaTeX?`,
      a: `Use ${sym.command} ${isText ? "in normal text" : "in math mode"}${pkg ? ` after adding ${pkg} to your preamble` : "; it needs no extra package"}. For example, ${isText ? sym.command : `$${exampleTex ?? sym.command}$`}.`,
    },
    {
      q: `Which package provides ${sym.command}?`,
      a: pkg
        ? `It comes from the ${sym.package} package: add ${pkg} to your preamble.`
        : `None: ${sym.command} is built into LaTeX, so no extra package is required.`,
    },
    ...(note?.pitfall ? [{ q: `What is the most common mistake with ${sym.name} in LaTeX?`, a: note.pitfall }] : []),
  ];
  // FAQPage markup earns no rich result for a site like this one since 2023;
  // pages with an editorial note declare a TechArticle with its revision date.
  const articleSchema = note
    ? {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        headline: pageTitle(sym),
        description: describe(sym),
        url: `https://latexci.com/tools/symbols/${canonicalSlug(sym)}`,
        dateModified: NOTES_MODIFIED,
        inLanguage: "en",
        proficiencyLevel: "Beginner",
        publisher: { "@type": "Organization", name: "latexci", url: "https://latexci.com" },
      }
    : null;
  const breadcrumb = breadcrumbSchema(
    { name: "Symbol Search", path: "/tools/symbols" },
    { name: sym.category, path: categoryHref(sym.category) },
    { name, path: `/tools/symbols/${slug}` },
  );
  const confused = confusedWith(sym);
  const blurb = note ? null : symbolBlurb(sym);
  const livePreview = previewHref(
    isText ? (exampleTex ?? sym.command) : `\\[ ${exampleTex ?? sym.command} \\]`,
    [sym.package, note?.example?.pkg ?? ""],
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {articleSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Navbar />
      <main style={{ flex: 1 }}>
        <div style={wrap}>
          {/* Breadcrumb trail (visible) */}
          <nav aria-label="Breadcrumb" style={{ fontSize: "0.8rem", color: "var(--fg-muted)", marginBottom: "1.5rem" }}>
            <Link href="/tools/symbols" style={{ color: "var(--accent)", textDecoration: "none" }}>LaTeX symbols</Link>
            <span style={{ margin: "0 0.5rem" }}>›</span>
            <Link href={categoryHref(sym.category)} style={{ color: "var(--accent)", textDecoration: "none" }}>{sym.category}</Link>
            <span style={{ margin: "0 0.5rem" }}>›</span>
            <span>{name}</span>
          </nav>

          <h1 style={{ color: "var(--fg)", fontSize: "1.9rem", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 0.4rem" }}>
            {name} in LaTeX
          </h1>
          <p style={{ ...para, marginBottom: "1.75rem" }}>
            The LaTeX command for {sym.name}{isGlyph ? ` (${sym.unicode})` : ""} is <code style={codeStyle}>{sym.command}</code>
            {sym.description ? ` (${sym.description}).` : "."}
            {other && (
              <> {other.category === "Greek Uppercase" ? "The capital form" : "The lowercase form"}{" "}
                {other.unicode} is{" "}
                <Link href={`/tools/symbols/${canonicalSlug(other)}`} style={{ color: "var(--accent)" }}>
                  <code style={codeStyle}>{other.command}</code>
                </Link>.</>
            )}
          </p>

          {/* Hero card: rendered glyph + command + copy */}
          <div style={{
            display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap",
            background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12,
            padding: "1.75rem 2rem",
          }}>
            <div aria-hidden="true" style={{ fontSize: "2.6rem", lineHeight: 1, minWidth: 60, textAlign: "center", color: "var(--fg)" }}>
              {hero ? <span dangerouslySetInnerHTML={{ __html: hero }} /> : sym.unicode}
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                <code style={{ ...codeStyle, fontSize: "1rem", padding: "0.3em 0.6em" }}>{sym.command}</code>
                <CopyButton text={sym.command} label="Copy command" />
                <FavouriteButton
                  symbol={{
                    slug: canonicalSlug(sym),
                    command: sym.command,
                    name: sym.name,
                    ...(sym.render ? { render: sym.render } : {}),
                  }}
                />
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--fg-muted)" }}>
                <Link href={categoryHref(sym.category)} style={{ color: "var(--accent)", textDecoration: "none" }}>{sym.category}</Link>
                {isGlyph ? ` · Unicode ${sym.unicode} (${codepoint})` : ""}
                {pkg ? ` · needs ${sym.package}` : " · no package needed"}
              </div>
            </div>
          </div>

          <p style={{ ...para, fontSize: "0.88rem", margin: "0.75rem 0 0" }}>
            Writing a paper? The <Link href="/tools/table" style={{ color: "var(--accent)" }}>table generator</Link> and
            the <Link href="/tools/bibtex" style={{ color: "var(--accent)" }}>BibTeX cleaner</Link> are one click away,
            no account.
          </p>

          {/* Curated, compile-verified alternatives for the most-searched symbols */}
          {note && (
            <>
              <h2 style={h2}>Which command should you use?</h2>
              <figure style={{ margin: "0 0 1rem" }}>
                <div style={{ overflowX: "auto" }}>
                  <table className="note-table">
                    <thead>
                      <tr><th scope="col">Command</th><th scope="col">Package</th><th scope="col">Use it when</th></tr>
                    </thead>
                    <tbody>
                      {note.variants.map((v, i) => (
                        <tr key={v.code}>
                          <td>
                            <code style={codeStyle}>{v.code}</code>{" "}
                            <CopyButton text={v.code} label="Copy" />
                            {i === 0 && <span className="note-reco">recommended</span>}
                          </td>
                          <td>{v.pkg ? <code style={codeStyle}>{v.pkg}</code> : "none"}{v.preamble ? " (preamble)" : ""}</td>
                          <td>{v.use}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <figcaption className="note-caption">
                  Table 1. Ways to write {sym.name} in LaTeX. Every line was compiled with pdfLaTeX
                  (TeX Live 2026) loading only the package shown.
                </figcaption>
              </figure>
              {note.pitfall && (
                <div className="note-pitfall" role="note">
                  <strong>Common mistake.</strong> {note.pitfall}
                </div>
              )}
            </>
          )}

          {/* Usage */}
          <h2 style={h2}>How to type {name}</h2>
          <p style={para}>
            {isText ? (
              <>Write <code style={codeStyle}>{sym.command}</code> in normal text, outside math mode.</>
            ) : (
              <>Write <code style={codeStyle}>{sym.command}</code> inside math mode, that is between{" "}
                <code style={codeStyle}>$…$</code> for inline math or in a <code style={codeStyle}>\[ … \]</code> or{" "}
                <code style={codeStyle}>equation</code> block for display math.</>
            )}
            {pkg ? (
              <> This symbol needs the <code style={codeStyle}>{sym.package}</code> package, so add{" "}
                <code style={codeStyle}>{pkg}</code> to your preamble.</>
            ) : (
              <> It is part of core LaTeX{isText ? "" : " math"}, so no extra package is required.</>
            )}
          </p>
          {blurb && (
            <p style={para}>
              {/* LaTeX in the generated sentence is set as code, like the rest of the page */}
              {blurb.split(/(\$[^$]+\$|\\[a-zA-Z]+(?:\{[^}]*\})*|\^\\circ)/g).map((part, i) =>
                i % 2 ? <code key={i} style={codeStyle}>{part}</code> : part,
              )}
            </p>
          )}
          {exampleHtml && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "1.25rem 1.5rem", margin: "0 0 1rem" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--fg-muted)", marginBottom: "0.5rem" }}>Example</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <code style={{ ...codeStyle, background: "transparent", border: "none", padding: 0, fontSize: "0.85rem" }}>{`$${exampleTex}$`}</code>
                <span style={{ color: "var(--fg)" }} dangerouslySetInnerHTML={{ __html: exampleHtml }} />
              </div>
            </div>
          )}
          <p style={para}>
            <Link href={livePreview} style={{ color: "var(--accent)" }}>Open this example in the live preview</Link>:
            it renders as you type, with no compiler and no signup.
          </p>

          {confused.length > 0 && (
            <>
              <h2 style={h2}>Often confused with</h2>
              <ul style={{ ...para, paddingLeft: "1.25rem", listStyle: "disc" }}>
                {confused.map((c) => (
                  <li key={canonicalSlug(c)}>
                    <Link href={`/tools/symbols/${canonicalSlug(c)}`} style={{ color: "var(--accent)" }}>
                      {displayName(c)}
                    </Link>{" "}
                    <code style={codeStyle}>{c.command}</code>
                    {glyphOf(c) ? ` (${c.unicode})` : ""}
                    {c.description ? `: ${c.description}` : ""}
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Related */}
          {related.length > 0 && (
            <>
              <h2 style={h2}>Related {sym.category} symbols</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {related.map((r) => (
                  <Link
                    key={symbolSlug(r)}
                    href={`/tools/symbols/${canonicalSlug(r)}`}
                    title={`${displayName(r)}: ${r.command}`}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "0.4rem",
                      padding: "0.35rem 0.7rem", borderRadius: 7,
                      border: "1px solid var(--border)", background: "var(--surface2)",
                      fontSize: "0.82rem", color: "var(--fg-muted)", textDecoration: "none",
                    }}
                  >
                    <span aria-hidden="true" style={{ color: "var(--fg)" }}>{r.unicode}</span>
                    <code style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.78rem" }}>{r.command}</code>
                  </Link>
                ))}
              </div>
              <p style={{ ...para, marginTop: "1rem" }}>
                <Link href={categoryHref(sym.category)} style={{ color: "var(--accent)" }}>{hubInfo(sym.category as SymbolCategory).h1}: the full table</Link>
                {" "}or{" "}
                <Link href="/tools/symbols" style={{ color: "var(--accent)" }}>search all 350+ LaTeX symbols</Link>.
              </p>
            </>
          )}

          {/* FAQ */}
          <h2 style={h2}>FAQ</h2>
          {faqs.map((f) => (
            <div key={f.q} style={{ marginBottom: "1.1rem" }}>
              <h3 style={{ color: "var(--fg)", fontSize: "0.98rem", fontWeight: 600, margin: "0 0 0.3rem" }}>{f.q}</h3>
              <p style={{ ...para, margin: 0 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
