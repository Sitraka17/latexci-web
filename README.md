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
```

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` | for sign-in | Google OAuth client ID |
| `AUTH_SECRET` | for sign-in | Signs the session cookie |
| `BLOB_READ_WRITE_TOKEN` | optional | Vercel Blob store `latexci-users` (injected by Vercel) |
| `ADMIN_EMAILS` | optional | Comma-separated admin emails (Users table + CSV in `/dashboard`) |
| `NEXT_PUBLIC_SITE_URL` | optional | Canonical site URL |

Without `GOOGLE_CLIENT_ID` and `AUTH_SECRET`, sign-in is off and PDF export
and Word to LaTeX are open to everyone, which is convenient for local work.

## Docs

- [`docs/google-signin.md`](docs/google-signin.md): sign-in, user records,
  environment setup.
- `CLAUDE.md` / `AGENTS.md`: conventions for contributors and agents.

Deploy: `vercel deploy --prod --yes`.
