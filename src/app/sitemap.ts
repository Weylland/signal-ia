import type { MetadataRoute } from "next";
import { getAllArticles, getAllTags } from "@/lib/articles";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, tags] = await Promise.all([getAllArticles(), getAllTags()]);

  return [
    { url: siteUrl, changeFrequency: "hourly", priority: 1 },
    { url: `${siteUrl}/tutos`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/glossaire`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/cette-semaine`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/sources`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/a-propos`, changeFrequency: "monthly", priority: 0.5 },
    ...articles.map((article) => ({
      url: `${siteUrl}/articles/${article.slug}`,
      lastModified: new Date(article.date),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...tags.map(({ tag }) => ({
      url: `${siteUrl}/tags/${encodeURIComponent(tag)}`,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
  ];
}
