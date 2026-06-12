import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { updateArticle, deleteArticle, getArticle } from "@/lib/articles";
import { parseInput } from "@/lib/article-input";

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/admin/articles/[slug]">) {
  const { slug } = await ctx.params;
  const existing = await getArticle(slug, { includeDrafts: true });
  if (!existing) {
    return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const input = parseInput(body);
  if (!input) {
    return NextResponse.json({ error: "Titre et contenu obligatoires" }, { status: 400 });
  }

  await updateArticle(slug, { ...input, date: existing.date, sources: input.sources ?? existing.sources });
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, slug });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/admin/articles/[slug]">) {
  const { slug } = await ctx.params;
  const existing = await getArticle(slug, { includeDrafts: true });
  if (!existing) {
    return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
  }

  await deleteArticle(slug);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
