#!/usr/bin/env node
// OpenNext Cloudflare build that never ships local secrets.
//
// opennextjs-cloudflare copies every variable from .env* files into
// .open-next/cloudflare/next-env.mjs, which is bundled into the Worker. A local
// .env.local (pulled from Vercel) would therefore embed BLOB_READ_WRITE_TOKEN
// and VERCEL_OIDC_TOKEN in the deployed code. This wrapper moves .env* files
// aside for the build, always puts them back, then fails if the bundled env is
// not empty. Secrets belong in `wrangler secret put`.
//
// Usage: node scripts/cf-build.mjs <wrangler config>   (env NEXT_PUBLIC_SITE_URL
// must be set for production so canonicals, sitemap and robots are right).
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, renameSync } from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const config = process.argv[2] ?? "wrangler.jsonc";
const SUFFIX = ".cf-build-aside";

const envFiles = readdirSync(root).filter(
  (f) => /^\.env(\..+)?$/.test(f) && !f.endsWith(SUFFIX) && f !== ".env.example",
);
const moved = [];
function restore() {
  for (const f of moved.splice(0)) {
    renameSync(path.join(root, f + SUFFIX), path.join(root, f));
  }
}
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    restore();
    process.exit(130);
  });
}

// A leftover from an interrupted run: put it back first.
for (const f of readdirSync(root).filter((f) => f.endsWith(SUFFIX))) {
  const orig = f.slice(0, -SUFFIX.length);
  if (!existsSync(path.join(root, orig))) renameSync(path.join(root, f), path.join(root, orig));
}

// Never let a Vercel shell leak in: VERCEL=1 would render @vercel/analytics,
// whose script 404s off Vercel.
function buildEnv() {
  const env = { ...process.env };
  for (const k of Object.keys(env)) if (k === "VERCEL" || k.startsWith("VERCEL_")) delete env[k];
  return env;
}

try {
  for (const f of envFiles) {
    renameSync(path.join(root, f), path.join(root, f + SUFFIX));
    moved.push(f);
  }
  if (moved.length) console.log(`cf-build: set aside ${moved.join(", ")} for the build`);
  console.log(`cf-build: NEXT_PUBLIC_SITE_URL=${process.env.NEXT_PUBLIC_SITE_URL ?? "(unset, falls back to https://latexci.com)"}`);
  execFileSync("npx", ["opennextjs-cloudflare", "build", "-c", config], {
    cwd: root,
    stdio: "inherit",
    env: buildEnv(),
  });
} finally {
  restore();
}

const bundled = readFileSync(path.join(root, ".open-next/cloudflare/next-env.mjs"), "utf8");
const leaked = [...bundled.matchAll(/"([A-Z0-9_]+)":/g)].map((m) => m[1]);
if (leaked.length) {
  console.error(`cf-build: REFUSING, bundled env contains ${[...new Set(leaked)].join(", ")}`);
  process.exit(1);
}
console.log("cf-build: bundled env is empty, OK");
