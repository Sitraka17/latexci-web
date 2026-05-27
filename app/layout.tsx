import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

// NEXT_PUBLIC_SITE_URL is set in Vercel → Settings → Environment Variables
// Fallback: your Vercel project URL. Update this when you add a custom domain.
const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://latexci-web.vercel.app");

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
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "latexci tools" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "latexci — Free Online LaTeX Tools",
    description: "Live LaTeX preview, diff, and Word-to-LaTeX. Free, no signup.",
    images: ["/og.png"],
    creator: "@Sitraka17",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: { canonical: BASE_URL },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        {/* Anti-flash: read saved theme before first paint — must be synchronous */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('latexci_theme');if(t==='light'||(t==null&&window.matchMedia('(prefers-color-scheme:light)').matches)){document.documentElement.classList.add('light');}}catch(e){}})();` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;1,14..32,400&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
