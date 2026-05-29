import type { Metadata } from "next";
import ToolLayout from "@/components/ToolLayout";
import LatexDiff from "@/components/LatexDiff";

export const metadata: Metadata = {
  title: "Online LaTeX Diff Tool — Compare .tex Files Side by Side — latexci",
  description:
    "Compare two LaTeX files in your browser — additions in green, deletions in red. Drag and drop .tex files. Perfect for tracking advisor revisions. Free, no signup.",
  keywords: [
    "latex diff tool online", "latexdiff web browser", "compare latex files",
    "track changes latex", "latex file comparison", "tex diff viewer",
  ],
  alternates: { canonical: "/tools/diff" },
  openGraph: {
    title: "Online LaTeX Diff Tool — latexci",
    description: "Compare two .tex files side by side. Free, works in any browser.",
    url: "/tools/diff", type: "website",
  },
  twitter: { card: "summary_large_image", title: "Online LaTeX Diff — latexci" },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LaTeX Diff — latexci",
  description: "Browser-based LaTeX diff. Compare two .tex files with changes highlighted.",
  url: "https://latexci-web.vercel.app/tools/diff",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web Browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function DiffPage() {
  return (
    <ToolLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <LatexDiff />
    </ToolLayout>
  );
}
