# latexci

The tools Overleaf forgot: free, browser-based LaTeX utilities, live at
[latexci.com](https://latexci.com).

- Live preview with PDF export, diff of two LaTeX versions, Word to LaTeX,
  table generator, symbol finder (350+ symbols), 28 templates, CV builder,
  and a BibTeX suite (DOI, arXiv, ISBN, PubMed, ORCID to BibTeX).
- Every tool is free; there is no paid plan.
- PDF export and Word to LaTeX need a one-click Google sign-in. All other
  tools work without an account.
- Saved documents stay in the browser (`localStorage`). Signed-in users get a
  small private record in Vercel Blob (Paris, EU), erasable with
  "Delete my data" in `/dashboard`.

## Stack

Next.js 16 (App Router, React 19, TypeScript), deployed on Vercel. CodeMirror
editor, KaTeX preview, `diff`, `mammoth` (Word import), Vercel Blob and
Vercel Analytics. No database. PDF compilation goes through YToTech
LaTeX-on-HTTP (`app/api/compile-pdf`).

## Scripts

```bash
npm run dev     # local server on http://localhost:3000
npm run build   # production build
npm run test    # unit tests (Vitest)
npm run lint    # ESLint
npm run cf:deploy       # build + deploy the production Worker "latexci" (Cloudflare)
npm run cf:preview:prod # same build, served locally by workerd
```

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` | for sign-in | Google OAuth client ID |
| `AUTH_SECRET` | for sign-in | Signs the session cookie |
| `BLOB_READ_WRITE_TOKEN` | optional | Vercel Blob store `latexci-users` (injected by Vercel) |
| `ADMIN_EMAILS` | optional | Comma-separated admin emails (Users table + CSV in `/dashboard`) |
| `NEXT_PUBLIC_SITE_URL` | optional | Canonical site URL |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | optional | Turns on OpenTelemetry tracing (`instrumentation.ts`); unset = off, nothing loaded |
| `OTEL_EXPORTER_OTLP_HEADERS` | optional | OTLP auth header, e.g. `Authorization=Basic%20<base64>` (Grafana Cloud) |

Without `GOOGLE_CLIENT_ID` and `AUTH_SECRET`, sign-in is off and PDF export
and Word to LaTeX are open to everyone, which is convenient for local work.

## Docs

- [`docs/google-signin.md`](docs/google-signin.md): sign-in, user records,
  environment setup.
- [`docs/cloudflare/2026-11-01-production-cutover.md`](docs/cloudflare/2026-11-01-production-cutover.md):
  move from Vercel to Cloudflare Workers, smoke test, remaining cutover steps.
- `CLAUDE.md` / `AGENTS.md`: conventions for contributors and agents.

Deploy: until the DNS cutover, latexci.com is still served by Vercel
(`vercel deploy --prod --yes`). The Cloudflare Worker `latexci` is deployed
with `npm run cf:deploy` (config `wrangler.production.jsonc`); its secrets are
set with `npx wrangler secret put NAME -c wrangler.production.jsonc`. The CF
build guard (`scripts/cf-guard.mjs`, used by every `cf:*` script) keeps `.env*`
files out of the Worker bundle, empties `next-env.mjs`, scans `.open-next/` for
secrets (`npm run cf:scan`) and inlines `NEXT_PUBLIC_SITE_URL=https://latexci.com`.
Never run `opennextjs-cloudflare build/deploy` by hand.

## License

MIT, see [LICENSE](LICENSE). Bundled fonts (Computer Modern Unicode, STIX Two Math) are under the SIL Open Font License 1.1.
