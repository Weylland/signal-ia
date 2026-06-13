import { readFileSync } from "node:fs";
import path from "node:path";

try {
  const envFile = readFileSync(path.join(process.cwd(), ".env.local"), "utf-8");
  for (const line of envFile.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
} catch {}

import { getDb } from "../src/lib/db";
import { indexArticleFts } from "../src/lib/articles";

const db = getDb();
const rows = db.prepare("SELECT slug FROM articles").all() as { slug: string }[];
console.log(`Indexation FTS5 de ${rows.length} articles…`);
for (const { slug } of rows) {
  indexArticleFts(slug);
}
console.log("FTS5 réindexé.");
