import { readFileSync } from "node:fs";
import path from "node:path";
import Parser from "rss-parser";
import { marked } from "marked";

// tsx ne charge pas .env.local automatiquement (contrairement à next)
try {
  const envFile = readFileSync(path.join(process.cwd(), ".env.local"), "utf-8");
  for (const line of envFile.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !(match[1] in process.env)) {
      process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  }
} catch {
  // pas de .env.local : les variables viennent de l'environnement
}
import { fetchOgImage } from "./og";
import { createArticle, getAllArticles, setArticleTranslation } from "../src/lib/articles";
import { getSettings } from "../src/lib/settings";
import { getSources, recordFetchResult } from "../src/lib/sources";
import { getDb } from "../src/lib/db";
import { callLLM } from "../src/lib/llm";

const MAX_ITEMS_PER_SOURCE = 10;

type PendingRow = {
  id: number;
  url: string;
  title: string;
  source_name: string;
  summary: string;
  published_at: string | null;
  score: number | null;
};

type ScoredItem = { url: string; score: number };

type StoryGroup = {
  title: string;
  links: string[];
  angle: string;
  tags: string[];
  breaking: boolean;
};

type WrittenArticle = {
  markdown: string;
  tldr: string[];
};

const logLines: string[] = [];
function log(line: string): void {
  console.log(line);
  logLines.push(line);
}

export async function runPipeline(): Promise<void> {
  await main();
}

async function fetchFeeds(): Promise<number> {
  const db = getDb();
  const parser = new Parser({ timeout: 15_000 });
  const sources = getSources({ activeOnly: true });
  const insert = db.prepare(
    `INSERT OR IGNORE INTO pending_news (url, title, source_name, summary, published_at)
     VALUES (?, ?, ?, ?, ?)`
  );

  let totalNew = 0;
  for (const source of sources) {
    try {
      const feed = await parser.parseURL(source.url);
      let added = 0;
      for (const item of (feed.items ?? []).slice(0, MAX_ITEMS_PER_SOURCE)) {
        if (!item.link || !item.title) continue;
        const result = insert.run(
          item.link,
          item.title.trim(),
          source.name,
          (item.contentSnippet ?? "").trim().slice(0, 500),
          item.isoDate ?? item.pubDate ?? null
        );
        added += Number(result.changes);
      }
      totalNew += added;
      recordFetchResult(source.id, true);
      log(`✓ ${source.name} : ${added} nouveaux items`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      recordFetchResult(source.id, false, message);
      log(`✗ ${source.name} : ${message}`);
    }
  }
  return totalNew;
}

async function scoreNewItems(items: PendingRow[]): Promise<ScoredItem[]> {
  const list = items
    .map((item) => `- url: ${item.url}\n  [${item.source_name}] ${item.title}\n  ${item.summary}`)
    .join("\n");

  const content = await callLLM(
    [
      {
        role: "system",
        content: `Tu es le rédacteur en chef d'un site de veille IA francophone destiné aux gens qui utilisent l'IA au quotidien (devs, indépendants, curieux).
Tu notes chaque news de 0 à 10 selon son importance pour ce public :
- 9-10 : événement majeur (nouveau modèle frontier, percée recherche, décision réglementaire majeure, faille de sécurité critique)
- 7-8 : annonce importante (nouveau produit/outil IA notable, levée de fonds significative, robotique IA marquante)
- 5-6 : intéressant mais pas urgent (mise à jour d'outil, étude, tendance)
- 0-4 : à ignorer (marketing, rumeur, sans lien direct avec l'IA, anecdotique)

Réponds en JSON strict : {"scores": [{"url": "...", "score": 7}]}`,
      },
      { role: "user", content: `News à noter :\n\n${list}` },
    ],
    true
  );

  const parsed = JSON.parse(content) as { scores: ScoredItem[] };
  return parsed.scores ?? [];
}

async function groupStories(items: PendingRow[], breakingThreshold: number): Promise<StoryGroup[]> {
  const list = items
    .map(
      (item) =>
        `- url: ${item.url} (score ${item.score})\n  [${item.source_name}] ${item.title}\n  ${item.summary}`
    )
    .join("\n");

  const content = await callLLM(
    [
      {
        role: "system",
        content: `Tu es rédacteur en chef d'un média de veille IA francophone. Tu regroupes des news par sujet : si plusieurs items couvrent la même actualité, ils forment UN seul groupe (un seul article sera écrit, citant toutes les sources).

TITRE (le plus important) :
- Factuel avant tout : il doit être 100 % vérifiable depuis les sources fournies. N'invente aucun chiffre, superlatif ni conséquence.
- Informatif, pas putaclic : il dit CE QUI s'est passé, pas "vous n'allez pas croire…". Pas de question rhétorique, pas de "voici pourquoi".
- Concis : 60 à 100 caractères idéalement. Une seule idée principale.
- Si tu hésites sur un fait, ne le mets pas dans le titre.

CHIFFRES : ne formule JAMAIS "passe de X à Y" sauf si la source indique explicitement une évolution entre deux versions. Si les valeurs sont des variantes d'un même produit (tiny/small/medium…), présente-les comme une gamme ("de X à Y selon la variante"), jamais comme une progression.

NOMS PROPRES : ne traduis ni n'altère jamais les noms propres (médias, entreprises, produits, personnes). « The Verge » reste « The Verge », jamais « le Verge ».

ANGLE : une phrase qui résume l'intérêt concret pour le lecteur (dev, indépendant, curieux IA).

TAGS : 2-3, en minuscules, spécifiques (entreprise, produit, ou thème précis). Évite les tags vagues comme "ia" ou "tech".

Un groupe est "breaking" si au moins un de ses items a un score >= ${breakingThreshold}.

Réponds en JSON strict : {"groups": [{"title": "...", "links": ["url1", "url2"], "angle": "...", "tags": ["..."], "breaking": false}]}`,
      },
      { role: "user", content: `News retenues :\n\n${list}` },
    ],
    true
  );

  const parsed = JSON.parse(content) as { groups: StoryGroup[] };
  return parsed.groups ?? [];
}

/**
 * Filtre les groupes candidats contre les articles récemment publiés.
 * Un même sujet déjà couvert n'est republié QUE s'il apporte une info nouvelle (mise à jour).
 * En cas d'échec LLM, on retombe sur un dédoublonnage par titre exact (comportement minimal sûr).
 */
async function filterAlreadyCovered(
  groups: StoryGroup[],
  recent: { title: string; excerpt: string; date: string }[]
): Promise<StoryGroup[]> {
  if (groups.length === 0 || recent.length === 0) return groups;

  try {
    const recentList = recent
      .map((a, i) => `${i + 1}. [${a.date.slice(0, 10)}] ${a.title} — ${a.excerpt}`)
      .join("\n");
    const candidateList = groups
      .map((g, i) => `[${i}] ${g.title} — ${g.angle}`)
      .join("\n");

    const content = await callLLM(
      [
        {
          role: "system",
          content: `Tu filtres des news IA candidates à la publication pour éviter les doublons.
On te donne des articles DÉJÀ publiés récemment, puis des candidats.
Pour chaque candidat, attribue un verdict :
- "new" : sujet pas encore couvert par les articles publiés.
- "update" : MÊME sujet qu'un article publié, MAIS apporte une info nouvelle substantielle (nouveaux chiffres, suite des événements, démenti, sortie effective d'un produit annoncé...). À garder.
- "duplicate" : même sujet sans aucune information nouvelle. À écarter.
Sois strict : en cas de doute entre "duplicate" et "update", choisis "duplicate".
Réponds en JSON strict : {"results":[{"index":0,"verdict":"new|update|duplicate"}]}`,
        },
        {
          role: "user",
          content: `Articles déjà publiés (récents) :\n${recentList}\n\nCandidats :\n${candidateList}`,
        },
      ],
      true
    );

    const parsed = JSON.parse(content) as { results: { index: number; verdict: string }[] };
    const keep = new Set(
      (parsed.results ?? [])
        .filter((r) => r.verdict !== "duplicate")
        .map((r) => r.index)
    );
    // Tout index non renvoyé par le modèle est conservé par sécurité.
    const seen = new Set((parsed.results ?? []).map((r) => r.index));
    return groups.filter((_, i) => keep.has(i) || !seen.has(i));
  } catch (error) {
    log(`⚠ dédup sujet indisponible (${error instanceof Error ? error.message : error}), repli sur titre exact`);
    const recentTitles = new Set(recent.map((a) => a.title.toLowerCase()));
    return groups.filter((g) => !recentTitles.has(g.title.toLowerCase()));
  }
}

async function writeArticle(group: StoryGroup, items: PendingRow[]): Promise<WrittenArticle> {
  const sources = items.filter((item) => group.links.includes(item.url));
  const context = sources
    .map((s) => `[${s.source_name}] ${s.title}\n${s.summary}\n${s.url}`)
    .join("\n\n");

  const content = await callLLM(
    [
      {
        role: "system",
        content: `Tu es journaliste pour un média de veille IA francophone destiné aux devs, indépendants et curieux. Tu rédiges un article de 250-400 mots, ton factuel et direct, sans emphase marketing ni remplissage.

RÈGLE ABSOLUE — ZÉRO INVENTION : tu te bases UNIQUEMENT sur les informations fournies. N'invente aucun chiffre, citation, date, nom ou conséquence. Si une information manque, ne la comble pas : fais plus court. Mieux vaut un article bref et exact qu'un article étoffé et approximatif.

STRUCTURE :
- Première phrase (chapeau) : énonce le fait central — qui, quoi, et pourquoi ça compte. Pas d'introduction qui tourne autour.
- 2-3 paragraphes courts qui développent les faits, le contexte, les implications concrètes.
- Pas de titre (fourni à part). Pas de conclusion creuse du type "l'avenir nous le dira".

MISE EN FORME : Markdown sobre — paragraphes séparés par une ligne vide, gras (**...**) seulement pour un terme clé occasionnel. Pas de titre #, pas de listes sauf si vraiment justifié.

CHIFFRES ET TENDANCES : n'emploie jamais "réduit", "augmente", "hausse", "baisse", "améliore" pour qualifier un écart entre deux valeurs si la source ne l'indique pas explicitement. Des variantes d'un même produit (tiny/small/medium…) sont une gamme d'options, pas une évolution avant/après.

NOMS PROPRES : ne traduis ni n'altère jamais les noms propres (médias, entreprises, produits, personnes). « The Verge », « The New York Times », « OpenAI » exactement — jamais « le Verge » ni « le New York Times ».

Réponds en JSON strict :
{"markdown": "le corps de l'article en Markdown", "tldr": ["point clé 1", "point clé 2", "point clé 3"]}
Le tldr : 3 phrases courtes, autonomes (lisibles hors contexte), sans se répéter entre elles, chacune portant un fait distinct.`,
      },
      {
        role: "user",
        content: `Titre de l'article : ${group.title}\nAngle : ${group.angle}\n\nSources :\n${context}`,
      },
    ],
    true,
    true
  );

  const parsed = JSON.parse(content) as WrittenArticle;
  return {
    markdown: parsed.markdown ?? "",
    tldr: Array.isArray(parsed.tldr) ? parsed.tldr.slice(0, 3) : [],
  };
}

async function translateArticle(
  title: string,
  excerpt: string,
  markdown: string,
  tldr: string[]
): Promise<{ title: string; excerpt: string; markdown: string; tldr: string[] } | null> {
  try {
    const content = await callLLM(
      [
        {
          role: "system",
          content: `Tu traduis un article de presse du français vers l'anglais. Traduction naturelle et journalistique, idiomatique, pas mot à mot. Conserve exactement la mise en forme Markdown (paragraphes, gras, liens).
Ne traduis jamais les noms propres (entreprises, produits, médias, personnes) — garde-les à l'identique.
Conserve tous les chiffres, unités et nombres exactement tels quels (34,5M reste 34.5M en notation anglaise, les paramètres restent des paramètres). N'ajoute, ne retire et ne reformule aucun fait : tu traduis, tu n'édites pas.
Réponds en JSON strict : {"title": "...", "excerpt": "...", "markdown": "...", "tldr": ["...", "..."]}`,
        },
        {
          role: "user",
          content: `Titre : ${title}\nChapeau : ${excerpt}\nTL;DR : ${JSON.stringify(tldr)}\n\nArticle :\n${markdown}`,
        },
      ],
      true,
      true
    );
    const parsed = JSON.parse(content);
    if (!parsed.title || !parsed.markdown) return null;
    return {
      title: parsed.title,
      excerpt: parsed.excerpt ?? "",
      markdown: parsed.markdown,
      tldr: Array.isArray(parsed.tldr) ? parsed.tldr.slice(0, 3) : [],
    };
  } catch (error) {
    log(`✗ traduction EN échouée : ${error instanceof Error ? error.message : error}`);
    return null;
  }
}

function countArticlesToday(): number {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const row = db
    .prepare("SELECT COUNT(*) AS c FROM articles WHERE type = 'news' AND date LIKE ?")
    .get(`${today}%`) as { c: number };
  return row.c;
}

async function main() {
  logLines.length = 0;
  const db = getDb();
  const settings = getSettings();
  const runResult = db.prepare("INSERT INTO pipeline_runs DEFAULT VALUES").run();
  const runId = Number(runResult.lastInsertRowid);

  let itemsNew = 0;
  let articlesCreated = 0;
  let status = "ok";

  try {
    log(`— Pipeline ${new Date().toISOString()} —`);
    itemsNew = await fetchFeeds();
    log(`${itemsNew} nouveaux items au total`);

    const newItems = db
      .prepare("SELECT * FROM pending_news WHERE status = 'new' ORDER BY seen_at DESC LIMIT 60")
      .all() as PendingRow[];

    if (newItems.length > 0) {
      // Blacklist filtering
      const blacklistWords = (settings.blacklistKeywords || "")
        .split("\n").map((s) => s.trim().toLowerCase()).filter(Boolean);
      const blacklistDomains = (settings.blacklistDomains || "")
        .split("\n").map((s) => s.trim().toLowerCase()).filter(Boolean);

      const filtered = newItems.filter((item) => {
        const text = `${item.title} ${item.summary}`.toLowerCase();
        if (blacklistWords.some((w) => text.includes(w))) return false;
        try {
          const domain = new URL(item.url).hostname.toLowerCase();
          if (blacklistDomains.some((d) => domain.includes(d))) return false;
        } catch {}
        return true;
      });

      const blacklisted = newItems.length - filtered.length;
      if (blacklisted > 0) {
        db.prepare("UPDATE pending_news SET status = 'rejected' WHERE status = 'new' AND url IN (" +
          newItems.filter((i) => !filtered.includes(i)).map(() => "?").join(",") + ")"
        ).run(...newItems.filter((i) => !filtered.includes(i)).map((i) => i.url));
        log(`${blacklisted} items filtrés par blacklist`);
      }

      if (filtered.length > 0) {
        log(`Scoring de ${filtered.length} items...`);
        const scores = await scoreNewItems(filtered);
        const setScore = db.prepare("UPDATE pending_news SET score = ?, status = ? WHERE url = ?");
        for (const item of filtered) {
          const score = scores.find((s) => s.url === item.url)?.score ?? 0;
          const newStatus = score >= settings.queueThreshold ? "queued" : "rejected";
          setScore.run(score, newStatus, item.url);
          item.score = score;
        }
        const queued = filtered.filter((i) => (i.score ?? 0) >= settings.queueThreshold).length;
        log(`${queued} items retenus, ${filtered.length - queued} rejetés`);
      }
    }

    const queuedItems = db
      .prepare(
        "SELECT * FROM pending_news WHERE status = 'queued' ORDER BY score DESC, seen_at DESC LIMIT 30"
      )
      .all() as PendingRow[];

    if (queuedItems.length > 0) {
      const rawGroups = await groupStories(queuedItems, settings.breakingThreshold);

      // Dédoublonnage par sujet : on écarte les groupes déjà couverts (sauf vraie mise à jour).
      const existing = await getAllArticles({ includeDrafts: true });
      const recentCutoff = new Date(Date.now() - 14 * 24 * 3600_000).toISOString();
      const recent = existing
        .filter((a) => a.date >= recentCutoff)
        .map((a) => ({ title: a.title, excerpt: a.excerpt, date: a.date }));
      const groups = await filterAlreadyCovered(rawGroups, recent);
      if (groups.length < rawGroups.length) {
        log(`— ${rawGroups.length - groups.length} sujet(s) déjà couvert(s), écarté(s)`);
      }

      const breakingGroups = groups.filter((g) => g.breaking);
      const normalGroups = groups.filter((g) => !g.breaking);

      const publishedToday = countArticlesToday();
      const dailyBudget = Math.max(0, settings.maxArticlesPerDay - publishedToday);
      const toWrite = [
        ...breakingGroups,
        ...normalGroups.slice(0, Math.max(0, settings.maxArticlesPerRun - breakingGroups.length)),
      ].slice(0, dailyBudget === 0 && breakingGroups.length > 0 ? breakingGroups.length : dailyBudget);

      const markDone = db.prepare(
        "UPDATE pending_news SET status = 'published', article_slug = ? WHERE url = ?"
      );

      for (const group of toWrite) {
        if (existing.some((a) => a.title.toLowerCase() === group.title.toLowerCase())) {
          log(`— déjà couvert (titre identique) : ${group.title}`);
          continue;
        }

        log(`${group.breaking ? "🔴 BREAKING" : "Rédaction"} : ${group.title}`);
        const written = await writeArticle(group, queuedItems);
        if (!written.markdown) {
          log(`✗ rédaction vide, abandon : ${group.title}`);
          continue;
        }

        const groupItems = queuedItems.filter((i) => group.links.includes(i.url));
        const image = groupItems.length > 0 ? await fetchOgImage(groupItems[0].url) : null;
        const maxScore = Math.max(...groupItems.map((i) => i.score ?? 0), 0);

        // Date = date de publication RSS la plus récente du groupe (jamais dans le futur)
        const now = new Date().toISOString();
        const rssDates = groupItems.map((i) => i.published_at).filter(Boolean) as string[];
        const articleDate = rssDates.length > 0
          ? rssDates.sort().reverse().find((d) => d <= now) ?? now
          : now;
        const breakingUntil = group.breaking
          ? new Date(Date.now() + settings.breakingDurationHours * 3600_000).toISOString()
          : null;

        const shouldPublish = !settings.requireApproval || group.breaking;

        const slug = await createArticle({
          title: group.title,
          excerpt: group.angle,
          tags: group.tags,
          image,
          html: await marked.parse(written.markdown.trim()),
          published: shouldPublish,
          sources: groupItems.map((s) => ({ name: s.source_name, url: s.url })),
          type: "news",
          tldr: written.tldr,
          breakingUntil,
          score: maxScore,
          date: articleDate,
        });

        const en = await translateArticle(group.title, group.angle, written.markdown, written.tldr);
        if (en) {
          setArticleTranslation(slug, {
            title: en.title,
            excerpt: en.excerpt,
            html: await marked.parse(en.markdown.trim()),
            tldr: en.tldr,
          });
        }

        for (const item of groupItems) markDone.run(slug, item.url);
        articlesCreated++;
        log(`✓ publié : ${slug}${en ? " (+ EN)" : ""}`);
      }
    } else {
      log("Rien en file d'attente.");
    }

    db.prepare("DELETE FROM pending_news WHERE seen_at < datetime('now', '-14 days')").run();
  } catch (error) {
    status = "error";
    log(`ERREUR : ${error instanceof Error ? error.message : error}`);
  } finally {
    db.prepare(
      `UPDATE pipeline_runs SET finished_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
       status = ?, items_new = ?, articles_created = ?, log = ? WHERE id = ?`
    ).run(status, itemsNew, articlesCreated, logLines.join("\n"), runId);
    log(`— Terminé : ${articlesCreated} article(s) créé(s) —`);
    if (status === "error") throw new Error("Pipeline terminé avec des erreurs");
  }
}

const isDirectRun =
  process.argv[1]?.includes("pipeline/run") || process.argv[1]?.includes("pipeline\\run");
if (isDirectRun) {
  main().catch(() => process.exit(1));
}
