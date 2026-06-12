import { getAllArticles } from "@/lib/articles";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const articles = await getAllArticles();

  const items = articles
    .slice(0, 30)
    .map(
      (article) => `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${siteUrl}/articles/${article.slug}</link>
      <guid>${siteUrl}/articles/${article.slug}</guid>
      <pubDate>${new Date(article.date).toUTCString()}</pubDate>
      <description>${escapeXml(article.excerpt)}</description>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>signal·ia</title>
    <link>${siteUrl}</link>
    <description>L'essentiel de l'actualité IA et robotique, chaque matin.</description>
    <language>fr</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
