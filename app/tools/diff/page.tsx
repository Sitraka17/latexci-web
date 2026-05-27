import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import LatexDiff from "@/components/LatexDiff";

export const metadata: Metadata = {
  title: "Online LaTeX Diff Tool — Compare .tex Files Side by Side — latexci",
  description:
    "Compare two LaTeX files in your browser — additions in green, deletions in red. Drag and drop .tex files. Perfect for tracking advisor revisions and paper co-authoring. Free, no signup.",
  keywords: [
    "latex diff tool online",
    "latexdiff web browser",
    "compare latex files",
    "track changes latex",
    "latex file comparison",
    "latex revision tracking",
    "tex diff viewer",
    "latex diff without installation",
  ],
  alternates: { canonical: "/tools/diff" },
  openGraph: {
    title: "Online LaTeX Diff Tool — latexci",
    description:
      "Compare two .tex files side by side. Additions green, deletions red. Free, works in any browser.",
    url: "/tools/diff",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online LaTeX Diff Tool — latexci",
    description: "Compare two .tex files in your browser. Drag and drop. Free.",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LaTeX Diff — latexci",
  description:
    "Browser-based LaTeX diff tool. Compare two .tex files side by side with additions highlighted green and deletions in red. Drag-and-drop file support.",
  url: "https://latexci-web.vercel.app/tools/diff",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web Browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Side-by-side LaTeX diff",
    "Drag-and-drop .tex file support",
    "Line-by-line change highlighting",
    "Works entirely in the browser",
  ],
};

export default function DiffPage() {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Navbar />
      <LatexDiff />
    </div>
  );
}
