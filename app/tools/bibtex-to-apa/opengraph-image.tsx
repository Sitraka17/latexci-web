import { ogCard } from "@/lib/og/card";

export const alt = "BibTeX to APA: Paste a .bib file and copy an APA 7th edition reference list into Word.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    section: "Tool",
    title: "BibTeX to APA",
    lede: "Paste a .bib file and copy an APA 7th edition reference list into Word.",
  });
}
