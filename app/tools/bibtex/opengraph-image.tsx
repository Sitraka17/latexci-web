import { ogCard } from "@/lib/og/card";

export const alt = "BibTeX tools: Look up a DOI, arXiv ID, PubMed ID or ISBN and clean the entry.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    section: "Tool",
    title: "BibTeX tools",
    lede: "Look up a DOI, arXiv ID, PubMed ID or ISBN and clean the entry.",
  });
}
