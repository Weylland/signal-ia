import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { url } = await req.json() as { url: string };
  if (!url) return NextResponse.json({ error: "URL manquante" }, { status: 400 });

  let html = "";
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; watch-ia-bot/1.0)" },
      signal: AbortSignal.timeout(10000),
    });
    html = await res.text();
  } catch (err) {
    return NextResponse.json({ error: `Impossible de récupérer la page : ${err}` }, { status: 400 });
  }

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) ||
    html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
    html.match(/property="og:title"\s+content="([^"]+)"/i);
  const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, " ") : "";

  // Extract description/excerpt
  const descMatch = html.match(/name="description"\s+content="([^"]+)"/i) ||
    html.match(/property="og:description"\s+content="([^"]+)"/i);
  const excerpt = descMatch ? descMatch[1].trim().replace(/\s+/g, " ").slice(0, 300) : "";

  // Extract OG image — validate URL to avoid javascript: or data: injection
  const imageMatch = html.match(/property="og:image"\s+content="([^"]+)"/i) ||
    html.match(/name="twitter:image"\s+content="([^"]+)"/i);
  let image: string | null = null;
  if (imageMatch) {
    try {
      const u = new URL(imageMatch[1].trim());
      if (u.protocol === "https:") image = u.href;
    } catch {}
  }

  // If Mistral is available, generate a better summary
  const key = process.env.MISTRAL_API_KEY;
  let generatedExcerpt = excerpt;
  if (key && (title || excerpt)) {
    try {
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 3000);

      const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "mistral-small-latest",
          temperature: 0.3,
          messages: [{
            role: "user",
            content: `Résume en 2 phrases max ce contenu web en français. Retourne uniquement le résumé.\n\nTitre: ${title}\nContenu: ${textContent}`,
          }],
        }),
      });
      if (res.ok) {
        const data = await res.json() as { choices: { message: { content: string } }[] };
        generatedExcerpt = data.choices[0].message.content.trim();
      }
    } catch {}
  }

  return NextResponse.json({ title, excerpt: generatedExcerpt, image, sourceUrl: url });
}
