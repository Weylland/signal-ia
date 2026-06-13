import { getSubscribers } from "@/lib/newsletter";
import { getAllArticles } from "@/lib/articles";
import { NewsletterAdmin } from "@/components/admin/NewsletterAdmin";

export const dynamic = "force-dynamic";

export default async function NewsletterPage() {
  const [subscribers, articles] = await Promise.all([
    Promise.resolve(getSubscribers()),
    getAllArticles({ limit: 20 }),
  ]);

  const weekAgo = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
  const weekArticles = articles.filter((a) => a.date >= weekAgo).slice(0, 5);

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="font-display text-3xl font-bold">Newsletter</h1>
        <span className="nb-pill">{subscribers.length} abonnés</span>
      </div>
      <NewsletterAdmin
        subscriberCount={subscribers.length}
        weekArticles={weekArticles.map((a) => ({ title: a.title, excerpt: a.excerpt, slug: a.slug }))}
        subscribers={subscribers}
      />
    </div>
  );
}
