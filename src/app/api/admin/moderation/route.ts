import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createArticle } from "@/lib/articles";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const { id, action } = await req.json() as { id: number; action: "publish" | "reject" };

  const db = getDb();
  const item = db
    .prepare("SELECT * FROM pending_news WHERE id = ?")
    .get(id) as {
      id: number; url: string; title: string; source_name: string;
      summary: string; published_at: string | null; score: number | null;
    } | undefined;

  if (!item) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  if (action === "reject") {
    db.prepare("UPDATE pending_news SET status = 'rejected' WHERE id = ?").run(id);
    return NextResponse.json({ ok: true });
  }

  // publish: generate article via Mistral then mark published
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
          messages: [{
            role: "user",
            content: `Rédige un article de news IA en français (300-500 mots) au format HTML basique (<p>, <h2>, <ul><li>) à partir de ce titre et résumé. Retourne uniquement le HTML.\n\nTitre: ${item.title}\nRésumé: ${item.summary}\nSource: ${item.url}`,
          }],
        }),
      });
      if (res.ok) {
        const data = await res.json() as { choices: { message: { content: string } }[] };
        html = data.choices[0].message.content.trim().replace(/^```html\n?|```$/g, "");
      }

      const res2 = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "mistral-small-latest",
          temperature: 0.3,
          messages: [{
            role: "user",
            content: `Donne 3 points essentiels sur cet article en JSON array de strings. Retourne uniquement le JSON.\n\n${item.title}\n${item.summary}`,
          }],
        }),
      });
      if (res2.ok) {
        const d2 = await res2.json() as { choices: { message: { content: string } }[] };
        try { tldr = JSON.parse(d2.choices[0].message.content.trim()) as string[]; } catch {}
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
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, slug });
}
