import { getDb } from "./db";

export type Source = {
  id: number;
  name: string;
  url: string;
  active: boolean;
  lastFetchAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
};

type SourceRow = {
  id: number;
  name: string;
  url: string;
  active: number;
  last_fetch_at: string | null;
  last_status: string | null;
  last_error: string | null;
};

const DEFAULT_SOURCES: { name: string; url: string }[] = [
  { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
  { name: "Hugging Face Blog", url: "https://huggingface.co/blog/feed.xml" },
  { name: "The Verge AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
  { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/" },
  { name: "Ars Technica AI", url: "https://arstechnica.com/ai/feed/" },
  { name: "MIT Technology Review AI", url: "https://www.technologyreview.com/topic/artificial-intelligence/feed" },
  { name: "Google AI Blog", url: "https://blog.google/technology/ai/rss/" },
  { name: "OpenAI News", url: "https://openai.com/news/rss.xml" },
  { name: "IEEE Spectrum Robotics", url: "https://spectrum.ieee.org/feeds/topic/robotics.rss" },
  { name: "MarkTechPost", url: "https://www.marktechpost.com/feed/" },
];

function rowToSource(row: SourceRow): Source {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    active: row.active === 1,
    lastFetchAt: row.last_fetch_at,
    lastStatus: row.last_status,
    lastError: row.last_error,
  };
}

export function seedDefaultSources(): void {
  const db = getDb();
  const count = db.prepare("SELECT COUNT(*) AS c FROM sources").get() as { c: number };
  if (count.c > 0) return;
  const insert = db.prepare("INSERT OR IGNORE INTO sources (name, url) VALUES (?, ?)");
  for (const s of DEFAULT_SOURCES) insert.run(s.name, s.url);
}

export function getSources(options?: { activeOnly?: boolean }): Source[] {
  const db = getDb();
  seedDefaultSources();
  const where = options?.activeOnly ? "WHERE active = 1" : "";
  const rows = db
    .prepare(`SELECT * FROM sources ${where} ORDER BY name`)
    .all() as SourceRow[];
  return rows.map(rowToSource);
}

export function addSource(name: string, url: string): void {
  const db = getDb();
  db.prepare("INSERT INTO sources (name, url) VALUES (?, ?)").run(name.trim(), url.trim());
}

export function updateSource(
  id: number,
  fields: { name?: string; url?: string; active?: boolean }
): void {
  const db = getDb();
  const row = db.prepare("SELECT * FROM sources WHERE id = ?").get(id) as SourceRow | undefined;
  if (!row) throw new Error("Source introuvable");
  db.prepare("UPDATE sources SET name = ?, url = ?, active = ? WHERE id = ?").run(
    fields.name?.trim() ?? row.name,
    fields.url?.trim() ?? row.url,
    fields.active === undefined ? row.active : fields.active ? 1 : 0,
    id
  );
}

export function deleteSource(id: number): void {
  const db = getDb();
  db.prepare("DELETE FROM sources WHERE id = ?").run(id);
}

export function recordFetchResult(id: number, ok: boolean, error?: string): void {
  const db = getDb();
  db.prepare(
    `UPDATE sources SET last_fetch_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
     last_status = ?, last_error = ? WHERE id = ?`
  ).run(ok ? "ok" : "error", error ?? null, id);
}
