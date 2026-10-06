import type { NextConfig } from "next";

// Security headers applied to every route. This is the non-breaking subset:
// it hardens against clickjacking, MIME sniffing, <base>/<object> abuse, and
// referrer leakage without a strict script-src (which would require per-request
// nonce plumbing for Next's inline hydration scripts). Defense-in-depth on top
// of the parser-level output escaping in lib/latex-parser.ts.
const SECURITY_HEADERS = [
  {
    key: "Content-Security-Policy",
    value: [
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];


// Symbol pages whose slug was a numeric collision suffix (delta-2 for \Delta)
// were renamed on 2026-10-05 to readable slugs; Google had indexed some of the
// old URLs, so they 308 to the new ones. Plus one URL seen in Search Console
// that never existed.
async function legacyRedirects() {
  return [
      // Cloud documents and Supabase auth were retired (Google sign-in, local documents).
      { source: "/shared/:token", destination: "/tools/preview", permanent: true },
      { source: "/auth/callback", destination: "/auth", permanent: true },
      // Paid plans were retired (2026-10-06): everything is free.
      { source: "/pricing/:rest+", destination: "/pricing", permanent: true },
      // Browsers and crawlers request /favicon.ico blindly; the icon is app/icon.svg.
      { source: "/favicon.ico", destination: "/icon.svg", permanent: true },
      { source: "/tools/symbols/gamma-2", destination: "/tools/symbols/capital-gamma", permanent: true },
      { source: "/tools/symbols/delta-2", destination: "/tools/symbols/capital-delta", permanent: true },
      { source: "/tools/symbols/theta-2", destination: "/tools/symbols/capital-theta", permanent: true },
      { source: "/tools/symbols/lambda-2", destination: "/tools/symbols/capital-lambda", permanent: true },
      { source: "/tools/symbols/xi-2", destination: "/tools/symbols/capital-xi", permanent: true },
      { source: "/tools/symbols/pi-2", destination: "/tools/symbols/capital-pi", permanent: true },
      { source: "/tools/symbols/sigma-2", destination: "/tools/symbols/capital-sigma", permanent: true },
      { source: "/tools/symbols/upsilon-2", destination: "/tools/symbols/capital-upsilon", permanent: true },
      { source: "/tools/symbols/phi-2", destination: "/tools/symbols/capital-phi", permanent: true },
      { source: "/tools/symbols/psi-2", destination: "/tools/symbols/capital-psi", permanent: true },
      { source: "/tools/symbols/omega-2", destination: "/tools/symbols/capital-omega", permanent: true },
      { source: "/tools/symbols/leftarrow-2", destination: "/tools/symbols/double-leftarrow", permanent: true },
      { source: "/tools/symbols/rightarrow-2", destination: "/tools/symbols/double-rightarrow", permanent: true },
      { source: "/tools/symbols/leftrightarrow-2", destination: "/tools/symbols/double-leftrightarrow", permanent: true },
      { source: "/tools/symbols/longrightarrow-2", destination: "/tools/symbols/double-longrightarrow", permanent: true },
      { source: "/tools/symbols/vdash-2", destination: "/tools/symbols/double-turnstile", permanent: true },
      { source: "/tools/symbols/vdash-3", destination: "/tools/symbols/forces-vdash", permanent: true },
      { source: "/tools/symbols/lvert-rvert-2", destination: "/tools/symbols/norm-lvert-rvert", permanent: true },
      { source: "/tools/arxiv-to-bibtex-converter", destination: "/tools/arxiv-to-bibtex", permanent: true },
  ];
}

const nextConfig: NextConfig = {
  redirects: legacyRedirects,
  // Vercel runs Next.js natively — no static export needed.
  // Images are optimized by Vercel's built-in image service.
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
