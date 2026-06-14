import Image from "next/image";
import Link from "next/link";
import {
  getAllArticles,
  getAllTags,
  getMostViewedArticles,
  localizeMeta,
  readingTimeMinutes,
  type ArticleMeta,
} from "@/lib/articles";
import { getSettings } from "@/lib/settings";
import { getLang, getDict, type Lang } from "@/lib/i18n";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleRow } from "@/components/ArticleRow";
import { CategoryBadge, Tag } from "@/components/Tag";
import { CoverPattern } from "@/components/CoverPattern";
import { NewsletterForm } from "@/components/NewsletterForm";
import { AdSlot } from "@/components/AdSlot";
import { FadeIn, FadeUp } from "@/components/Reveal";

export const dynamic = "force-dynamic";

function SectionHead({
  label,
  title,
  action,
  href,
}: {
  label: string;
  title: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="border-l-2 border-[var(--ac)] pl-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ac)]">
          {label}
        </span>
        <h2 className="text-[22px] font-bold tracking-tight">{title}</h2>
      </div>
      {action && href && (
        <Link href={href} className="font-mono text-[12px] text-[var(--ink-d)] transition-colors hover:text-[var(--ac)]">
          {action} →
        </Link>
      )}
    </div>
  );
}

export default async function Home() {
  const settings = getSettings();
  const lang = await getLang();
  const t = getDict(lang);
  const locale = lang === "en" ? "en-GB" : "fr-FR";

  if (settings.maintenanceMode) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="font-display text-4xl">{t.maintenanceTitle}</p>
        <p className="mt-4 text-[var(--ink-dim)]">{t.maintenanceBody}</p>
      </div>
    );
  }

  const [articles, tags, mostViewed, tutos] = await Promise.all([
    getAllArticles({ type: "news" }),
    getAllTags(),
    getMostViewedArticles(5),
    getAllArticles({ type: "tuto", limit: 4 }),
  ]);

  if (articles.length === 0 && tutos.length === 0) {
    return <p className="text-sm">{t.noArticles}</p>;
  }

  const [featured, ...rest] = articles;
  const featuredLoc = featured ? localizeMeta(featured, lang) : null;
  const dayAgo = new Date(Date.now() - 24 * 3600_000).toISOString();
  const last24h = articles.filter((a) => a.date >= dayAgo).slice(0, 8);
  const magArticles = rest.slice(0, 7);
  const recurringTags = tags.filter((x) => x.count >= 2);
  const exploreTags = (recurringTags.length > 0 ? recurringTags : tags).slice(0, 16);
  const distinctSources = new Set(articles.flatMap((a) => a.sources.map((s) => s.name))).size;

  return (
    <div className="flex flex-col gap-16 pb-4">
      {/* ── Hero ── */}
      {featured && featuredLoc && (
        <FadeIn>
          <Link href={`/articles/${featured.slug}`} className="hero-card group block">
            <div className="img-vignette has-scanlines relative min-h-[220px] overflow-hidden lg:min-h-full">
              {featured.image ? (
                <Image
                  src={featured.image}
                  alt={featuredLoc.title}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <CoverPattern seed={featured.slug} label={featured.tags[0] ?? featuredLoc.title} />
              )}
              <span
                className="absolute left-3 top-3 z-[4] font-mono text-[9px] font-bold uppercase tracking-[0.1em]"
                style={{ background: "var(--ac)", color: "var(--on-ac)", padding: "3px 8px" }}
              >
                {t.featured}
              </span>
            </div>
            <div className="flex flex-col justify-center gap-4 p-6 sm:p-12">
              <CategoryBadge tags={featured.tags} lang={lang} fallbackText={featuredLoc.title} />
              <h1 className="text-[clamp(24px,2.4vw,36px)] font-bold leading-[1.12] tracking-[-0.025em] transition-colors group-hover:text-[var(--ac)]">
                {featuredLoc.title}
              </h1>
              <p className="font-serif text-[16px] leading-relaxed text-[var(--ink-d)]">
                {featuredLoc.excerpt}
              </p>
              <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4 font-mono text-[11px] text-[var(--ink-f)]">
                <span>{new Date(featured.date).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}</span>
                {featured.sources.length > 0 && (
                  <span className="text-[var(--ac)]">{t.sourcesCited(featured.sources.length)}</span>
                )}
                <span className="ml-auto font-display font-semibold text-[var(--ac)]">{t.readArticle}</span>
              </div>
            </div>
          </Link>
        </FadeIn>
      )}

      <AdSlot position="home-top" />

      {/* ── Digest 24 h ── */}
      {last24h.length > 1 && (
        <FadeUp>
          <section>
            <SectionHead label="01" title={t.last24h} action={t.fullFeed} href="/cette-semaine" />
            <div className="digest-grid">
              <div>
                {last24h.map((a) => (
                  <ArticleRow key={a.slug} article={a} lang={lang} />
                ))}
              </div>
              <div className="digest-side flex flex-col gap-5">
                {exploreTags.length > 0 && (
                  <div>
                    <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ink-f)]">
                      {t.explore}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {exploreTags.slice(0, 8).map(({ tag }) => (
                        <Tag key={tag} href={`/tags/${encodeURIComponent(tag)}`}>
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 divide-x border border-line" style={{ borderColor: "var(--ln)" }}>
                  {[
                    [last24h.length, lang === "en" ? "24h" : "24 h"],
                    [distinctSources, lang === "en" ? "Sources" : "Sources"],
                    [tutos.length, "Tutos"],
                  ].map(([v, l]) => (
                    <div key={l} className="px-2 py-4 text-center" style={{ borderColor: "var(--ln)" }}>
                      <p className="text-[26px] font-bold text-[var(--ac)]">{v}</p>
                      <p className="mt-1 font-mono text-[9px] uppercase tracking-wide text-[var(--ink-f)]">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </FadeUp>
      )}

      {/* ── Grille magazine (bande raised) ── */}
      {magArticles.length > 0 && (
        <FadeUp>
          <section className="band band-alt -mx-5 px-5">
            <div className="mx-auto max-w-6xl">
              <SectionHead label="02" title={t.news} action={t.navAllNews} href="/actus" />
              <div className="mag">
                {magArticles.map((a, i) => (
                  <div key={a.slug} className={i === 0 ? "c2" : ""}>
                    <ArticleCard article={a} lang={lang} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </FadeUp>
      )}

      <AdSlot position="home-middle" />

      {/* ── Tutos (bande deep) ── */}
      {tutos.length > 0 && (
        <FadeUp>
          <section className="band band-deep -mx-5 px-5">
            <div className="mx-auto max-w-6xl">
              <SectionHead label="03" title={t.tutosSection} action={t.allTutos} href="/tutos" />
              <p className="mb-8 max-w-[34ch] text-[clamp(22px,2.2vw,30px)] font-bold leading-tight">
                {t.tutosPitch}
              </p>
              <div className="flex flex-col gap-3">
                {tutos.map((tuto, i) => (
                  <TutoRow key={tuto.slug} tuto={tuto} lang={lang} n={i + 1} guide={t.guide} read={t.readArticle} />
                ))}
              </div>
            </div>
          </section>
        </FadeUp>
      )}

      {/* ── Plus lus + Explorer ── */}
      <div className="two-col">
        {mostViewed.length > 0 && (
          <FadeUp>
            <section>
              <SectionHead label="04" title={t.mostRead} />
              <div>
                {mostViewed.map((a, i) => (
                  <ArticleRow key={a.slug} article={a} lang={lang} rank={i + 1} />
                ))}
              </div>
            </section>
          </FadeUp>
        )}
        {exploreTags.length > 0 && (
          <FadeUp>
            <section>
              <SectionHead label="→" title={t.explore} action={t.searchTitle} href="/recherche" />
              <div className="flex flex-wrap gap-2">
                {exploreTags.map(({ tag, count }) => (
                  <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`} className="tag">
                    {tag}
                    <span className="ml-1.5 text-[var(--ac)]">{count}</span>
                  </Link>
                ))}
              </div>
            </section>
          </FadeUp>
        )}
      </div>

      {/* ── Newsletter CTA ── */}
      <FadeUp>
        <section
          className="band band-deep dot-bg -mx-5 px-5 text-center"
          style={{ borderTop: "1px solid var(--ac)" }}
        >
          <div className="mx-auto max-w-[560px]">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ac)]">
              {t.newsletterTitle}
            </p>
            <h2 className="text-[clamp(26px,3vw,40px)] font-bold leading-tight tracking-tight">
              {t.newsletterPitch}
            </h2>
            <div className="mx-auto mt-6 max-w-sm">
              <NewsletterForm
                labels={{ subscribe: t.subscribe, subscribed: t.subscribed, error: t.emailError }}
              />
            </div>
          </div>
        </section>
      </FadeUp>
    </div>
  );
}

function TutoRow({
  tuto,
  lang,
  n,
  guide,
  read,
}: {
  tuto: ArticleMeta;
  lang: Lang;
  n: number;
  guide: string;
  read: string;
}) {
  const loc = localizeMeta(tuto, lang);
  const readMin = readingTimeMinutes(tuto.excerpt + " " + (loc.tldr.join(" ") ?? ""));
  return (
    <Link
      href={`/articles/${tuto.slug}`}
      className="card-mag group flex items-stretch gap-0"
      style={{ background: "var(--bg-r)" }}
    >
      <span
        className="flex w-14 shrink-0 items-center justify-center font-mono text-xl font-bold"
        style={{ background: "var(--bg-d)", color: "var(--ac)" }}
      >
        {String(n).padStart(2, "0")}
      </span>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="font-mono text-[10px] uppercase tracking-wide text-[var(--ink-f)]">{guide}</span>
        <h3 className="text-[16px] font-semibold leading-snug transition-colors group-hover:text-[var(--ac)]">
          {loc.title}
        </h3>
        <p className="line-clamp-1 font-serif text-[13px] text-[var(--ink-d)]">{loc.excerpt}</p>
      </div>
      <span className="hidden shrink-0 items-center px-5 font-mono text-[11px] text-[var(--ink-f)] sm:flex">
        {readMin} min · {read}
      </span>
    </Link>
  );
}
