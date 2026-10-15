import { ogCard } from "@/lib/og/card";

export const alt = "ISBN to BibTeX: Paste an ISBN and copy a @book entry.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    section: "Tool",
    title: "ISBN to BibTeX",
    lede: "Paste an ISBN and copy a @book entry.",
  });
}
