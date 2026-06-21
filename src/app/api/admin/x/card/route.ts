import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { generateXCard } from "@/lib/x-card";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug requis" }, { status: 400 });

  const row = getDb()
    .prepare("SELECT title, type FROM articles WHERE slug = ?")
    .get(slug) as { title: string; type: string } | undefined;
  if (!row) return NextResponse.json({ error: "article introuvable" }, { status: 404 });

  const card = await generateXCard({
    title: row.title,
    kind: row.type === "tuto" ? "tuto" : "news",
  });

  return new NextResponse(new Uint8Array(card), {
    headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
  });
}
