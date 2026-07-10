// Appel LLM unifié, partagé entre le pipeline (rédaction) et X (tweets).
// Le mode "claude" est hybride : seuls les appels "premium" (création de contenu
// public — articles, traductions, tweets) passent sur Claude. La classification
// simple (scoring, groupage) reste sur Mistral, gratuit, dans tous les cas.

import { getSettings, type LLMChoice } from "./settings";
import { recordLlmTrace } from "./llm-metrics";

type LLMResult = { text: string; usageIn: number; usageOut: number };

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
const MISTRAL_MODEL = "mistral-small-latest";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_HAIKU = "claude-haiku-4-5-20251001";
const CLAUDE_SONNET = "claude-sonnet-5";
const CLAUDE_OPUS = "claude-opus-4-8";

// Chaque choix de tâche → un fournisseur + un modèle concret.
export const CHOICE_MODEL: Record<LLMChoice, { provider: "mistral" | "claude"; model: string }> = {
  mistral: { provider: "mistral", model: MISTRAL_MODEL },
  haiku: { provider: "claude", model: CLAUDE_HAIKU },
  sonnet: { provider: "claude", model: CLAUDE_SONNET },
  opus: { provider: "claude", model: CLAUDE_OPUS },
};

export type LLMMessage = { role: string; content: string };

async function callMistral(messages: LLMMessage[], json: boolean, temperature: number): Promise<LLMResult> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("MISTRAL_API_KEY manquante — https://console.mistral.ai");

  const res = await fetch(MISTRAL_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      messages,
      temperature,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Mistral API ${res.status} : ${await res.text()}`);
  const data = await res.json();
  return {
    text: data.choices[0].message.content,
    usageIn: data.usage?.prompt_tokens ?? 0,
    usageOut: data.usage?.completion_tokens ?? 0,
  };
}

async function callClaude(messages: LLMMessage[], json: boolean, temperature: number, model: string = CLAUDE_HAIKU): Promise<LLMResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY manquante — https://console.anthropic.com");

  const systemMsg = messages.find((m) => m.role === "system");
  const userMsgs = messages.filter((m) => m.role !== "system");
  const systemPrompt = [
    systemMsg?.content ?? "",
    json ? "Réponds uniquement avec du JSON valide, sans bloc markdown ni commentaire." : "",
  ].filter(Boolean).join("\n");

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature,
      system: systemPrompt,
      messages: userMsgs,
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status} : ${await res.text()}`);
  const data = await res.json();
  let text: string = data.content[0].text.trim();
  // Claude peut entourer le JSON d'un bloc markdown malgré la consigne : on retire
  // UNIQUEMENT un fence qui ENVELOPPE toute la réponse. Une recherche globale de
  // ```...``` casserait un tuto dont le champ markdown contient lui-même des blocs de
  // code : elle capturerait la première fence interne et tronquerait le JSON (parse
  // échoue → tuto jamais généré, repli silencieux sur une actu).
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
  }
  return {
    text,
    usageIn: data.usage?.input_tokens ?? 0,
    usageOut: data.usage?.output_tokens ?? 0,
  };
}

// Tâches LLM. "scoring" couvre toute la classification (scoring/groupage/dédup) et
// reste TOUJOURS sur Mistral (gratuit). Les autres suivent le menu admin par tâche.
export type LLMTask = "scoring" | "articles" | "tutos" | "tweets" | "translation";

// La classification (scoring) est forcée sur Mistral ; les autres suivent le réglage admin.
export function choiceForTask(task: LLMTask): LLMChoice {
  if (task === "scoring") return "mistral";
  const s = getSettings();
  switch (task) {
    case "articles":
      return s.llmArticles;
    case "tutos":
      return s.llmTutos;
    case "tweets":
      return s.llmTweets;
    case "translation":
      return s.llmTranslation;
  }
}

/**
 * Appel LLM routé par tâche selon les réglages admin (un modèle par tâche).
 * Si la tâche est réglée sur Claude et que Claude échoue (crédits, rate-limit, panne),
 * on dégrade automatiquement sur Mistral plutôt que d'échouer.
 */
export async function callLLM(
  messages: LLMMessage[],
  json = false,
  task: LLMTask = "scoring",
  temperature = 0.4
): Promise<string> {
  const { provider, model } = CHOICE_MODEL[choiceForTask(task)];
  const t0 = Date.now();

  if (provider === "claude") {
    try {
      const r = await callClaude(messages, json, temperature, model);
      recordLlmTrace({ task, model, tokensIn: r.usageIn, tokensOut: r.usageOut, latencyMs: Date.now() - t0, status: "ok" });
      return r.text;
    } catch (err) {
      console.error(
        "[llm] Claude indisponible, repli sur Mistral :",
        err instanceof Error ? err.message : err
      );
      const t1 = Date.now();
      try {
        const r = await callMistral(messages, json, temperature);
        recordLlmTrace({ task, model: MISTRAL_MODEL, tokensIn: r.usageIn, tokensOut: r.usageOut, latencyMs: Date.now() - t1, status: "fallback" });
        return r.text;
      } catch (e2) {
        recordLlmTrace({ task, model, tokensIn: null, tokensOut: null, latencyMs: Date.now() - t0, status: "error" });
        throw e2;
      }
    }
  }

  try {
    const r = await callMistral(messages, json, temperature);
    recordLlmTrace({ task, model, tokensIn: r.usageIn, tokensOut: r.usageOut, latencyMs: Date.now() - t0, status: "ok" });
    return r.text;
  } catch (e) {
    recordLlmTrace({ task, model, tokensIn: null, tokensOut: null, latencyMs: Date.now() - t0, status: "error" });
    throw e;
  }
}
