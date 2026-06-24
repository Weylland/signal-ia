import { marked } from "marked";
import { getDb } from "./db";
import { callLLM } from "./llm";
import { createArticle } from "./articles";
import { autoTranslateArticle } from "./translate";

// Génération d'un tuto evergreen quand le stock à partager sur X est épuisé.
// C'est le SEUL endroit où le système écrit du contenu de toutes pièces : le pipeline
// ne produit que des news, et le poster X ne fait que piocher l'existant. Le tuto est
// publié sur le site (FR) + traduit en EN, puis le poster X récupère sa version FR.

const TUTO_THEMES =
  "prompting efficace, ChatGPT / Claude / Gemini / Mistral en pratique, automatisation avec n8n, " +
  "RAG (récupération augmentée), agents IA autonomes, faire tourner un LLM en local (Ollama), " +
  "brancher une API IA dans son code, sécuriser et fiabiliser un LLM, function calling, embeddings et recherche sémantique";

const DIFFICULTIES = ["debutant", "intermediaire", "avance"] as const;
type Difficulty = (typeof DIFFICULTIES)[number];

type GeneratedTuto = {
  title: string;
  excerpt: string;
  difficulty: Difficulty;
  tags: string[];
  markdown: string;
  tldr: string[];
};

// Titres des tutos existants : on les fournit au modèle pour qu'il ne re-propose pas
// un sujet déjà couvert.
function existingTutoTitles(): string[] {
  const rows = getDb()
    .prepare("SELECT title FROM articles WHERE type = 'tuto' ORDER BY date DESC LIMIT 80")
    .all() as { title: string }[];
  return rows.map((r) => r.title);
}

function normalizeDifficulty(raw: unknown): Difficulty {
  return typeof raw === "string" && (DIFFICULTIES as readonly string[]).includes(raw)
    ? (raw as Difficulty)
    : "intermediaire";
}

/**
 * Écrit un tuto inédit, le publie (FR) et le traduit en EN. Renvoie le slug, ou null
 * si la génération échoue (le poster X retombe alors sur une actu, jamais sur du vide).
 */
export async function generateTuto(): Promise<string | null> {
  const existing = existingTutoTitles();
  const avoid = existing.length
    ? `\n\nTUTOS DÉJÀ PUBLIÉS — n'en propose AUCUN qui recoupe l'un de ceux-ci, choisis un sujet ou un angle réellement nouveau :\n- ${existing.join("\n- ")}`
    : "";

  let parsed: GeneratedTuto;
  try {
    const raw = await callLLM(
      [
        {
          role: "system",
          content: `Tu écris un tutoriel pratique et intemporel pour watch·ia, un média de veille IA francophone destiné aux devs, indépendants et curieux. Ton factuel, direct, concret. Aucun remplissage, aucune emphase marketing.

OBJECTIF : à la fin, le lecteur doit pouvoir REFAIRE la manip pour ses propres besoins. Un tuto se juge à sa valeur reproductible.

STRUCTURE (Markdown sobre, pas de titre # de niveau 1 — il est fourni à part) :
- Un chapeau d'1-2 phrases : à qui ça sert et ce qu'on saura faire à la fin.
- Des étapes numérotées claires (## Étape 1, ## Étape 2, …), chacune avec le pourquoi puis le comment.
- Du CODE EXÉCUTABLE dans des blocs \`\`\` quand c'est pertinent (commande shell, snippet), avec la sortie attendue.
- Une section "## Adapter à ton cas" : comment transposer à d'autres besoins.
- Une section "## En cas de souci" : 2-3 pièges fréquents et leur résolution.

RÈGLES :
- N'invente pas d'API, de flag, de prix ou de chiffre. Si tu n'es pas sûr d'une commande exacte, reste générique plutôt que faux.
- Ne traduis ni n'altère les noms propres (OpenAI, Claude, Ollama, n8n…).
- Pas de promesse creuse ("révolutionnaire", "en un clic"). Concret et honnête sur les limites.
- 600 à 900 mots.

Réponds en JSON STRICT :
{"title": "...", "excerpt": "chapeau d'1 phrase", "difficulty": "debutant|intermediaire|avance", "tags": ["tag1","tag2"], "markdown": "le corps en Markdown", "tldr": ["point clé 1","point clé 2","point clé 3"]}`,
        },
        {
          role: "user",
          content: `Choisis UN sujet de tuto neuf et utile parmi ces thèmes : ${TUTO_THEMES}.${avoid}

Écris le tuto complet maintenant, en français.`,
        },
      ],
      true,
      "tutos",
      0.7
    );
    parsed = JSON.parse(raw) as GeneratedTuto;
  } catch {
    return null;
  }

  const title = parsed.title?.trim();
  const markdown = parsed.markdown?.trim();
  if (!title || !markdown) return null;

  const slug = await createArticle({
    title,
    excerpt: parsed.excerpt?.trim() ?? "",
    image: null,
    html: await marked.parse(markdown),
    type: "tuto",
    difficulty: normalizeDifficulty(parsed.difficulty),
    tags: Array.isArray(parsed.tags) ? parsed.tags.filter((t) => typeof t === "string" && t.trim()) : [],
    tldr: Array.isArray(parsed.tldr) ? parsed.tldr.filter((t) => typeof t === "string" && t.trim()).slice(0, 3) : [],
    published: true,
  });

  // Traduction EN pour le site (best-effort : un échec ne bloque pas la publication FR).
  try {
    await autoTranslateArticle(slug);
  } catch {
    /* la version FR reste publiée ; l'EN pourra être régénérée plus tard */
  }

  return slug;
}
