import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

export type ArticleMeta = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  sources: { name: string; url: string }[];
};

export type Article = ArticleMeta & {
  html: string;
};

export async function getAllArticles(): Promise<ArticleMeta[]> {
  let files: string[];
  try {
    files = await readdir(ARTICLES_DIR);
  } catch {
    return [];
  }

  const articles = await Promise.all(
    files
      .filter((file) => file.endsWith(".md"))
      .map(async (file) => {
        const raw = await readFile(path.join(ARTICLES_DIR, file), "utf-8");
        const { data } = matter(raw);
        return {
          slug: file.replace(/\.md$/, ""),
          title: data.title as string,
          date: data.date as string,
          excerpt: (data.excerpt as string) ?? "",
          tags: (data.tags as string[]) ?? [],
          sources: (data.sources as { name: string; url: string }[]) ?? [],
        };
      })
  );

  return articles.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getArticle(slug: string): Promise<Article | null> {
  try {
    const raw = await readFile(path.join(ARTICLES_DIR, `${slug}.md`), "utf-8");
    const { data, content } = matter(raw);
    return {
      slug,
      title: data.title as string,
      date: data.date as string,
      excerpt: (data.excerpt as string) ?? "",
      tags: (data.tags as string[]) ?? [],
      sources: (data.sources as { name: string; url: string }[]) ?? [],
      html: await marked.parse(content),
    };
  } catch {
    return null;
  }
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
