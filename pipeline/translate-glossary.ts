import { readFileSync } from "node:fs";
import path from "node:path";

try {
  const envFile = readFileSync(path.join(process.cwd(), ".env.local"), "utf-8");
  for (const line of envFile.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
} catch {}

import { getDb } from "../src/lib/db";
import { getGlossary } from "../src/lib/glossary";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
if (!MISTRAL_API_KEY) {
  console.error("MISTRAL_API_KEY manquante");
  process.exit(1);
}

async function translateDefinition(term: string, frHtml: string): Promise<string> {
  const fr = frHtml.replace(/<[^>]+>/g, "").trim();
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${MISTRAL_API_KEY}` },
    body: JSON.stringify({
      model: "mistral-small-latest",
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: `Translate this French AI glossary definition for the term "${term}" into English. Keep it concise (1-3 sentences). Return only the translated text, no quotes, no extra formatting.\n\nFrench: ${fr}`,
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Mistral ${res.status}: ${await res.text()}`);
  const data = await res.json() as { choices: { message: { content: string } }[] };
  return `<p>${data.choices[0].message.content.trim()}</p>`;
}

async function main() {
  const entries = getGlossary();
  const db = getDb();
  const toTranslate = entries.filter((e) => !e.definitionEnHtml);
  console.log(`${toTranslate.length} termes à traduire…`);

  for (const entry of toTranslate) {
    try {
      const enHtml = await translateDefinition(entry.term, entry.definitionHtml);
      db.prepare("UPDATE glossary SET definition_html_en = ? WHERE id = ?").run(enHtml, entry.id);
      console.log(`✓ ${entry.term}`);
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.error(`✗ ${entry.term}:`, err);
    }
  }
  console.log("Traduction terminée.");
}

main();
