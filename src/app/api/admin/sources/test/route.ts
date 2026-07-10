import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";
import { recordFetchResult } from "@/lib/sources";

// Teste un flux RSS à la demande. Si un id est fourni, enregistre le résultat
// (met à jour la santé de la source affichée partout).
export async function POST(request: NextRequest) {
  let body: { url?: string; id?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const url = (body.url ?? "").trim();
  if (!url) return NextResponse.json({ error: "URL manquante" }, { status: 400 });

  const parser = new Parser({ timeout: 15_000 });
  try {
    const feed = await parser.parseURL(url);
    const count = feed.items?.length ?? 0;
    if (typeof body.id === "number") recordFetchResult(body.id, true);
    return NextResponse.json({ ok: true, count, title: feed.title ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Flux illisible";
    if (typeof body.id === "number") recordFetchResult(body.id, false, message);
    return NextResponse.json({ ok: false, error: message });
  }
}
