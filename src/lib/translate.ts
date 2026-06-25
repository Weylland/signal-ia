import { getArticle, setArticleTranslation } from "./articles";
import { callLLM } from "./llm";

/**
 * Traduction FR → EN. Passe par callLLM (tâche "translation") → suit le menu admin
 * de traduction (Claude si choisi, sinon Mistral) avec repli Mistral si Claude échoue.
 * Logique partagée entre la route admin de traduction et le serveur MCP.
 */

async function translateOne(prompt: string): Promise<string> {
  const out = await callLLM([{ role: "user", content: prompt }], false, "translation", 0.3);
  // Le modèle entoure parfois sa sortie d'un bloc markdown (```html … ```) : on le retire
  // pour ne pas stocker la fence en clair dans le HTML EN.
  return out
    .trim()
    .replace(/^```(?:html|json|markdown)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
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
    translateOne(
      `Translate this French article title to English. Return only the translated title, nothing else.\n\nFrench: ${article.title}`
    ),
    translateOne(
      `Translate this French article summary to English (1-2 sentences max). Return only the translation.\n\nFrench: ${article.excerpt}`
    ),
    article.tldr.length > 0
      ? translateOne(
          `Translate these French bullet points to English. Return a JSON array of strings, nothing else.\n\n${JSON.stringify(article.tldr)}`
        )
      : Promise.resolve("[]"),
    translateOne(
      `Translate this French article to English. Keep all HTML tags intact (including any <svg> diagrams). Return only the translated HTML.\n\n${article.html.slice(0, 8000)}`
    ),
  ]);

  // Parse tolérant : selon le provider, le tableau peut être entouré de prose ou de fences.
  let tldrEn: string[] = article.tldr;
  try {
    const match = tldrRaw.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(match ? match[0] : tldrRaw);
    if (Array.isArray(parsed)) tldrEn = parsed.filter((t): t is string => typeof t === "string");
  } catch {
    tldrEn = article.tldr;
  }

  setArticleTranslation(slug, { title: titleEn, excerpt: excerptEn, html: htmlEn, tldr: tldrEn });
  return { titleEn, excerptEn, tldrEn, htmlEn };
}
