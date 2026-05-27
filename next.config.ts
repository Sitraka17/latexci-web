import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",   // Static HTML export — works on Cloudflare Pages, GitHub Pages, any CDN
  trailingSlash: true, // Ensures /tools/preview/ works without a server
  images: {
    unoptimized: true, // Required for static export (no Next.js image server)
  },
};

export default nextConfig;
