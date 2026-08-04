// JSON-LD BreadcrumbList helper for structured data on tool/content pages.
// Only reference real, crawlable pages — there is no /tools index route, so
// tool breadcrumbs are Home > <Tool>, never Home > Tools > <Tool>.
const BASE = "https://latexci.com";

export function breadcrumbSchema(...items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      ...items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: it.name,
        item: `${BASE}${it.path}`,
      })),
    ],
  };
}
