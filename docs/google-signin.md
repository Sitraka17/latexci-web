# Google sign-in and user records

Status: live in production since 5 October 2026.

latexci signs users in with Google using the OpenID Connect ID-token flow
(form_post, state and nonce). No client secret is used or stored, and there is
no database:

- the session is a signed cookie (`lib/session.ts`, HMAC with `AUTH_SECRET`);
- the Google ID token is verified against Google's public keys
  (`lib/google-id-token.ts`);
- each signed-in user gets one private JSON record in Vercel Blob
  (`lib/users.ts`, store `latexci-users`, region Paris `cdg1`): email, name,
  first and last seen, and counts of sign-ins, PDF exports and Word
  conversions;
- documents stay in the browser (`localStorage`, `lib/local-docs.ts`).

Every tool is free. Only PDF export (`/api/compile-pdf`) and Word to LaTeX
(`/api/word-conversion`) require a session. If `GOOGLE_CLIENT_ID` or
`AUTH_SECRET` is missing, the sign-in page says "being set up" and both
features are open to everyone.

## Google Cloud (already done)

- Project `latexci-510720`, OAuth consent screen External, app `latexci`,
  publishing status "In production". Scopes `openid`, `email`, `profile`
  (non-sensitive, no Google review needed).
- OAuth client "latexci web" (Web application):
  - Authorised JavaScript origins: `https://latexci.com`
  - Authorised redirect URIs:
    - `https://latexci.com/api/auth/callback/google`
    - `http://localhost:3000/api/auth/callback/google` (local dev)
- The client secret is not used: leave it in Google.

## Environment variables (Vercel, Production)

| Variable | Purpose |
| --- | --- |
| `GOOGLE_CLIENT_ID` | OAuth client ID of "latexci web" |
| `AUTH_SECRET` | Signs the session cookie. Changing it signs everyone out. |
| `BLOB_READ_WRITE_TOKEN` | Injected automatically by the Blob store `latexci-users` connected to the project. Without it, user records are simply not written. |
| `ADMIN_EMAILS` | Comma-separated emails. Admins see a Users table and a CSV export in `/dashboard`. |

## User data

- Records are written best-effort (with `after()`), so a storage error never
  blocks a sign-in or an export.
- "Delete my data" in `/dashboard` calls `POST /api/account/delete`, which
  deletes the record, clears the session cookies, and wipes the documents
  saved in that browser.

## Check after a deploy

```bash
vercel deploy --prod --yes
```

- https://latexci.com/api/health shows `"auth":"google"`;
- https://latexci.com/auth shows the "Sign in with Google" button.
