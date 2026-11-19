import { ogCard } from "@/lib/og/card";

export const alt = "BibTeX to Harvard: Paste a .bib file and copy a Harvard (Cite Them Right) reference list into Word.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    section: "Tool",
    title: "BibTeX to Harvard",
    lede: "Paste a .bib file and copy a Harvard (Cite Them Right) reference list into Word.",
  });
}
