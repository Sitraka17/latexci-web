#!/usr/bin/env node
/**
 * Guarded Cloudflare build and deploy for latexci (@opennextjs/cloudflare).
 * Node >= 20, no dependency beyond the project's own OpenNext and wrangler.
 *
 * Why: `opennextjs-cloudflare build` copies every variable of .env, .env.local,
 * .env.production... into .open-next/cloudflare/next-env.mjs IN PLAIN TEXT, and
 * that file is bundled into the Worker script. The .env.local pulled from
 * Vercel holds BLOB_READ_WRITE_TOKEN and VERCEL_OIDC_TOKEN: the staging build of
 * 23/10 shipped them inside the latexci-staging Worker.
 *
 * What this script does:
 *   1. collects the secret-looking values of .env* / .dev.vars / build env
 *      (kept in memory only, never printed);
 *   2. sets the .env* files aside for the build and always puts them back;
 *   3. runs `opennextjs-cloudflare build` for the chosen Worker, without VERCEL*;
 *   4. NEUTRALISES next-env.mjs (empty exports: runtime values come from the
 *      Worker's secrets and vars, never from a local file), printing names only;
 *   5. lets wrangler bundle the Worker (`deploy --dry-run --outdir`, no account);
 *   6. scans all of .open-next/ and FAILS if a known secret value or a
 *      vercel_blob_rw_ token, Google client secret or Vercel OIDC JWT is found.
 *      Only names, labels and file paths are printed, never values.
 *
 * Usage (through the npm scripts):
 *   node scripts/cf-guard.mjs build  --target=staging|production
 *   node scripts/cf-guard.mjs deploy --target=staging|production
 *   node scripts/cf-guard.mjs scan   --target=staging|production   (check only)
 * `deploy` always redoes the guarded build first, then refuses a dirty git tree
 * (production), a config whose Worker name is not the target's, a production
 * config that declares routes or a custom domain, or a build made for another target.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { classify, ENV_PREFIX, nextEnvNames, parseDotenv, scanText } from "./cf-guard-lib.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, ".open-next");
const BUNDLE_DIR = join(OUT, ".bundle-check");
const MARKER = join(OUT, ".latexci-target");
const SUFFIX = ".cf-build-aside";

const TARGETS = {
  staging: { wrangler: "wrangler.jsonc", worker: "latexci-staging", siteUrl: null },
  production: { wrangler: "wrangler.production.jsonc", worker: "latexci", siteUrl: "https://latexci.com" },
};

function fail(message) {
  restore();
  console.error(`\ncf-guard: ERREUR, ${message}\n`);
  process.exit(1);
}

function bin(name) {
  return join(ROOT, "node_modules", ".bin", name);
}

function run(cmd, args, env = process.env) {
  console.log(`\n> ${relative(ROOT, cmd)} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit", env });
  if (r.error) fail(`impossible de lancer ${cmd} : ${r.error.message}`);
  if (r.status !== 0) fail(`${relative(ROOT, cmd)} ${args[0] ?? ""} a échoué (code ${r.status})`);
}

function parseArgs() {
  const [command, ...rest] = process.argv.slice(2);
  const target = rest.find((a) => a.startsWith("--target="))?.split("=")[1];
  if (!["build", "deploy", "scan"].includes(command ?? "") || !TARGETS[target ?? ""]) {
    fail("usage : cf-guard.mjs build|deploy|scan --target=staging|production");
  }
  return { command, target };
}

// ---------------------------------------------------------------- env files

function isEnvFile(name) {
  return /^\.env(\..+)?$/.test(name) && !name.endsWith(SUFFIX) && name !== ".env.example";
}

function localSecretFiles() {
  return readdirSync(ROOT)
    .filter((n) => isEnvFile(n) || n.endsWith(SUFFIX) || n === ".dev.vars" || n.startsWith(".dev.vars."))
    .map((n) => join(ROOT, n))
    .filter((p) => statSync(p).isFile());
}

/** Known secret values (memory only): local files plus the build environment. */
function collectNeedles() {
  const needles = [];
  for (const file of localSecretFiles()) {
    const origin = relative(ROOT, file).replace(SUFFIX, "");
    for (const [name, value] of Object.entries(parseDotenv(readFileSync(file, "utf8")))) {
      const level = classify(name, value);
      if (level) needles.push({ name, origin, level, buf: Buffer.from(value) });
    }
  }
  for (const [name, value] of Object.entries(process.env)) {
    const level = ENV_PREFIX.test(name) ? classify(name, value) : null;
    if (level) needles.push({ name, origin: "environnement du build", level, buf: Buffer.from(value) });
  }
  return needles;
}

const moved = [];
function restore() {
  for (const f of moved.splice(0)) renameSync(join(ROOT, f + SUFFIX), join(ROOT, f));
}
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    restore();
    process.exit(130);
  });
}

function setEnvFilesAside() {
  // A leftover from an interrupted run: put it back first.
  for (const f of readdirSync(ROOT).filter((n) => n.endsWith(SUFFIX))) {
    const orig = f.slice(0, -SUFFIX.length);
    if (!existsSync(join(ROOT, orig))) renameSync(join(ROOT, f), join(ROOT, orig));
  }
  for (const f of readdirSync(ROOT).filter(isEnvFile)) {
    renameSync(join(ROOT, f), join(ROOT, f + SUFFIX));
    moved.push(f);
  }
  if (moved.length) console.log(`cf-guard: ${moved.join(", ")} mis de côté pendant le build`);
}

// ---------------------------------------------------------------- build

/** Replaces next-env.mjs with empty exports; prints the NAMES removed. */
function neutralizeNextEnv() {
  const file = join(OUT, "cloudflare", "next-env.mjs");
  if (!existsSync(file)) fail(`${relative(ROOT, file)} introuvable : version d'OpenNext inattendue, vérifier l'adaptateur`);
  const names = nextEnvNames(readFileSync(file, "utf8"));
  writeFileSync(
    file,
    "// Neutralised by scripts/cf-guard.mjs: no .env file value inside the Worker.\n" +
      "export const production = {};\nexport const development = {};\nexport const test = {};\n",
  );
  console.log(`\ncf-guard: next-env.mjs neutralisé (${names.length ? `retirés : ${names.join(", ")}` : "aucune variable de fichier .env"})`);
}

function buildEnv(target) {
  const env = { ...process.env, NEXT_TELEMETRY_DISABLED: "1" };
  // VERCEL=1 would render @vercel/analytics, whose script 404s off Vercel.
  for (const k of Object.keys(env)) if (k === "VERCEL" || k.startsWith("VERCEL_")) delete env[k];
  const { siteUrl } = TARGETS[target];
  if (siteUrl) {
    if (env.NEXT_PUBLIC_SITE_URL && env.NEXT_PUBLIC_SITE_URL !== siteUrl) {
      console.warn(`cf-guard: NEXT_PUBLIC_SITE_URL de l'environnement ignorée, ${siteUrl} imposée pour ${target}`);
    }
    env.NEXT_PUBLIC_SITE_URL = siteUrl;
  }
  console.log(`cf-guard: cible ${target}, NEXT_PUBLIC_SITE_URL=${env.NEXT_PUBLIC_SITE_URL ?? "(non définie, repli sur https://latexci.com)"}`);
  return env;
}

function build(target) {
  const t = TARGETS[target];
  const needles = collectNeedles(); // before the files move, kept for the scan
  const env = buildEnv(target);
  rmSync(OUT, { recursive: true, force: true });
  setEnvFilesAside();
  try {
    run(bin("opennextjs-cloudflare"), ["build", "-c", t.wrangler], env);
  } finally {
    restore();
  }
  neutralizeNextEnv();
  run(bin("wrangler"), ["deploy", "--dry-run", "--config", t.wrangler, "--outdir", relative(ROOT, BUNDLE_DIR)], env);
  writeFileSync(MARKER, `${target}\n`);
  scan(needles);
}

// ---------------------------------------------------------------- scan

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else if (st.isFile()) yield p;
  }
}

function scan(needles = collectNeedles()) {
  if (!existsSync(OUT)) fail(".open-next/ absent : lancer le build d'abord");
  const failures = new Set();
  const warnings = new Set();
  let files = 0;
  let bytes = 0;
  for (const file of walk(OUT)) {
    const buf = readFileSync(file);
    files += 1;
    bytes += buf.length;
    const rel = relative(ROOT, file);
    for (const n of needles) {
      if (buf.indexOf(n.buf) !== -1) {
        (n.level === "warn" ? warnings : failures).add(`${rel} : valeur de ${n.name} (${n.origin})`);
      }
    }
    if (buf.indexOf(0) !== -1 && !/\.(m?js|json|html|txt|rsc|body|meta|cache|map)$/.test(file)) continue;
    for (const label of scanText(buf.toString("utf8"))) failures.add(`${rel} : ${label}`);
  }
  console.log(
    `\ncf-guard: scan de .open-next/ : ${files} fichiers, ${(bytes / 1e6).toFixed(1)} Mo, ` +
      `${needles.length} valeur(s) connue(s) recherchée(s) (${[...new Set(needles.map((n) => n.name))].join(", ") || "aucune"})`,
  );
  if (warnings.size) {
    console.warn([...warnings].map((w) => `  avertissement : ${w}`).join("\n"));
    console.warn("  (donnée personnelle : vérifier qu'il s'agit bien d'une adresse publique du site)");
  }
  if (failures.size) {
    console.error([...failures].map((f) => `  - ${f}`).join("\n"));
    fail(`${failures.size} fuite(s) de secret dans le bundle : NE PAS DÉPLOYER. Supprimer .open-next/ après correction.`);
  }
  console.log("  OK : aucun secret trouvé dans .open-next/");
}

// ---------------------------------------------------------------- deploy checks

function checkConfig(target) {
  const t = TARGETS[target];
  const cfg = readFileSync(join(ROOT, t.wrangler), "utf8").replace(/^\s*\/\/.*$/gm, "");
  const name = cfg.match(/"name"\s*:\s*"([^"]+)"/)?.[1];
  if (name !== t.worker) fail(`${t.wrangler} vise le Worker « ${name ?? "?"} », attendu « ${t.worker} » pour ${target}`);
  if (target === "production" && /"(routes|route|custom_domain)"\s*:/.test(cfg)) {
    fail(`${t.wrangler} déclare une route ou un domaine : le domaine latexci.com se rattache à la main (voir docs/cloudflare)`);
  }
}

function checkGitClean(target) {
  const status = spawnSync("git", ["status", "--porcelain"], { cwd: ROOT, encoding: "utf8" });
  if (status.status !== 0) fail("git status a échoué");
  if (status.stdout.trim() === "") return;
  if (target === "production") fail("arbre git non propre : committer avant de déployer la production");
  console.warn("cf-guard: arbre git non propre (toléré pour le staging)");
}

function checkBuiltTarget(target) {
  const built = existsSync(MARKER) ? readFileSync(MARKER, "utf8").trim() : null;
  if (built !== target) fail(`le build présent vise « ${built ?? "rien"} », pas « ${target} »`);
}

const { command, target } = parseArgs();
if (command === "scan") {
  scan();
} else if (command === "build") {
  build(target);
} else {
  checkGitClean(target); // fail early, before the long build
  checkConfig(target);
  build(target);
  checkBuiltTarget(target);
  run(bin("opennextjs-cloudflare"), ["deploy", "-c", TARGETS[target].wrangler]);
}
