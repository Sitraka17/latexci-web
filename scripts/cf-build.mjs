#!/usr/bin/env node
// Kept for old habits and docs: forwards to the guarded build of
// scripts/cf-guard.mjs, which sets .env* aside, neutralises next-env.mjs,
// bundles the Worker with wrangler and scans .open-next/ for secrets.
//
// Usage: node scripts/cf-build.mjs <wrangler config>
import { spawnSync } from "node:child_process";
import path from "node:path";

const config = process.argv[2] ?? "wrangler.jsonc";
const target = { "wrangler.jsonc": "staging", "wrangler.production.jsonc": "production" }[config];
if (!target) {
  console.error(`cf-build: config inconnue « ${config} » (wrangler.jsonc ou wrangler.production.jsonc)`);
  process.exit(1);
}
const guard = path.join(path.dirname(new URL(import.meta.url).pathname), "cf-guard.mjs");
const r = spawnSync(process.execPath, [guard, "build", `--target=${target}`], { stdio: "inherit" });
process.exit(r.status ?? 1);
