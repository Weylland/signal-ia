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

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
const MODEL = "mistral-small-latest";
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

async function callMistral(
  messages: { role: string; content: string }[],
  json = false
): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error(
      "MISTRAL_API_KEY manquante. Crée une clé gratuite sur https://console.mistral.ai"
    );
  }

  const res = await fetch(MISTRAL_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.4,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(`Mistral API ${res.status} : ${await res.text()}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
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

  const content = await callMistral(
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

  const content = await callMistral(
    [
      {
        role: "system",
        content: `Tu regroupes des news IA par sujet : si plusieurs items couvrent la même actualité, ils forment UN seul groupe (un seul article sera écrit, citant toutes les sources).
Pour chaque groupe, propose un titre français accrocheur mais factuel, un angle, et 2-3 tags en minuscules.
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

async function writeArticle(group: StoryGroup, items: PendingRow[]): Promise<WrittenArticle> {
  const sources = items.filter((item) => group.links.includes(item.url));
  const context = sources
    .map((s) => `[${s.source_name}] ${s.title}\n${s.summary}\n${s.url}`)
    .join("\n\n");

  const content = await callMistral(
    [
      {
        role: "system",
        content: `Tu rédiges un article de veille IA en français (250-400 mots), ton factuel et direct, sans emphase marketing.
Structure : un chapeau d'une phrase, 2-3 paragraphes, pas de titre (il est fourni à part), pas de conclusion creuse.
Tu te bases UNIQUEMENT sur les informations fournies — n'invente aucun chiffre, citation ou détail.
Si l'information est limitée, fais court.

Réponds en JSON strict :
{"markdown": "le corps de l'article en Markdown", "tldr": ["point clé 1", "point clé 2", "point clé 3"]}
Le tldr résume l'essentiel en 3 phrases courtes et autonomes.`,
      },
      {
        role: "user",
        content: `Titre de l'article : ${group.title}\nAngle : ${group.angle}\n\nSources :\n${context}`,
      },
    ],
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
    const content = await callMistral(
      [
        {
          role: "system",
          content: `Tu traduis un article de presse du français vers l'anglais. Traduction naturelle et journalistique, pas mot à mot. Conserve la mise en forme Markdown.
Réponds en JSON strict : {"title": "...", "excerpt": "...", "markdown": "...", "tldr": ["...", "..."]}`,
        },
        {
          role: "user",
          content: `Titre : ${title}\nChapeau : ${excerpt}\nTL;DR : ${JSON.stringify(tldr)}\n\nArticle :\n${markdown}`,
        },
      ],
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
      const groups = await groupStories(queuedItems, settings.breakingThreshold);
      const breakingGroups = groups.filter((g) => g.breaking);
      const normalGroups = groups.filter((g) => !g.breaking);

      const publishedToday = countArticlesToday();
      const dailyBudget = Math.max(0, settings.maxArticlesPerDay - publishedToday);
      const toWrite = [
        ...breakingGroups,
        ...normalGroups.slice(0, Math.max(0, settings.maxArticlesPerRun - breakingGroups.length)),
      ].slice(0, dailyBudget === 0 && breakingGroups.length > 0 ? breakingGroups.length : dailyBudget);

      const existing = await getAllArticles({ includeDrafts: true });
      const markDone = db.prepare(
        "UPDATE pending_news SET status = 'published', article_slug = ? WHERE url = ?"
      );

      for (const group of toWrite) {
        if (existing.some((a) => a.title.toLowerCase() === group.title.toLowerCase())) {
          log(`— déjà couvert : ${group.title}`);
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
