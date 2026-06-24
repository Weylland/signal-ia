import { NextRequest, NextResponse } from "next/server";
import { getArticle, setArticleTranslation } from "@/lib/articles";
import { autoTranslateArticle } from "@/lib/translate";
import { revalidatePath } from "next/cache";

type TranslateBody = {
  titleEn?: string;
  excerptEn?: string;
  tldrEn?: string[];
  htmlEn?: string;
  autoTranslate?: boolean;
};

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
    await autoTranslateArticle(slug);
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
