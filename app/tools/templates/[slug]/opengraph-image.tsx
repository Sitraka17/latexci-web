import { ogCard } from "@/lib/og/card";
import { templateById, allTemplateIds } from "@/lib/seo-pages";

export const alt = "LaTeX template on latexci";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// One card per page, rendered at build time like the pages themselves.
export function generateStaticParams() {
  return allTemplateIds().map((slug) => ({ slug }));
}

// Template data may set a long dash; the card keeps one punctuation style.
const plain = (s: string) => s.replace(/\s*\u2014\s*/g, ": ");

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = templateById(slug);
  return ogCard({
    section: t ? `Template, ${t.category}` : "Templates",
    title: t ? plain(t.title) : "LaTeX template",
    lede: t ? plain(t.desc) : undefined,
  });
}
