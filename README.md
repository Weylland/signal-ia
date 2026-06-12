# signal·ia — site de veille IA automatisé

Site de news IA en français, alimenté chaque jour par un pipeline automatisé :
scraping de sources d'actualité IA → sélection + rédaction par un agent LLM → publication.

Projet d'entraînement aux agents IA.

## Architecture

```
Sources RSS (TechCrunch AI, Hugging Face Blog, ...)
        │
        ▼
[1. Scraper]  pipeline/scrape.ts           → data/raw/YYYY-MM-DD.json
        │
        ▼
[2. Agent rédacteur]  pipeline/generate.ts → content/articles/*.md
        │   triage LLM (sélection des 3 news majeures) puis rédaction FR
        ▼
[3. Site Next.js]  src/app/                lit content/articles en SSG
        │
        ▼
[4. Automatisation]  .github/workflows/daily.yml
        cron quotidien 07:00 UTC : scrape → generate → commit → redéploiement
```

### Choix techniques

| Brique | Choix | Pourquoi |
|---|---|---|
| Framework | Next.js 16 (App Router, TypeScript, Tailwind 4) | SSG idéal pour du contenu, zéro serveur |
| Pipeline | Scripts Node standalone (`tsx`), hors Next.js | Testables en local, découplés du site |
| Sources | Flux RSS | Gratuit, stable, pas de scraping HTML fragile |
| LLM | Mistral API (`mistral-small-latest`) | Free tier, appel direct via fetch (pas de SDK) |
| Stockage | Fichiers (JSON brut + Markdown) dans le repo | Zéro coût, versionné par git, pas d'infra |
| Automatisation | GitHub Actions cron | Gratuit sur repo public, commit les articles |
| Hébergement cible | Vercel free tier | Redéploiement auto à chaque commit d'articles |

### Structure du repo

```
pipeline/          Pipeline de publication (scripts standalone)
  sources.ts       Liste des flux RSS scrapés
  scrape.ts        Récupère les news → data/raw/YYYY-MM-DD.json (idempotent, dédup par URL)
  generate.ts      Agent LLM : triage des items puis rédaction FR → content/articles/
data/raw/          Sorties brutes du scraper (gitignored, éphémère)
content/articles/  Articles Markdown publiés (committés, source du site)
src/app/           Site Next.js (App Router) — home + /articles/[slug]
src/lib/           Lecture des articles (gray-matter + marked)
.github/workflows/ daily.yml — cron quotidien
```

## Utilisation

```bash
npm install
npm run scrape                 # récupère les news du jour dans data/raw/
npx tsx pipeline/generate.ts   # triage + rédaction (nécessite MISTRAL_API_KEY)
npm run dev                    # lance le site
```

## Activer l'automatisation complète

1. **Clé Mistral** (free tier, gratuit) : créer une clé sur https://console.mistral.ai
2. Sur GitHub : Settings → Secrets and variables → Actions → ajouter `MISTRAL_API_KEY`
3. Le workflow `daily.yml` tourne chaque jour à 07:00 UTC (déclenchable manuellement via l'onglet Actions)
4. **Déploiement** : importer le repo sur https://vercel.com (free tier) — chaque commit d'articles redéploie le site

## Roadmap

1. ✅ Scraper RSS (2 sources, sortie JSON locale)
2. ✅ Agent rédacteur (triage + rédaction Mistral) — les 6 premiers articles ont été rédigés manuellement pour amorcer la v1
3. ✅ Frontend (home + pages articles, SSG, design sombre)
4. ✅ Workflow GitHub Actions quotidien (en attente du secret `MISTRAL_API_KEY`)
5. ⬜ Améliorations : plus de sources, pages par tag, sitemap + schema.org, flux RSS sortant, OG images
