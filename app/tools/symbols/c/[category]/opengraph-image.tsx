import { ogCard, mathItalicGreek } from "@/lib/og/card";
import { categoryBySlug, categorySlug, hubInfo } from "@/lib/seo-pages";
import { CATEGORIES, SYMBOLS } from "@/lib/symbols";

export const alt = "A category of LaTeX symbols on latexci";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// One card per page, rendered at build time like the pages themselves.
export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: categorySlug(c) }));
}

export default async function Image({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const category = categoryBySlug(slug);
  if (!category) return ogCard({ section: "Symbol reference", title: "LaTeX symbols" });
  const hub = hubInfo(category);
  // A few glyphs of the category as a sample line, like a font specimen.
  const sample = SYMBOLS.filter((s) => s.category === category && [...s.unicode].length === 1)
    .slice(0, 8)
    .map((s) => s.unicode)
    .join("  ");
  const shown = category === "Greek Lowercase" ? mathItalicGreek(sample) : sample;
  return ogCard({
    section: "Symbol reference",
    title: hub.h1,
    lede: sample ? `${hub.count} commands: ${shown}` : `${hub.count} commands, each with its package`,
  });
}
