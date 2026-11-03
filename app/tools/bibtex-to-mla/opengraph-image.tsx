import { ogCard } from "@/lib/og/card";

export const alt = "BibTeX to MLA: Paste a .bib file and copy an MLA 9th edition Works Cited list into Word.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    section: "Tool",
    title: "BibTeX to MLA",
    lede: "Paste a .bib file and copy an MLA 9th edition Works Cited list into Word.",
  });
}
