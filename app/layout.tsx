import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
// KaTeX styles are self-hosted (bundled) rather than fetched from a CDN, so the
// math CSS is not a render-blocking cross-origin request on every page.
import "katex/dist/katex.min.css";
import "./globals.css";

// Self-hosted via next/font — no render-blocking Google Fonts CSS request.
// Exposed as CSS variables so both globals.css and inline styles can use them.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
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
    { media: "(prefers-color-scheme: dark)",  color: "#0d0d13" },
    { media: "(prefers-color-scheme: light)", color: "#ece7da" },
  ],
};

// NEXT_PUBLIC_SITE_URL must be set to https://latexci.com in Vercel → Settings → Environment Variables
const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://latexci.com");

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "latexci — Free Online LaTeX Preview, Diff & Word-to-LaTeX Converter",
    template: "%s | latexci",
  },
  description:
    "Free browser-based LaTeX tools: live preview with KaTeX math rendering, side-by-side diff, and Word (.docx) to LaTeX conversion. No account, no install.",
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
    title: "latexci — Free Online LaTeX Tools",
    description:
      "Live LaTeX preview, side-by-side diff, and Word-to-LaTeX conversion. All free, no signup required.",
    // og:image comes from app/opengraph-image.tsx (file convention) —
    // do NOT list a static image here or it overrides the generated one.
  },
  twitter: {
    card: "summary_large_image",
    title: "latexci — Free Online LaTeX Tools",
    description: "Live LaTeX preview, diff, and Word-to-LaTeX. Free, no signup.",
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`h-full ${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
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
        <Analytics />
      </body>
    </html>
  );
}
