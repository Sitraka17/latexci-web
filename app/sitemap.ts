export const dynamic = "force-static";
import type { MetadataRoute } from "next";
import { canonicalSymbolSlugs, allTemplateIds, symbolBySlug, categoryHref, CV_TEMPLATE_SEO } from "@/lib/seo-pages";
import { noteFor } from "@/lib/symbol-notes";
import { CATEGORIES } from "@/lib/symbols";

// Date the programmatic per-symbol / per-template pages were created. They are
// generated from static data, so a single honest creation date is correct until
// that data changes (bump when lib/symbols.ts or lib/templates.ts changes shape).
const PROGRAMMATIC_LASTMOD = "2026-10-13";
// Symbol pages with an editorial note (lib/symbol-notes.ts) and the category
// hubs were last revised on this date; bump it when the notes change.
const NOTES_LASTMOD = "2026-10-16";
// CV template pages got new titles, descriptions and a guide link on this date.
const CV_TEMPLATES_LASTMOD = "2026-10-18";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://latexci.com");

// lastmod = the date each page's content last MATERIALLY changed, taken from git
// history (`git log -1 --format=%cI -- <source>`) rather than `new Date()`. A build
// timestamp would tell Google every page changes on every deploy, which is false and
// trains crawlers to ignore our lastmod. These are honest, stable dates — bump the
// relevant entry when you materially edit a page (templates also covers lib/templates.ts).
const LAST_MODIFIED: Record<string, string> = {
  "/": "2026-10-07",
  "/academics": "2026-10-18",
  "/tools/preview": "2026-10-07",
  "/tools/table": "2026-10-13",
  "/tools/diff": "2026-10-13",
  "/tools/word-to-latex": "2026-10-13",
  "/tools/bibtex": "2026-10-13",
  "/tools/doi-to-bibtex": "2026-10-13",
  "/tools/arxiv-to-bibtex": "2026-10-13",
  "/tools/pubmed-to-bibtex": "2026-10-13",
  "/tools/isbn-to-bibtex": "2026-10-13",
  "/tools/symbols": "2026-10-16",
  "/tools/templates": "2026-10-18",
  "/tools/cv-builder": "2026-10-18",
  "/latex-resume-ats": "2026-10-18",
  "/orcid-to-latex-cv": "2026-10-18",
  "/cv-latex": "2026-10-18",
  "/after-overleaf": "2026-07-05",
  "/pricing": "2026-10-07",
  "/privacy": "2026-10-07",
  "/terms": "2026-10-06",
};

type Entry = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

// Only public, canonical, indexable, final-200 pages. Deliberately excluded:
// /auth, /dashboard, /shared/[token]: all noindex.
const PAGES: Entry[] = [
  { path: "/",                  changeFrequency: "weekly",  priority: 1.0 },
  { path: "/academics",         changeFrequency: "monthly", priority: 0.95 },
  { path: "/tools/preview",     changeFrequency: "monthly", priority: 0.9 },
  { path: "/tools/table",       changeFrequency: "monthly", priority: 0.9 },
  { path: "/tools/diff",        changeFrequency: "monthly", priority: 0.85 },
  { path: "/tools/word-to-latex", changeFrequency: "monthly", priority: 0.85 },
  { path: "/tools/bibtex",      changeFrequency: "monthly", priority: 0.9 },
  { path: "/tools/doi-to-bibtex",    changeFrequency: "monthly", priority: 0.85 },
  { path: "/tools/arxiv-to-bibtex",  changeFrequency: "monthly", priority: 0.85 },
  { path: "/tools/pubmed-to-bibtex", changeFrequency: "monthly", priority: 0.85 },
  { path: "/tools/isbn-to-bibtex",   changeFrequency: "monthly", priority: 0.85 },
  { path: "/tools/symbols",     changeFrequency: "monthly", priority: 0.9 },
  { path: "/tools/templates",   changeFrequency: "weekly",  priority: 0.8 },
  { path: "/tools/cv-builder",  changeFrequency: "monthly", priority: 0.85 },
  { path: "/latex-resume-ats",  changeFrequency: "monthly", priority: 0.8 },
  { path: "/orcid-to-latex-cv", changeFrequency: "monthly", priority: 0.75 },
  { path: "/cv-latex",          changeFrequency: "monthly", priority: 0.8 },
  { path: "/after-overleaf",    changeFrequency: "monthly", priority: 0.85 },
  { path: "/pricing",           changeFrequency: "monthly", priority: 0.9 },
  { path: "/privacy",           changeFrequency: "yearly",  priority: 0.3 },
  { path: "/terms",             changeFrequency: "yearly",  priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const core: MetadataRoute.Sitemap = PAGES.map(({ path, changeFrequency, priority }) => ({
    url: path === "/" ? BASE_URL : `${BASE_URL}${path}`,
    lastModified: LAST_MODIFIED[path],
    changeFrequency,
    priority,
  }));

  // Programmatic reference pages: one per LaTeX symbol, one per template.
  // Only canonical (primary) symbol slugs — non-primary duplicate-command pages
  // still render (200) for generateStaticParams but are not submitted here.
  const symbols: MetadataRoute.Sitemap = canonicalSymbolSlugs().map((slug) => ({
    url: `${BASE_URL}/tools/symbols/${slug}`,
    lastModified: noteFor(symbolBySlug(slug)?.name ?? "") ? NOTES_LASTMOD : PROGRAMMATIC_LASTMOD,
    changeFrequency: "yearly",
    priority: 0.5,
  }));
  const templates: MetadataRoute.Sitemap = allTemplateIds().map((slug) => ({
    url: `${BASE_URL}/tools/templates/${slug}`,
    lastModified: CV_TEMPLATE_SEO[slug] ? CV_TEMPLATES_LASTMOD : PROGRAMMATIC_LASTMOD,
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  const hubs: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${BASE_URL}${categoryHref(c)}`,
    lastModified: NOTES_LASTMOD,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...core, ...hubs, ...symbols, ...templates];
}
