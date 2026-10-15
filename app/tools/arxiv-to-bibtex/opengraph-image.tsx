import { ogCard } from "@/lib/og/card";

export const alt = "arXiv to BibTeX: Paste an arXiv ID or URL and copy the entry.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    section: "Tool",
    title: "arXiv to BibTeX",
    lede: "Paste an arXiv ID or URL and copy the entry.",
  });
}
