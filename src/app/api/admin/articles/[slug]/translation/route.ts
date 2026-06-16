import { NextRequest, NextResponse } from "next/server";
import { getArticle, setArticleTranslation } from "@/lib/articles";
import { revalidatePath } from "next/cache";
import sanitizeHtml from "sanitize-html";

type TranslateBody = {
  titleEn?: string;
  excerptEn?: string;
  tldrEn?: string[];
  htmlEn?: string;
  autoTranslate?: boolean;
};

async function mistralTranslate(prompt: string): Promise<string> {
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
  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content.trim();
}

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  const article = await getArticle(slug, { includeDrafts: true });
  if (!article) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({
    titleEn: article.titleEn,
    excerptEn: article.excerptEn,
    tldrEn: article.tldrEn,
    htmlEn: article.htmlEn,
  });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  const article = await getArticle(slug, { includeDrafts: true });
  if (!article) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const body = await req.json() as TranslateBody;

  if (body.autoTranslate) {
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
        `Translate this French article to English. Keep all HTML tags intact. Return only the translated HTML.\n\n${article.html.slice(0, 8000)}`
      ),
    ]);

    let tldrEn: string[] = [];
    try {
      tldrEn = JSON.parse(tldrRaw) as string[];
    } catch {
      tldrEn = article.tldr;
    }

    const cleanHtml = sanitizeHtml(htmlEn, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(["h1", "h2", "h3"]),
      allowedAttributes: { a: ["href", "target", "rel"] },
    });

    setArticleTranslation(slug, {
      title: titleEn,
      excerpt: excerptEn,
      html: cleanHtml,
      tldr: tldrEn,
    });
  } else {
    setArticleTranslation(slug, {
      title: body.titleEn ?? article.titleEn ?? article.title,
      excerpt: body.excerptEn ?? article.excerptEn ?? article.excerpt,
      html: body.htmlEn ?? article.htmlEn ?? article.html,
      tldr: body.tldrEn ?? article.tldrEn ?? article.tldr,
    });
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
