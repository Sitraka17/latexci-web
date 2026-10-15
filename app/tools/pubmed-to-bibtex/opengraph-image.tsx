import { ogCard } from "@/lib/og/card";

export const alt = "PubMed to BibTeX: Turn a PMID into a clean @article entry.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    section: "Tool",
    title: "PubMed to BibTeX",
    lede: "Turn a PMID into a clean @article entry.",
  });
}
