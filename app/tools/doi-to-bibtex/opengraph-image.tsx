import { ogCard } from "@/lib/og/card";

export const alt = "DOI to BibTeX: Paste a DOI and copy a clean BibTeX entry.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    section: "Tool",
    title: "DOI to BibTeX",
    lede: "Paste a DOI and copy a clean BibTeX entry.",
  });
}
