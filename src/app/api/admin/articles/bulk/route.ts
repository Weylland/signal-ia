import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { deleteArticle, updateArticle, getArticle } from "@/lib/articles";

export async function POST(request: NextRequest) {
  let body: { action: string; slugs: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const { action, slugs } = body;
  if (!Array.isArray(slugs) || slugs.length === 0) {
    return NextResponse.json({ error: "Aucun article sélectionné" }, { status: 400 });
  }
  if (!["publish", "unpublish", "delete"].includes(action)) {
    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  }

  const errors: string[] = [];
  for (const slug of slugs) {
    try {
      if (action === "delete") {
        await deleteArticle(slug);
      } else {
        const existing = await getArticle(slug, { includeDrafts: true });
        if (!existing) { errors.push(slug); continue; }
        await updateArticle(slug, {
          title: existing.title,
          excerpt: existing.excerpt,
          tags: existing.tags,
          image: existing.image,
          html: existing.html,
          published: action === "publish",
          date: existing.date,
          sources: existing.sources,
          type: existing.type,
        });
      }
    } catch {
      errors.push(slug);
    }
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, errors });
}
