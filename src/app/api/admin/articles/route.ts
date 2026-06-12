import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createArticle } from "@/lib/articles";
import { parseInput } from "@/lib/article-input";

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

  const slug = await createArticle(input);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, slug });
}
