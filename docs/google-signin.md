# Turning on Google sign-in

latexci signs users in with Google (OAuth 2.0, code flow with PKCE) and keeps
no database: the session is a signed cookie (`lib/session.ts`) and the plan is
read from Stripe (`lib/entitlement.ts`). Until the variables below exist, the
sign-in page says "being set up" and every tool, PDF export included, is open.

## 1. Create the OAuth client (Google Cloud console, about 5 minutes)

1. https://console.cloud.google.com/apis/credentials, pick or create a project.
2. "OAuth consent screen": External, app name `latexci`, support email,
   authorised domain `latexci.com`, scopes `openid`, `email`, `profile` (all
   non-sensitive, so no Google review). Publish the app ("In production").
3. "Create credentials" > "OAuth client ID" > Web application:
   - Authorised JavaScript origins: `https://latexci.com`
   - Authorised redirect URIs:
     - `https://latexci.com/api/auth/callback/google`
     - `http://localhost:3000/api/auth/callback/google` (local dev)
4. Copy the client ID and the client secret.

## 2. Add them to Vercel (Production)

```bash
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
```

`AUTH_SECRET` is already set (random, 2026-10-05). Changing it signs everyone out.

## 3. Redeploy

```bash
vercel deploy --prod --yes
```

Check: https://latexci.com/api/health shows `"auth":"google"`, and
https://latexci.com/auth shows the "Sign in with Google" button.

## Billing

Pro gates (PDF export, Word quota) stay open while `STRIPE_SECRET_KEY` is
missing, since nobody could pay. To sell Pro, also set `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET` and the four `NEXT_PUBLIC_STRIPE_*` price ids.
Checkout binds each subscription to the Google account id
(`metadata.google_sub`); older subscriptions are matched by email.
