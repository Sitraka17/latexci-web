import { ogCard, mathItalicGreek } from "@/lib/og/card";
import { allSymbolSlugs, symbolBySlug, displayName } from "@/lib/seo-pages";

export const alt = "LaTeX symbol reference card on latexci";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// One card per page, rendered at build time like the pages themselves.
export function generateStaticParams() {
  return allSymbolSlugs().map((slug) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sym = symbolBySlug(slug);
  if (!sym) return ogCard({ section: "Symbol reference", title: "LaTeX symbols" });
  const single = [...sym.unicode].length === 1;
  return ogCard({
    section: `Symbol reference, ${sym.category}`,
    title: `${displayName(sym)} in LaTeX`,
    command: sym.command,
    glyph: sym.category === "Greek Lowercase" ? mathItalicGreek(sym.unicode) : sym.unicode,
    glyphNote: single ? "U+" + sym.unicode.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0") : undefined,
    lede: sym.package === "base" ? "Built into LaTeX: no package needed." : "Load its package in the preamble:",
    ledeCode: sym.package === "base" ? undefined : `\\usepackage{${sym.package}}`,
  });
}
