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
import { categoryFor } from "@/lib/category";
import { getSources } from "@/lib/sources";
import { getLang, getDict, type Lang } from "@/lib/i18n";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleRow } from "@/components/ArticleRow";
import { CategoryBadge, Tag } from "@/components/Tag";
import { CoverPattern } from "@/components/CoverPattern";
import { NewsletterForm } from "@/components/NewsletterForm";
import { AdSlot } from "@/components/AdSlot";
import { FadeIn, FadeUp } from "@/components/Reveal";

export const dynamic = "force-dynamic";

function SecHead({
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
        <h2 className="text-[22px] font-bold tracking-[-0.02em]">{title}</h2>
      </div>
      {action && href && (
        <Link
          href={href}
          className="font-mono text-[12px] text-[var(--ink-d)] transition-colors hover:text-[var(--ac)]"
        >
          {action} →
        </Link>
      )}
    </div>
  );
}

export default async function Home() {
  const lang = await getLang();
  const t = getDict(lang);
  const en = lang === "en";
  const locale = en ? "en-GB" : "fr-FR";

  const [articles, tags, mostViewed, tutos] = await Promise.all([
    getAllArticles({ type: "news" }),
    getAllTags(),
    getMostViewedArticles(5),
    getAllArticles({ type: "tuto", limit: 3 }),
  ]);

  if (articles.length === 0 && tutos.length === 0) {
    return <p className="text-sm">{t.noArticles}</p>;
  }

  const [featured, ...rest] = articles;
  const featuredLoc = featured ? localizeMeta(featured, lang) : null;
  const dayAgo = new Date(Date.now() - 24 * 3600_000).toISOString();
  const last24h = articles.filter((a) => a.date >= dayAgo).slice(0, 5);
  const magArticles = rest.slice(0, 5);
  const recurringTags = tags.filter((x) => x.count >= 2);
  const exploreTags = (recurringTags.length > 0 ? recurringTags : tags).slice(0, 18);
  const monitoredSources = getSources({ activeOnly: true }).length;

  // Compte par catégorie pour le panneau latéral
  const catMap = new Map<string, { label: string; cls: string; count: number }>();
  for (const a of articles) {
    const c = categoryFor(a.tags, lang, localizeMeta(a, lang).title);
    if (!c.key) continue;
    const e = catMap.get(c.key) ?? { label: c.label, cls: c.cls, count: 0 };
    e.count++;
    catMap.set(c.key, e);
  }
  const catList = [...catMap.values()].sort((a, b) => b.count - a.count);

  const time = (iso: string) =>
    new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="-mt-10">
      {/* ── Bandeau valeur ── */}
      <div className="fullbleed" style={{ borderBottom: "1px solid var(--ln)", background: "var(--bg-d)" }}>
        <div className="wrap flex items-center justify-center gap-2 py-2.5 text-center">
          <span className="font-mono text-[11px] leading-relaxed text-[var(--ink-d)]">
            {en ? "We read " : "On lit "}
            <span className="font-semibold text-[var(--ac)]">
              {monitoredSources} {en ? "AI sources" : "sources IA"}
            </span>
            {en ? " for you — the essentials in 5 minutes a day." : " pour toi — l'essentiel en 5 minutes par jour."}
          </span>
        </div>
      </div>

      {/* ── Hero ── */}
      {featured && featuredLoc && (
        <section className="fullbleed" style={{ padding: "var(--s6) 0 0" }}>
          <div className="wrap">
            <FadeIn>
              <Link href={`/articles/${featured.slug}`} className="hero-card group block">
                <div className="img-vignette has-scanlines relative min-h-[220px] overflow-hidden lg:min-h-full">
                  {featured.image ? (
                    <Image
                      src={featured.image}
                      alt={featuredLoc.title}
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, 600px"
                      className="object-cover"
                    />
                  ) : (
                    <CoverPattern seed={featured.slug} label={featured.tags[0] ?? featuredLoc.title} />
                  )}
                  <span
                    className="absolute left-2.5 top-2.5 z-[4] font-mono text-[9px] font-bold uppercase tracking-[0.1em]"
                    style={{ background: "var(--ac)", color: "var(--on-ac)", padding: "3px 8px" }}
                  >
                    {t.featured}
                  </span>
                </div>
                <div className="flex flex-col justify-center gap-4 p-6 sm:p-12">
                  <CategoryBadge tags={featured.tags} lang={lang} fallbackText={featuredLoc.title} />
                  <h1 className="text-[clamp(22px,2.2vw,34px)] font-bold leading-[1.12] tracking-[-0.025em] transition-colors group-hover:text-[var(--ac)]">
                    {featuredLoc.title}
                  </h1>
                  <p className="font-serif text-[16px] leading-[1.68] text-[var(--ink-d)]">
                    {featuredLoc.excerpt}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4 font-mono text-[11px] text-[var(--ink-f)]">
                    <span>{time(featured.date)}</span>
                    <span>{readingTimeMinutes(featured.excerpt)} min</span>
                    {featured.sources.length > 0 && (
                      <span className="text-[var(--ac)]">
                        {featured.sources.length} {en ? "sources" : "sources"}
                      </span>
                    )}
                    <span className="ml-auto font-display font-semibold text-[var(--ac)]">
                      {t.readArticle}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {featured.tags.slice(0, 3).map((tg) => (
                      <Tag key={tg}>{tg}</Tag>
                    ))}
                  </div>
                </div>
              </Link>
            </FadeIn>
          </div>
        </section>
      )}

      {/* ── Dernières 24 h ── */}
      {last24h.length > 1 && (
        <section className="fullbleed band">
          <div className="wrap">
            <FadeUp>
              <div className="digest-grid">
                <div>
                  <SecHead
                    label={en ? "Last 24h" : "Dernières 24 h"}
                    title={en ? "The feed" : "Le fil"}
                    action={t.navAllNews}
                    href="/actus"
                  />
                  {last24h.map((a) => (
                    <ArticleRow key={a.slug} article={a} lang={lang} />
                  ))}
                </div>
                <div className="digest-side flex flex-col">
                  <div className="mb-4 border-l-2 border-[var(--ln-h)] pl-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ink-f)]">
                    {en ? "Browse by category" : "Explorer par catégorie"}
                  </div>
                  <div className="mb-8 flex flex-col gap-2">
                    {catList.map((c) => (
                      <Link
                        key={c.label}
                        href={`/recherche?q=${encodeURIComponent(c.label)}`}
                        className="flex min-h-[44px] items-center justify-between border border-line px-4 text-[13px] font-medium transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
                        style={{ background: "var(--bg-r)" }}
                      >
                        <span>{c.label}</span>
                        <span className={`tag${c.cls ? " " + c.cls : ""}`}>{c.count}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="border border-line p-4" style={{ background: "var(--bg-r)" }}>
                    <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ink-f)]">
                      {en ? "Today's numbers" : "Chiffres du jour"}
                    </div>
                    {[
                      [en ? "Articles" : "Articles", String(articles.length)],
                      [en ? "Active sources" : "Sources actives", String(monitoredSources)],
                      [en ? "Tutorials" : "Tutos", String(tutos.length)],
                      [en ? "Last 24h" : "Dernières 24 h", String(last24h.length)],
                    ].map(([l, v]) => (
                      <div key={l} className="flex justify-between border-b border-line py-2 last:border-0">
                        <span className="font-mono text-[11px] text-[var(--ink-d)]">{l}</span>
                        <span className="font-display text-[13px] font-bold text-[var(--ac)]">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </section>
      )}

      {/* ── Sélection magazine ── */}
      {magArticles.length > 0 && (
        <section className="fullbleed band band-alt">
          <div className="wrap">
            <FadeUp>
              <SecHead
                label={en ? "Selection" : "Sélection"}
                title={en ? "Don't miss" : "À ne pas manquer"}
                action={en ? "See all" : "Voir tout"}
                href="/actus"
              />
              <div className="mag">
                {magArticles.map((a, i) => (
                  <div key={a.slug} className={i === 0 ? "c2" : ""}>
                    <ArticleCard article={a} lang={lang} />
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>
        </section>
      )}

      <AdSlot position="home-middle" />

      {/* ── Tutos ── */}
      {tutos.length > 0 && (
        <section className="fullbleed band band-deep">
          <div className="wrap">
            <FadeUp>
              <SecHead
                label={en ? "Hands-on" : "Pratique"}
                title={t.tutosTitle}
                action={t.allTutos}
                href="/tutos"
              />
              <div className="flex flex-col gap-4">
                {tutos.map((tuto, i) => (
                  <TutoRow key={tuto.slug} tuto={tuto} lang={lang} n={i + 1} guide={t.guide} read={en ? "Read →" : "Lire →"} />
                ))}
              </div>
            </FadeUp>
          </div>
        </section>
      )}

      {/* ── Tags + Plus lus ── */}
      <section className="fullbleed band">
        <div className="wrap">
          <FadeUp>
            <div className="two-col">
              <div>
                <SecHead label={t.explore} title={en ? "All tags" : "Tous les tags"} />
                <div className="flex flex-wrap gap-2">
                  {exploreTags.map(({ tag, count }) => (
                    <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`} className="tag">
                      {tag}
                      <span className="ml-1.5 text-[var(--ac)]">{count}</span>
                    </Link>
                  ))}
                </div>
              </div>
              {mostViewed.length > 0 && (
                <div>
                  <SecHead label={en ? "Popular" : "Populaire"} title={t.mostRead} />
                  {mostViewed.map((a, i) => (
                    <ArticleRow key={a.slug} article={a} lang={lang} rank={i + 1} />
                  ))}
                </div>
              )}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section
        className="fullbleed relative -mb-10 overflow-hidden"
        style={{ borderTop: "1px solid var(--ac)", background: "var(--bg-d)", padding: "var(--s9) 0" }}
      >
        <div className="dot-bg pointer-events-none absolute inset-0 opacity-30" />
        <div className="wrap relative z-[1]">
          <div className="mx-auto flex max-w-[560px] flex-col items-center gap-5 text-center">
            <span
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ac)]"
              style={{ border: "1px solid var(--ac)", padding: "3px 10px" }}
            >
              {en ? "Weekly newsletter" : "Newsletter hebdo"}
            </span>
            <h2 className="text-[clamp(28px,4vw,40px)] font-bold leading-[1.1] tracking-[-0.025em]">
              {en ? "This week's AI, condensed." : "L'IA de la semaine, condensée."}
            </h2>
            <p className="font-serif text-[17px] leading-[1.72] text-[var(--ink-d)]">
              {en
                ? "Every Friday — major news, recent tutorials, key numbers. No tracker. One-click unsubscribe."
                : "Chaque dimanche — actus majeures, tutos récents, chiffres clés. Aucun tracker. Désabonnement en un clic."}
            </p>
            <div className="w-full max-w-[420px]">
              <NewsletterForm
                labels={{ subscribe: t.subscribe, subscribed: t.subscribed, error: t.emailError }}
              />
            </div>
          </div>
        </div>
      </section>
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
      className="card-mag group flex flex-wrap items-start gap-5 p-5"
    >
      <span
        className="flex h-14 w-14 shrink-0 items-center justify-center border border-line font-mono text-lg font-semibold"
        style={{ background: "var(--bg-d)", color: "var(--ac)" }}
      >
        {String(n).padStart(2, "0")}
      </span>
      <div className="min-w-[200px] flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ac)]" style={{ border: "1px solid currentColor", padding: "2px 6px" }}>
            {guide}
          </span>
          {tuto.tags.slice(0, 3).map((tg) => (
            <Tag key={tg}>{tg}</Tag>
          ))}
        </div>
        <h3 className="mb-2 text-[16px] font-semibold leading-snug tracking-[-0.01em] transition-colors group-hover:text-[var(--ac)]">
          {loc.title}
        </h3>
        <p className="font-serif text-[13px] leading-[1.55] text-[var(--ink-d)]">{loc.excerpt}</p>
      </div>
      <div className="shrink-0 text-right">
        <div className="font-mono text-[11px] text-[var(--ink-f)]">{readMin} min</div>
        <div className="mt-1 font-mono text-[11px] text-[var(--ac)]">{read}</div>
      </div>
    </Link>
  );
}
