# signal·ia — site de veille IA et robotique

Site de news IA en français, alimenté chaque jour par un pipeline automatisé,
avec interface d'administration complète.

## Fonctionnalités

- **Site public** : home magazine (à la une + grille avec images), pages articles,
  pages par tag, à propos, design chaleureux animé (Fraunces + Motion)
- **Admin** (`/admin`) : connexion par mot de passe, création / édition / suppression
  d'articles (Markdown, image, tags), aperçu image
- **Pipeline quotidien** : scraping RSS → triage + rédaction par LLM (Mistral) → publication
- **SEO** : sitemap, robots.txt, flux RSS sortant (`/flux.xml`), Open Graph, JSON-LD NewsArticle
- **Conformité** : mentions légales, politique de confidentialité (RGPD — aucun cookie visiteur,
  pas de bannière nécessaire)
- **Sécurité** : headers HTTP (CSP, HSTS, X-Frame-Options...), sessions JWT httpOnly/sameSite strict,
  rate limiting sur le login, comparaison de mot de passe à temps constant

## Architecture

```
Sources RSS (TechCrunch AI, Hugging Face Blog, ...)
        │
        ▼
[1. Scraper]  pipeline/scrape.ts           → data/raw/YYYY-MM-DD.json
        │
        ▼
[2. Agent rédacteur]  pipeline/generate.ts → content/articles/*.md (+ image og:image)
        │
        ▼
[3. Site Next.js]  src/app/                SSG + admin dynamique
        │
        ▼
[4. Automatisation]  .github/workflows/daily.yml (cron 07:00 UTC)
```

### Structure

```
pipeline/            Scripts standalone (scrape, generate, og, backfill-images)
content/articles/    Articles Markdown (source du site, committés)
data/raw/            Données brutes scraper (gitignored)
src/app/             Pages publiques + admin + API
src/lib/articles.ts  Lecture/écriture des articles
src/lib/auth.ts      Sessions JWT (jose)
src/proxy.ts         Protection /admin et /api/admin
```

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis remplir AUTH_SECRET, ADMIN_PASSWORD
npm run dev
```

Variables d'environnement (`.env.local`, voir `.env.example`) :

| Variable | Rôle |
|---|---|
| `AUTH_SECRET` | Signature des sessions admin (32+ caractères aléatoires) |
| `ADMIN_PASSWORD` | Mot de passe de `/admin` |
| `NEXT_PUBLIC_SITE_URL` | URL publique (SEO, sitemap, RSS) |
| `MISTRAL_API_KEY` | Génération d'articles (free tier sur console.mistral.ai) |

## Pipeline

```bash
npm run scrape                 # news du jour → data/raw/
npx tsx pipeline/generate.ts   # triage + rédaction → content/articles/
```

Le workflow GitHub Actions `daily.yml` enchaîne les deux chaque matin et committe
les nouveaux articles (secret `MISTRAL_API_KEY` requis côté GitHub).

## Déploiement

- **Vercel** (recommandé pour le site) : importer le repo, définir les variables
  d'environnement. Note : l'admin écrit sur le filesystem — sur Vercel les
  modifications admin ne persistent pas entre déploiements ; l'admin est fait pour
  un hébergement Node persistant (VPS, Synology...) ou un usage local, le contenu
  étant versionné par git.
- **VPS / Synology** : `npm run build && npm start` — admin pleinement fonctionnel.
