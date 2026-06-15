import type { Metadata } from "next";
import { getAllArticles } from "@/lib/articles";
import { getLang, getDict } from "@/lib/i18n";
import { ArticleRow } from "@/components/ArticleRow";
import { PageHeader, PageBand } from "@/components/PageShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cette semaine en IA",
  description:
    "Le récapitulatif des actualités IA et robotique des 7 derniers jours, en français.",
};

export default async function CetteSemainePage() {
  const lang = await getLang();
  const t = getDict(lang);
  const en = lang === "en";
  const locale = en ? "en-GB" : "fr-FR";

  const weekAgo = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
  const all = await getAllArticles({ type: "news" });
  const articles = all.filter((a) => a.date >= weekAgo);
  const distinctSources = new Set(articles.flatMap((a) => a.sources.map((s) => s.name))).size;
  const tutos = (await getAllArticles({ type: "tuto" })).length;

  const byDay = new Map<string, typeof articles>();
  for (const a of articles) {
    const day = a.date.slice(0, 10);
    byDay.set(day, [...(byDay.get(day) ?? []), a]);
  }
  const days = [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  const stats: [string, string][] = [
    [String(articles.length), en ? "Articles" : "Articles"],
    [String(distinctSources), "Sources"],
    [String(days.length), en ? "Days" : "Jours"],
    [String(tutos), "Tutos"],
  ];

  return (
    <div className="-mt-10">
      <PageHeader
        title={t.weekTitle}
        subtitle={t.weekIntro}
        right={
          <div className="flex flex-wrap gap-6">
            {stats.map(([v, l]) => (
              <div key={l} className="text-center">
                <div className="text-[28px] font-bold tracking-[-0.02em] text-[var(--ac)]">{v}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-f)]">
                  {l}
                </div>
              </div>
            ))}
          </div>
        }
      />
      <PageBand>
        {days.length === 0 ? (
          <p className="font-serif text-[15px] text-[var(--ink-d)]">{t.weekEmpty}</p>
        ) : (
          days.map(([day, dayArticles]) => (
            <div key={day} className="mb-16 last:mb-0">
              <div className="mb-4 border-l-2 border-[var(--ac)] pl-3 font-mono text-[12px] font-semibold capitalize tracking-[0.04em] text-[var(--ac)]">
                {new Date(day).toLocaleDateString(locale, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </div>
              {dayArticles.map((a) => (
                <ArticleRow key={a.slug} article={a} lang={lang} />
              ))}
            </div>
          ))
        )}
      </PageBand>
    </div>
  );
}
