import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { saveArticle, deleteArticle, getArticle } from "@/lib/articles";

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/admin/articles/[slug]">) {
  const { slug } = await ctx.params;
  const existing = await getArticle(slug);
  if (!existing) {
    return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : existing.title;
  const markdown =
    typeof body.markdown === "string" && body.markdown.trim() ? body.markdown.trim() : existing.markdown;

  await saveArticle(slug, {
    title,
    markdown,
    excerpt: typeof body.excerpt === "string" ? body.excerpt.trim() : existing.excerpt,
    tags: Array.isArray(body.tags)
      ? body.tags.filter((t): t is string => typeof t === "string" && t.length > 0)
      : existing.tags,
    image:
      typeof body.image === "string"
        ? body.image.startsWith("http")
          ? body.image
          : null
        : existing.image,
    date: existing.date,
    sources: existing.sources,
  });

  revalidatePath("/");
  revalidatePath(`/articles/${slug}`);
  return NextResponse.json({ ok: true, slug });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/admin/articles/[slug]">) {
  const { slug } = await ctx.params;
  const existing = await getArticle(slug);
  if (!existing) {
    return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
  }

  await deleteArticle(slug);
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
