import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles, formatDate } from "@/lib/articles";
import { FadeUp } from "@/components/Reveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cette semaine en IA",
  description:
    "Le récapitulatif des actualités IA et robotique des 7 derniers jours, en français.",
};

export default async function CetteSemainePage() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
  const articles = (await getAllArticles({ type: "news" })).filter((a) => a.date >= weekAgo);

  const byDay = new Map<string, typeof articles>();
  for (const article of articles) {
    const day = article.date.slice(0, 10);
    byDay.set(day, [...(byDay.get(day) ?? []), article]);
  }
  const days = [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <div className="mx-auto max-w-3xl">
      <FadeUp>
        <header className="mb-10">
          <h1 className="font-display text-4xl font-bold tracking-tight">
            <span className="highlight">Cette semaine en IA</span>
          </h1>
          <p className="mt-4 leading-relaxed">
            Tout ce qui s&apos;est passé ces 7 derniers jours, jour par jour. Le rattrapage idéal
            si tu as décroché.
          </p>
        </header>
      </FadeUp>

      {days.length === 0 ? (
        <p className="nb-card max-w-md p-6 text-sm">Pas encore d&apos;articles cette semaine.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {days.map(([day, dayArticles], i) => (
            <FadeUp key={day} delay={Math.min(i * 0.05, 0.25)}>
              <section>
                <h2 className="mb-3 font-display text-lg font-bold capitalize">
                  {new Date(day).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </h2>
                <div className="nb-card divide-y-2 divide-ink">
                  {dayArticles.map((article) => (
                    <Link
                      key={article.slug}
                      href={`/articles/${article.slug}`}
                      className="group block p-4"
                    >
                      <p className="font-semibold group-hover:underline">
                        {article.breaking && <span className="mr-2">🔴</span>}
                        {article.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-ink/70">{article.excerpt}</p>
                    </Link>
                  ))}
                </div>
              </section>
            </FadeUp>
          ))}
        </div>
      )}

      <p className="mt-10 text-xs text-ink/50">
        Dernière mise à jour : {articles[0] ? formatDate(articles[0].date) : "—"}
      </p>
    </div>
  );
}
