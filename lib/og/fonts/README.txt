Fonts for the Open Graph images (lib/og/card.tsx). Satori, behind next/og
ImageResponse, reads TTF/OTF/WOFF but not WOFF2, so these are TrueType copies.

cmu-serif-*.ttf, cmu-typewriter.ttf
  Computer Modern Unicode by Andrey V. Panov, SIL Open Font License 1.1.
  Converted from the woff2 subsets in app/fonts with fontTools (2026-10-16),
  outlines unchanged.

stix-two-math-subset.ttf
  STIX Two Math, Copyright 2001-2021 The STIX Fonts Project Authors
  (https://github.com/stipub/stixfonts), SIL Open Font License 1.1.
  Subset with fontTools pyftsubset to the glyphs of lib/symbols.ts (2026-10-16).

License text: https://openfontlicense.org/open-font-license-official-text/
