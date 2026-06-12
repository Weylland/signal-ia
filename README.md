# signal·ia — site de veille IA et robotique

Site de news IA en français avec base SQLite, admin complet type WordPress,
et pipeline de publication automatisé.

## Fonctionnalités

- **Site public** : home magazine néo-brutaliste (à la une, grille avec images, tags),
  pages articles, pages par tag, à propos, animations
- **Admin** (`/admin`) type WordPress :
  - tableau de bord avec statistiques (articles, publiés, brouillons, tags)
  - liste des articles avec recherche et filtre par statut
  - éditeur visuel (TipTap) : gras, titres, listes, citations, liens — pas de Markdown à écrire
  - brouillons / publication en un clic
  - upload d'images (JPEG, PNG, WebP, AVIF — 5 Mo max) ou URL externe
  - gestion des tags : renommer (fusion automatique), supprimer
- **Base de données** : SQLite (`database.sqlite` à la racine, créée automatiquement) —
  zéro service externe. Couche d'accès isolée dans `src/lib/articles.ts` (migration facile
  vers Postgres si besoin un jour)
- **Pipeline** : scraping RSS → triage + rédaction LLM (Mistral) → insertion en base
- **SEO** : sitemap, robots.txt, flux RSS sortant, Open Graph, JSON-LD NewsArticle
- **Sécurité** : sessions JWT httpOnly, rate limiting login, sanitisation HTML
  (sanitize-html) sur tout contenu admin, headers CSP/HSTS, uploads validés
- **Conformité** : mentions légales, politique de confidentialité (RGPD, aucun cookie visiteur)

## Démarrage

```bash
npm install
cp .env.example .env.local   # remplir AUTH_SECRET et ADMIN_PASSWORD
npx tsx pipeline/migrate-md-to-db.ts   # une seule fois : importe content/articles/ en base
npm run dev                  # site sur http://localhost:3000, admin sur /admin
```

| Variable | Rôle |
|---|---|
| `AUTH_SECRET` | Signature des sessions admin (32+ caractères aléatoires) |
| `ADMIN_PASSWORD` | Mot de passe de `/admin` |
| `NEXT_PUBLIC_SITE_URL` | URL publique (SEO, sitemap, RSS) |
| `MISTRAL_API_KEY` | Génération d'articles (free tier sur console.mistral.ai) |

## Pipeline quotidien

```bash
npm run pipeline   # scrape + génère + publie en base
```

La base étant locale, le pipeline doit tourner **sur la machine qui héberge le site** :
- en local : Planificateur de tâches Windows (`npm run pipeline` chaque matin)
- sur VPS : cron — `0 7 * * * cd /srv/signal-ia && npm run pipeline`

(L'ancien workflow GitHub Actions a été retiré : il committait des fichiers Markdown,
modèle abandonné au profit de la base SQLite.)

## Déploiement

Hébergement Node persistant requis (VPS, machine locale) :

```bash
npm run build && npm start
```

Penser à sauvegarder `database.sqlite` et `public/uploads/` (non versionnés).
Le dossier `content/articles/` est l'archive des anciens articles Markdown,
déjà importés en base — il ne sert plus au site.
