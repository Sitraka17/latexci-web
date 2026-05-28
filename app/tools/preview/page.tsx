import type { Metadata } from "next";
import { Suspense } from "react";
import ToolLayout from "@/components/ToolLayout";
import LatexEditor from "@/components/LatexEditor";

export const metadata: Metadata = {
  title: "Online LaTeX Preview with KaTeX Math Rendering — latexci",
  description:
    "Paste LaTeX source and see a live preview instantly — equations rendered by KaTeX, sections, tables, figures, theorem environments. No install, no signup, no compiler wait.",
  keywords: [
    "online latex preview", "latex previewer", "katex online renderer",
    "latex to html converter", "check latex equation online",
    "latex preview no installation", "live latex editor", "latex equation renderer",
  ],
  alternates: { canonical: "/tools/preview" },
  openGraph: {
    title: "Online LaTeX Preview — latexci",
    description: "Live LaTeX preview with KaTeX math rendering. Free, no signup.",
    url: "/tools/preview", type: "website",
  },
  twitter: { card: "summary_large_image", title: "Online LaTeX Preview — latexci" },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LaTeX Preview — latexci",
  description: "Browser-based LaTeX preview with live KaTeX math rendering.",
  url: "https://latexci-web.vercel.app/tools/preview",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web Browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function PreviewPage() {
  return (
    <ToolLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Suspense>
        <LatexEditor />
      </Suspense>
    </ToolLayout>
  );
}
