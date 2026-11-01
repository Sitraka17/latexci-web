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
| Build et déploiement gardés | `scripts/cf-guard.mjs` (`scripts/cf-build.mjs` le relaie) | voir « Garde-fou des secrets » plus bas |
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
npm test                 # vitest, 296 tests
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
- Le Worker `latexci-staging` embarque le token Blob du build du 23/10 : voir
  « Garde-fou des secrets », section « À faire par Sitraka ».
- `@opennextjs/cloudflare` est bloqué à 1.20.1 tant que Next n'est pas en >=16.4.1.
- Déploiement automatique possible plus tard : GitHub Action avec les secrets de dépôt
  `CLOUDFLARE_API_TOKEN` et `CLOUDFLARE_ACCOUNT_ID` (dépôt public, Actions gratuites).

## Garde-fou des secrets (`scripts/cf-guard.mjs`, ajouté le 01/11/2026)

Tous les scripts `cf:*` passent par ce garde-fou. Il :

1. relève en mémoire les valeurs secrètes des `.env*`, `.dev.vars` et de
   l'environnement du build (jamais affichées) ;
2. met les `.env*` de côté pendant `opennextjs-cloudflare build` et les remet toujours ;
3. retire `VERCEL*` de l'environnement et impose `NEXT_PUBLIC_SITE_URL=https://latexci.com`
   pour la prod ;
4. vide `.open-next/cloudflare/next-env.mjs` (affiche seulement les noms retirés) ;
5. fait empaqueter le Worker par wrangler (`deploy --dry-run --outdir`, sans compte) ;
6. scanne tout `.open-next/` : valeurs connues de `GOOGLE_CLIENT_ID`, `AUTH_SECRET`,
   `BLOB_READ_WRITE_TOKEN`, `VERCEL_OIDC_TOKEN`, `OTEL_EXPORTER_OTLP_HEADERS`, plus toute
   forme `vercel_blob_rw_...`, `GOCSPX-...` ou JWT émis par Vercel. Échec au moindre
   résultat. `ADMIN_EMAILS` donne un simple avertissement (adresse peut-être publique).

`npm run cf:deploy` refuse en plus : un arbre git non propre, un `wrangler.production.jsonc`
qui ne vise pas le Worker `latexci` ou qui déclare une route ou un domaine, un build fait
pour une autre cible. `npm run cf:staging` tolère un arbre non propre (avertissement).

Vérifié le 01/11/2026 avec de fausses valeurs dans un `.env.local` temporaire : le build
OpenNext brut recopie bien `ADMIN_EMAILS`, `AUTH_SECRET`, `BLOB_READ_WRITE_TOKEN`,
`GOOGLE_CLIENT_ID` dans `next-env.mjs` et `npm run cf:scan` le refuse ; le build gardé
(`npm run cf:build:prod`) passe, `next-env.mjs` vide, aucune valeur trouvée.

Ne jamais lancer `npx opennextjs-cloudflare build` ou `deploy` à la main : toujours les
scripts npm.

### À faire par Sitraka (dans l'ordre)

Le Worker `latexci-staging` (build du 23/10, avant le garde-fou) contient le
`BLOB_READ_WRITE_TOKEN` réel et un `VERCEL_OIDC_TOKEN`. L'historique des versions du
Worker le garde même après un redéploiement : **la rotation du token Blob est obligatoire**.

1. Retirer l'ancienne version du staging, au choix :
   ```bash
   npm run cf:staging                      # redéploiement gardé (sans secret)
   # ou, si le staging ne sert plus :
   npx wrangler delete -c wrangler.jsonc
   ```
2. Régénérer le token Blob : tableau de bord Vercel > Storage > store `latexci-users` >
   réglages du store, régénérer (rotate) le jeton lecture-écriture. Ne pas supprimer le store.
3. Vérifier que la variable `BLOB_READ_WRITE_TOKEN` du projet Vercel `latexci` porte bien
   le nouveau jeton (Settings > Environment Variables), puis redéployer latexci.com, qui
   est encore servi par Vercel. Le faire depuis `main`, jamais depuis la branche
   `cloudflare-staging` (sinon du code non fusionné part en production Vercel) :
   ```bash
   git switch main && git pull
   vercel deploy --prod --yes
   git switch cloudflare-staging
   ```
   Autre possibilité sans changer de branche : tableau de bord Vercel > Deployments >
   dernier déploiement de production > Redeploy (reprend le même code, avec le nouveau jeton).
   Tester aussitôt le tableau admin du dashboard (lecture Blob).
4. Mettre à jour le fichier local (facultatif) : `vercel env pull .env.local`.
5. Poser les secrets du Worker de prod. Coller chaque valeur à l'invite de wrangler,
   jamais dans la ligne de commande :
   ```bash
   npx wrangler secret put GOOGLE_CLIENT_ID      -c wrangler.production.jsonc
   npx wrangler secret put AUTH_SECRET           -c wrangler.production.jsonc
   npx wrangler secret put BLOB_READ_WRITE_TOKEN -c wrangler.production.jsonc   # le NOUVEAU jeton
   npx wrangler secret put ADMIN_EMAILS          -c wrangler.production.jsonc
   ```
6. Redéployer la prod Cloudflare depuis un arbre propre, puis contrôler :
   ```bash
   git status                 # doit être vide
   npm run cf:deploy          # build gardé, scan, puis deploy
   curl -s https://latexci.<compte>.workers.dev/api/health   # attendu : "auth":"google"
   ```
7. `VERCEL_OIDC_TOKEN` expire seul en quelques heures : rien à faire, sauf si un
   comportement anormal apparaît dans les journaux Vercel.
