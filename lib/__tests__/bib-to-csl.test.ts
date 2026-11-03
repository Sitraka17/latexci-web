import { describe, it, expect } from "vitest";
import {
  latexToText, sentenceCase, bibNameToCsl, parseNames, entryToCsl, bibToCsl, mlaPublisher,
} from "../bib-to-csl";
import { parseBibTeX, splitNameParts } from "../bibtex";

const t = (s: string) => latexToText(s).text;
const m = (s: string) => latexToText(s, { markup: true, protectCase: true }).text;
const item = (bib: string, style: "apa" | "mla" | "chicago" | "ieee" = "apa", sentence?: boolean) =>
  entryToCsl(parseBibTeX(bib)[0], { style, sentenceCase: sentence });

describe("latexToText", () => {
  it("converts symbol accents in every brace form", () => {
    expect(t(String.raw`Erd\H{o}s, G\"odel, {\"U}ber, \'{e}t\'e, \`a, \^o, \~n, \=a, \.z`))
      .toBe("Erdős, Gödel, Über, été, à, ô, ñ, ā, ż");
  });
  it("converts letter accents and dotless i", () => {
    expect(t(String.raw`\c{c}a, \v{S}koda, \v s, \u{g}, \k{a}, \r{a}, \'{\i}, \"\i`)).toBe("ça, Škoda, š, ğ, ą, å, í, ï");
  });
  it("converts special letters", () => {
    expect(t(String.raw`Stra\ss{}e, {\O}rsted, \L{}\'od\'z, \ae on, {\aa}r`)).toBe("Straße, Ørsted, Łódź, æon, år");
  });
  it("converts escapes, dashes, ties and TeX quotes", () => {
    expect(t(String.raw`Smith \& Sons, 50\%, pp.~1--2, a---b, ` + "``quoted'' and `single'"))
      .toBe("Smith & Sons, 50%, pp. 1–2, a\u2014b, “quoted” and ‘single'");
  });
  it("keeps the argument of formatting commands, as markup when asked", () => {
    expect(t(String.raw`A \emph{Very} \textbf{bold} \textsc{Caps} idea`)).toBe("A Very bold Caps idea");
    expect(latexToText(String.raw`On \emph{Drosophila} and {\em Mus}`, { markup: true }).text)
      .toBe("On <i>Drosophila</i> and <i>Mus</i>");
  });
  it("protects braced words from case changes in titles", () => {
    expect(m(String.raw`The {DNA} of {\LaTeX} and {\'E}cole`)).toBe('The <span class="nocase">DNA</span> of LaTeX and École');
  });
  it("turns simple math into text", () => {
    expect(t(String.raw`Fast $\alpha$-stable and $O(n^2)$ bounds`)).toBe("Fast α-stable and O(n2) bounds");
    expect(latexToText(String.raw`$H_2O$`, { markup: true }).text).toBe("H<sub>2</sub>O");
  });
  it("reports unknown commands and keeps their argument", () => {
    const r = latexToText(String.raw`A \foo{bar} b`);
    expect(r.text).toBe("A bar b");
    expect(r.unknown).toEqual(["\\foo"]);
  });
  it("reads \\url and \\href", () => {
    expect(t(String.raw`\url{https://x.org/a_b} and \href{https://y.org}{the site}`)).toBe("https://x.org/a_b and the site");
  });
});

describe("sentenceCase", () => {
  it("lowercases outside braces, capitalising the start and after a colon", () => {
    expect(sentenceCase("Emotions in Storybooks: A Comparison of Groups in the {United States}"))
      .toBe("Emotions in storybooks: A comparison of groups in the {United States}");
  });
  it("keeps acronyms, brand names, the pronoun I and math", () => {
    expect(sentenceCase("Using DNA and COVID-19 Data on the iPhone: What I Learned about $O(N)$"))
      .toBe("Using DNA and COVID-19 data on the iPhone: What I learned about $O(N)$");
  });
  it("lowercases hyphenated compounds part by part", () => {
    expect(sentenceCase("A Domain-Specific Twenty-First Century Non-DNA Study")).toBe("A domain-specific twenty-first century Non-DNA study");
  });
  it("leaves command names alone", () => {
    expect(sentenceCase(String.raw`The \LaTeX\ Companion and \emph{Other} Books`)).toBe(String.raw`The \LaTeX\ companion and \emph{Other} books`);
  });
  it("capitalises after a question mark", () => {
    expect(sentenceCase("How Do Adults Search for Information? Impact of Age")).toBe("How do adults search for information? Impact of age");
  });
});

describe("names", () => {
  it("splits the three BibTeX forms", () => {
    expect(bibNameToCsl("Donald E. Knuth")).toEqual({ family: "Knuth", given: "Donald E." });
    expect(bibNameToCsl("Knuth, Donald E.")).toEqual({ family: "Knuth", given: "Donald E." });
    expect(bibNameToCsl("King, Jr, Martin Luther")).toEqual({ family: "King", given: "Martin Luther", suffix: "Jr" });
  });
  it("keeps particles as non-dropping particles", () => {
    expect(bibNameToCsl("Ludwig van Beethoven")).toEqual({ family: "Beethoven", given: "Ludwig", "non-dropping-particle": "van" });
    expect(bibNameToCsl("de la Fuente, R.")).toEqual({ family: "Fuente", given: "R.", "non-dropping-particle": "de la" });
    expect(bibNameToCsl("Charles Louis Xavier Joseph de la Vall{\\'e}e Poussin"))
      .toEqual({ family: "Vallée Poussin", given: "Charles Louis Xavier Joseph", "non-dropping-particle": "de la" });
  });
  it("reads Jr. without commas and after one comma", () => {
    expect(bibNameToCsl("John Smith Jr.")).toEqual({ family: "Smith", given: "John", suffix: "Jr." });
    expect(bibNameToCsl("John Smith, Jr.")).toEqual({ family: "Smith", given: "John", suffix: "Jr." });
  });
  it("treats a braced name as an organisation", () => {
    expect(bibNameToCsl("{World Health Organization}")).toEqual({ literal: "World Health Organization" });
    expect(bibNameToCsl("{Barnes and Noble}")).toEqual({ literal: "Barnes and Noble" });
  });
  it("converts accents and ties in names", () => {
    expect(bibNameToCsl(String.raw`Kurt G{\"o}del`)).toEqual({ family: "Gödel", given: "Kurt" });
    expect(bibNameToCsl("D.~E. Knuth")).toEqual({ family: "Knuth", given: "D. E." });
    expect(bibNameToCsl(String.raw`{\"O}zt{\"u}rk, Ay\c{s}e`)).toEqual({ family: "Öztürk", given: "Ayşe" });
  });
  it("splits lists on top-level and, and drops others", () => {
    expect(parseNames("A. Smith and {Barnes and Noble} and others")).toEqual([
      { family: "Smith", given: "A." }, { literal: "Barnes and Noble" },
    ]);
  });
  it("exposes the four parts", () => {
    expect(splitNameParts("von Neumann, Jr, John")).toEqual({ first: "John", von: "von", last: "Neumann", jr: "Jr" });
  });
});

describe("dates", () => {
  it("year, month macro and day", () => {
    expect(item("@article{a, title={T}, year=2019, month=oct, day=31}").item.issued).toEqual({ "date-parts": [[2019, 10, 31]] });
    expect(item("@article{a, title={T}, year={2019}, month={February}}").item.issued).toEqual({ "date-parts": [[2019, 2]] });
    expect(item('@article{a, title={T}, year=2019, month=jan # "~15"}').item.issued).toEqual({ "date-parts": [[2019, 1, 15]] });
  });
  it("biblatex date and urldate", () => {
    const { item: it } = item("@online{a, title={T}, date={2014-12-28}, urldate={2026-11-02}, url={https://x.org}}");
    expect(it.issued).toEqual({ "date-parts": [[2014, 12, 28]] });
    expect(it.accessed).toEqual({ "date-parts": [[2026, 11, 2]] });
  });
  it("season, in press and no date", () => {
    expect(item("@article{a, title={T}, year=2010, month={spring}}").item.issued).toEqual({ "date-parts": [[2010]], season: 1 });
    expect(item("@article{a, title={T}, year={in press}}").item.status).toBe("in press");
    expect(item("@article{a, title={T}, year={n.d.}}").item.issued).toBeUndefined();
  });
});

describe("entry types and fields", () => {
  const types: Array<[string, string]> = [
    ["article", "article-journal"], ["book", "book"], ["inproceedings", "paper-conference"],
    ["conference", "paper-conference"], ["incollection", "chapter"], ["phdthesis", "thesis"],
    ["mastersthesis", "thesis"], ["techreport", "report"], ["misc", "document"],
    ["online", "webpage"], ["unpublished", "manuscript"], ["proceedings", "book"], ["manual", "book"],
  ];
  it.each(types)("@%s -> %s", (bib, csl) => {
    expect(item(`@${bib}{k, title={T}, year=2000}`).item.type).toBe(csl);
  });
  it("@misc with a URL is a web page; @inbook without booktitle is the book", () => {
    expect(item(String.raw`@misc{k, title={T}, howpublished={\url{https://x.org}}}`).item).toMatchObject({ type: "webpage", URL: "https://x.org" });
    expect(item("@inbook{k, title={Book}, chapter={3}, publisher={P}, year=2000}").item).toMatchObject({ type: "book", "chapter-number": "3" });
  });
  it("unknown types become documents, with a warning", () => {
    const r = item("@weird{k, title={T}, year=2000}");
    expect(r.item.type).toBe("document");
    expect(r.warnings.join(" ")).toMatch(/not a standard entry type/);
  });
  it("maps the article fields", () => {
    const { item: it } = item(String.raw`@article{k, author={Knuth, D. E.}, title={Literate Programming},
      journal={The Computer Journal}, volume=27, number=2, pages={97--111}, year=1984,
      doi={https://doi.org/10.1093/comjnl/27.2.97}, issn={0010-4620}}`, "mla");
    expect(it).toMatchObject({
      type: "article-journal", title: "Literate Programming", "container-title": "The Computer Journal",
      volume: "27", issue: "2", page: "97–111", DOI: "10.1093/comjnl/27.2.97", ISSN: "0010-4620",
    });
  });
  it("maps book, chapter and thesis fields", () => {
    expect(item(String.raw`@book{k, title={T}, publisher={Addison-Wesley}, address={Reading, MA}, edition={Second}, isbn={0-201-89683-4}, year=1997}`).item)
      .toMatchObject({ publisher: "Addison-Wesley", "publisher-place": "Reading, MA", edition: 2, ISBN: "0-201-89683-4" });
    expect(item("@incollection{k, title={C}, booktitle={The Book}, editor={E. Ed}, pages={1-9}, publisher={P}, year=2000}").item)
      .toMatchObject({ "container-title": "The book", editor: [{ family: "Ed", given: "E." }], page: "1–9" });
    expect(item("@phdthesis{k, title={T}, school={MIT}, year=2000}", "mla").item).toMatchObject({ publisher: "MIT", genre: "PhD dissertation" });
    expect(item("@mastersthesis{k, title={T}, school={MIT}, year=2000}").item).toMatchObject({ genre: "Master's thesis" });
    expect(item("@techreport{k, title={T}, institution={NASA}, number={TR-1}, year=2000}").item).toMatchObject({ publisher: "NASA", number: "TR-1" });
  });
  it("puts a numbered proceedings series in front of the volume title for APA only", () => {
    const bib = "@inproceedings{k, title={P}, booktitle={Learning}, series={Lecture Notes in Computer Science}, volume={11353}, year=2019}";
    expect(item(bib, "apa").item["container-title"]).toBe("Lecture notes in computer science: Vol. 11353. Learning");
    expect(item(bib, "chicago").item).toMatchObject({ "container-title": "Learning", "collection-title": "Lecture Notes in Computer Science", "collection-number": "11353" });
  });
  it("abbreviates university presses for MLA", () => {
    expect(mlaPublisher("Cambridge University Press")).toBe("Cambridge UP");
    expect(mlaPublisher("University of Chicago Press")).toBe("U of Chicago P");
    expect(mlaPublisher("Northwestern University")).toBe("Northwestern U");
    expect(mlaPublisher("Penguin Books")).toBe("Penguin Books");
    expect(item("@book{k, title={T}, publisher={Oxford University Press}, year=2000}", "apa").item.publisher).toBe("Oxford University Press");
  });
  it("drops https:// from URLs for MLA only", () => {
    const bib = "@online{k, title={T}, url={https://example.org/a}, year=2000}";
    expect(item(bib, "mla").item.URL).toBe("example.org/a");
    expect(item(bib, "apa").item.URL).toBe("https://example.org/a");
  });
  it("sentence case follows the style default unless set", () => {
    expect(item("@book{k, title={The Art of Programming}, publisher={P}, year=1}", "apa").item.title).toBe("The art of programming");
    expect(item("@book{k, title={The Art of Programming}, publisher={P}, year=1}", "apa", false).item.title).toBe("The Art of Programming");
    expect(item("@book{k, title={The Art of Programming}, publisher={P}, year=1}", "mla").item.title).toBe("The Art of Programming");
  });
});

describe("warnings", () => {
  it("reports the fields a style needs", () => {
    const { warnings } = bibToCsl("@book{b, author={A, B}, title={T}}\n@article{a, title={T}, year=2000}", { style: "apa" });
    const msgs = warnings.map((w) => `${w.key}: ${w.message}`);
    expect(msgs).toContain('b: no year: APA prints "n.d." (no date).');
    expect(msgs).toContain("b: no publisher field, which APA prints for this type.");
    expect(msgs).toContain("a: no journal field, which APA prints for this type.");
    expect(msgs).toContain("a: no author or editor: the style moves the title to the author position.");
  });
  it("reports duplicate keys once and skips the copy", () => {
    const r = bibToCsl("@misc{a, author={A, B}, title={One}, year=2001}\n@misc{a, author={A, B}, title={Two}, year=2002}", { style: "mla" });
    expect(r.items).toHaveLength(1);
    expect(r.items[0].title).toBe("One");
    expect(r.warnings).toEqual([{ key: "a", message: "duplicate citation key: only the first entry is formatted." }]);
  });
});
