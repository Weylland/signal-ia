import { getDb } from "./db";

export type ArticleType = "news" | "tuto";

export type ArticleMeta = {
  id: number;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  image: string | null;
  published: boolean;
  sources: { name: string; url: string }[];
  type: ArticleType;
  tldr: string[];
  views: number;
  breaking: boolean;
  scheduledAt: string | null;
};

export type Article = ArticleMeta & {
  html: string;
};

type ArticleRow = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content_html: string;
  image: string | null;
  sources: string;
  published: number;
  date: string;
  type: string;
  tldr: string;
  views: number;
  breaking_until: string | null;
  scheduled_at: string | null;
};

function safeJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function rowToMeta(row: ArticleRow): ArticleMeta {
  const db = getDb();
  const tags = db
    .prepare(
      `SELECT t.name FROM tags t
       JOIN article_tags at ON at.tag_id = t.id
       WHERE at.article_id = ? ORDER BY t.name`
    )
    .all(row.id) as { name: string }[];

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    date: row.date,
    excerpt: row.excerpt,
    tags: tags.map((t) => t.name),
    image: row.image,
    published: row.published === 1,
    sources: safeJson(row.sources, []),
    type: row.type === "tuto" ? "tuto" : "news",
    tldr: safeJson(row.tldr, []),
    views: row.views,
    breaking: row.breaking_until !== null && row.breaking_until > new Date().toISOString(),
    scheduledAt: row.scheduled_at,
  };
}

export function publishDueScheduledArticles(): void {
  const db = getDb();
  db.prepare(
    `UPDATE articles SET published = 1, scheduled_at = NULL,
     date = scheduled_at, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE published = 0 AND scheduled_at IS NOT NULL AND scheduled_at <= ?`
  ).run(new Date().toISOString());
}

export async function getAllArticles(options?: {
  includeDrafts?: boolean;
  search?: string;
  type?: ArticleType;
  limit?: number;
}): Promise<ArticleMeta[]> {
  const db = getDb();
  publishDueScheduledArticles();
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (!options?.includeDrafts) {
    clauses.push("published = 1");
  }
  if (options?.type) {
    clauses.push("type = ?");
    params.push(options.type);
  }
  if (options?.search) {
    clauses.push("(title LIKE ? OR excerpt LIKE ? OR content_html LIKE ?)");
    const like = `%${options.search}%`;
    params.push(like, like, like);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const limit = options?.limit ? `LIMIT ${Math.floor(options.limit)}` : "";
  const rows = db
    .prepare(`SELECT * FROM articles ${where} ORDER BY date DESC ${limit}`)
    .all(...params) as ArticleRow[];

  return rows.map(rowToMeta);
}

export async function getBreakingArticles(): Promise<ArticleMeta[]> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM articles
       WHERE published = 1 AND breaking_until IS NOT NULL AND breaking_until > ?
       ORDER BY date DESC`
    )
    .all(new Date().toISOString()) as ArticleRow[];
  return rows.map(rowToMeta);
}

export async function getMostViewedArticles(limit = 5): Promise<ArticleMeta[]> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM articles WHERE published = 1 AND views > 0
       ORDER BY views DESC, date DESC LIMIT ?`
    )
    .all(limit) as ArticleRow[];
  return rows.map(rowToMeta);
}

export async function getRelatedArticles(slug: string, limit = 3): Promise<ArticleMeta[]> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT a.*, COUNT(*) AS shared FROM articles a
       JOIN article_tags at ON at.article_id = a.id
       WHERE at.tag_id IN (
         SELECT at2.tag_id FROM article_tags at2
         JOIN articles a2 ON a2.id = at2.article_id WHERE a2.slug = ?
       )
       AND a.slug != ? AND a.published = 1
       GROUP BY a.id ORDER BY shared DESC, a.date DESC LIMIT ?`
    )
    .all(slug, slug, limit) as ArticleRow[];
  return rows.map(rowToMeta);
}

export function incrementViews(slug: string): void {
  const db = getDb();
  db.prepare("UPDATE articles SET views = views + 1 WHERE slug = ? AND published = 1").run(slug);
}

export async function getArticlesByTag(tag: string): Promise<ArticleMeta[]> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT a.* FROM articles a
       JOIN article_tags at ON at.article_id = a.id
       JOIN tags t ON t.id = at.tag_id
       WHERE t.name = ? AND a.published = 1
       ORDER BY a.date DESC`
    )
    .all(tag) as ArticleRow[];
  return rows.map(rowToMeta);
}

export async function getAllTags(options?: {
  includeDrafts?: boolean;
}): Promise<{ tag: string; count: number }[]> {
  const db = getDb();
  const publishedFilter = options?.includeDrafts ? "" : "AND a.published = 1";
  const rows = db
    .prepare(
      `SELECT t.name AS tag, COUNT(a.id) AS count FROM tags t
       LEFT JOIN article_tags at ON at.tag_id = t.id
       LEFT JOIN articles a ON a.id = at.article_id ${publishedFilter}
       GROUP BY t.id ORDER BY count DESC, t.name`
    )
    .all() as { tag: string; count: number }[];
  return rows;
}

export async function getArticle(
  slug: string,
  options?: { includeDrafts?: boolean }
): Promise<Article | null> {
  const db = getDb();
  publishDueScheduledArticles();
  const row = db.prepare("SELECT * FROM articles WHERE slug = ?").get(slug) as
    | ArticleRow
    | undefined;
  if (!row) return null;
  if (!row.published && !options?.includeDrafts) return null;
  return { ...rowToMeta(row), html: row.content_html };
}

export type ArticleInput = {
  title: string;
  excerpt: string;
  tags: string[];
  image: string | null;
  html: string;
  published: boolean;
  date?: string;
  sources?: { name: string; url: string }[];
  type?: ArticleType;
  tldr?: string[];
  breakingUntil?: string | null;
  scheduledAt?: string | null;
  score?: number | null;
};

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function setTags(articleId: number, tags: string[]): void {
  const db = getDb();
  db.prepare("DELETE FROM article_tags WHERE article_id = ?").run(articleId);
  const insertTag = db.prepare("INSERT OR IGNORE INTO tags (name) VALUES (?)");
  const getTag = db.prepare("SELECT id FROM tags WHERE name = ?");
  const link = db.prepare("INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)");
  for (const tag of tags) {
    const name = tag.trim().toLowerCase();
    if (!name) continue;
    insertTag.run(name);
    const { id } = getTag.get(name) as { id: number };
    link.run(articleId, id);
  }
  db.prepare(
    "DELETE FROM tags WHERE id NOT IN (SELECT DISTINCT tag_id FROM article_tags)"
  ).run();
}

export async function createArticle(input: ArticleInput): Promise<string> {
  const db = getDb();
  const date = input.date ?? new Date().toISOString();
  let slug = `${date.slice(0, 10)}-${slugify(input.title)}`;
  let suffix = 1;
  while (db.prepare("SELECT 1 FROM articles WHERE slug = ?").get(slug)) {
    slug = `${date.slice(0, 10)}-${slugify(input.title)}-${++suffix}`;
  }

  const result = db
    .prepare(
      `INSERT INTO articles
       (slug, title, excerpt, content_html, image, sources, published, date,
        type, tldr, breaking_until, scheduled_at, score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      slug,
      input.title,
      input.excerpt,
      input.html,
      input.image,
      JSON.stringify(input.sources ?? []),
      input.published ? 1 : 0,
      date,
      input.type ?? "news",
      JSON.stringify(input.tldr ?? []),
      input.breakingUntil ?? null,
      input.scheduledAt ?? null,
      input.score ?? null
    );

  setTags(Number(result.lastInsertRowid), input.tags);
  return slug;
}

export async function updateArticle(slug: string, input: ArticleInput): Promise<void> {
  const db = getDb();
  const row = db
    .prepare("SELECT id, date, sources, type, tldr, breaking_until, scheduled_at FROM articles WHERE slug = ?")
    .get(slug) as
    | {
        id: number;
        date: string;
        sources: string;
        type: string;
        tldr: string;
        breaking_until: string | null;
        scheduled_at: string | null;
      }
    | undefined;
  if (!row) throw new Error("Article introuvable");

  db.prepare(
    `UPDATE articles SET title = ?, excerpt = ?, content_html = ?, image = ?, sources = ?,
     published = ?, date = ?, type = ?, tldr = ?, breaking_until = ?, scheduled_at = ?,
     updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = ?`
  ).run(
    input.title,
    input.excerpt,
    input.html,
    input.image,
    JSON.stringify(input.sources ?? safeJson(row.sources, [])),
    input.published ? 1 : 0,
    input.date ?? row.date,
    input.type ?? row.type,
    JSON.stringify(input.tldr ?? safeJson(row.tldr, [])),
    input.breakingUntil === undefined ? row.breaking_until : input.breakingUntil,
    input.scheduledAt === undefined ? row.scheduled_at : input.scheduledAt,
    row.id
  );

  setTags(row.id, input.tags);
}

export async function deleteArticle(slug: string): Promise<void> {
  const db = getDb();
  db.prepare("DELETE FROM articles WHERE slug = ?").run(slug);
  db.prepare(
    "DELETE FROM tags WHERE id NOT IN (SELECT DISTINCT tag_id FROM article_tags)"
  ).run();
}

export async function renameTag(oldName: string, newName: string): Promise<void> {
  const db = getDb();
  const clean = newName.trim().toLowerCase();
  if (!clean) throw new Error("Nom de tag invalide");
  const existing = db.prepare("SELECT id FROM tags WHERE name = ?").get(clean) as
    | { id: number }
    | undefined;
  const old = db.prepare("SELECT id FROM tags WHERE name = ?").get(oldName) as
    | { id: number }
    | undefined;
  if (!old) throw new Error("Tag introuvable");

  if (existing && existing.id !== old.id) {
    db.prepare("UPDATE OR IGNORE article_tags SET tag_id = ? WHERE tag_id = ?").run(
      existing.id,
      old.id
    );
    db.prepare("DELETE FROM article_tags WHERE tag_id = ?").run(old.id);
    db.prepare("DELETE FROM tags WHERE id = ?").run(old.id);
  } else {
    db.prepare("UPDATE tags SET name = ? WHERE id = ?").run(clean, old.id);
  }
}

export async function deleteTag(name: string): Promise<void> {
  const db = getDb();
  db.prepare("DELETE FROM tags WHERE name = ?").run(name);
}

export async function getStats(): Promise<{
  total: number;
  published: number;
  drafts: number;
  tags: number;
  views: number;
  tutos: number;
}> {
  const db = getDb();
  const counts = db
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN published = 1 THEN 1 ELSE 0 END) AS published,
              SUM(views) AS views,
              SUM(CASE WHEN type = 'tuto' THEN 1 ELSE 0 END) AS tutos
       FROM articles`
    )
    .get() as { total: number; published: number | null; views: number | null; tutos: number | null };
  const tagCount = db.prepare("SELECT COUNT(*) AS c FROM tags").get() as { c: number };
  const published = counts.published ?? 0;
  return {
    total: counts.total,
    published,
    drafts: counts.total - published,
    tags: tagCount.c,
    views: counts.views ?? 0,
    tutos: counts.tutos ?? 0,
  };
}

export function readingTimeMinutes(html: string): number {
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
