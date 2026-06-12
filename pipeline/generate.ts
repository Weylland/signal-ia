import { readFile } from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";
import type { RawItem } from "./scrape";
import { fetchOgImage } from "./og";
import { createArticle, getAllArticles } from "../src/lib/articles";

const RAW_DIR = path.join(process.cwd(), "data", "raw");
const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
const MODEL = "mistral-small-latest";
const MAX_ARTICLES_PER_DAY = 3;

type TriageResult = {
  selection: {
    title: string;
    links: string[];
    reason: string;
    tags: string[];
  }[];
};

async function callMistral(messages: { role: string; content: string }[], json = false): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    console.error("MISTRAL_API_KEY manquante. Crée une clé gratuite sur https://console.mistral.ai");
    process.exit(1);
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

async function triage(items: RawItem[]): Promise<TriageResult> {
  const list = items
    .map((item, i) => `${i + 1}. [${item.sourceName}] ${item.title}\n   ${item.summary}\n   ${item.link}`)
    .join("\n");

  const content = await callMistral(
    [
      {
        role: "system",
        content: `Tu es le rédacteur en chef d'un site de veille IA francophone.
Tu sélectionnes les ${MAX_ARTICLES_PER_DAY} news les plus importantes du jour parmi une liste.

Critères de sélection :
- Annonces majeures : nouveaux modèles, percées recherche, levées de fonds significatives, robotique liée à l'IA
- Écarter : contenus marketing/sponsorisés, rumeurs, news sans lien direct avec l'IA
- Regrouper les items qui couvrent la même actualité (un seul article, plusieurs liens sources)

Réponds en JSON strict : {"selection": [{"title": "titre français de l'article à écrire", "links": ["url1"], "reason": "pourquoi c'est important", "tags": ["tag1", "tag2"]}]}`,
      },
      { role: "user", content: `News du jour :\n\n${list}` },
    ],
    true
  );

  return JSON.parse(content);
}

async function writeArticle(selected: TriageResult["selection"][number], items: RawItem[]): Promise<string> {
  const sources = items.filter((item) => selected.links.includes(item.link));
  const context = sources
    .map((s) => `[${s.sourceName}] ${s.title}\n${s.summary}\n${s.link}`)
    .join("\n\n");

  return callMistral([
    {
      role: "system",
      content: `Tu rédiges un article de veille IA en français (250-400 mots), ton factuel et direct, sans emphase marketing.
Structure : un chapeau d'une phrase, 2-3 paragraphes, pas de titre (il est fourni à part), pas de conclusion creuse.
Tu te bases UNIQUEMENT sur les informations fournies — n'invente aucun chiffre, citation ou détail.
Si l'information est limitée, fais court. Format Markdown.`,
    },
    {
      role: "user",
      content: `Titre de l'article : ${selected.title}\nAngle : ${selected.reason}\n\nSources :\n${context}`,
    },
  ]);
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const rawPath = path.join(RAW_DIR, `${today}.json`);

  let items: RawItem[];
  try {
    items = JSON.parse(await readFile(rawPath, "utf-8"));
  } catch {
    console.error(`Pas de données pour aujourd'hui (${rawPath}). Lance d'abord : npm run scrape`);
    process.exit(1);
  }

  const existing = await getAllArticles({ includeDrafts: true });

  console.log(`Triage de ${items.length} items...`);
  const { selection } = await triage(items);

  for (const selected of selection.slice(0, MAX_ARTICLES_PER_DAY)) {
    const slugBase = `${today}-${slugify(selected.title)}`;
    if (existing.some((a) => a.slug.startsWith(slugBase))) {
      console.log(`— déjà publié : ${selected.title}`);
      continue;
    }

    console.log(`Rédaction : ${selected.title}`);
    const body = await writeArticle(selected, items);
    const sources = items.filter((item) => selected.links.includes(item.link));
    const image = sources.length > 0 ? await fetchOgImage(sources[0].link) : null;

    const slug = await createArticle({
      title: selected.title,
      excerpt: selected.reason,
      tags: selected.tags,
      image,
      html: await marked.parse(body.trim()),
      published: true,
      sources: sources.map((s) => ({ name: s.sourceName, url: s.link })),
    });
    console.log(`✓ publié en base : ${slug}`);
  }

  console.log("\nGénération terminée.");
}

main();
