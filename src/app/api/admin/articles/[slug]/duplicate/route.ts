import { NextRequest, NextResponse } from "next/server";
import { getArticle, createArticle } from "@/lib/articles";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(_req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  const article = await getArticle(slug, { includeDrafts: true });
  if (!article) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const newSlug = await createArticle({
    title: `${article.title} (copie)`,
    excerpt: article.excerpt,
    html: article.html,
    published: false,
    tags: article.tags,
    image: article.image,
    sources: article.sources,
    type: article.type,
    tldr: article.tldr,
  });

  return NextResponse.json({ ok: true, slug: newSlug });
}
