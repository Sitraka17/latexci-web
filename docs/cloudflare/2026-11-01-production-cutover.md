# Bascule de production vers Cloudflare Workers (01/11/2026)

État : le Worker de production `latexci` est construit et déployé sur son adresse
workers.dev (`latexci.<sous-domaine du compte>.workers.dev`, non indexée grâce au
`X-Robots-Tag: noindex` posé par `next.config.ts` sur tout hôte `*.workers.dev`).
latexci.com est **toujours servi par Vercel** : aucun DNS, aucun domaine personnalisé,
aucun secret n'a été touché. Le Worker de staging `latexci-staging` reste en place.

## Ce qui a été fait sur la branche `cloudflare-staging`

| Élément | Fichier | Détail |
|---|---|---|
| Config Worker de prod | `wrangler.production.jsonc` | nom `latexci`, `WORKER_SELF_REFERENCE` vers `latexci`, `keep_vars: true`, observabilité activée, aucun domaine déclaré |
| Build sans secrets locaux | `scripts/cf-build.mjs` | met `.env*` de côté pendant le build, les remet toujours, retire `VERCEL*` de l'environnement, échoue si `.open-next/cloudflare/next-env.mjs` contient une variable |
| Scripts npm | `package.json` | `cf:build:prod`, `cf:preview:prod`, `cf:deploy` (prod) ; `cf:build`, `cf:preview`, `cf:staging` passent aussi par le wrapper |
| Analytics Vercel | `app/layout.tsx` | `<Analytics />` rendu seulement si `VERCEL=1` au build ; le wrapper retire `VERCEL` : aucun appel `/_vercel/insights` sur Cloudflare (vérifié) |
| Origine du site | build | `NEXT_PUBLIC_SITE_URL=https://latexci.com` est inliné au build : canonical, sitemap et robots pointent sur latexci.com (vérifié) |

### Pourquoi le wrapper de build

`opennextjs-cloudflare build` recopie toutes les variables des fichiers `.env*` dans
`.open-next/cloudflare/next-env.mjs`, qui est embarqué dans le code du Worker. Le
`.env.local` local (tiré de Vercel) contient `BLOB_READ_WRITE_TOKEN` et
`VERCEL_OIDC_TOKEN` : le build de staging du 23/10 les a donc embarqués dans le Worker
`latexci-staging`. Le build de prod les exclut désormais. Voir « À faire par Sitraka ».

## Déployer (prod)

```bash
npm ci
npm test                 # vitest, 292 tests
npm run cf:deploy        # build prod + deploy du Worker "latexci"
```

Après le build, `.next` (environ 600 Mo) peut être supprimé : il se régénère.

## Smoke test du 01/11/2026 sur workers.dev

Toutes les pages et routes ci-dessous répondent comme attendu, sans aucun secret posé :

- 200 : `/`, `/tools/symbols/frac`, `/pricing`, `/privacy`, `/dashboard`, `/auth`,
  `/robots.txt` (Sitemap `https://latexci.com/sitemap.xml`), `/sitemap.xml`
  (`<loc>https://latexci.com...`), `/api/health` (`auth: off`), `/api/auth/me`.
- 404 propre : `/does-not-exist`.
- 308 : `/tools/arxiv-to-bibtex-converter`, `/auth/callback`, `/pricing/pro`,
  `/shared/abc` vers leurs cibles.
- En-têtes : HSTS preload, CSP, `X-Frame-Options: DENY`, `X-Robots-Tag: noindex` (workers.dev).
- APIs : `compile-pdf` (POST) renvoie un vrai PDF (`%PDF-`), `doi-to-bibtex`,
  `arxiv-to-bibtex`, `pmid-to-bibtex?id=`, `orcid-works?id=` en 200,
  `word-conversion` `{"allowed":true}`.
- Échecs attendus faute de secret :
  - `/api/auth/google` : 307 vers `/auth?error=unavailable` (`GOOGLE_CLIENT_ID`, `AUTH_SECRET`).
  - `/api/admin/users` : 403, `/api/account/newsletter` : 401 (pas de session, donc pas
    d'accès Blob ; `BLOB_READ_WRITE_TOKEN`, `ADMIN_EMAILS`).
  - Sans `GOOGLE_CLIENT_ID`, `isAuthConfigured` est faux : export PDF et conversion Word
    sont ouverts sans compte. C'est le comportement attendu tant que les secrets manquent.
- Limite connue (pas un secret) : le repli serveur de `isbn-to-bibtex` renvoie 502
  (Open Library 521, Google Books 429 depuis les IP sortantes Cloudflare). La page
  interroge Open Library depuis le navigateur en premier, le repli serveur seul est touché.

## Étapes de bascule restantes (dans l'ordre)

1. **Secrets du Worker `latexci`** (noms seulement, valeurs copiées depuis Vercel par Sitraka) :
   ```bash
   npx wrangler secret put GOOGLE_CLIENT_ID      -c wrangler.production.jsonc
   npx wrangler secret put AUTH_SECRET           -c wrangler.production.jsonc
   npx wrangler secret put BLOB_READ_WRITE_TOKEN -c wrangler.production.jsonc
   npx wrangler secret put ADMIN_EMAILS          -c wrangler.production.jsonc
   ```
   `ADMIN_EMAILS` peut aussi être une variable texte dans le tableau de bord
   (Workers > latexci > Settings > Variables) ; `keep_vars: true` la protège des redéploiements.
   Puis `curl https://latexci.<compte>.workers.dev/api/health` doit renvoyer `"auth":"google"`.
2. **Export des zones OVH** `latexci.com` et `latexci.org` (OVH Manager > Domaines >
   Zone DNS > « Modifier en mode textuel », copier tout). À conserver : MX `mx1` (prio 1),
   `mx2` (prio 5), `mx3` (prio 100) `.mail.ovh.net`, SPF `v=spf1 include:mx.ovh.com -all`,
   TXT `google-site-verification`, TXT `1|www.latexci.com`, tout DKIM ou autoconfig.
3. **Import dans Cloudflare** (plan Free) : Add a site `latexci.com`, puis `latexci.org`.
   Comparer ligne à ligne avec l'export : MX x3, SPF, TXT identiques. Supprimer de
   l'import les A/CNAME Vercel (`216.198.79.1`, `cname.vercel-dns.com`).
4. **Domaine personnalisé** : Workers > `latexci` > Settings > Domains & Routes > Add >
   Custom domain `latexci.com`. Possible seulement quand la zone est active chez
   Cloudflare (donc juste après l'étape 6) ; Cloudflare crée l'enregistrement proxifié.
5. **Redirections** (remplacent `vercel.json`) : pour `www.latexci.com`, `latexci.org`,
   `www.latexci.org`, créer un enregistrement proxifié (AAAA `100::`) puis une Redirect
   Rule « Dynamic » : `concat("https://latexci.com", http.request.uri.path)`, code 308,
   « Preserve query string » coché.
6. **Bascule NS chez OVH** : remplacer `dns109.ovh.net` / `ns109.ovh.net` par la paire
   donnée par Cloudflare, pour les deux domaines. Propagation 24 à 48 h. Ne rien
   supprimer chez Vercel avant J+3.
7. **Contrôle OAuth Google** (GCP projet `latexci-510720`, client « latexci web ») :
   vérifier que l'origine JavaScript autorisée `https://latexci.com` et l'URI de
   redirection `https://latexci.com/api/auth/callback/google` sont présentes. Le
   `redirect_uri` est construit depuis l'origine de la requête : rien ne change pour
   latexci.com. N'ajouter l'origine workers.dev que pour tester le sign-in avant bascule.
8. **Tests post-bascule** : connexion Google, export PDF connecté, tableau admin du
   dashboard (lecture Blob), désinscription newsletter (écriture Blob), mail OVH dans
   les deux sens, `curl -I https://www.latexci.com/x` (308 vers l'apex), inspection
   d'URL dans la Search Console, `npm run indexnow` si voulu.
9. **Après J+3** : fusionner `cloudflare-staging` dans `main`, retirer les domaines du
   projet Vercel (ne pas supprimer le projet ni le store Blob `latexci-users`, le token
   en dépend), puis passer Vercel en Hobby avant le 21/11.

## Points ouverts

- Le texte de `/privacy` mentionne encore Vercel Analytics ; à ajuster (ou à remplacer
  par Cloudflare Web Analytics, beacon sans cookie) au choix de Sitraka.
- Le Worker `latexci-staging` embarque le token Blob du build du 23/10 : le redéployer
  avec `npm run cf:staging` (wrapper) ou le supprimer, puis régénérer le token Blob.
- `@opennextjs/cloudflare` est bloqué à 1.20.1 tant que Next n'est pas en >=16.4.1.
- Déploiement automatique possible plus tard : GitHub Action avec les secrets de dépôt
  `CLOUDFLARE_API_TOKEN` et `CLOUDFLARE_ACCOUNT_ID` (dépôt public, Actions gratuites).
