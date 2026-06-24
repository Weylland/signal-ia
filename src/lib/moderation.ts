import { getDb } from "./db";
import { createArticle } from "./articles";
import { autoTranslateArticle } from "./translate";
import { callLLM } from "./llm";

/**
 * Publie une news en attente (pending_news) : génère un article à partir du
 * titre/résumé, le crée, puis marque l'item comme publié.
 * Passe par callLLM → respecte le réglage admin (Claude si activé, sinon Mistral)
 * et bénéficie du repli Mistral si Claude est indisponible, comme le pipeline.
 * Logique partagée entre la route admin de modération et le serveur MCP
 * (outil approve_article), pour que l'approbation produise réellement un article.
 */

type PendingItem = {
  id: number;
  url: string;
  title: string;
  source_name: string;
  summary: string;
  published_at: string | null;
  score: number | null;
};

export async function publishPendingItem(id: number): Promise<string> {
  const db = getDb();
  const item = db.prepare("SELECT * FROM pending_news WHERE id = ?").get(id) as
    | PendingItem
    | undefined;
  if (!item) throw new Error("Item introuvable");

  let html = `<p>${item.summary || item.title}</p>`;
  let tldr: string[] = [];

  try {
    const body = await callLLM(
      [
        {
          role: "user",
          content: `Rédige un article de news IA en français (300-500 mots) au format HTML basique (<p>, <h2>, <ul><li>) à partir de ce titre et résumé. Retourne uniquement le HTML.\n\nTitre: ${item.title}\nRésumé: ${item.summary}\nSource: ${item.url}`,
        },
      ],
      false,
      true,
      0.5
    );
    const cleaned = body.trim().replace(/^```html\n?|```$/g, "").trim();
    if (cleaned) html = cleaned;
  } catch {
    /* garde le fallback <p>résumé</p> */
  }

  try {
    const raw = await callLLM(
      [
        {
          role: "user",
          content: `Donne 3 points essentiels sur cet article en JSON array de strings. Retourne uniquement le JSON.\n\n${item.title}\n${item.summary}`,
        },
      ],
      false,
      true,
      0.3
    );
    // Extraction tolérante (le modèle peut entourer de prose ou de fences selon le provider).
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) tldr = parsed.filter((t): t is string => typeof t === "string");
    }
  } catch {
    /* tldr reste vide */
  }

  const slug = await createArticle({
    title: item.title,
    excerpt: item.summary,
    html,
    published: true,
    tags: [],
    image: null,
    sources: [{ name: item.source_name, url: item.url }],
    type: "news",
    tldr,
    score: item.score,
  });

  db.prepare("UPDATE pending_news SET status = 'published', article_slug = ? WHERE id = ?").run(slug, id);
  autoTranslateArticle(slug).catch(() => {});
  return slug;
}

export function rejectPendingItem(id: number): void {
  getDb().prepare("UPDATE pending_news SET status = 'rejected' WHERE id = ?").run(id);
}
