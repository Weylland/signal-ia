import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { saveArticle, slugify, getArticle, type ArticleInput } from "@/lib/articles";

function parseInput(body: Record<string, unknown>): ArticleInput | null {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const markdown = typeof body.markdown === "string" ? body.markdown.trim() : "";
  if (!title || !markdown) return null;

  return {
    title,
    markdown,
    excerpt: typeof body.excerpt === "string" ? body.excerpt.trim() : "",
    tags: Array.isArray(body.tags)
      ? body.tags.filter((t): t is string => typeof t === "string" && t.length > 0)
      : [],
    image: typeof body.image === "string" && body.image.startsWith("http") ? body.image : null,
    date: typeof body.date === "string" && body.date ? body.date : undefined,
    sources: Array.isArray(body.sources)
      ? body.sources.filter(
          (s): s is { name: string; url: string } =>
            typeof s === "object" && s !== null &&
            typeof (s as Record<string, unknown>).name === "string" &&
            typeof (s as Record<string, unknown>).url === "string"
        )
      : [],
  };
}

export async function POST(request: NextRequest) {
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

  const date = input.date ?? new Date().toISOString();
  const slug = `${date.slice(0, 10)}-${slugify(input.title)}`;

  if (await getArticle(slug)) {
    return NextResponse.json({ error: "Un article avec ce titre existe déjà" }, { status: 409 });
  }

  await saveArticle(slug, { ...input, date });
  revalidatePath("/");
  revalidatePath(`/articles/${slug}`);
  return NextResponse.json({ ok: true, slug });
}
