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

const nextConfig: NextConfig = {
  // Vercel runs Next.js natively — no static export needed.
  // Images are optimized by Vercel's built-in image service.
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
