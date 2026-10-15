import { describe, it, expect } from "vitest";
import {
  generateCv, texDates, texAuthors, sortPublications, groupPublications, normalizeCv, lengthWarning,
  EXAMPLE_CV, EXAMPLE_CV_FR, EMPTY_CV, EMPTY_ENTRY, EMPTY_PUB, type CvData, type CvPublication,
} from "../cv";

const pub = (year: string, title: string, extra: Partial<CvPublication> = {}): CvPublication => ({ ...EMPTY_PUB, year, title, ...extra });

describe("texDates()", () => {
  it("turns typed ranges into LaTeX en dashes", () => {
    expect(texDates("2019-2023", "en")).toBe("2019--2023");
    expect(texDates("2019--2023", "en")).toBe("2019--2023");
    expect(texDates("2019 – 2023", "en")).toBe("2019 -- 2023");
    expect(texDates("Sept. 2021 – June 2024", "en")).toBe("Sept. 2021 -- June 2024");
    expect(texDates("Sept. 2021 - June 2024", "en")).toBe("Sept. 2021 -- June 2024");
    expect(texDates("2021\u20132024", "en")).toBe("2021--2024");
  });
  it("translates present and aujourd'hui to the CV language", () => {
    expect(texDates("2023-present", "fr")).toBe("2023--aujourd'hui");
    expect(texDates("mars 2022 – aujourd'hui", "en")).toBe("mars 2022 -- present");
    expect(texDates("2023 – Present", "fr")).toBe("2023 -- aujourd'hui");
  });
  it("keeps single dates and escapes specials", () => {
    expect(texDates("2024", "en")).toBe("2024");
    expect(texDates("2024 #1", "en")).toBe("2024 \\#1");
    expect(texDates("", "fr")).toBe("");
  });
});

describe("texAuthors()", () => {
  it("bolds every occurrence of the user's name", () => {
    expect(texAuthors("Smith, J., Doe, A. & Smith, J.", "Smith, J.")).toBe("\\textbf{Smith, J.}, Doe, A. \\& \\textbf{Smith, J.}");
  });
  it("does not bold a longer name that merely contains it", () => {
    expect(texAuthors("Goldsmith, J. & Smith, Ja.", "Smith, J")).toBe("Goldsmith, J. \\& Smith, Ja.");
  });
  it("handles accents and leaves authors unchanged without a name", () => {
    expect(texAuthors("Lefèvre, H. & Müller, J.", "Lefèvre, H.")).toBe("\\textbf{Lefèvre, H.} \\& Müller, J.");
    expect(texAuthors("A & B", "")).toBe("A \\& B");
  });
});

describe("publication order", () => {
  it("sorts newest first, in press on top, undated last, stable otherwise", () => {
    const sorted = sortPublications([pub("2019", "a"), pub("", "b"), pub("2024", "c"), pub("in press", "d"), pub("2019", "e"), pub("2021", "")]);
    expect(sorted.map((p) => p.title)).toEqual(["d", "c", "a", "e", "b"]);
  });
  it("groups by type only when a type is used", () => {
    expect(groupPublications([pub("2020", "a"), pub("2021", "b")], "en")).toEqual([{ heading: "", items: [pub("2021", "b"), pub("2020", "a")] }]);
    const g = groupPublications([pub("2020", "a", { type: "preprint" }), pub("2021", "b", { type: "journal" }), pub("2022", "c")], "fr");
    expect(g.map((x) => x.heading)).toEqual(["Articles de revues", "Prépublications", "Autres publications"]);
  });
  it("wraps English titles in a French CV", () => {
    const out = generateCv({ ...EXAMPLE_CV_FR, publications: [pub("2022", "Bayes: a primer", { english: true })] });
    expect(out).toContain("\\foreignlanguage{english}{Bayes: a primer}.");
    expect(generateCv({ ...EXAMPLE_CV, publications: [pub("2022", "Bayes: a primer", { english: true })] })).not.toContain("foreignlanguage");
  });
});

describe("legacy drafts", () => {
  // A draft saved by the first release: no github, pubName, sections, types.
  const legacy = {
    layout: "industry", lang: "fr", photo: true, name: "Ana", headline: "", email: "a@b.c", phone: "", location: "",
    website: "", linkedin: "", orcid: "", summary: "", skills: "Outils : Git", languages: "",
    education: [{ dates: "2019--2023", title: "Master", org: "X", location: "", details: "" }],
    experience: [],
    publications: [{ authors: "Ana", title: "T", venue: "V", year: "2020", doi: "" }],
  };
  it("loads with empty defaults for new fields, never example content", () => {
    const d = normalizeCv(JSON.parse(JSON.stringify(legacy)));
    expect(d.name).toBe("Ana");
    expect(d.layout).toBe("industry");
    expect(d.photo).toBe(true);
    expect(d.github).toBe("");
    expect(d.grants).toBe("");
    expect(d.pubName).toBe("");
    expect(d.onePage).toBe(false);
    expect(d.publications[0]).toEqual({ authors: "Ana", title: "T", venue: "V", year: "2020", doi: "", type: "", english: false });
    expect(generateCv(d)).toContain("2019--2023");
  });
  it("survives garbage", () => {
    expect(normalizeCv(null)).toEqual(EMPTY_CV);
    expect(normalizeCv({ name: 42, education: "x", layout: "weird" }).name).toBe("");
    expect(normalizeCv({ education: [null] }).education).toEqual([EMPTY_ENTRY]);
  });
  it("generates from a draft typed without optional fields", () => {
    const { github: _g, pubName: _p, grants: _gr, ...old } = EXAMPLE_CV;
    void _g; void _p; void _gr;
    expect(() => generateCv(old as CvData)).not.toThrow();
  });
});

describe("ATS-friendly output", () => {
  const all: CvData[] = (["academic", "industry"] as const).flatMap((layout) =>
    (["en", "fr"] as const).map((lang) => ({ ...(lang === "fr" ? EXAMPLE_CV_FR : EXAMPLE_CV), layout, lang })),
  );
  it.each(all.map((c) => [`${c.layout}/${c.lang}`, c] as const))("%s has fonts, Unicode mapping, metadata, needspace", (_, c) => {
    const out = generateCv(c);
    expect(out).toContain("\\usepackage{lmodern}");
    expect(out).toContain("\\input{glyphtounicode}\\pdfgentounicode=1");
    expect(out).toContain(`\\hypersetup{pdftitle={CV ${c.name}}, pdfauthor={${c.name}}, pdfsubject={${c.headline}}, pdflang=${c.lang}}`);
    expect(out).toMatch(/needspace\{4\\baselineskip\}/);
    expect(out.indexOf("\\hypersetup")).toBeGreaterThan(out.indexOf("{hyperref}"));
    expect(out).not.toContain("minipage}[t]");
    expect(out).not.toContain("\u2014");
  });
  it("orders industry sections profile, skills, experience, education", () => {
    const out = generateCv({ ...EXAMPLE_CV, layout: "industry" });
    const at = (s: string) => out.indexOf(`\\sect{${s}}`);
    expect(at("Profile")).toBeGreaterThan(0);
    expect(at("Profile")).toBeLessThan(at("Skills"));
    expect(at("Skills")).toBeLessThan(at("Experience"));
    expect(at("Experience")).toBeLessThan(at("Education"));
    expect(out).toContain("\\textbf{Programming:} Python, PyTorch, JAX, R");
    expect(out).not.toContain("skilltag");
  });
  it("one-page option tightens the layout", () => {
    const out = generateCv({ ...EXAMPLE_CV, layout: "industry", onePage: true });
    expect(out).toContain("\\linespread{0.95}");
    expect(out).toContain("top=1cm");
  });
  it("photo slot is an empty frame with a commented includegraphics", () => {
    const out = generateCv({ ...EXAMPLE_CV, layout: "industry", photo: true });
    expect(out).toContain("% \\includegraphics[width=3cm]{photo.jpg}");
    expect(out.split("\n").filter((l) => !l.trim().startsWith("%")).join("\n")).not.toMatch(/Photo/);
  });
  it("links phone and GitHub", () => {
    const out = generateCv({ ...EXAMPLE_CV, phone: "0033 6 12 34 56 78", github: "https://github.com/jane/" });
    expect(out).toContain("\\href{tel:+33612345678}{0033 6 12 34 56 78}");
    expect(out).toContain("\\href{https://github.com/jane}{github.com/jane}");
  });
  it("outputs only non-empty further sections", () => {
    const out = generateCv({ ...EXAMPLE_CV, talks: "", service: "  ", extraTitle: "Volunteering", extra: "Red Cross, 2020" });
    expect(out).toContain("\\cvsect{Grants and fellowships}");
    expect(out).not.toContain("Invited talks");
    expect(out).not.toContain("{Service}");
    expect(out).toContain("\\cvsect{Volunteering}");
    expect(generateCv({ ...EXAMPLE_CV, extraTitle: "Empty" })).not.toContain("Empty");
  });
  it("warns about length only for long industry CVs", () => {
    const many = Array.from({ length: 6 }, () => ({ ...EMPTY_ENTRY, title: "Job" }));
    expect(lengthWarning({ ...EXAMPLE_CV, layout: "industry", experience: many })).toMatch(/one page/);
    expect(lengthWarning({ ...EXAMPLE_CV, layout: "academic", experience: many })).toBe("");
    const bullets = [{ ...EMPTY_ENTRY, title: "Job", details: "a\nb\nc\nd\ne\nf\ng" }];
    expect(lengthWarning({ ...EXAMPLE_CV, layout: "industry", experience: bullets })).toMatch(/one page/);
    expect(lengthWarning({ ...EXAMPLE_CV, layout: "industry" })).toBe("");
  });
});
