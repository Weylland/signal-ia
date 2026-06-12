import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { getDb } from "../src/lib/db";

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

async function main() {
  const db = getDb();
  const files = (await readdir(ARTICLES_DIR)).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    if (db.prepare("SELECT 1 FROM articles WHERE slug = ?").get(slug)) {
      console.log(`— déjà en base : ${slug}`);
      continue;
    }

    const raw = await readFile(path.join(ARTICLES_DIR, file), "utf-8");
    const { data, content } = matter(raw);

    db.prepare(
      `INSERT INTO articles (slug, title, excerpt, content_html, image, sources, published, date)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`
    ).run(
      slug,
      data.title,
      data.excerpt ?? "",
      await marked.parse(content),
      data.image ?? null,
      JSON.stringify(data.sources ?? []),
      data.date
    );

    const articleId = (db.prepare("SELECT id FROM articles WHERE slug = ?").get(slug) as { id: number }).id;
    for (const tag of (data.tags ?? []) as string[]) {
      db.prepare("INSERT OR IGNORE INTO tags (name) VALUES (?)").run(tag);
      const tagId = (db.prepare("SELECT id FROM tags WHERE name = ?").get(tag) as { id: number }).id;
      db.prepare("INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)").run(articleId, tagId);
    }
    console.log(`✓ ${slug}`);
  }

  console.log("\nMigration terminée.");
}

main();
