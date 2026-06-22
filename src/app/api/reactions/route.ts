import { NextRequest, NextResponse } from "next/server";
import { addReaction, getReactions } from "@/lib/articles";
import { getDb } from "@/lib/db";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const REACTION_TYPES = ["useful", "fire", "think"] as const;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  // Garde-fou global : max 30 réactions / min / IP, tous slugs confondus
  if (!rateLimit(`reaction:${ip}`, 30, 60_000)) {
    return rateLimitResponse();
  }

  let parsed: { slug?: unknown; reaction?: unknown };
  try {
    parsed = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const slug = typeof parsed.slug === "string" ? parsed.slug : "";
  const reaction = typeof parsed.reaction === "string" ? parsed.reaction : "";
  if (!slug) {
    return NextResponse.json({ error: "Slug manquant" }, { status: 400 });
  }

  if (!REACTION_TYPES.includes(reaction as typeof REACTION_TYPES[number])) {
    return NextResponse.json({ error: "Réaction invalide" }, { status: 400 });
  }

  // L'article doit exister avant d'enregistrer quoi que ce soit.
  const db = getDb();
  const article = db.prepare("SELECT id FROM articles WHERE slug = ?").get(slug) as { id: number } | undefined;
  if (!article) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Simple rate-limit: 1 reaction per slug per IP per session (stored in memory)
  const key = `${ip}:${slug}:${reaction}`;
  if (recentReactions.has(key)) {
    return NextResponse.json({ error: "Déjà réagi" }, { status: 429 });
  }
  recentReactions.add(key);
  setTimeout(() => recentReactions.delete(key), 10 * 60_000);

  addReaction(slug, reaction as "useful" | "fire" | "think");
  return NextResponse.json(getReactions(article.id));
}

const recentReactions = new Set<string>();
