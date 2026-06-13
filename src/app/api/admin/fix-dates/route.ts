import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  const expected = process.env.CLAUDE_API_KEY;
  const fromHeader = request.headers.get("x-admin-secret");
  const fromQuery = request.nextUrl.searchParams.get("key");
  if (!expected || (fromHeader !== expected && fromQuery !== expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const now = new Date().toISOString();

  // Pour chaque article lié à des pending_news, récupère la date RSS la plus récente
  const rows = db.prepare(`
    SELECT pn.article_slug, MAX(pn.published_at) as best_date
    FROM pending_news pn
    WHERE pn.article_slug IS NOT NULL
      AND pn.published_at IS NOT NULL
      AND pn.published_at <= ?
    GROUP BY pn.article_slug
  `).all(now) as { article_slug: string; best_date: string }[];

  const update = db.prepare("UPDATE articles SET date = ? WHERE slug = ? AND date > ?");
  // "date > ?" évite d'écraser une date déjà corrigée manuellement qui serait antérieure

  let fixed = 0;
  for (const row of rows) {
    const result = update.run(row.best_date, row.article_slug, row.best_date);
    if (result.changes) fixed++;
  }

  return NextResponse.json({ fixed, total: rows.length });
}
