import Image from "next/image";
import type { ReactNode } from "react";

// Building blocks for the CV guides (/latex-resume-ats, /orcid-to-latex-cv,
// /cv-latex): a ruled figure made of rows of cells (rendered page, LaTeX
// source, extracted text). Every string shown comes from lib/seo-cv/*.json,
// written by scripts/seo-cv/run-*.mjs. Styles: .xfig* in app/globals.css.

export type PngSize = { width: number; height: number };

/** Ruled figure; rows stack, cells inside a row sit side by side. */
export function XFig({ children }: { children: ReactNode }) {
  return <div className="xfig">{children}</div>;
}

export function XRow({ cols = 1, children }: { cols?: 1 | 2 | 3; children: ReactNode }) {
  return <div className={`xfig-row xfig-cols-${cols}`}>{children}</div>;
}

export function XCell({ label, children }: { label?: ReactNode; children: ReactNode }) {
  return (
    <div className="xfig-cell">
      {label && <div className="xfig-label">{label}</div>}
      {children}
    </div>
  );
}

/**
 * Extracted text or source, verbatim. Control characters (an icon glyph can
 * come out as U+0083) are invisible, so they are shown as a marked code point.
 * `wrap` breaks long lines (for one-line extracts); sources keep their lines.
 */
export function Verbatim({ text, lang, wrap }: { text: string; lang?: string; wrap?: boolean }) {
  const parts: ReactNode[] = [];
  let buf = "";
  let k = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    const control = (cp < 0x20 && ch !== "\n" && ch !== "\t") || (cp >= 0x7f && cp <= 0x9f);
    if (control) {
      if (buf) parts.push(buf);
      buf = "";
      parts.push(<span key={k++} className="xfig-ctl" title="control character">{`[U+${cp.toString(16).toUpperCase().padStart(4, "0")}]`}</span>);
    } else buf += ch;
  }
  if (buf) parts.push(buf);
  return <pre lang={lang} className={wrap ? "xfig-wrap" : undefined}>{parts}</pre>;
}

/** A rendered PDF page (PNG from pdftoppm), shown at a print-like scale. */
export function PageImage({ src, size, alt, scale = 0.62 }: { src: string; size: PngSize; alt: string; scale?: number }) {
  return (
    <div className="xfig-page">
      <Image
        src={src}
        alt={alt}
        width={size.width}
        height={size.height}
        unoptimized
        style={{ width: "100%", maxWidth: Math.round(size.width * scale), height: "auto" }}
      />
    </div>
  );
}
