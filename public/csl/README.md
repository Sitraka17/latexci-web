# CSL styles and locales

These files are used by the BibTeX formatter (`/tools/bibtex-to-apa`,
`/tools/bibtex-to-mla`, `/tools/bibtex-to-chicago`). They are copied
unmodified from the Citation Style Language project:

- Styles: https://github.com/citation-style-language/styles,
  commit 8c15d2757ac6ce93c800682f4b9e53582e27e609 (fetched 2 November 2026)
  - `apa.csl`: APA Style 7th edition
  - `modern-language-association.csl`: MLA Handbook 9th edition (in-text citations)
  - `chicago-author-date.csl`: Chicago Manual of Style 18th edition (author-date)
  - `chicago-notes-bibliography.csl`: Chicago Manual of Style 18th edition (notes and bibliography)
  - `ieee.csl`: IEEE Reference Guide version 11.29.2023
  - `harvard-cite-them-right.csl`: Cite Them Right 12th edition (author-date/Harvard)
- Locales: https://github.com/citation-style-language/locales,
  commit 8bef426f89f38c0789223c50e53ec2197bc50bb3 (fetched 2 November 2026)
  - `locales-en-US.xml`, `locales-en-GB.xml`

## License

All of these files are licensed under the Creative Commons
Attribution-ShareAlike 3.0 Unported license
(https://creativecommons.org/licenses/by-sa/3.0/). The authors and
contributors of each style are listed in the `<info>` block at the top of
the file. If you change a file, the change must be shared under the same
license; to update, copy the new version from the repositories above and
record the commit here.

The formatting itself is done by citeproc-js (npm package `citeproc`),
Copyright (c) 2009-2019 Frank Bennett, licensed under CPAL 1.0 or AGPL 3.0 (or later).
