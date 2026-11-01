// Pure helpers for scripts/cf-guard.mjs (no I/O on the project, unit-tested in
// lib/__tests__/cf-guard.test.ts). Nothing here ever returns or prints a
// secret VALUE: findings only carry variable names, pattern labels and paths.

/** Names that are secret for latexci whatever their value looks like. */
export const SECRET_NAMES = new Set([
  "AUTH_SECRET",
  "BLOB_READ_WRITE_TOKEN",
  "GOOGLE_CLIENT_ID",
  "VERCEL_OIDC_TOKEN",
  "OTEL_EXPORTER_OTLP_HEADERS",
  "CLOUDFLARE_API_TOKEN",
]);

/**
 * Personal data rather than credentials: a hit is reported as a warning, since
 * an admin address can also be the public contact address shown on the site.
 */
export const WARN_NAMES = new Set(["ADMIN_EMAILS"]);

const SECRET_NAME = /(SECRET|PRIVATE|PASSWORD|PASSWD|TOKEN|API_KEY|_HEADERS$|CREDENTIAL)/i;
const SECRET_VALUE = /^vercel_blob_rw_|^GOCSPX-|^eyJ/;

/** Shape-based search, independent of any local file. */
export const PATTERNS = [
  { name: "jeton Vercel Blob (vercel_blob_rw_)", re: /vercel_blob_rw_[A-Za-z0-9]{8,}_[A-Za-z0-9]{16,}/g },
  { name: "secret client Google OAuth (GOCSPX-)", re: /GOCSPX-[A-Za-z0-9_-]{20,}/g },
];
const JWT = /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g;

/** Minimal dotenv parser (KEY=VALUE, single or double quotes, trailing comments). */
export function parseDotenv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    } else {
      v = v.replace(/\s+#.*$/, "");
    }
    out[m[1]] = v;
  }
  return out;
}

/** Is this env entry worth searching for in the bundle? */
export function classify(name, value) {
  if (!value || value.length < 8) return null;
  if (name.startsWith("NEXT_PUBLIC_")) return null; // public by design (inlined into client JS)
  if (WARN_NAMES.has(name)) return "warn";
  if (SECRET_NAMES.has(name) || SECRET_NAME.test(name) || SECRET_VALUE.test(value)) return "fail";
  return null;
}

/** Only these build-environment variables are searched (avoids PATH, HOME...). */
export const ENV_PREFIX = /^(AUTH_|BLOB_|GOOGLE_|VERCEL_|ADMIN_|OTEL_|CLOUDFLARE_|NEXT_)/;

function jwtIssuer(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    return typeof payload.iss === "string" ? payload.iss : null;
  } catch {
    return null;
  }
}

/** Findings (labels only) for one text file of the bundle. */
export function scanText(text) {
  const hits = [];
  for (const p of PATTERNS) {
    p.re.lastIndex = 0;
    if (p.re.test(text)) hits.push(p.name);
  }
  JWT.lastIndex = 0;
  for (const m of text.matchAll(JWT)) {
    const iss = jwtIssuer(m[0]);
    if (iss && /vercel\.com/.test(iss)) {
      hits.push("jeton OIDC Vercel (JWT)");
      break;
    }
  }
  return hits;
}

/** Variable names declared in an OpenNext next-env.mjs (values ignored). */
export function nextEnvNames(source) {
  return [...new Set([...source.matchAll(/"([A-Za-z_][A-Za-z0-9_]*)":/g)].map((m) => m[1]))];
}
