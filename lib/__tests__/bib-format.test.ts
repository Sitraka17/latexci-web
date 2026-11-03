/**
 * Golden tests: BibTeX entries rendered by citeproc-js with the official CSL
 * styles, compared to the sample references published by the APA and the MLA.
 *
 * Every expected string was copied from the page cited above it (opened on
 * 2 November 2026). Italics in the samples are written *like this* here and
 * compared against citeproc's <i> markup. apastyle.apa.org answers scripts
 * with a bot challenge, so the APA pages were read in their Internet Archive
 * captures, whose addresses are given next to the original URLs.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BibFormatter, toPlainText, toRichHtml, type FormatResult } from "../bib-format";
import { nodeLoader } from "../bib-format-node";
import { CITEPROC_FILE, CITEPROC_VERSION } from "../citeproc-load";
import { SAMPLE_BIB } from "../bib-format-samples";

const formatter = new BibFormatter(nodeLoader);

/** citeproc HTML -> the *italic* notation used in the expectations. */
const star = (html: string) =>
  html
    .replace(/<\/i>(\s*)<i>/g, "$1") // adjacent italics merge
    .replace(/<\/?i>/g, "*")
    .replace(/<span[^>]*>|<\/span>/g, "")
    .replace(/&#38;/g, "&")
    .replace(/&amp;/g, "&");

async function render(bib: string, style: "apa" | "mla"): Promise<FormatResult> {
  return formatter.format(bib, style);
}

async function one(bib: string, style: "apa" | "mla"): Promise<string> {
  const r = await render(bib, style);
  expect(r.entries).toHaveLength(1);
  return star(r.entries[0].html);
}

// Engines are slow to build under Node (citeproc's pure-JS XML path): build
// each once before the tests.
beforeAll(async () => {
  await formatter.prepare("apa");
  await formatter.prepare("mla");
}, 60_000);

// ── APA 7th edition ──────────────────────────────────────────────────────────

describe("APA 7th edition (apa.csl) against apastyle.apa.org samples", () => {
  // https://apastyle.apa.org/style-grammar-guidelines/references/examples/journal-article-references
  // (capture https://web.archive.org/web/20250101182551/ + that URL)
  it("journal article with a DOI", async () => {
    const bib = String.raw`@article{grady2019,
      author  = {Grady, J. S. and Her, M. and Moreno, G. and Perez, C. and Yelinek, J.},
      title   = {Emotions in Storybooks: A Comparison of Storybooks That Represent Ethnic and Racial Groups in the {United States}},
      journal = {Psychology of Popular Media Culture},
      year    = {2019}, volume = {8}, number = {3}, pages = {207--217},
      doi     = {10.1037/ppm0000185}
    }`;
    expect(await one(bib, "apa")).toBe(
      "Grady, J. S., Her, M., Moreno, G., Perez, C., & Yelinek, J. (2019). Emotions in storybooks: A comparison of storybooks that represent ethnic and racial groups in the United States. *Psychology of Popular Media Culture*, *8*(3), 207–217. https://doi.org/10.1037/ppm0000185",
    );
  });

  // https://apastyle.apa.org/style-grammar-guidelines/references/examples/book-references
  // (capture https://web.archive.org/web/20250101182813/ + that URL)
  it("book with an edition and a DOI", async () => {
    const bib = String.raw`@book{jackson2019,
      author    = {Jackson, Lynne M.},
      title     = {The Psychology of Prejudice: From Attitudes to Social Action},
      edition   = {2nd},
      publisher = {American Psychological Association},
      year      = {2019},
      doi       = {https://doi.org/10.1037/0000168-000}
    }`;
    expect(await one(bib, "apa")).toBe(
      "Jackson, L. M. (2019). *The psychology of prejudice: From attitudes to social action* (2nd ed.). American Psychological Association. https://doi.org/10.1037/0000168-000",
    );
  });

  it("book without a DOI", async () => {
    const bib = String.raw`@book{sapolsky2017,
      author = {Robert M. Sapolsky},
      title  = {Behave: The Biology of Humans at Our Best and Worst},
      publisher = {Penguin Books}, year = 2017
    }`;
    expect(await one(bib, "apa")).toBe(
      "Sapolsky, R. M. (2017). *Behave: The biology of humans at our best and worst*. Penguin Books.",
    );
  });

  // https://apastyle.apa.org/style-grammar-guidelines/references/examples/edited-book-chapter-references
  // (capture https://web.archive.org/web/20250101183009/ + that URL)
  it("chapter in an edited book, with the book's edition", async () => {
    const bib = String.raw`@incollection{dillard2020,
      author    = {Dillard, J. P.},
      title     = {Currents in the Study of Persuasion},
      booktitle = {Media Effects: Advances in Theory and Research},
      editor    = {Oliver, M. B. and Raney, A. A. and Bryant, J.},
      edition   = {4},
      pages     = {115--129},
      publisher = {Routledge},
      year      = {2020}
    }`;
    expect(await one(bib, "apa")).toBe(
      "Dillard, J. P. (2020). Currents in the study of persuasion. In M. B. Oliver, A. A. Raney, & J. Bryant (Eds.), *Media effects: Advances in theory and research* (4th ed., pp. 115–129). Routledge.",
    );
  });

  it("chapter in an edited book, with a DOI", async () => {
    const bib = String.raw`@incollection{aron2019,
      author    = {Aron, L. and Botella, M. and Lubart, T.},
      title     = {Culinary Arts: Talent and Their Development},
      booktitle = {The Psychology of High Performance: Developing Human Potential into Domain-Specific Talent},
      editor    = {Subotnik, R. F. and Olszewski-Kubilius, P. and Worrell, F. C.},
      pages     = {345--359},
      publisher = {American Psychological Association},
      year      = {2019},
      doi       = {10.1037/0000120-016}
    }`;
    expect(await one(bib, "apa")).toBe(
      "Aron, L., Botella, M., & Lubart, T. (2019). Culinary arts: Talent and their development. In R. F. Subotnik, P. Olszewski-Kubilius, & F. C. Worrell (Eds.), *The psychology of high performance: Developing human potential into domain-specific talent* (pp. 345–359). American Psychological Association. https://doi.org/10.1037/0000120-016",
    );
  });

  // https://apastyle.apa.org/style-grammar-guidelines/references/examples/conference-proceeding-references
  // (capture https://web.archive.org/web/20250101183201/ + that URL)
  it("conference paper in proceedings published in a book series", async () => {
    const bib = String.raw`@inproceedings{bedenel2019,
      author    = {Bedenel, A.-L. and Jourdan, L. and Biernacki, C.},
      title     = {Probability Estimation by an Adapted Genetic Algorithm in Web Insurance},
      booktitle = {Learning and Intelligent Optimization},
      editor    = {Battiti, R. and Brunato, M. and Kotsireas, I. and Pardalos, P.},
      series    = {Lecture Notes in Computer Science},
      volume    = {11353},
      pages     = {225--240},
      publisher = {Springer},
      year      = {2019},
      doi       = {10.1007/978-3-030-05348-2_21}
    }`;
    expect(await one(bib, "apa")).toBe(
      "Bedenel, A.-L., Jourdan, L., & Biernacki, C. (2019). Probability estimation by an adapted genetic algorithm in web insurance. In R. Battiti, M. Brunato, I. Kotsireas, & P. Pardalos (Eds.), *Lecture notes in computer science: Vol. 11353. Learning and intelligent optimization* (pp. 225–240). Springer. https://doi.org/10.1007/978-3-030-05348-2_21",
    );
  });

  // https://apastyle.apa.org/style-grammar-guidelines/references/examples/unpublished-dissertation-references
  // (capture https://web.archive.org/web/20250102053302/ + that URL)
  it("unpublished doctoral dissertation (the BibTeX type field sets the label)", async () => {
    const bib = String.raw`@phdthesis{harris2014,
      author = {Harris, L.},
      title  = {Instructional Leadership Perceptions and Practices of Elementary School Leaders},
      school = {University of Virginia},
      type   = {Unpublished doctoral dissertation},
      year   = {2014}
    }`;
    expect(await one(bib, "apa")).toBe(
      "Harris, L. (2014). *Instructional leadership perceptions and practices of elementary school leaders* [Unpublished doctoral dissertation]. University of Virginia.",
    );
  });

  // https://apastyle.apa.org/style-grammar-guidelines/references/examples/webpage-website-references
  // (capture https://web.archive.org/web/20241228013029/ + that URL)
  it("web page on a news website", async () => {
    const bib = String.raw`@online{bologna2019,
      author       = {Bologna, C.},
      title        = {Why Some People with Anxiety Love Watching Horror Movies},
      organization = {HuffPost},
      date         = {2019-10-31},
      url          = {https://www.huffpost.com/entry/anxiety-love-watching-horror-movies_l_5d277587e4b02a5a5d57b59e}
    }`;
    expect(await one(bib, "apa")).toBe(
      "Bologna, C. (2019, October 31). *Why some people with anxiety love watching horror movies*. HuffPost. https://www.huffpost.com/entry/anxiety-love-watching-horror-movies_l_5d277587e4b02a5a5d57b59e",
    );
  });

  it("web page by an organisation (group author in braces)", async () => {
    // Same page: World Health Organization (2018, May 24), The top 10 causes of death.
    // The sample sets the period inside the italics by mistake (". The top");
    // the expected string has the period outside, as in every other sample.
    const bib = String.raw`@misc{who2018,
      author = {{World Health Organization}},
      title  = {The Top 10 Causes of Death},
      year = 2018, month = may, day = 24,
      url    = {https://www.who.int/news-room/fact-sheets/detail/the-top-10-causes-of-death}
    }`;
    expect(await one(bib, "apa")).toBe(
      "World Health Organization. (2018, May 24). *The top 10 causes of death*. https://www.who.int/news-room/fact-sheets/detail/the-top-10-causes-of-death",
    );
  });

  it("sorts the list alphabetically and gives the in-text citations", async () => {
    const bib = String.raw`
      @book{s, author = {Sapolsky, Robert M.}, title = {Behave}, publisher = {Penguin Books}, year = 2017}
      @article{g, author = {Grady, J. S. and Her, M. and Moreno, G.}, title = {Emotions in Storybooks},
               journal = {Psychology of Popular Media Culture}, year = 2019, volume = 8, number = 3, pages = {207--217}}`;
    const r = await render(bib, "apa");
    expect(r.entries.map((e) => e.id)).toEqual(["g", "s"]);
    const grady = r.citations.find((c) => c.id === "g")!;
    // APA: three or more authors are cited as "First et al." from the first citation.
    expect(grady.forms.map((f) => f.text)).toEqual([
      "(Grady et al., 2019)",
      "(Grady et al., 2019, p. 207)",
      "Grady et al. (2019)",
    ]);
    expect(r.layout).toEqual({ hangingIndent: true, lineSpacing: 2, entrySpacing: 0 });
  });
});

// ── MLA 9th edition ──────────────────────────────────────────────────────────

describe("MLA 9th edition (modern-language-association.csl) against style.mla.org samples", () => {
  // https://style.mla.org/page-range-and-doi/
  // The page types a hyphen in "11-14"; citeproc sets the en dash of the CSL
  // locale, which the MLA itself prints in other samples (style.mla.org/cite-cross-published-article/).
  it("journal article with pages and a DOI", async () => {
    const bib = String.raw`@article{berman2015,
      author  = {Berman, Russell},
      title   = {The Necessity of Language Learning},
      journal = {ADFL Bulletin},
      volume  = {43}, number = {2}, year = {2015}, pages = {11--14},
      doi     = {10.1632/adfl.43.2.11}
    }`;
    expect(await one(bib, "mla")).toBe(
      "Berman, Russell. “The Necessity of Language Learning.” *ADFL Bulletin*, vol. 43, no. 2, 2015, pp. 11–14, https://doi.org/10.1632/adfl.43.2.11.",
    );
  });

  // https://style.mla.org/works-cited/citations-by-format/books/
  it("book", async () => {
    const bib = String.raw`@book{mantel2010, author = {Hilary Mantel}, title = {Wolf Hall}, publisher = {Picador}, year = {2010}}`;
    expect(await one(bib, "mla")).toBe("Mantel, Hilary. *Wolf Hall*. Picador, 2010.");
  });

  it("edited book, compound surname with an accent", async () => {
    const bib = String.raw`@book{sanchez2018,
      editor = {S{\'a}nchez Prado, Ignacio M.},
      title = {Mexican Literature in Theory}, publisher = {Bloomsbury}, year = {2018}
    }`;
    expect(await one(bib, "mla")).toBe("Sánchez Prado, Ignacio M., editor. *Mexican Literature in Theory*. Bloomsbury, 2018.");
  });

  // https://style.mla.org/doi-for-a-book-chapter/
  // The sample continues with the database the chapter was read in, a second
  // container (". *Cambridge Core*, https://doi.org/..."), which BibTeX has no
  // field for. The expected string is the sample up to the end of its first
  // container. "Cambridge University Press" becomes "Cambridge UP", as in the sample.
  it("chapter in an edited collection", async () => {
    const bib = String.raw`@incollection{bould2021,
      author    = {Bould, Mark},
      title     = {Speculative Fiction},
      booktitle = {The {Cambridge} Companion to Twenty-First Century {American} Fiction},
      editor    = {Miller, Joshua},
      publisher = {Cambridge University Press},
      year      = {2021},
      pages     = {63--78}
    }`;
    expect(await one(bib, "mla")).toBe(
      "Bould, Mark. “Speculative Fiction.” *The Cambridge Companion to Twenty-First Century American Fiction*, edited by Joshua Miller, Cambridge UP, 2021, pp. 63–78.",
    );
  });

  // https://style.mla.org/citing-conference-proceedings/
  // The sample names the first editor only ("Steven S. Chang et al."); the
  // other two editors, Lily Liaw and Josef Ruppenhofer, are from the CiNii
  // record of the volume (https://ci.nii.ac.jp/ncid/BA00917609). MLA's
  // minimal page range gives "348-58"; citeproc uses the en dash.
  it("paper in conference proceedings", async () => {
    const bib = String.raw`@inproceedings{hualde2000,
      author    = {Hualde, Jos{\'e} Ignacio},
      title     = {Patterns of Correspondence in the Adaptation of {Spanish} Borrowings in {Basque}},
      booktitle = {Proceedings of the Twenty-Fifth Annual Meeting of the {Berkeley Linguistics Society}, {February} 12-15, 1999: General Session and Parasession on Loan Word Phenomena},
      editor    = {Chang, Steven S. and Liaw, Lily and Ruppenhofer, Josef},
      publisher = {Berkeley Linguistics Society},
      year      = {2000},
      pages     = {348--358}
    }`;
    expect(await one(bib, "mla")).toBe(
      "Hualde, José Ignacio. “Patterns of Correspondence in the Adaptation of Spanish Borrowings in Basque.” *Proceedings of the Twenty-Fifth Annual Meeting of the Berkeley Linguistics Society, February 12-15, 1999: General Session and Parasession on Loan Word Phenomena*, edited by Steven S. Chang et al., Berkeley Linguistics Society, 2000, pp. 348–58.",
    );
  });

  // https://style.mla.org/citing-dissertations/
  it("doctoral dissertation", async () => {
    const bib = String.raw`@phdthesis{njus2010,
      author = {Njus, Jesse},
      title  = {Performing the Passion: A Study on the Nature of Medieval Acting},
      school = {Northwestern University},
      year   = {2010}
    }`;
    expect(await one(bib, "mla")).toBe(
      "Njus, Jesse. *Performing the Passion: A Study on the Nature of Medieval Acting*. 2010. Northwestern U, PhD dissertation.",
    );
  });

  // https://style.mla.org/works-cited/citations-by-format/online-works/
  // The sample's URL carries two line-break artifacts of the original layout
  // (a space after "2015/01/" and "thecreative"); the expected string uses the
  // address of the article. MLA 9th ed. 5.96 drops "https://".
  it("article on a website", async () => {
    const bib = String.raw`@online{deresiewicz2014,
      author       = {Deresiewicz, William},
      title        = {The Death of the Artist---and the Birth of the Creative Entrepreneur},
      organization = {The Atlantic},
      date         = {2014-12-28},
      url          = {https://theatlantic.com/magazine/archive/2015/01/the-death-of-the-artist-and-the-birth-of-the-creative-entrepreneur/383497/}
    }`;
    expect(await one(bib, "mla")).toBe(
      "Deresiewicz, William. “The Death of the Artist\u2014and the Birth of the Creative Entrepreneur.” *The Atlantic*, 28 Dec. 2014, theatlantic.com/magazine/archive/2015/01/the-death-of-the-artist-and-the-birth-of-the-creative-entrepreneur/383497/.",
    );
  });

  it("in-text citation: author and page, no comma", async () => {
    const bib = String.raw`@article{berman2015, author = {Berman, Russell}, title = {The Necessity of Language Learning},
      journal = {ADFL Bulletin}, volume = {43}, number = {2}, year = {2015}, pages = {11--14}}`;
    const r = await render(bib, "mla");
    expect(r.citations[0].forms.map((f) => f.text)).toEqual(["(Berman 11)", "Berman (11)"]);
  });
});

// ── Output formats ───────────────────────────────────────────────────────────

describe("clipboard and download output", () => {
  const bib = String.raw`@book{s, author = {Sapolsky, Robert M.}, title = {Behave}, publisher = {Penguin Books}, year = 2017}`;

  it("rich text keeps italics and sets a 0.5 in hanging indent, double spaced for APA", async () => {
    const r = await render(bib, "apa");
    const html = toRichHtml(r);
    expect(html).toBe(
      '<p style="margin-top:0;margin-bottom:0pt;margin-left:0.5in;text-indent:-0.5in;line-height:200%">Sapolsky, R. M. (2017). <i>Behave</i>. Penguin Books.</p>',
    );
    expect(toPlainText(r)).toBe("Sapolsky, R. M. (2017). Behave. Penguin Books.\n");
  });

  it("escapes markup typed in a field", async () => {
    const r = await formatter.format(
      String.raw`@book{x, author = {A, B}, title = {<img src=x onerror=alert(1)> \& Co}, publisher = {P}, year = 2000}`,
      "apa", { sentenceCase: false });
    expect(r.entries[0].html).not.toMatch(/<img/i);
    expect(r.entries[0].html).toContain("&#60;img src=x onerror=alert(1)&#62; &#38; Co");
    expect(r.entries[0].text).toContain("<img src=x onerror=alert(1)> & Co");
  });
});

// ── The shipped citeproc and every style ─────────────────────────────────────

describe("citeproc-js as shipped", () => {
  it("public/vendor/citeproc is the unmodified npm file", () => {
    const shipped = readFileSync(join(process.cwd(), "public/vendor/citeproc", CITEPROC_FILE));
    const npm = readFileSync(join(process.cwd(), "node_modules/citeproc/citeproc_commonjs.js"));
    const version = JSON.parse(readFileSync(join(process.cwd(), "node_modules/citeproc/package.json"), "utf8")).version;
    // On a citeproc upgrade: copy citeproc_commonjs.js to public/vendor/citeproc/citeproc-<version>.js
    // and bump CITEPROC_VERSION in lib/citeproc-load.ts.
    expect(version).toBe(CITEPROC_VERSION);
    expect(shipped.equals(npm)).toBe(true);
  });

  // Page ranges go through citeproc's range code, the part a minifier broke
  // (see lib/citeproc-load.ts): each style's own range format is checked.
  const RANGE = "@article{range, author = {Range, A.}, title = {T}, journal = {J}, year = 2000, volume = 1, pages = {1234--1256}}";
  it.each([
    ["apa", "1234–1256"], // expanded
    ["mla", "1234–56"], // minimal-two
    ["chicago", "1234–56"], // chicago-16
    ["chicago-notes", "1234–56"],
    ["ieee", "1234–1256"],
    ["harvard", "1234–1256"],
  ] as const)("%s formats the sample file and its page ranges", async (style, range) => {
    const r = await formatter.format(`${SAMPLE_BIB}\n${RANGE}`, style);
    expect(r.entries).toHaveLength(7);
    expect(r.entries.find((e) => e.id === "range")?.text).toContain(range);
  }, 60_000);
});
