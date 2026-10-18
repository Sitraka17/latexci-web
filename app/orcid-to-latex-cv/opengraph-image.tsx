import { ogCard } from "@/lib/og/card";

export const alt = "From an ORCID record to a LaTeX publication list: the API, its limits, plain LaTeX and biblatex.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    section: "Guide",
    title: "ORCID to a LaTeX CV",
    lede: "The public API, its limits, plain LaTeX and biblatex.",
    ledeCode: "\\printbibliography[type=article]",
  });
}
