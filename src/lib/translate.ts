import { getArticle, setArticleTranslation } from "./articles";

/**
 * Traduction FR → EN via Mistral. Logique partagée entre la route admin de
 * traduction et le serveur MCP (outil translate_article), pour éviter la
 * duplication et garantir un comportement identique partout.
 */

export async function mistralTranslate(prompt: string): Promise<string> {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) throw new Error("MISTRAL_API_KEY manquante");
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "mistral-small-latest",
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Mistral ${res.status}`);
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content.trim();
}

export type ArticleTranslation = {
  titleEn: string;
  excerptEn: string;
  tldrEn: string[];
  htmlEn: string;
};

/**
 * Traduit un article FR vers l'anglais et enregistre la version EN.
 * Le HTML est nettoyé par setArticleTranslation (cleanHtml), qui préserve les
 * schémas SVG. Retourne les champs EN générés.
 */
export async function autoTranslateArticle(slug: string): Promise<ArticleTranslation> {
  const article = await getArticle(slug, { includeDrafts: true });
  if (!article) throw new Error(`Article "${slug}" introuvable`);

  const [titleEn, excerptEn, tldrRaw, htmlEn] = await Promise.all([
    mistralTranslate(
      `Translate this French article title to English. Return only the translated title, nothing else.\n\nFrench: ${article.title}`
    ),
    mistralTranslate(
      `Translate this French article summary to English (1-2 sentences max). Return only the translation.\n\nFrench: ${article.excerpt}`
    ),
    article.tldr.length > 0
      ? mistralTranslate(
          `Translate these French bullet points to English. Return a JSON array of strings, nothing else.\n\n${JSON.stringify(article.tldr)}`
        )
      : Promise.resolve("[]"),
    mistralTranslate(
      `Translate this French article to English. Keep all HTML tags intact (including any <svg> diagrams). Return only the translated HTML.\n\n${article.html.slice(0, 8000)}`
    ),
  ]);

  let tldrEn: string[] = [];
  try {
    tldrEn = JSON.parse(tldrRaw) as string[];
  } catch {
    tldrEn = article.tldr;
  }

  setArticleTranslation(slug, { title: titleEn, excerpt: excerptEn, html: htmlEn, tldr: tldrEn });
  return { titleEn, excerptEn, tldrEn, htmlEn };
}
