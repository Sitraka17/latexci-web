// OpenNext adapter config for Cloudflare Workers (staging).
// Every page is prerendered at build time with revalidate=false (no ISR), so
// the default in-memory/dummy incremental cache is enough: static HTML and RSC
// payloads are served from Workers Assets, only /auth and /api/* hit the Worker.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

export default defineCloudflareConfig({
  // Read-only cache bundled into the Worker's static assets: enough because
  // nothing revalidates (no R2/KV needed, stays on the free tier).
  incrementalCache: staticAssetsIncrementalCache,
});
