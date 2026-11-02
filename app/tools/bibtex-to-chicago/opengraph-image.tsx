import { ogCard } from "@/lib/og/card";

export const alt = "BibTeX to Chicago: Paste a .bib file and copy a Chicago 18th edition reference list into Word.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    section: "Tool",
    title: "BibTeX to Chicago",
    lede: "Paste a .bib file and copy a Chicago 18th edition list, author-date or notes.",
  });
}
