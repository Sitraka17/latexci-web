import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import katex from "katex";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import { breadcrumbSchema } from "@/lib/breadcrumbs";
import { CATEGORIES, SYMBOLS, type SymbolEntry } from "@/lib/symbols";
import { noteFor } from "@/lib/symbol-notes";
import {
  categoryBySlug,
  categoryHref,
  categorySlug,
  canonicalSlug,
  displayName,
  hubInfo,
  symbolSlug,
} from "@/lib/seo-pages";
import "../../hub.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: categorySlug(c) }));
}

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const category = categoryBySlug(slug);
  if (!category) return {};
  const hub = hubInfo(category);
  const path = categoryHref(category);
  return {
    title: hub.title,
    description: hub.description,
    alternates: { canonical: path },
    openGraph: { title: hub.title, description: hub.description, url: path, type: "website" },
    twitter: { card: "summary_large_image", title: hub.title },
  };
}

// Build-time KaTeX; null on failure so the cell falls back to the Unicode glyph.
function renderMath(tex: string): string | null {
  try {
    return katex.renderToString(tex, { throwOnError: true, strict: false, trust: false });
  } catch {
    return null;
  }
}

// Text-mode commands KaTeX does not know render as their glyph instead.
function glyphCell(sym: SymbolEntry): string | null {
  if (sym.category === "Text Symbols") return null;
  return renderMath(sym.render ?? sym.command);
}

/** Formats "\\lede with \\commands" so each backslash command is set in typewriter. */
function withCode(text: string) {
  return text.split(/(\\[a-zA-Z]+(?:\{[^}]*\})?)/g).map((part, i) =>
    part.startsWith("\\") ? <code key={i} className="hub-code">{part}</code> : part,
  );
}

export default async function SymbolHubPage({ params }: Props) {
  const { category: slug } = await params;
  const category = categoryBySlug(slug);
  if (!category) notFound();
  const hub = hubInfo(category);
  const symbols = SYMBOLS.filter((s) => s.category === category);
  const others = CATEGORIES.filter((c) => c !== category);
  const withNotes = symbols.filter((s) => noteFor(s.name)).length;

  const breadcrumb = breadcrumbSchema(
    { name: "Symbol Search", path: "/tools/symbols" },
    { name: category, path: categoryHref(category) },
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Navbar />
      <main className="paper hub" style={{ flex: 1, width: "100%", boxSizing: "border-box", paddingBottom: "3rem" }}>
        <nav aria-label="Breadcrumb" className="hub-crumbs">
          <Link href="/tools/symbols">LaTeX symbols</Link>
          <span aria-hidden="true">›</span>
          <span>{category}</span>
        </nav>

        <header className="titleblock">
          <h1>{hub.h1}</h1>
          <p className="subtitle">{hub.count} commands, each with the package it needs</p>
          <p className="authors">Symbol reference, latexci</p>
        </header>

        <section className="abstract" aria-label="Abstract">
          <p className="abstract-title">Abstract</p>
          <p>
            {withCode(hub.lede)} Table 1 lists every symbol of the category with its rendered glyph, the
            command to type and the package to load; each name links to a page with a worked example
            {withNotes > 0 ? `, and ${withNotes} of them to a note comparing the commands that compile` : ""}.
          </p>
        </section>

        <h2><span className="secnum">1</span>The symbols</h2>
        <div className="hub-table-wrap">
          <table className="booktabs hub-table">
            <thead>
              <tr>
                <th scope="col">Glyph</th>
                <th scope="col">Command</th>
                <th scope="col">Package</th>
                <th scope="col">Page</th>
              </tr>
            </thead>
            <tbody>
              {symbols.map((s) => {
                const html = glyphCell(s);
                return (
                  <tr key={symbolSlug(s)}>
                    <td className="hub-glyph" aria-hidden="true">
                      {html ? <span dangerouslySetInnerHTML={{ __html: html }} /> : s.unicode}
                    </td>
                    <td><code className="hub-code">{s.command}</code></td>
                    <td className="muted">{s.package === "base" ? "none" : <code className="hub-code">{s.package}</code>}</td>
                    <td>
                      <Link href={`/tools/symbols/${canonicalSlug(s)}`}>{displayName(s)}</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="caption">
          <b>Table 1.</b> {hub.h1}: glyph, command, package (none means built into LaTeX) and the page for each
          symbol. Commands go inside math mode unless the page says otherwise.
        </p>

        <h2><span className="secnum">2</span>Other categories</h2>
        <p>
          The same table exists for every family of symbols. To find one by name or by pasting the character,
          use the <Link href="/tools/symbols">symbol search</Link>.
        </p>
        <ul className="hub-others">
          {others.map((c) => (
            <li key={c}>
              <Link href={categoryHref(c)}>{hubInfo(c).h1}</Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
