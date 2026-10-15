import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { editionFromText, normalizeEdition, protectTitleCaps, titleCaseJournal } from "@/lib/bib-escape";
import { cleanBibTeX, normalizeAuthors } from "@/lib/bibtex";
import { GET as arxivGET } from "../../app/api/arxiv-to-bibtex/route";
import { GET as doiGET } from "../../app/api/doi-to-bibtex/route";
import { GET as pmidGET } from "../../app/api/pmid-to-bibtex/route";
import { GET as isbnGET } from "../../app/api/isbn-to-bibtex/route";

let ip = 0;
const req = (url: string) =>
  new NextRequest(url, { headers: { "x-forwarded-for": `10.9.${Math.floor(++ip / 250)}.${ip % 250}` } });
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

afterEach(() => vi.unstubAllGlobals());

describe("protectTitleCaps", () => {
  it("braces acronyms and capital+digit words", () => {
    expect(protectTitleCaps("Safety of the BNT162b2 mRNA COVID-19 Vaccine"))
      .toBe("Safety of the {BNT162b2} {mRNA} {COVID-19} Vaccine");
    expect(protectTitleCaps("DNA repair on a GPU, with LaTeX"))
      .toBe("{DNA} repair on a {GPU}, with {LaTeX}");
  });
  it("leaves ordinary capitalised words alone", () => {
    expect(protectTitleCaps("Attention Is All You Need")).toBe("Attention Is All You Need");
  });
  it("never wraps inside math, braces or command names, and is idempotent", () => {
    const t = "The $SU(2)$ model of {DNA} and \\LaTeX\\ macros, R\\&D";
    expect(protectTitleCaps(t)).toBe(t);
    const once = protectTitleCaps("RNA and DNA");
    expect(protectTitleCaps(once)).toBe(once);
  });
});

describe("titleCaseJournal", () => {
  it("title-cases NLM sentence-case names", () => {
    expect(titleCaseJournal("The New England journal of medicine")).toBe("The New England Journal of Medicine");
    expect(titleCaseJournal("Brain, behavior, and immunity")).toBe("Brain, Behavior, and Immunity");
    expect(titleCaseJournal("The Lancet. Infectious diseases")).toBe("The Lancet. Infectious Diseases");
    expect(titleCaseJournal("JAMA")).toBe("JAMA");
  });
});

describe("editions", () => {
  it("normalises edition statements to the BibTeX word", () => {
    expect(normalizeEdition("2nd ed.")).toBe("Second");
    expect(normalizeEdition("3rd edition")).toBe("Third");
    expect(normalizeEdition("Revised edition")).toBe("Revised");
    expect(normalizeEdition("")).toBe("");
    expect(editionFromText("Pattern Classification, Second Edition")).toBe("Second");
    expect(editionFromText("An Introduction")).toBe("");
  });
});

describe("normalizeAuthors suffixes", () => {
  it("moves Jr., Sr., II, III into the Jr part", () => {
    expect(normalizeAuthors("John Smith Jr.")).toBe("Smith, Jr., John");
    expect(normalizeAuthors("John Smith Sr.")).toBe("Smith, Sr., John");
    expect(normalizeAuthors("Henry Ford II")).toBe("Ford, II, Henry");
    expect(normalizeAuthors("Martin Luther King III")).toBe("King, III, Martin Luther");
    expect(normalizeAuthors("John Smith, Jr.")).toBe("Smith, Jr., John");
    expect(normalizeAuthors("Smith, Jr., John")).toBe("Smith, Jr., John");
  });
});

describe("cleanBibTeX keeps @preamble and @string", () => {
  it("writes the preamble verbatim at the top, then the strings", () => {
    const { output } = cleanBibTeX(
      `@article{a, title={T}, journal=nat}\n@preamble{"\\providecommand{\\noopsort}[1]{}"}\n@string{nat = "Nature"}`,
      { uppercaseTypes: false },
    );
    const lines = output.split("\n");
    expect(lines[0]).toBe(`@preamble{"\\providecommand{\\noopsort}[1]{}"}`);
    expect(lines[1]).toBe(`@string{nat = "Nature"}`);
    expect(output).toContain("@article{a,");
    // Used before its definition, the macro stays bare; the kept @string now resolves it.
    expect(output).toContain("journal      = nat");
  });
});

const ARXIV_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"><title>arXiv Query: id_list=1706.03762</title>
<opensearch:totalResults>1</opensearch:totalResults>
<entry><id>http://arxiv.org/abs/1706.03762v7</id>
<published>2017-06-12T17:57:34Z</published>
<title>Attention Is All You Need for GPU NLP</title>
<summary>The dominant models.</summary>
<author><name>Ashish Vaswani</name></author><author><name>Noam Shazeer</name></author>
<arxiv:doi xmlns:arxiv="http://arxiv.org/schemas/atom">10.48550/arXiv.1706.03762</arxiv:doi>
<arxiv:primary_category xmlns:arxiv="http://arxiv.org/schemas/atom" term="cs.CL" scheme="http://arxiv.org/schemas/atom"/>
</entry></feed>`;

describe("GET /api/arxiv-to-bibtex", () => {
  it("emits an @misc entry with eprint, archivePrefix and primaryClass", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(ARXIV_FEED, { status: 200 })));
    const res = await arxivGET(req("https://latexci.com/api/arxiv-to-bibtex?id=1706.03762v7"));
    const bib = await res.text();
    expect(bib.startsWith("@misc{Vaswani2017_1706_03762,")).toBe(true);
    expect(bib).toContain("eprint        = {1706.03762}");
    expect(bib).toContain("archivePrefix = {arXiv}");
    expect(bib).toContain("primaryClass  = {cs.CL}");
    expect(bib).toContain("url           = {https://arxiv.org/abs/1706.03762}");
    expect(bib).toContain("doi           = {10.48550/arXiv.1706.03762}");
    expect(bib).toContain("title         = {Attention Is All You Need for {GPU} {NLP}}");
    expect(bib).not.toMatch(/journal|howpublished|note/);
  });
});

describe("GET /api/doi-to-bibtex", () => {
  it("fixes CrossRef quirks: DOI url, page dashes, empty authors, title caps", async () => {
    const crossref = ` @article{Polack_2020, title={Safety and Efficacy of the BNT162b2 mRNA Covid-19 Vaccine}, volume={383}, ISSN={1533-4406}, url={http://dx.doi.org/10.1056/NEJMoa2034577}, DOI={10.1056/nejmoa2034577}, number={27}, journal={New England Journal of Medicine}, author={Polack, Fernando P. and Thomas, Stephen J. and }, year={2020}, month=dec, pages={2603–2615} }`;
    vi.stubGlobal("fetch", vi.fn(async () => new Response(crossref, { status: 200 })));
    const res = await doiGET(req("https://latexci.com/api/doi-to-bibtex?doi=10.1056/NEJMoa2034577"));
    const bib = await res.text();
    expect(bib).toContain("title        = {Safety and Efficacy of the {BNT162b2} {mRNA} {Covid-19} Vaccine}");
    expect(bib).toContain("pages        = {2603--2615}");
    expect(bib).toContain("author       = {Polack, Fernando P. and Thomas, Stephen J.}");
    expect(bib).not.toContain("url");
    expect(bib).toContain("month        = dec");
  });
  it("keeps a url that points somewhere else than the DOI", async () => {
    const crossref = `@article{k, title={T}, url={https://example.org/paper}, DOI={10.1000/xyz}, pages={1-5}}`;
    vi.stubGlobal("fetch", vi.fn(async () => new Response(crossref, { status: 200 })));
    const bib = await (await doiGET(req("https://latexci.com/api/doi-to-bibtex?doi=10.1000/xyz"))).text();
    expect(bib).toContain("url          = {https://example.org/paper}");
    expect(bib).toContain("pages        = {1--5}");
  });
});

describe("GET /api/pmid-to-bibtex", () => {
  it("title-cases the NLM journal name and protects title capitals", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({
      result: {
        "33301246": {
          title: "Safety and Efficacy of the BNT162b2 mRNA Covid-19 Vaccine.",
          fulljournalname: "The New England journal of medicine",
          source: "N Engl J Med",
          pubdate: "2020 Dec 31",
          authors: [{ name: "Polack FP", authtype: "Author" }],
          volume: "383", issue: "27", pages: "2603-2615",
          elocationid: "doi: 10.1056/NEJMoa2034577",
        },
      },
    })));
    const bib = await (await pmidGET(req("https://latexci.com/api/pmid-to-bibtex?id=33301246"))).text();
    expect(bib).toContain("journal  = {The New England Journal of Medicine}");
    expect(bib).toContain("title    = {Safety and Efficacy of the {BNT162b2} {mRNA} {Covid-19} Vaccine}");
  });
});

describe("GET /api/isbn-to-bibtex editions", () => {
  it("outputs the Open Library edition_name as a BibTeX edition", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.endsWith("/isbn/9780471056690.json")) {
        return json({ title: "Pattern Classification", edition_name: "2nd ed.", publish_date: "2001", authors: [{ key: "/authors/OL1A" }] });
      }
      if (url.includes("/authors/OL1A")) return json({ name: "Richard O. Duda" });
      return json({}, 404);
    }));
    const bib = await (await isbnGET(req("https://latexci.com/api/isbn-to-bibtex?isbn=9780471056690"))).text();
    expect(bib).toContain("edition   = {Second}");
  });
  it("finds the edition in a Google Books subtitle", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.startsWith("https://openlibrary.org")) return new Response("Forbidden", { status: 403 });
      return json({ items: [{ volumeInfo: { title: "Deep Learning with Python", subtitle: "Second Edition", authors: ["Francois Chollet"], publishedDate: "2021" } }] });
    }));
    const bib = await (await isbnGET(req("https://latexci.com/api/isbn-to-bibtex?isbn=9781617296864"))).text();
    expect(bib).toContain("title     = {Deep Learning with Python}");
    expect(bib).toContain("edition   = {Second}");
  });
});
