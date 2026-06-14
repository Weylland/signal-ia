# Handoff : signal·ia — Site public + Back-office admin

## Vue d'ensemble

signal·ia est un média de veille IA français. Ce package est le handoff de design complet pour **l'implémentation en Next.js (App Router) + Tailwind CSS v4**.

## À propos des fichiers

Les fichiers `.html`, `.jsx` et `.css` de ce dossier sont des **maquettes de référence créées en HTML/React prototypage** — ils montrent l'aspect visuel et le comportement voulus, mais **ne sont pas du code production à copier directement**. La tâche est de **recréer ces designs dans le projet Next.js** avec App Router, Tailwind CSS v4, et les conventions du codebase existant.

## Fidélité

**Haute-fidélité (hifi)** — Les maquettes sont pixel-perfect avec couleurs finales, typographies, espacements et interactions. Recréez l'UI avec précision en utilisant les patterns et bibliothèques du projet.

---

## Stack cible

- **Framework** : Next.js (App Router)
- **Styles** : Tailwind CSS v4 (avec `@theme` pour les tokens custom)
- **Thème** : clair + sombre (via `data-theme` sur `<html>`)
- **Fonts** : Space Grotesk + Lora + JetBrains Mono (Google Fonts)
- **Pas de compte utilisateur** côté public — les favoris sont en `localStorage`

---

## Design Tokens (`tokens.css` → à transposer en `@theme` Tailwind v4)

### Typographie
| Variable | Valeur | Usage |
|---|---|---|
| `--ff-h` | `'Space Grotesk', system-ui, sans-serif` | Titres, UI, navigation |
| `--ff-b` | `'Lora', Georgia, serif` | Corps d'article, descriptions |
| `--ff-m` | `'JetBrains Mono', monospace` | Labels, data, métadonnées, code |

### Palette — Thème sombre (défaut)
```css
--bg:     oklch(0.13 0.008 160)   /* fond principal */
--bg-r:   oklch(0.17 0.010 160)   /* fond surélevé (cards) */
--bg-d:   oklch(0.09 0.007 160)   /* fond profond (nav, footer, sidebar) */
--bg-e:   oklch(0.22 0.010 160)   /* fond élevé (modals, cmd palette) */
--ink:    oklch(0.93 0.008 130)   /* texte principal */
--ink-d:  oklch(0.65 0.012 140)   /* texte secondaire */
--ink-f:  oklch(0.42 0.012 140)   /* texte tertiaire / placeholders */
--ln:     oklch(0.27 0.012 150)   /* bordure douce */
--ln-h:   oklch(0.40 0.014 150)   /* bordure forte */
--ac:     oklch(0.91 0.22 127)    /* accent chartreuse (CTA, active, progress) */
--ac-d:   oklch(0.76 0.20 127)    /* accent hover */
--on-ac:  oklch(0.14 0.02 130)    /* texte sur accent */
```

### Palette — Thème clair (`[data-theme="light"]`)
```css
--bg:     oklch(0.97 0.006 110)
--bg-r:   oklch(1.00 0.003 110)
--bg-d:   oklch(0.93 0.009 110)
--bg-e:   oklch(1.00 0.001 110)
--ink:    oklch(0.16 0.012 150)
--ink-d:  oklch(0.40 0.014 150)
--ink-f:  oklch(0.58 0.012 150)
--ln:     oklch(0.88 0.012 130)
--ln-h:   oklch(0.72 0.014 130)
--ac:     oklch(0.50 0.19 130)
--ac-d:   oklch(0.65 0.17 130)
--on-ac:  oklch(0.98 0.01 130)
```

### Couleurs de catégories (même chroma/lightness, hue varie)
```css
--c-llm:  oklch(0.91 0.22 127)   /* chartreuse — LLM / IA générative */
--c-rob:  oklch(0.88 0.15 195)   /* cyan       — Robotique */
--c-tool: oklch(0.82 0.17 290)   /* violet     — Outils / Dev */
--c-res:  oklch(0.88 0.17  62)   /* amber      — Recherche */
--c-biz:  oklch(0.84 0.16  25)   /* coral      — Business */
--c-pol:  oklch(0.84 0.13 240)   /* bleu       — Politique / Régulation */
/* Thème clair : lightness → ~0.44, mêmes chroma et hue */
```

### Statuts
```css
--ok:  oklch(0.78 0.16 150)   /* vert   — succès */
--wn:  oklch(0.85 0.18  58)   /* amber  — avertissement */
--er:  oklch(0.72 0.20  20)   /* rouge  — erreur */
```

### Espacement
```
s1=4px  s2=8px  s3=12px  s4=16px  s5=24px
s6=32px  s7=48px  s8=64px  s9=96px
```

### Ombres (hard offset — signature visuelle)
```css
--sh:  3px 3px 0 var(--ln-h)   /* ombre standard */
--sha: 4px 4px 0 var(--ac)     /* ombre accent (hover cards) */
```

### Règles visuelles clés
- **Border-radius : 0** partout — angles droits, aucune exception
- **Box-shadow hard offset** sur les cards en hover : `transform: translate(-2px,-2px) + box-shadow: 4px 4px 0 var(--ac)`
- **Cibles tactiles** : `min-height: 44px` sur tous les boutons / liens interactifs
- **Grain global** : overlay SVG `fractalNoise` fixe, `opacity: 0.028`, `mix-blend-mode: soft-light`
- **Scanlines** : `repeating-linear-gradient` horizontal à 3.8% d'opacité sur les zones sombres (nav, footer, ticker, sidebar, image placeholders)
- **Dot grid** : `radial-gradient(circle, var(--ln) 1px, transparent 1px)` 24×24px sur les fonds de sections profondes et les placeholders image

---

## Écrans — Site public

### 1. Accueil (`/`)

**Layout** : colonne unique, sections en bandes alternées

**Sections dans l'ordre :**

#### Ticker (bande alerte)
- Height: 34px, fond: `--bg-d`, bordure bas: `1px solid --ac`
- Badge "ALERTE" : `--ac` background, `--on-ac` texte, `font-mono`, 9px uppercase
- Texte défilant en `animation: translateX(-50%)` en 36s, pause au hover
- Scanlines overlay

#### Hero (article à la une)
- 2 colonnes égales, min-height: 460px, responsive → 1 col mobile
- Colonne gauche : placeholder image avec dot grid + "À LA UNE" badge `--ac`
- Colonne droite : padding 48px, flex col, gap 16px
  - TagBadge catégorie
  - `h2` Space Grotesk 700, clamp(22px, 2.2vw, 34px), leading 1.12, tracking -0.025em
  - Résumé Lora 16px, `--ink-d`
  - Méta : temps · min · sources (Mono 11px)
  - Tags

#### Digest "Dernières 24h"
- 2 colonnes : `1fr 300px`, collapse → 1 col à 900px
- Gauche : liste `ArticleRow` (titre, tag catégorie, heure, durée lecture)
  - Hover: `padding-left` de 0 → 12px (transition 150ms)
- Droite (cachée mobile) : 
  - Boutons catégorie avec hover offset shadow coloré
  - Encart stats du jour (4 métriques)

#### Magazine grid (section `--bg-r`)
- CSS Grid 3 cols, gap 20px ; 1er article `grid-column: span 2`
- Responsive : 2 cols à 900px (span 2 → 1), 1 col à 600px
- Cards : fond `--bg-r`, border `1px solid --ln`
  - Image placeholder 150px
  - TagBadge + date (mono 10px)
  - Titre Space Grotesk 600 15px
  - Extrait Lora 13px
  - Durée + vues

#### Tutos (section `--bg-d`)
- Liste verticale, gap 16px
- Chaque tuto : flex row, gap 24px, fond `--bg-r`
  - Carré 56×56px numéro mono 700 `--ac`
  - Diff badge + tags + titre + description Lora 13px
  - Durée + "Lire →" à droite
  - Hover : translate(-2px,-2px) + shadow accent

#### Tags + Plus lus
- 2 cols égales, collapse mobile
- Gauche : tags cloud flex-wrap, gap 8px — chaque tag est cliquable
- Droite : top 5 `ArticleRow` avec rank number `--ac`

#### Newsletter CTA
- fond `--bg-d`, border-top `1px solid --ac`
- Dot grid en background opacity 0.3
- Centré, maxWidth 560px
- `h2` 40px, formulaire email + bouton primaire
- État success : badge vert ✓

---

### 2. Article (`/article/[id]`)

**Layout** : colonne étroite centrée (max-width 720px)

#### Reading progress
- `position: fixed; top: 0; left: 0; height: 3px`
- Background `--ac`, transition width 80ms linear
- Calculé depuis `scrollTop / (scrollHeight - clientHeight) * 100`

#### En-tête
- Breadcrumb ← Actus + TagBadge catégorie + tags
- `h1` clamp(28px, 5vw, 50px), 700, leading 1.08, tracking -0.025em
- Méta : date longue · heure · durée · sources · vues

#### En résumé
- Box avec `border-left: 4px solid --ac`, fond `--bg-r`
- Header "EN RÉSUMÉ" mono 10px uppercase + dot `--ac`
- 3 points : numéro mono `--ac` + texte Space Grotesk 16px

#### Image principale
- Placeholder dot grid, 380px de hauteur

#### Corps (`.prose`)
- Font Lora 18px, leading 1.82
- `h2` Space Grotesk 700 24px, `h3` 20px
- `p` margin-bottom 1.4em, `text-wrap: pretty`
- `blockquote` border-left 3px `--ac`, padding-left 24px, italic
- `code` mono 0.85em, fond `--bg-e`, border `1px solid --ln`

#### Réactions
- 4 boutons emoji avec compteur : 🔥 💡 🤔 ❓
- Hover: border `--ac`, once clicked: fond `--bg-e`, couleur `--ac`
- Bouton Sauvegarder (localStorage `sig-fav`) + Partager

#### Sources
- Fond `--bg-d`, border `1px solid --ln`
- Liste de liens mono 12px, border `1px solid --ac`, hover fond teinté

#### Articles liés
- Magazine grid 3 cols (section `--bg-r`)

---

### 3. Toutes les actus (`/actus`)

- Filtres : input recherche + select catégorie + boutons tags colorés
- Grid magazine 3 cols avec pagination
- Reset filtres si actifs

### 4. Tutos (`/tutos`)

- Filtre niveau : Tous / débutant / intermédiaire / avancé
- Liste d'articles horizontaux : numéro 2-digit mono `--ac` + titre + description + durée

### 5. Glossaire (`/glossaire`)

- Index alphabétique (boutons lettre) + recherche texte
- Grille de termes : 2 cols (terme + définition)
- `term` mono 16px 700 `--ac`, `full` mono 10px `--ink-f`, `def` Lora 15px

### 6. Cette semaine (`/cette-semaine`)

- Stats en en-tête (articles, sources, vues, abonnés)
- Timeline jour par jour, chaque jour en section avec `ArticleRow`

### 7. Tendances (`/tendances`)

- Ranking visuel : numéro + tag catégorie + barre de volume CSS + delta %
- Hover: translate + shadow accent

### 8. Recherche (`/recherche`)

- Grand champ de recherche centré + bouton
- Résultats : liste `ArticleRow`

### 9. Sources (`/sources`)

- Grid 3 cols de cards source
- Indicateur de santé (dot coloré + label)
- Nom source + catégorie tag + dernière synchro + nb articles

### 10. À propos (`/a-propos`)

- Page éditoriale en prose (max-width 720px)
- Sections avec `h2` Space Grotesk

### 11. Contact (`/contact`)

- Formulaire : nom + email + sujet (select) + message
- Grid 2 cols pour nom/email
- État success : icône ✓ + message

### 12. Favoris (`/favoris`)

- Lecture depuis `localStorage.getItem('sig-fav')` (tableau d'IDs)
- État vide : icône ♡ + CTA vers actus
- Liste avec bouton "× Retirer" par article

### 13. 404

- Grand "404" mono 96px `--ln-h`
- CTA vers accueil + actus

---

## Composants partagés

### NavBar
- `position: sticky; top: 0; z-index: 100`
- height: 52px, fond `--bg-d`, border-bottom `1px solid --ln`, `backdrop-filter: blur(8px)`
- Logo : "signal" `--ac` + "·" `--ink-f` + "ia" `--ink`, 19px 700
- Liens desktop : `font-size: 13px`, active = `color: --ac` + `border-bottom: 2px solid --ac`
- Droite : bouton ⌘K (mono, fond `--bg-r`) + icônes recherche/favoris/thème + "admin ↗"
- **Mobile** : hamburger ≡ → overlay plein écran, liens 22px 600, min-height 56px par lien

### Footer
- fond `--bg-d`, border-top `1px solid --ln`
- Grid auto-fit colonnes 180px : brand + contenu + média + newsletter mini-form
- Bas : copyright + RSS/Mastodon/JSON links mono

### CommandPalette (⌘K)
- Overlay fixe, fond `oklch(0 0 0 / 0.65)` + `backdrop-filter: blur(4px)`
- Box : max-width 560px, fond `--bg-e`, border `--ln-h`, shadow `var(--sha)`
- Input de recherche + liste résultats (navigation ↑↓ ↵ ESC)
- Ligne active : border-left 2px `--ac`, fond `--bg-r`

### TagBadge
- `font-mono 10px uppercase letter-spacing .08em`
- `padding: 2px 6px`, `border: 1px solid currentColor`
- Couleur selon catégorie (voir tokens cat)

### ArticleCard (grid)
- fond `--bg-r`, border `1px solid --ln`
- Hover: `transform: translate(-2px,-2px)` + `box-shadow: 4px 4px 0 var(--ac)`

### ArticleRow (liste)
- Flex, border-bottom `1px solid --ln`
- Hover: `padding-left` 0 → 12px (transition 150ms)

---

## Écrans — Back-office Admin (`/admin/*`)

### Layout admin
- Sidebar 240px (fixe/sticky) + main flex-1
- Mobile : sidebar en drawer slide-in depuis la gauche
- Header admin : 52px sticky, breadcrumb mono, bouton "+ Nouvel article", toggle thème

### Sidebar
- fond `--bg-d`, border-right `1px solid --ln`
- Logo + badge "ADMIN"
- 3 sections : Contenu / Audience / Système
- Lien actif : border-left 2px `--ac`, fond `--bg-r`, color `--ink`, weight 600
- Icônes mono 12px `--ac`

### Dashboard (`/admin`)
- 4 MetricCards en grid auto-fit 200px
- Table articles récents + Pipeline RSS health (santé flux)
- **MetricCard** : label mono 10px + valeur 34px 700 + delta `--ok`/`--er`

### Articles (`/admin/articles`)
- Table avec checkbox + tri + filtres
- Colonnes : titre (tronqué) + catégorie + statut + date + vues + actions
- **StatusBadge** : mono 10px uppercase, couleur selon statut (publié/brouillon/planifié)
- Actions inline : Éditer + Épingler
- Actions bulk (sélection multiple) : Archiver + Supprimer

### Éditeur (`/admin/editeur`)
- Layout split 50/50 full-height
- Toolbar sticky : titre input + select statut + bouton Sauvegarder
- Gauche : catégorie, tags, textarea Markdown, accordéons SEO + Sources
- Droite : aperçu live rendu — HTML parsé depuis Markdown (h2, blockquote, bold, italic, code)
- Mode aperçu toggle (masque le formulaire)

### Pipeline (`/admin/pipeline`)
- Cards d'articles avec statuts (queued/review/approved/rejected)
- Actions : Éditer / Approuver / Rejeter
- Border colorée selon statut (ok/warn/err)

### Sources RSS (`/admin/sources`)
- Table : état (dot coloré) + nom + catégorie + dernière synchro + nb articles + actions

### Newsletter (`/admin/newsletter`)
- 4 métriques (abonnés, ouverture, clic, désabos)
- Split : formulaire (objet + textarea Markdown) + aperçu email

### Messages (`/admin/messages`)
- Split : liste inbox + détail message sélectionné
- Non lus : border-left 3px `--ac`, titre en weight 700

### Analytics (`/admin/analytics`)
- 4 métriques
- Bar chart CSS (divs en flex alignItems: flex-end)
- Top articles avec progress bar colorée par catégorie

### Tags (`/admin/tags`)
- Grid auto-fill 240px par tag
- Actions : fusionner ⇄ + supprimer ×

### Réglages (`/admin/reglages`)
- Sections accordéon : Identité / Apparence / Pipeline
- Toggle maintenance (custom avec CSS transform)

### Sauvegarde (`/admin/backup`)
- 3 métriques + table avec type (auto/manuel) + actions

---

## Interactions & Comportements

| Interaction | Implémentation |
|---|---|
| Thème clair/sombre | `data-theme` sur `<html>`, persisté en `localStorage('sig-theme')` |
| Favoris | `localStorage('sig-fav')` = tableau d'IDs article |
| Palette ⌘K | `Cmd/Ctrl+K` global, navigation ↑↓, validation ↵, fermeture ESC |
| Reading progress | `scroll` event → `scrollTop / (scrollHeight - clientHeight) * 100` |
| Réactions article | State local, une réaction par type, compteur incrémenté |
| Newsletter subscribe | Validation email, état success |
| Éditeur aperçu live | `dangerouslySetInnerHTML` sur textarea onChange |
| Card hover | `translate(-2px, -2px)` + `box-shadow: 4px 4px 0 var(--ac)` |
| Row hover | `padding-left` 0 → 12px |

---

## Accessibilité

- Contrastes AA sur toutes les combinaisons texte/fond
- `focus-visible` : `outline: 2px solid var(--ac); outline-offset: 2px`
- `min-height: 44px` sur toutes les cibles tactiles
- Labels sur tous les champs de formulaire
- `aria-label` sur les boutons icônes
- Navigation clavier complète sur la palette ⌘K

---

## Assets

Pas d'images réelles — prévoir un système de **visuels générés** (motifs SVG / gradients) pour les articles sans image. Les maquettes utilisent des placeholders dot-grid + label.

**Fonts Google** (à charger en `next/font` ou `@import`) :
```
Space Grotesk: 300, 400, 500, 600, 700
Lora: 400, 500, 600 (normal + italic)
JetBrains Mono: 400, 500, 600
```

---

## Fichiers de référence

| Fichier | Contenu |
|---|---|
| `signal-ia.html` | Point d'entrée — ouvrir dans un navigateur pour voir la maquette interactive |
| `tokens.css` | Tous les tokens CSS (palette, typo, espacement, composants, animations) |
| `shared.jsx` | Données mock, Nav, Footer, ⌘K, cards articles, Ticker |
| `admin-shared.jsx` | AdminLayout, sidebar, MetricCard, StatusBadge |
| `page-home.jsx` | Page d'accueil |
| `page-article.jsx` | Page article |
| `pages-public.jsx` | 11 pages publiques (actus, tutos, glossaire…) |
| `admin-pages.jsx` | 11 pages admin (dashboard, éditeur, pipeline…) |
| `app.jsx` | Routeur React (ref pour la structure des routes) |

> **⚠️ Note** : Les fichiers `.jsx` utilisent Babel standalone pour le prototypage — ne pas utiliser en production. Transposer la logique et les styles dans Next.js / Tailwind.
