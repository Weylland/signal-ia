import { readFile, readdir, writeFile, unlink, mkdir } from "node:fs/promises";
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
  image: string | null;
  sources: { name: string; url: string }[];
};

export type Article = ArticleMeta & {
  html: string;
  markdown: string;
};

function toMeta(slug: string, data: Record<string, unknown>): ArticleMeta {
  return {
    slug,
    title: (data.title as string) ?? slug,
    date: (data.date as string) ?? new Date().toISOString(),
    excerpt: (data.excerpt as string) ?? "",
    tags: (data.tags as string[]) ?? [],
    image: (data.image as string) ?? null,
    sources: (data.sources as { name: string; url: string }[]) ?? [],
  };
}

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
        return toMeta(file.replace(/\.md$/, ""), data);
      })
  );

  return articles.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getArticlesByTag(tag: string): Promise<ArticleMeta[]> {
  const articles = await getAllArticles();
  return articles.filter((article) => article.tags.includes(tag));
}

export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  const articles = await getAllArticles();
  const counts = new Map<string, number>();
  for (const article of articles) {
    for (const tag of article.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getArticle(slug: string): Promise<Article | null> {
  if (slug.includes("/") || slug.includes("\\") || slug.includes("..")) return null;
  try {
    const raw = await readFile(path.join(ARTICLES_DIR, `${slug}.md`), "utf-8");
    const { data, content } = matter(raw);
    return {
      ...toMeta(slug, data),
      markdown: content,
      html: await marked.parse(content),
    };
  } catch {
    return null;
  }
}

export type ArticleInput = {
  title: string;
  excerpt: string;
  tags: string[];
  image: string | null;
  markdown: string;
  date?: string;
  sources?: { name: string; url: string }[];
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

export async function saveArticle(slug: string, input: ArticleInput): Promise<void> {
  if (slug.includes("/") || slug.includes("\\") || slug.includes("..")) {
    throw new Error("Slug invalide");
  }
  await mkdir(ARTICLES_DIR, { recursive: true });
  const frontmatter = {
    title: input.title,
    date: input.date ?? new Date().toISOString(),
    excerpt: input.excerpt,
    tags: input.tags,
    ...(input.image ? { image: input.image } : {}),
    sources: input.sources ?? [],
  };
  await writeFile(
    path.join(ARTICLES_DIR, `${slug}.md`),
    matter.stringify(input.markdown.trim() + "\n", frontmatter),
    "utf-8"
  );
}

export async function deleteArticle(slug: string): Promise<void> {
  if (slug.includes("/") || slug.includes("\\") || slug.includes("..")) {
    throw new Error("Slug invalide");
  }
  await unlink(path.join(ARTICLES_DIR, `${slug}.md`));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
