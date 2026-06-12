import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { fetchOgImage } from "./og";

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

async function main() {
  const files = (await readdir(ARTICLES_DIR)).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const filePath = path.join(ARTICLES_DIR, file);
    const raw = await readFile(filePath, "utf-8");
    const { data, content } = matter(raw);

    if (data.image) {
      console.log(`— déjà une image : ${file}`);
      continue;
    }

    const firstSource = data.sources?.[0]?.url;
    if (!firstSource) continue;

    const image = await fetchOgImage(firstSource);
    if (!image) {
      console.log(`✗ pas d'og:image : ${file}`);
      continue;
    }

    data.image = image;
    await writeFile(filePath, matter.stringify(content, data), "utf-8");
    console.log(`✓ ${file} → ${image.slice(0, 80)}`);
  }
}

main();
