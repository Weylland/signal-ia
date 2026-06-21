// Déduction d'une catégorie (et de sa couleur) à partir des tags d'un article.
// Pur, sans dépendance — utilisable côté serveur comme client.

export type CategoryKey = "llm" | "robotics" | "tools" | "research" | "business" | "policy";

type CategoryDef = { key: CategoryKey; label: string; labelEn: string; cls: string; keywords: string[] };

// Ordre = priorité (premier match gagne)
const CATEGORIES: CategoryDef[] = [
  {
    key: "robotics",
    label: "Robotique",
    labelEn: "Robotics",
    cls: "t-rob",
    keywords: ["robot", "robotique", "humanoïde", "humanoide", "boston dynamics", "drone", "bipède", "bipede", "figure"],
  },
  {
    key: "policy",
    label: "Politique",
    labelEn: "Policy",
    cls: "t-pol",
    keywords: ["régulation", "regulation", "ai act", "europe", "gouvernement", "justice", "loi", "politique", "parlement", "protestations", "procès", "proces", "régulateur"],
  },
  {
    key: "business",
    label: "Business",
    labelEn: "Business",
    cls: "t-biz",
    keywords: ["financement", "levée", "levee", "acquisition", "ipo", "bourse", "valorisation", "startup", "entreprise", "business", "milliards", "rachat", "introduction en bourse"],
  },
  {
    key: "research",
    label: "Recherche",
    labelEn: "Research",
    cls: "t-res",
    keywords: ["recherche", "deepmind", "alphafold", "biologie", "science", "nature", "deep research", "papier", "étude", "etude", "neurosciences"],
  },
  {
    key: "tools",
    label: "Outils",
    labelEn: "Tools",
    cls: "t-tool",
    keywords: ["outil", "outils", "dev", "ide", "cursor", "mcp", "agent", "agents", "no-code", "api", "automatisation", "n8n", "coding", "perplexity", "stability", "3d", "assistant", "plugin", "framework"],
  },
  {
    key: "llm",
    label: "LLM",
    labelEn: "LLM",
    cls: "t-llm",
    keywords: ["llm", "gpt", "openai", "mistral", "claude", "anthropic", "gemini", "google", "modèle", "modele", "model", "llama", "ia-générative", "ia générative", "ia generative", "fine-tuning", "rag", "prompt", "multimodal", "open-source", "kimi", "moonshot", "deepseek", "meta", "fable", "mythos"],
  },
];

export type Category = { key: CategoryKey | null; label: string; cls: string };

/** Liste des catégories (clé + libellé localisé), dans l'ordre de priorité. */
export function categoryList(lang: "fr" | "en" = "fr"): { key: CategoryKey; label: string }[] {
  return CATEGORIES.map((c) => ({ key: c.key, label: lang === "en" ? c.labelEn : c.label }));
}

/** Déduit la catégorie d'un article depuis ses tags (et son titre en secours). */
export function categoryFor(tags: string[], lang: "fr" | "en" = "fr", fallbackText = ""): Category {
  const hay = [...tags, fallbackText].join(" ").toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.keywords.some((k) => hay.includes(k))) {
      return { key: cat.key, label: lang === "en" ? cat.labelEn : cat.label, cls: cat.cls };
    }
  }
  // Pas de catégorie identifiée : badge neutre avec le premier tag
  const first = tags[0];
  return { key: null, label: first ? first : lang === "en" ? "News" : "Actu", cls: "" };
}
