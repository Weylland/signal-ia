import Parser from "rss-parser";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { SOURCES, type Source } from "./sources";

export type RawItem = {
  sourceId: string;
  sourceName: string;
  title: string;
  link: string;
  publishedAt: string | null;
  summary: string;
};

const OUTPUT_DIR = path.join(process.cwd(), "data", "raw");
const MAX_ITEMS_PER_SOURCE = 10;

async function scrapeSource(parser: Parser, source: Source): Promise<RawItem[]> {
  const feed = await parser.parseURL(source.feedUrl);
  return (feed.items ?? []).slice(0, MAX_ITEMS_PER_SOURCE).map((item) => ({
    sourceId: source.id,
    sourceName: source.name,
    title: item.title?.trim() ?? "(sans titre)",
    link: item.link ?? "",
    publishedAt: item.isoDate ?? item.pubDate ?? null,
    summary: (item.contentSnippet ?? "").trim().slice(0, 500),
  }));
}

async function readExisting(filePath: string): Promise<RawItem[]> {
  try {
    return JSON.parse(await readFile(filePath, "utf-8"));
  } catch {
    return [];
  }
}

async function main() {
  const parser = new Parser({ timeout: 15_000 });
  const items: RawItem[] = [];

  for (const source of SOURCES) {
    try {
      const sourceItems = await scrapeSource(parser, source);
      console.log(`✓ ${source.name} : ${sourceItems.length} items`);
      items.push(...sourceItems);
    } catch (error) {
      console.error(`✗ ${source.name} : ${error instanceof Error ? error.message : error}`);
    }
  }

  if (items.length === 0) {
    console.error("Aucun item récupéré, abandon.");
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  const outputPath = path.join(OUTPUT_DIR, `${today}.json`);

  await mkdir(OUTPUT_DIR, { recursive: true });
  const existing = await readExisting(outputPath);
  const existingLinks = new Set(existing.map((item) => item.link));
  const newItems = items.filter((item) => !existingLinks.has(item.link));
  const merged = [...newItems, ...existing];

  await writeFile(outputPath, JSON.stringify(merged, null, 2), "utf-8");
  console.log(`\n${newItems.length} nouveaux items (${merged.length} au total) → ${outputPath}`);
}

main();
