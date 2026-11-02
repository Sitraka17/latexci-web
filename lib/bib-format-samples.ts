/**
 * lib/bib-format-samples.ts: the sample .bib file of the BibTeX formatter.
 * Every entry is a real publication: Knuth's article is the CrossRef record
 * used on /tools/doi-to-bibtex, Lamport's book the one on /tools/bibtex, and
 * the others are sample references published by the APA Style team
 * (apastyle.apa.org), so the output can be checked against the source.
 * The file is deliberately not in alphabetical order.
 */

export interface SampleEntry {
  /** BibTeX entry type, as shown in the examples table. */
  type: string;
  /** What kind of work it is. */
  kind: string;
  bib: string;
}

export const SAMPLE_ENTRIES: SampleEntry[] = [
  {
    type: "@article",
    kind: "Journal article",
    bib: String.raw`@article{knuth1984,
  author    = {Knuth, Donald E.},
  title     = {Literate Programming},
  journal   = {The Computer Journal},
  year      = {1984},
  volume    = {27},
  number    = {2},
  pages     = {97--111},
  doi       = {10.1093/comjnl/27.2.97}
}`,
  },
  {
    type: "@book",
    kind: "Book",
    bib: String.raw`@book{lamport1994,
  author    = {Lamport, Leslie},
  title     = {{\LaTeX}: A Document Preparation System},
  edition   = {2},
  publisher = {Addison-Wesley},
  year      = {1994}
}`,
  },
  {
    type: "@incollection",
    kind: "Chapter in an edited book",
    bib: String.raw`@incollection{dillard2020,
  author    = {Dillard, J. P.},
  title     = {Currents in the Study of Persuasion},
  booktitle = {Media Effects: Advances in Theory and Research},
  editor    = {Oliver, M. B. and Raney, A. A. and Bryant, J.},
  edition   = {4},
  pages     = {115--129},
  publisher = {Routledge},
  year      = {2020}
}`,
  },
  {
    type: "@inproceedings",
    kind: "Conference paper",
    bib: String.raw`@inproceedings{bedenel2019,
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
}`,
  },
  {
    type: "@phdthesis",
    kind: "Doctoral thesis",
    bib: String.raw`@phdthesis{harris2014,
  author    = {Harris, L.},
  title     = {Instructional Leadership Perceptions and Practices of Elementary School Leaders},
  school    = {University of Virginia},
  type      = {Unpublished doctoral dissertation},
  year      = {2014}
}`,
  },
  {
    type: "@online",
    kind: "Web page",
    bib: String.raw`@online{bologna2019,
  author       = {Bologna, C.},
  title        = {Why Some People with Anxiety Love Watching Horror Movies},
  organization = {HuffPost},
  date         = {2019-10-31},
  url          = {https://www.huffpost.com/entry/anxiety-love-watching-horror-movies_l_5d277587e4b02a5a5d57b59e}
}`,
  },
];

export const SAMPLE_BIB = SAMPLE_ENTRIES.map((e) => e.bib).join("\n\n");
