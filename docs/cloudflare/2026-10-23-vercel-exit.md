# Sortie de Vercel : mesure ISR et faisabilité Cloudflare Workers (23/10/2026)

Branche `cloudflare-staging`. Rien de déployé en production, aucune bascule DNS.
Staging vérifié : https://latexci-staging.trains-lux.workers.dev

## Volet A : lectures ISR, mesure avant/après

Mesure au build (`next build`, Next 16.2.10, commit b80c8ea = prod Vercel du 18/10) :

| Catégorie | Routes | Pages générées |
|---|---|---|
| Statique (o) | 46 | 46 |
| SSG via generateStaticParams (filled circle) | 6 groupes | 855 (380 symboles + 380 OG, 17 catégories x2, 28 templates x2, moins recouvrements) |
| Total prérendu | | **901 pages, toutes `revalidate: false`** |
| Dynamique (f) | 16 | 15 routes API + `/auth` |

Verdict : **il n'y a plus rien à rendre statique**. Le `prerender-manifest` confirme
`initialRevalidateSeconds: false` sur les 895 routes listées et `dynamicParams: false`
sur les trois routes `[slug]`. La recommandation du 16/10 était déjà appliquée et
déployée (le « 60 % » du constat était la part de latexci dans les 886k lectures du
compte, pas une fraction réductible ; voir `docs/growth/2026-10-16-plan.md`, section 6).

Les ~514k lectures ISR/mois restantes sont un artefact de facturation Vercel : les pages
App Router prérendues sont servies depuis le stockage ISR et comptées par tranche de
8 Ko, même avec `revalidate: false`. Les seuls leviers côté code (poids de page : -14 à
-17 % ; prefetch à l'intention) sont déjà en prod. Gain supplémentaire possible sur
Vercel : zéro.

Le vrai zéro est le volet B : sur Cloudflare, les 901 pages partent dans Workers Assets
(requêtes statiques gratuites et illimitées, pas de métrique ISR) ; seuls `/auth` et
`/api/*` invoquent le Worker.

## Volet B : audit des 15 routes API pour Workers

Verdict global : **15/15 portables, zéro route bloquante au palier gratuit.**

| Route | Techno | Verdict |
|---|---|---|
| `compile-pdf` | Proxy fetch vers https://latex.ytotech.com (pdflatex puis fallback), aucun binaire local | **Portable telle quelle.** I/O-bound : les 2x25 s d'attente YToTech ne comptent pas dans la limite CPU de 10 ms du palier gratuit. PDF de test compilé sur le staging (14,5 Ko, 200, ~7 s) |
| `word-conversion` | La conversion (mammoth) tourne dans le navigateur ; la route ne gère que quota et cookies signés (WebCrypto) | **Portable telle quelle**, testée |
| `arxiv/doi/isbn/pmid-to-bibtex`, `orcid-works` | fetch vers arXiv, CrossRef/DataCite, OpenLibrary, PubMed, ORCID | **Portables** après passage de `runtime: "edge"` à `"nodejs"` (l'adaptateur OpenNext ne bundle pas les routes edge ; c'était la seule erreur rencontrée, 500 corrigée). Testées (DOI et arXiv en navigateur et en curl) |
| `auth/*` (google, callback, me, signout) | Cookie HMAC-SHA256 (WebCrypto), vérif d'ID token Google par fetch JWKS, **aucune base de données** | **Portable.** Secrets à poser à la bascule : `GOOGLE_CLIENT_ID`, `AUTH_SECRET` |
| `account/*`, `admin/users` | `@vercel/blob` (un JSON par utilisateur, best-effort, jamais bloquant) | **Portable telle quelle à court terme** : le SDK est un client REST qui marche hors Vercel avec `BLOB_READ_WRITE_TOKEN`, et le store survit au retour en Hobby. Adaptable vers R2 ou KV à terme (seule dépendance Vercel restante) |
| `health` | trivial | Portable, testée |

Points transverses :
- `rate-limit` : Map en mémoire par isolate, même sémantique que sur Vercel Edge. OK.
- `after()` de next/server (3 routes) : supporté par OpenNext (waitUntil). OK.
- `next/image` : seul usage avec `unoptimized`, rien à configurer.
- `@vercel/analytics` : script servi par l'infra Vercel uniquement ; rendu désormais
  conditionné à `VERCEL=1` (à remplacer par Cloudflare Web Analytics à la bascule).
- OTel (`@vercel/otel`) : no-op sans `OTEL_EXPORTER_OTLP_ENDPOINT`, inchangé.
- Redirections de `next.config.ts` (308 symboles, favicon) : vérifiées sur le staging.
- En-têtes de sécurité (CSP, HSTS...) : vérifiés sur le staging.
- `X-Robots-Tag: noindex` ajouté pour tout host `*.workers.dev` (le staging ne doit
  jamais concurrencer latexci.com dans Google) ; la condition de host ne matche
  jamais en production.

Versions : `@opennextjs/cloudflare` épinglé en **1.20.1**, dernière version compatible
Next 16.2.10 (1.20.3+ exige Next >=16.3.3, 1.20.12+ exige >=16.4.1 : ces planchers
suivent les correctifs de sécurité Next). Monter Next vers la dernière 16.x permettra
de suivre OpenNext ; à faire dans une PR séparée.

Palier gratuit Workers : 100k requêtes dynamiques/jour (pages statiques et assets
exclus, servis gratuitement par Workers Assets). Le trafic API actuel en est très loin.

## Vérifié sur le staging (navigateur, zéro erreur console)

- Home, `/tools/preview` (éditeur + rendu KaTeX), `/tools/symbols/alpha`,
  `/tools/doi-to-bibtex`, `/auth`, `/dashboard`, `/tools/word-to-latex`.
- Compilation PDF réelle depuis l'éditeur : POST `/api/compile-pdf` 200, PDF téléchargé.
- Conversion DOI -> BibTeX en direct (CrossRef).
- `sitemap.xml`, `robots.txt`, 404, redirections 308, en-têtes de sécurité.
- 292 tests vitest au vert après le changement de runtime.

Commandes : `npm run cf:build` (build), `npm run cf:preview` (workerd local),
`npm run cf:staging` (déploie le Worker `latexci-staging` ; le nom du Worker est fixé
dans `wrangler.jsonc`, aucun risque de toucher la prod).

## Plan de bascule DNS (à exécuter à la main, rien de fait)

Constat registrar : latexci.com **et** latexci.org sont chez **OVH** (zone DNS chez OVH,
ns109/dns109.ovh.net). Attention : la zone porte aussi le **mail OVH**
(MX mx1/mx2/mx3.mail.ovh.net, SPF `include:mx.ovh.com`) et le TXT
`google-site-verification` (GSC). Apex -> 216.198.79.1 (Vercel),
www -> cname.vercel-dns.com.

Un custom domain Workers exige que la zone soit chez Cloudflare (le setup CNAME sans
changer les NS est réservé aux plans payants). Donc :

1. Exporter la zone complète depuis OVH (sauvegarde, et vérifier DKIM/autoconfig mail).
2. Ajouter la zone `latexci.com` au compte Cloudflare (plan Free). Vérifier
   l'import : MX x3, SPF, TXT google-site-verification doivent y être à l'identique.
3. Déployer le Worker de production (nom `latexci`, même code que le staging) avec les
   secrets `GOOGLE_CLIENT_ID`, `AUTH_SECRET`, `BLOB_READ_WRITE_TOKEN` et la var
   `ADMIN_EMAILS` (`wrangler secret put`). Attacher le custom domain `latexci.com`.
4. Règles de redirection Cloudflare (Redirect Rules, gratuites) pour remplacer
   `vercel.json` : `www.latexci.com/*` -> 301 `https://latexci.com/$1` ; idem zone
   `latexci.org` (apex et www) si elle est migrée aussi, sinon la laisser pointer
   vers Vercel tant que le projet y vit, puis la migrer de la même façon.
5. Chez OVH, remplacer les nameservers par ceux fournis par Cloudflare. Propagation
   24 à 48 h ; Vercel continue de servir pendant ce temps (ne rien supprimer côté
   Vercel avant J+3).
6. Tests post-bascule : URLs identiques, 308 des symboles, sitemap, mail entrant et
   sortant OVH, fetch GSC (la vérification TXT est conservée, rien à refaire côté
   Search Console).
7. Ensuite seulement : downgrade du compte Vercel en Hobby (avant le 21/11).

SEO : aucune URL ne change, les redirections sont conservées, HSTS préchargé déjà
actif, certificat via Cloudflare Universal SSL. Le changement d'hébergeur est neutre
pour GSC.

## Reste à faire manuel

- Pousser la branche `cloudflare-staging` et ouvrir la PR quand voulu. Attention :
  le push déclenchera un build de préversion chez Vercel (inoffensif mais consomme
  du quota) ; c'est volontairement resté local.
- Si on veut tester le sign-in Google sur le staging : poser `GOOGLE_CLIENT_ID` et
  `AUTH_SECRET` sur le Worker et ajouter l'origin workers.dev dans la console Google
  OAuth. Laissé éteint exprès (l'export PDF reste ainsi testable sans compte).
- À la bascule : remplacer `@vercel/analytics` par Cloudflare Web Analytics, et
  décider du remplacement de `@vercel/blob` (R2) ou le garder avec son token.
- Monter Next >=16.4.1 puis @opennextjs/cloudflare en dernière version (PR séparée).
