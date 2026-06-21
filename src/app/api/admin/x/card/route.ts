import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { generateXCard } from "@/lib/x-card";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const slug = params.get("slug");

  let title: string;
  let kind: "news" | "tuto" = "news";
  let tag: string | undefined;

  if (slug) {
    const row = getDb()
      .prepare("SELECT title, type FROM articles WHERE slug = ?")
      .get(slug) as { title: string; type: string } | undefined;
    if (!row) return NextResponse.json({ error: "article introuvable" }, { status: 404 });
    title = row.title;
    kind = row.type === "tuto" ? "tuto" : "news";
  } else {
    title = params.get("title")?.trim() || "";
    tag = params.get("tag")?.trim() || undefined;
    if (!title) return NextResponse.json({ error: "slug ou title requis" }, { status: 400 });
  }

  const card = await generateXCard({ title, kind, tag });

  return new NextResponse(new Uint8Array(card), {
    headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
  });
}
