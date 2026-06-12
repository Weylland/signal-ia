import Image from "next/image";
import Link from "next/link";
import {
  getAllArticles,
  getAllTags,
  getBreakingArticles,
  getMostViewedArticles,
  formatDate,
} from "@/lib/articles";
import { getSettings } from "@/lib/settings";
import { ArticleCard } from "@/components/ArticleCard";
import { AdSlot } from "@/components/AdSlot";
import { FadeIn, FadeUp } from "@/components/Reveal";

const pillColors = ["var(--sunshine)", "var(--mint)", "var(--sky)", "var(--peach)"];

export const dynamic = "force-dynamic";

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 60) return `il y a ${Math.max(1, minutes)} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return formatDate(iso);
}

export default async function Home() {
  const settings = getSettings();

  if (settings.maintenanceMode) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="font-display text-3xl font-bold">On revient vite.</p>
        <p className="mt-4">Le site est en maintenance. Repasse dans quelques minutes.</p>
      </div>
    );
  }

  const [articles, tags, breaking, mostViewed, tutos] = await Promise.all([
    getAllArticles({ type: "news" }),
    getAllTags(),
    getBreakingArticles(),
    getMostViewedArticles(4),
    getAllArticles({ type: "tuto", limit: 3 }),
  ]);

  if (articles.length === 0 && tutos.length === 0) {
    return <p className="text-sm">Aucun article publié pour l&apos;instant.</p>;
  }

  const [featured, ...rest] = articles;
  const dayAgo = new Date(Date.now() - 24 * 3600_000).toISOString();
  const last24h = articles.filter((a) => a.date >= dayAgo);

  return (
    <div className="flex flex-col gap-14">
      {breaking.length > 0 && (
        <FadeIn>
          <Link
            href={`/articles/${breaking[0].slug}`}
            className="nb-card flex flex-wrap items-center gap-3 bg-[var(--peach)] p-4"
            style={{ boxShadow: "var(--shadow-lg)" }}
          >
            <span className="nb-pill animate-pulse bg-cream">🔴 À chaud</span>
            <span className="font-display text-lg font-bold">{breaking[0].title}</span>
            <span className="ml-auto text-sm font-semibold">Lire →</span>
          </Link>
        </FadeIn>
      )}

      {featured && (
        <FadeIn>
          <section
            className="nb-card grid overflow-hidden sm:grid-cols-2"
            style={{ boxShadow: "var(--shadow-lg)" }}
          >
            <Link
              href={`/articles/${featured.slug}`}
              className="relative block aspect-[16/10] border-b-[2.5px] border-ink bg-cream-2 sm:aspect-auto sm:min-h-[380px] sm:border-b-0 sm:border-r-[2.5px]"
            >
              {featured.image && (
                <Image
                  src={featured.image}
                  alt={featured.title}
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover"
                />
              )}
            </Link>
            <div className="flex flex-col justify-center bg-cream p-7 sm:p-10">
              <p className="mb-4">
                <span className="nb-pill bg-peach">★ À la une</span>
              </p>
              <Link href={`/articles/${featured.slug}`}>
                <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                  <span className="highlight">{featured.title}</span>
                </h1>
              </Link>
              <p className="mt-4 leading-relaxed">{featured.excerpt}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="font-display text-xs font-bold uppercase tracking-wider">
                  {formatDate(featured.date)}
                </span>
                {featured.tags.map((tag, i) => (
                  <Link
                    key={tag}
                    href={`/tags/${encodeURIComponent(tag)}`}
                    className="nb-pill"
                    style={{ background: pillColors[i % pillColors.length] }}
                  >
                    {tag}
                  </Link>
                ))}
              </div>
              <Link href={`/articles/${featured.slug}`} className="nb-btn nb-btn-primary mt-7 w-fit">
                Lire l&apos;article →
              </Link>
            </div>
          </section>
        </FadeIn>
      )}

      <AdSlot position="home-top" />

      {last24h.length > 1 && (
        <FadeUp>
          <section className="nb-card bg-cream-2 p-6">
            <h2 className="font-display text-lg font-bold">
              ⚡ Le fil des dernières 24 h
            </h2>
            <ul className="mt-4 flex flex-col divide-y divide-ink/15">
              {last24h.slice(0, 6).map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/articles/${a.slug}`}
                    className="group flex flex-wrap items-baseline gap-x-3 py-2"
                  >
                    <span className="shrink-0 font-mono text-xs text-ink/50">
                      {timeAgo(a.date)}
                    </span>
                    <span className="font-semibold group-hover:underline">{a.title}</span>
                    {a.breaking && <span className="nb-pill bg-[var(--peach)]">🔴</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </FadeUp>
      )}

      {tags.length > 0 && (
        <FadeUp>
          <section className="flex flex-wrap items-center gap-2">
            <span className="mr-2 font-display text-sm font-bold">Explorer :</span>
            {tags.map(({ tag, count }, i) => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag)}`}
                className="nb-pill"
                style={{ background: pillColors[i % pillColors.length] }}
              >
                {tag} <span className="ml-1 opacity-70">{count}</span>
              </Link>
            ))}
          </section>
        </FadeUp>
      )}

      <section>
        <FadeUp>
          <h2 className="mb-6 font-display text-2xl font-bold">
            <span className="highlight-mint">Dernières actualités</span>
          </h2>
        </FadeUp>
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((article, i) => (
            <FadeUp key={article.slug} delay={Math.min(i * 0.06, 0.3)}>
              <ArticleCard article={article} />
            </FadeUp>
          ))}
        </div>
      </section>

      <AdSlot position="home-middle" />

      {tutos.length > 0 && (
        <section>
          <FadeUp>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">
                <span className="highlight">🎓 Derniers tutos</span>
              </h2>
              <Link href="/tutos" className="nb-btn px-3 py-1.5 text-sm">
                Tous les tutos →
              </Link>
            </div>
          </FadeUp>
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {tutos.map((tuto, i) => (
              <FadeUp key={tuto.slug} delay={i * 0.06}>
                <ArticleCard article={tuto} />
              </FadeUp>
            ))}
          </div>
        </section>
      )}

      {mostViewed.length > 0 && (
        <FadeUp>
          <section className="nb-card p-6">
            <h2 className="font-display text-lg font-bold">🔥 Les plus lus</h2>
            <ol className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {mostViewed.map((a, i) => (
                <li key={a.slug} className="flex items-baseline gap-3">
                  <span className="font-display text-2xl font-bold text-ink/25">{i + 1}</span>
                  <Link href={`/articles/${a.slug}`} className="font-semibold hover:underline">
                    {a.title}
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        </FadeUp>
      )}
    </div>
  );
}
