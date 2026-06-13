import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles, localizeMeta, formatDate } from "@/lib/articles";
import { getLang, getDict } from "@/lib/i18n";
import { FadeUp } from "@/components/Reveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cette semaine en IA",
  description:
    "Le récapitulatif des actualités IA et robotique des 7 derniers jours, en français.",
};

export default async function CetteSemainePage() {
  const lang = await getLang();
  const t = getDict(lang);
  const locale = lang === "en" ? "en-GB" : "fr-FR";

  const weekAgo = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
  const articles = (await getAllArticles({ type: "news" })).filter((a) => a.date >= weekAgo);
  const distinctSources = new Set(
    articles.flatMap((a) => a.sources.map((s) => s.name))
  ).size;

  const byDay = new Map<string, typeof articles>();
  for (const article of articles) {
    const day = article.date.slice(0, 10);
    byDay.set(day, [...(byDay.get(day) ?? []), article]);
  }
  const days = [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <div className="mx-auto max-w-3xl">
      <FadeUp>
        <header className="mb-8">
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{t.weekTitle}</h1>
          <p className="mt-4 leading-relaxed text-[var(--ink-dim)]">{t.weekIntro}</p>
        </header>
      </FadeUp>

      {articles.length > 0 && (
        <FadeUp delay={0.05}>
          <div className="mb-10 grid grid-cols-3 divide-x-2 divide-ink border-2 border-ink shadow-[4px_4px_0_var(--ink)]">
            <div className="p-5 text-center">
              <p className="font-display text-4xl font-bold text-[var(--accent)]">
                {articles.length}
              </p>
              <p className="meta mt-1 uppercase">{lang === "en" ? "Articles" : "Articles"}</p>
            </div>
            <div className="p-5 text-center">
              <p className="font-display text-4xl font-bold text-[var(--accent)]">
                {days.length}
              </p>
              <p className="meta mt-1 uppercase">{lang === "en" ? "Days" : "Jours"}</p>
            </div>
            <div className="p-5 text-center">
              <p className="font-display text-4xl font-bold text-[var(--accent)]">
                {distinctSources}
              </p>
              <p className="meta mt-1 uppercase">{lang === "en" ? "Sources" : "Sources"}</p>
            </div>
          </div>
        </FadeUp>
      )}

      {days.length === 0 ? (
        <p className="nb-card max-w-md p-6 text-sm">{t.weekEmpty}</p>
      ) : (
        <div className="flex flex-col gap-10">
          {days.map(([day, dayArticles], i) => (
            <FadeUp key={day} delay={Math.min(i * 0.05, 0.25)}>
              <section>
                <div className="section-head">
                  <span className="idx">{String(days.length - i).padStart(2, "0")}</span>
                  <h2>
                    {new Date(day).toLocaleDateString(locale, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </h2>
                  <span className="more !border-0">{t.weekArticles(dayArticles.length)}</span>
                </div>
                <div className="flex flex-col">
                  {dayArticles.map((article) => {
                    const loc = localizeMeta(article, lang);
                    return (
                      <Link
                        key={article.slug}
                        href={`/articles/${article.slug}`}
                        className="group border-b border-line py-3.5"
                      >
                        <p className="flex flex-wrap items-baseline gap-x-3 font-medium group-hover:text-[var(--accent)]">
                          {article.breaking && <span className="nb-pill tag--hot">{t.breaking}</span>}
                          {loc.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-[var(--ink-dim)]">
                          {loc.excerpt}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </section>
            </FadeUp>
          ))}
        </div>
      )}

      <p className="meta mt-10 uppercase">
        {t.weekUpdated} : {articles[0] ? formatDate(articles[0].date) : "—"}
      </p>
    </div>
  );
}
