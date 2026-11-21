import { ogCard } from "@/lib/og/card";

export const alt = "BibTeX to IEEE: Paste a .bib file and copy a numbered IEEE reference list into Word.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    section: "Tool",
    title: "BibTeX to IEEE",
    lede: "Paste a .bib file and copy a numbered IEEE reference list into Word.",
  });
}
