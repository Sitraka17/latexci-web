import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CV_TEMPLATE_SEO, allTemplateIds } from "../seo-pages";
import ats from "../seo-cv/ats-results.json";
import orcid from "../seo-cv/orcid-results.json";
import fr from "../seo-cv/fr-results.json";

describe("CV template metadata", () => {
  it("covers existing templates only, within the length limits", () => {
    const ids = allTemplateIds();
    for (const [id, { title, description }] of Object.entries(CV_TEMPLATE_SEO)) {
      expect(ids).toContain(id);
      expect(title.length, title).toBeLessThanOrEqual(55);
      expect(description.length, description).toBeGreaterThanOrEqual(110);
      expect(description.length, description).toBeLessThanOrEqual(158);
    }
  });
});

describe("CV guides", () => {
  const pages = ["latex-resume-ats", "orcid-to-latex-cv", "cv-latex"].map((p) =>
    readFileSync(join(__dirname, "../../app", p, "page.tsx"), "utf8"),
  );

  it("keep titles and descriptions within the limits", () => {
    for (const src of pages) {
      const title = src.match(/title: `?"?([^`"\n]+)[`"],\n  description/)?.[1] ?? "";
      const desc = src.match(/description:\n\s+`?"?([^`"\n]+)[`"],/)?.[1] ?? "";
      const t = title.replace("${NB}", " ");
      const d = desc.replace("${NB}", " ");
      expect(t.length, t).toBeGreaterThan(20);
      expect(t.length, t).toBeLessThanOrEqual(55);
      expect(d.length, d).toBeGreaterThanOrEqual(110);
      expect(d.length, d).toBeLessThanOrEqual(158);
    }
  });

  it("contain no em dash", () => {
    for (const src of pages) expect(src).not.toContain("\u2014");
  });

  it("show only documents that compiled", () => {
    const docs = { ...ats.results, ...fr } as Record<string, { text?: string }>;
    for (const [id, r] of Object.entries(docs)) if (id !== "meta") expect(r.text, id).toBeTruthy();
    expect(orcid["orcid-plain"].text).toContain("Publications");
    expect(orcid["orcid-biblatex"].text).toContain("Journal articles");
  });
});
