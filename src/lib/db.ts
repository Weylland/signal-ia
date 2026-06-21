import Database from "better-sqlite3";
import path from "node:path";
import { mkdirSync } from "node:fs";

let db: Database.Database | null = null;

function addColumnIfMissing(
  database: Database.Database,
  table: string,
  column: string,
  definition: string
): void {
  const columns = database
    .prepare(`PRAGMA table_info(${table})`)
    .all() as { name: string }[];
  if (!columns.some((c) => c.name === column)) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export function getDb(): Database.Database {
  if (db) return db;

  const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), "database.sqlite");
  try { mkdirSync(path.dirname(dbPath), { recursive: true }); } catch {}
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL DEFAULT '',
      content_html TEXT NOT NULL,
      image TEXT,
      sources TEXT NOT NULL DEFAULT '[]',
      published INTEGER NOT NULL DEFAULT 0,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS article_tags (
      article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (article_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT UNIQUE NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      last_fetch_at TEXT,
      last_status TEXT,
      last_error TEXT
    );

    CREATE TABLE IF NOT EXISTS pending_news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      source_name TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      published_at TEXT,
      score INTEGER,
      status TEXT NOT NULL DEFAULT 'new',
      article_slug TEXT,
      seen_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS pipeline_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      finished_at TEXT,
      status TEXT NOT NULL DEFAULT 'running',
      items_seen INTEGER NOT NULL DEFAULT 0,
      items_new INTEGER NOT NULL DEFAULT 0,
      articles_created INTEGER NOT NULL DEFAULT 0,
      log TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS glossary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      term TEXT NOT NULL,
      definition_html TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_articles_published_date ON articles(published, date DESC);
    CREATE INDEX IF NOT EXISTS idx_pending_news_status ON pending_news(status, seen_at DESC);
  `);

  addColumnIfMissing(db, "articles", "type", "TEXT NOT NULL DEFAULT 'news'");
  addColumnIfMissing(db, "articles", "score", "INTEGER");
  addColumnIfMissing(db, "articles", "breaking_until", "TEXT");
  addColumnIfMissing(db, "articles", "views", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing(db, "articles", "tldr", "TEXT NOT NULL DEFAULT '[]'");
  addColumnIfMissing(db, "articles", "scheduled_at", "TEXT");
  addColumnIfMissing(db, "articles", "title_en", "TEXT");
  addColumnIfMissing(db, "articles", "excerpt_en", "TEXT");
  addColumnIfMissing(db, "articles", "content_html_en", "TEXT");
  addColumnIfMissing(db, "articles", "tldr_en", "TEXT");
  addColumnIfMissing(db, "articles", "difficulty", "TEXT");
  addColumnIfMissing(db, "glossary", "definition_html_en", "TEXT");

  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_articles_type ON articles(type, published, date DESC)"
  );

  // FTS5 virtual table for fast full-text search
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
      slug UNINDEXED,
      title,
      excerpt,
      content_html,
      tags_text,
      content='',
      tokenize='unicode61 remove_diacritics 1'
    );
  `);

  // Reactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS article_reactions (
      article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      reaction TEXT NOT NULL CHECK(reaction IN ('useful','fire','think')),
      count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (article_id, reaction)
    );
  `);

  // View snapshots for trending (daily delta)
  db.exec(`
    CREATE TABLE IF NOT EXISTS view_snapshots (
      article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      snapped_at TEXT NOT NULL,
      views INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (article_id, snapped_at)
    );
  `);

  addColumnIfMissing(db, "pending_news", "body_html", "TEXT");
  addColumnIfMissing(db, "sources", "article_count", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing(db, "sources", "avg_score", "REAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS newsletter_sends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject TEXT NOT NULL,
      recipients INTEGER NOT NULL DEFAULT 0,
      errors INTEGER NOT NULL DEFAULT 0,
      sent_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS x_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_slug TEXT NOT NULL,
      tweet_id TEXT,
      lang TEXT NOT NULL DEFAULT 'fr',
      posted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
    CREATE INDEX IF NOT EXISTS idx_x_posts_slug ON x_posts(article_slug, posted_at DESC);
  `);

  return db;
}
