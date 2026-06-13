import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { term, defFr } = await req.json() as { term: string; defFr: string };
  const key = process.env.MISTRAL_API_KEY;
  if (!key) return NextResponse.json({ error: "Clé Mistral manquante" }, { status: 500 });

  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "mistral-small-latest",
      temperature: 0.3,
      messages: [{
        role: "user",
        content: `Translate this French AI glossary definition for "${term}" into English. Return only the translated text, concise (1-3 sentences), no quotes.\n\nFrench: ${defFr}`,
      }],
    }),
  });

  if (!res.ok) return NextResponse.json({ error: "Erreur Mistral" }, { status: 500 });
  const data = await res.json() as { choices: { message: { content: string } }[] };
  return NextResponse.json({ defEn: data.choices[0].message.content.trim() });
}
