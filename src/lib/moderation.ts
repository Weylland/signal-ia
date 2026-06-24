import { getDb } from "./db";
import { createArticle } from "./articles";
import { autoTranslateArticle } from "./translate";

/**
 * Publie une news en attente (pending_news) : génère un article via Mistral à
 * partir du titre/résumé, le crée, puis marque l'item comme publié.
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

  const key = process.env.MISTRAL_API_KEY;
  let html = `<p>${item.summary || item.title}</p>`;
  let tldr: string[] = [];

  if (key) {
    try {
      const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "mistral-small-latest",
          temperature: 0.5,
          messages: [
            {
              role: "user",
              content: `Rédige un article de news IA en français (300-500 mots) au format HTML basique (<p>, <h2>, <ul><li>) à partir de ce titre et résumé. Retourne uniquement le HTML.\n\nTitre: ${item.title}\nRésumé: ${item.summary}\nSource: ${item.url}`,
            },
          ],
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { choices: { message: { content: string } }[] };
        html = data.choices[0].message.content.trim().replace(/^```html\n?|```$/g, "");
      }

      const res2 = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "mistral-small-latest",
          temperature: 0.3,
          messages: [
            {
              role: "user",
              content: `Donne 3 points essentiels sur cet article en JSON array de strings. Retourne uniquement le JSON.\n\n${item.title}\n${item.summary}`,
            },
          ],
        }),
      });
      if (res2.ok) {
        const d2 = (await res2.json()) as { choices: { message: { content: string } }[] };
        try {
          tldr = JSON.parse(d2.choices[0].message.content.trim()) as string[];
        } catch {}
      }
    } catch {}
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
