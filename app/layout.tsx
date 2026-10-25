import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
import "katex/dist/katex.min.css";
import "./globals.css";

// Computer Modern Unicode, the LaTeX typeface with full accent coverage
// (SIL Open Font License, subset to Latin; see app/fonts/README.txt). Loaded
// Loaded through next/font for font-display: swap + preload.
// next/font preloads per call, not per file: the two roman serif weights (the
// first paint) and the two italics are separate calls sharing one family name,
// so only the roman files get a <link rel="preload">.
const cmSerif = localFont({
  src: [
    { path: "./fonts/cmu-serif-500-roman.woff2", weight: "400", style: "normal" },
    { path: "./fonts/cmu-serif-700-roman.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-cm-serif",
  display: "swap",
  fallback: ["Times New Roman", "serif"],
});
const cmSerifItalic = localFont({
  src: [
    { path: "./fonts/cmu-serif-500-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/cmu-serif-700-italic.woff2", weight: "700", style: "italic" },
  ],
  // Same family name as the roman call above (next/font names it after the
  // variable, cmSerif), so italic text picks these faces; checked in the CSS.
  declarations: [{ prop: "font-family", value: "cmSerif" }],
  variable: "--font-cm-serif-italic",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const cmSans = localFont({
  src: [
    { path: "./fonts/cmu-sans-serif-500-roman.woff2", weight: "400", style: "normal" },
    { path: "./fonts/cmu-sans-serif-500-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/cmu-sans-serif-700-roman.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-cm-sans",
  display: "swap",
  preload: false,
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
});
const cmTypewriter = localFont({
  src: "./fonts/cmu-typewriter-text-500-roman.woff2",
  variable: "--font-cm-tt",
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "monospace"],
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
  preload: false,
});

/* ── Viewport ─────────────────────────────────────────────────────────────────
   viewport-fit=cover extends the layout into the iPhone notch / home-indicator
   safe area. env(safe-area-inset-*) variables then let us add padding where needed.
────────────────────────────────────────────────────────────────────────────── */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#141518" },
    { media: "(prefers-color-scheme: light)", color: "#fbfaf6" },
  ],
};

// NEXT_PUBLIC_SITE_URL must be set to https://latexci.com in Vercel → Settings → Environment Variables
const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://latexci.com");

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "latexci: Free Online LaTeX Preview, Diff & Word to LaTeX",
    template: "%s | latexci",
  },
  description:
    "Free LaTeX tools in your browser: live KaTeX preview, side-by-side diff, Word (.docx) to LaTeX. PDF export and Word import need a one-click Google sign-in.",
  keywords: [
    "latex preview online",
    "latex diff tool",
    "word to latex converter",
    "online latex editor",
    "latex to html",
    "latex equation preview",
    "free latex tools",
    "latex thesis template",
    "phd thesis latex",
    "academic latex tools",
    "latex for researchers",
    "bibtex online",
    "overleaf alternative",
  ],
  authors: [{ name: "Sitraka Forler", url: "https://github.com/Sitraka17" }],
  creator: "Sitraka Forler",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "latexci",
    title: "latexci: Free Online LaTeX Tools",
    description:
      "Live LaTeX preview, side-by-side diff, and Word to LaTeX conversion. All free; PDF export and Word to LaTeX with a one-click Google sign-in.",
    // og:image comes from app/opengraph-image.tsx (file convention) —
    // do NOT list a static image here or it overrides the generated one.
  },
  twitter: {
    card: "summary_large_image",
    title: "latexci: Free Online LaTeX Tools",
    description: "Live LaTeX preview, diff, and Word to LaTeX. Every tool free, no paid plan.",
    creator: "@Sitraka17",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  // No root canonical: each page declares its own. A root-level canonical
  // would be inherited by any page that forgets alternates — pointing
  // search engines at the homepage as its "canonical" copy.
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "latexci",
  url: "https://latexci.com",
  logo: "https://latexci.com/icon.svg",
  description: "Free LaTeX tools for researchers and students: live preview, diff, Word to LaTeX, BibTeX converters, symbol search, table generator, templates, and CV builder.",
  founder: {
    "@type": "Person",
    name: "Sitraka Forler",
    url: "https://github.com/Sitraka17",
  },
  sameAs: [
    "https://github.com/Sitraka17/latexci-web",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "latexci",
  url: "https://latexci.com",
  description: "Free LaTeX tools in your browser: live preview, diff, Word to LaTeX, BibTeX, symbol search, table generator, templates, and CV builder.",
  publisher: { "@type": "Organization", name: "latexci", url: "https://latexci.com" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`h-full ${cmSerif.variable} ${cmSerifItalic.variable} ${cmSans.variable} ${cmTypewriter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Structured data: Organization + WebSite (site-wide, not page-specific) */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        {/* Anti-flash: read saved theme before first paint — must be synchronous */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('latexci_theme');if(t==='light'||(t==null&&window.matchMedia('(prefers-color-scheme:light)').matches)){document.documentElement.classList.add('light');}}catch(e){}})();` }} />
        {/* KaTeX CSS is imported (self-hosted/bundled) at the top of this file. */}
        {/* PWA manifest — apple-touch-icon is auto-injected from app/apple-icon.tsx */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="latexci" />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <a href="#main" className="skip-link">Skip to content</a>
        <div id="main" tabIndex={-1}>
          {children}
        </div>
        {/* Vercel-only: the script lives at /_vercel/insights and 404s on any
            other host (Cloudflare staging), so it is gated on the build env. */}
        {process.env.VERCEL === "1" && <Analytics />}
      </body>
    </html>
  );
}
