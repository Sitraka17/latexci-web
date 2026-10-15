import { ogCard } from "@/lib/og/card";

export const alt = "LaTeX symbol search: Find any symbol by name, command or Unicode, with the package it needs.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    section: "Symbol reference",
    title: "LaTeX symbol search",
    lede: "Find any symbol by name, command or Unicode, with the package it needs.",
  });
}
