export const dynamic = "force-static";
import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://latexci-web.vercel.app");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL,                            lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE_URL}/academics`,             lastModified: new Date(), changeFrequency: "monthly", priority: 0.95 },
    { url: `${BASE_URL}/tools/preview`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/tools/table`,           lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/tools/diff`,            lastModified: new Date(), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/tools/word-to-latex`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/tools/templates`,       lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE_URL}/pricing`,              lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
  ];
}
