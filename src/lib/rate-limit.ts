import { getDb } from "./db";

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const db = getDb();
  const now = Date.now();

  // Nettoyage occasionnel des entrées expirées (~1% des appels)
  if (Math.random() < 0.01) {
    db.prepare("DELETE FROM rate_limits WHERE reset_at < ?").run(now);
  }

  const row = db
    .prepare("SELECT count, reset_at FROM rate_limits WHERE key = ?")
    .get(key) as { count: number; reset_at: number } | undefined;

  if (!row || now >= row.reset_at) {
    db.prepare("INSERT OR REPLACE INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)").run(key, now + windowMs);
    return true;
  }

  if (row.count >= max) return false;

  db.prepare("UPDATE rate_limits SET count = count + 1 WHERE key = ?").run(key);
  return true;
}

export function rateLimitResponse() {
  return new Response(JSON.stringify({ error: "Trop de requêtes" }), {
    status: 429,
    headers: { "Content-Type": "application/json", "Retry-After": "60" },
  });
}
