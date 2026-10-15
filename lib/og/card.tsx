// Open Graph cards in the house style: a LaTeX title page. Paper #fbfaf6,
// ink #161616, one blue #23408e, Computer Modern, booktabs-weight rules.
// Every opengraph-image.tsx in app/ renders through ogCard() so that pages
// which set `openGraph` in their metadata (and so lose the root image) still
// get an og:image of their own. Images are generated at build time.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const PAPER = "#fbfaf6";
const INK = "#161616";
const MUTED = "#55524c";
const BLUE = "#23408e";

const fontDir = join(process.cwd(), "lib/og/fonts");
type Fonts = NonNullable<NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"]>;
let fontsPromise: Promise<Fonts> | null = null;
function fonts() {
  fontsPromise ??= Promise.all([
    readFile(join(fontDir, "cmu-serif-roman.ttf")),
    readFile(join(fontDir, "cmu-serif-bold.ttf")),
    readFile(join(fontDir, "cmu-serif-italic.ttf")),
    readFile(join(fontDir, "cmu-typewriter.ttf")),
    readFile(join(fontDir, "stix-two-math-subset.ttf")),
  ]).then(([roman, bold, italic, tt, stix]) => [
    { name: "CMU Serif", data: roman, weight: 400 as const, style: "normal" as const },
    { name: "CMU Serif", data: bold, weight: 700 as const, style: "normal" as const },
    { name: "CMU Serif", data: italic, weight: 400 as const, style: "italic" as const },
    { name: "CMU Typewriter", data: tt, weight: 400 as const, style: "normal" as const },
    // Greek and math glyphs the Latin CMU subset lacks; Satori falls back to it.
    { name: "STIX Two Math", data: stix, weight: 400 as const, style: "normal" as const },
  ]);
  return fontsPromise;
}

export interface OgCard {
  /** Small running head, top right (e.g. "Symbol reference"). */
  section: string;
  /** The title, set in bold serif. */
  title: string;
  /** One line under the title. */
  lede?: string;
  /** Symbol pages: the rendered glyph (Unicode) and the command. */
  glyph?: string;
  command?: string;
  /** Under the glyph, e.g. "U+03B4". */
  glyphNote?: string;
  /** A line of code under the lede, in typewriter (e.g. a \\usepackage line). */
  ledeCode?: string;
}

// LaTeX sets lowercase Greek in italics; the upright Unicode letters would
// misrepresent \\delta, so map them to the Mathematical Italic block.
const ITALIC_VARIANTS: Record<string, number> = {
  "\u03f5": 0x1d716, "\u03d1": 0x1d717, "\u03f0": 0x1d718,
  "\u03d5": 0x1d719, "\u03f1": 0x1d71a, "\u03d6": 0x1d71b,
};
export function mathItalicGreek(text: string): string {
  return [...text]
    .map((ch) => {
      const c = ch.codePointAt(0)!;
      if (c >= 0x03b1 && c <= 0x03c9) return String.fromCodePoint(0x1d6fc + (c - 0x03b1));
      return ITALIC_VARIANTS[ch] ? String.fromCodePoint(ITALIC_VARIANTS[ch]) : ch;
    })
    .join("");
}

function clip(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…";
}

export async function ogCard(card: OgCard): Promise<ImageResponse> {
  const hasGlyph = !!card.glyph;
  const titleSize = card.title.length > 44 ? 50 : card.title.length > 30 ? 58 : 66;
  const glyphLen = [...(card.glyph ?? "")].length;
  const glyphSize = glyphLen <= 1 ? 190 : glyphLen <= 2 ? 140 : glyphLen <= 4 ? 92 : 56;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          background: PAPER, color: INK, fontFamily: "CMU Serif", padding: "52px 80px 48px",
        }}
      >
        {/* Running head over a heavy rule, as on a typeset page */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 24, color: MUTED }}>
          <div style={{ display: "flex", fontStyle: "italic" }}>latexci</div>
          <div style={{ display: "flex" }}>{card.section}</div>
        </div>
        <div style={{ display: "flex", height: 2, background: INK, marginTop: 12 }} />

        <div
          style={{
            flex: 1, display: "flex", alignItems: "center",
            justifyContent: hasGlyph ? "flex-start" : "center", gap: 64,
          }}
        >
          {hasGlyph && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  width: 300, height: 300, display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1px solid ${INK}`, background: "#ffffff",
                  fontFamily: "STIX Two Math", fontSize: glyphSize, lineHeight: 1,
                }}
              >
                {card.glyph}
              </div>
              {card.glyphNote && (
                <div style={{ display: "flex", marginTop: 12, fontFamily: "CMU Typewriter", fontSize: 20, color: MUTED }}>
                  {card.glyphNote}
                </div>
              )}
            </div>
          )}
          <div
            style={{
              display: "flex", flexDirection: "column", flex: 1,
              alignItems: hasGlyph ? "flex-start" : "center", textAlign: hasGlyph ? "left" : "center",
            }}
          >
            <div style={{ display: "flex", fontSize: titleSize, fontWeight: 700, lineHeight: 1.12 }}>
              {clip(card.title, 70)}
            </div>
            {card.command && (
              <div style={{ display: "flex", marginTop: 26, fontFamily: "CMU Typewriter", fontSize: card.command.length > 24 ? 30 : 40, color: BLUE }}>
                {clip(card.command, 40)}
              </div>
            )}
            {!hasGlyph && <div style={{ display: "flex", width: 120, height: 1, background: INK, marginTop: 28 }} />}
            {card.lede && (
              <div style={{ display: "flex", marginTop: hasGlyph ? 22 : 24, fontSize: hasGlyph ? 26 : 30, lineHeight: 1.4, color: MUTED, maxWidth: hasGlyph ? 640 : 900 }}>
                {clip(card.lede, hasGlyph ? 110 : 130)}
              </div>
            )}
            {card.ledeCode && (
              <div style={{ display: "flex", marginTop: 8, fontFamily: "CMU Typewriter", fontSize: 26, color: INK }}>
                {card.ledeCode}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", height: 1, background: INK }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 22, color: MUTED }}>
          <div style={{ display: "flex" }}>latexci.com</div>
          <div style={{ display: "flex", fontStyle: "italic" }}>Free, in the browser, no installation</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  );
}
