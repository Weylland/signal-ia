type Entry = { count: number; reset: number };
const store = new Map<string, Entry>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now >= entry.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

export function rateLimitResponse() {
  return new Response(JSON.stringify({ error: "Trop de requêtes" }), {
    status: 429,
    headers: { "Content-Type": "application/json", "Retry-After": "60" },
  });
}
