import { getSubscribers } from "@/lib/newsletter";
import { getAllArticles } from "@/lib/articles";
import { NewsletterAdmin } from "@/components/admin/NewsletterAdmin";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewsletterPage() {
  const [subscribers, articles] = await Promise.all([
    Promise.resolve(getSubscribers()),
    getAllArticles({ limit: 20 }),
  ]);

  const weekAgo = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
  const weekArticles = articles.filter((a) => a.date >= weekAgo).slice(0, 5);

  const db = getDb();
  const sentCount = (() => { try { return (db.prepare("SELECT COUNT(*) AS c FROM newsletter_sends").get() as { c: number }).c; } catch { return 0; } })();

  const metrics = [
    { label: "Abonnés", value: subscribers.length },
    { label: "Envois effectués", value: sentCount },
    { label: "Articles cette semaine", value: weekArticles.length },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "var(--s7)" }}>
        <h1 style={{ fontFamily: "var(--ff-h)", fontSize: 26, fontWeight: 700, letterSpacing: "-.02em" }}>Newsletter</h1>
        <p style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-f)", marginTop: "var(--s2)" }}>
          {subscribers.length} abonnés actifs
        </p>
      </div>

      {/* Metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "var(--s4)", marginBottom: "var(--s7)" }}>
        {metrics.map((m) => (
          <div key={m.label} style={{ background: "var(--bg-r)", border: "1px solid var(--ln-h)", padding: "var(--s5)", boxShadow: "2px 2px 0 var(--ln-h)", display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
            <div style={{ fontFamily: "var(--ff-m)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--ink-f)" }}>{m.label}</div>
            <div style={{ fontFamily: "var(--ff-h)", fontSize: 34, fontWeight: 700, letterSpacing: "-.02em", color: "var(--ink)", lineHeight: 1 }}>{m.value}</div>
          </div>
        ))}
      </div>

      <NewsletterAdmin
        subscriberCount={subscribers.length}
        weekArticles={weekArticles.map((a) => ({ title: a.title, excerpt: a.excerpt, slug: a.slug }))}
        subscribers={subscribers}
      />
    </div>
  );
}
