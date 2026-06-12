import type { ArticleInput } from "./articles";
import { cleanHtml } from "./sanitize";

export function parseInput(body: Record<string, unknown>): ArticleInput | null {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const html = typeof body.html === "string" ? cleanHtml(body.html.trim()) : "";
  if (!title || !html) return null;

  return {
    title,
    html,
    excerpt: typeof body.excerpt === "string" ? body.excerpt.trim() : "",
    published: body.published === true,
    tags: Array.isArray(body.tags)
      ? body.tags.filter((t): t is string => typeof t === "string" && t.length > 0)
      : [],
    image:
      typeof body.image === "string" &&
      (body.image.startsWith("http") || body.image.startsWith("/uploads/"))
        ? body.image
        : null,
    date: typeof body.date === "string" && body.date ? body.date : undefined,
    sources: Array.isArray(body.sources)
      ? body.sources.filter(
          (s): s is { name: string; url: string } =>
            typeof s === "object" && s !== null &&
            typeof (s as Record<string, unknown>).name === "string" &&
            typeof (s as Record<string, unknown>).url === "string"
        )
      : undefined,
    type: body.type === "tuto" ? "tuto" : "news",
    tldr: Array.isArray(body.tldr)
      ? body.tldr
          .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
          .slice(0, 3)
      : [],
    scheduledAt:
      typeof body.scheduledAt === "string" && body.scheduledAt ? body.scheduledAt : null,
  };
}
