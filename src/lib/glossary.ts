import { getDb } from "./db";
import { slugify } from "./articles";
import { cleanHtml } from "./sanitize";
import { callLLM } from "./llm";

export type GlossaryEntry = {
  id: number;
  slug: string;
  term: string;
  definitionHtml: string;
  definitionEnHtml: string | null;
};

const SEED: { term: string; definition: string }[] = [
  {
    term: "LLM (Large Language Model)",
    definition:
      "Grand modèle de langage : une IA entraînée sur d'énormes volumes de texte pour comprendre et générer du langage. GPT, Claude, Mistral ou Gemini sont des LLM.",
  },
  {
    term: "Prompt",
    definition:
      "L'instruction qu'on donne à une IA. La qualité du prompt détermine en grande partie la qualité de la réponse — d'où le « prompt engineering », l'art de bien formuler ses demandes.",
  },
  {
    term: "Token",
    definition:
      "L'unité de texte que manipule un LLM, environ 3-4 caractères en français. Les limites et les prix des API sont exprimés en tokens.",
  },
  {
    term: "Fenêtre de contexte",
    definition:
      "La quantité maximale de texte (en tokens) qu'un modèle peut prendre en compte d'un coup : la conversation, les documents fournis, les instructions. Au-delà, il « oublie ».",
  },
  {
    term: "Fine-tuning",
    definition:
      "Ré-entraîner un modèle existant sur des données spécifiques pour le spécialiser dans une tâche ou un domaine, plutôt que de repartir de zéro.",
  },
  {
    term: "RAG (Retrieval-Augmented Generation)",
    definition:
      "Technique qui consiste à chercher des documents pertinents (dans une base interne, par exemple) et à les injecter dans le prompt pour que le modèle réponde avec des informations à jour et vérifiables.",
  },
  {
    term: "Hallucination",
    definition:
      "Quand un modèle invente une information fausse avec assurance : un chiffre, une source, un fait. C'est le principal risque pratique des LLM — toujours vérifier les faits critiques.",
  },
  {
    term: "Agent (IA)",
    definition:
      "Un système où le modèle ne se contente pas de répondre : il enchaîne des actions (chercher sur le web, exécuter du code, appeler des outils) en autonomie pour accomplir un objectif.",
  },
  {
    term: "MCP (Model Context Protocol)",
    definition:
      "Protocole ouvert (créé par Anthropic) qui permet de connecter une IA à des outils et sources de données externes de façon standardisée : bases de données, API, fichiers, services.",
  },
  {
    term: "Inférence",
    definition:
      "La phase où le modèle est utilisé pour générer des réponses (par opposition à l'entraînement). Le coût d'inférence est ce qu'on paie quand on appelle une API d'IA.",
  },
  {
    term: "Open weights / open source",
    definition:
      "Un modèle « open weights » publie ses poids (téléchargeables, exécutables chez soi), comme Llama ou Mistral. Vraiment open source impliquerait aussi données et code d'entraînement — c'est rare.",
  },
  {
    term: "Multimodal",
    definition:
      "Un modèle capable de traiter plusieurs types de contenus : texte, images, audio, vidéo — en entrée, en sortie, ou les deux.",
  },
  {
    term: "AGI (Artificial General Intelligence)",
    definition:
      "Intelligence artificielle générale : une IA hypothétique aussi compétente qu'un humain sur l'ensemble des tâches cognitives. Objet de débats intenses sur sa faisabilité et son horizon.",
  },
  {
    term: "Embedding",
    definition:
      "Représentation d'un texte sous forme de vecteur de nombres qui capture son sens. Deux textes proches sémantiquement ont des embeddings proches — c'est la base de la recherche sémantique et du RAG.",
  },
  {
    term: "Température",
    definition:
      "Paramètre qui règle la créativité d'un modèle : basse (0-0.3) pour des réponses factuelles et reproductibles, haute (0.7+) pour des réponses variées et créatives.",
  },
  {
    term: "Benchmark",
    definition:
      "Test standardisé pour comparer les modèles entre eux (MMLU, HumanEval, etc.). Utile mais imparfait : les modèles peuvent être sur-optimisés pour les benchmarks.",
  },
  {
    term: "GPU",
    definition:
      "Processeur graphique, devenu le matériel clé de l'IA : l'entraînement et l'inférence des grands modèles tournent massivement sur GPU (Nvidia en tête), d'où les enjeux géopolitiques autour des puces.",
  },
  {
    term: "Quantization",
    definition:
      "Compression d'un modèle en réduisant la précision de ses poids pour qu'il tourne sur du matériel modeste (un PC, un téléphone), au prix d'une légère perte de qualité.",
  },
];

export function seedGlossary(): void {
  const db = getDb();
  const count = db.prepare("SELECT COUNT(*) AS c FROM glossary").get() as { c: number };
  if (count.c > 0) return;
  const insert = db.prepare(
    "INSERT OR IGNORE INTO glossary (slug, term, definition_html) VALUES (?, ?, ?)"
  );
  for (const entry of SEED) {
    insert.run(slugify(entry.term), entry.term, `<p>${entry.definition}</p>`);
  }
}

export function getGlossary(): GlossaryEntry[] {
  const db = getDb();
  seedGlossary();
  const rows = db
    .prepare("SELECT * FROM glossary ORDER BY term COLLATE NOCASE")
    .all() as { id: number; slug: string; term: string; definition_html: string; definition_html_en: string | null }[];
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    term: r.term,
    definitionHtml: r.definition_html,
    definitionEnHtml: r.definition_html_en ?? null,
  }));
}

export function upsertGlossaryEntry(term: string, definitionHtml: string, id?: number): void {
  const db = getDb();
  const clean = cleanHtml(definitionHtml);
  if (id) {
    db.prepare("UPDATE glossary SET term = ?, definition_html = ? WHERE id = ?").run(
      term.trim(),
      clean,
      id
    );
  } else {
    db.prepare("INSERT INTO glossary (slug, term, definition_html) VALUES (?, ?, ?)").run(
      slugify(term),
      term.trim(),
      clean
    );
  }
}

export function deleteGlossaryEntry(id: number): void {
  const db = getDb();
  db.prepare("DELETE FROM glossary WHERE id = ?").run(id);
}

// Traduit en anglais les entrées qui n'ont pas encore de version EN.
// Passe par callLLM (tâche "translation") → suit le menu admin de traduction
// (Mistral par défaut, Claude si choisi) avec repli Mistral si Claude échoue.
export async function translateGlossaryToEn(): Promise<{ translated: number; remaining: number }> {
  const db = getDb();
  const rows = db
    .prepare("SELECT id, term, definition_html FROM glossary WHERE definition_html_en IS NULL OR definition_html_en = ''")
    .all() as { id: number; term: string; definition_html: string }[];

  const update = db.prepare("UPDATE glossary SET definition_html_en = ? WHERE id = ?");
  let translated = 0;
  for (const r of rows) {
    try {
      const out = await callLLM(
        [{
          role: "user",
          content: `Translate this AI-glossary definition from French to English. Keep the HTML tags intact. Never translate proper nouns (company/product names like OpenAI, Anthropic). Return ONLY the translated HTML, nothing else.\n\nTerm: ${r.term}\nHTML: ${r.definition_html}`,
        }],
        false,
        "translation",
        0.2
      );
      const html = cleanHtml(out.replace(/```html|```/g, "").trim());
      if (html) {
        update.run(html, r.id);
        translated++;
      }
    } catch {
      // on continue sur l'entrée suivante
    }
  }
  return { translated, remaining: rows.length - translated };
}
