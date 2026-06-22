# signal·ia — veille IA et robotique en français

Site de news + tutos IA avec base SQLite, admin complet type WordPress,
et pipeline de publication temps quasi réel.

## Fonctionnalités

- **Site public** : home magazine néo-brutaliste (à la une, bandeau breaking, fil des
  dernières 24 h, plus lus), pages articles enrichies (TL;DR « l'essentiel en 3 points »,
  temps de lecture, barre de progression, partage, articles liés), section **Tutos**,
  **glossaire IA**, récap **Cette semaine**, **recherche**, page sources, newsletter
- **Admin** (`/admin`) type WordPress :
  - tableau de bord : stats (articles, vues, tutos, abonnés), statut du pipeline
  - éditeur visuel (TipTap), type actu/tuto, TL;DR, brouillons, **publication planifiée**, aperçu
  - gestion des sources RSS (ajout, activation, santé des flux)
  - réglages du site : identité, seuils du pipeline, réseaux sociaux, maintenance,
    emplacements pub (désactivés par défaut)
  - journal du pipeline (chaque passage : items vus, retenus, articles créés)
- **Pipeline temps quasi réel** : toutes les 30 min — scraping RSS (11 sources) →
  scoring LLM 0-10 de chaque news → breaking (≥ 8) publié immédiatement avec badge
  « À chaud » → file d'attente pour le reste → déduplication multi-sources → rédaction
  française (Mistral) avec TL;DR
- **Base de données** : SQLite (`database.sqlite`, créée et migrée automatiquement) —
  zéro service externe
- **SEO** : sitemap, robots.txt, flux RSS sortant, Open Graph, JSON-LD (NewsArticle,
  TechArticle, DefinedTermSet)
- **Sécurité** : sessions JWT httpOnly, rate limiting, sanitize-html, headers CSP/HSTS
- **Conformité** : RGPD sans cookie visiteur (compteur de vues anonyme, pas de tracker)

## Démarrage

```bash
npm install
cp .env.example .env.local   # remplir les variables
npm run dev                  # site sur http://localhost:3000, admin sur /admin
```

| Variable | Rôle |
|---|---|
| `AUTH_SECRET` | Signature des sessions admin (32+ caractères aléatoires) |
| `ADMIN_PASSWORD` | Mot de passe de `/admin` |
| `NEXT_PUBLIC_SITE_URL` | URL publique (SEO, sitemap, RSS, partage) |
| `MISTRAL_API_KEY` | Scoring + rédaction des articles (free tier sur console.mistral.ai) |

## Pipeline

```bash
npm run pipeline   # un passage : scrape → score → rédige → publie
```

Le pipeline tourne **sur la machine qui héberge le site** :

- **Windows (local)** : une tâche planifiée `signal-ia-pipeline` le lance toutes les 30 min
  (logs dans `pipeline.log`). La gérer : `schtasks /Query /TN signal-ia-pipeline`,
  la supprimer : `schtasks /Delete /TN signal-ia-pipeline /F`
- **VPS** : cron — `*/30 * * * * cd /srv/signal-ia && npm run pipeline >> pipeline.log 2>&1`

Les seuils (breaking, file d'attente, articles max/jour) se règlent dans
**/admin/reglages**, les sources RSS aussi. Chaque passage est consultable dans
**/admin/pipeline**.

## Déploiement

Hébergement Node persistant requis (VPS, machine locale) :

```bash
npm run build && npm start
```

Penser à sauvegarder `database.sqlite` et `public/uploads/` (non versionnés).
