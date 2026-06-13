import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles, readingTimeMinutes, getArticle, localizeMeta } from "@/lib/articles";
import { getLang, getDict } from "@/lib/i18n";
import { ArticleCard } from "@/components/ArticleCard";
import { Pagination, paginate, parsePage } from "@/components/Pagination";
import { FadeUp } from "@/components/Reveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tutos IA",
  description:
    "Tutoriels pratiques pour utiliser l'IA au quotidien : prompts, MCP, agents, outils. En français, sans jargon inutile.",
};

export default async function TutosPage({ searchParams }: PageProps<"/tutos">) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const lang = await getLang();
  const t = getDict(lang);

  const tutos = await getAllArticles({ type: "tuto" });
  const { slice, totalPages } = paginate(tutos, page);

  const totalMinutes = (
    await Promise.all(tutos.map(async (tuto) => (await getArticle(tuto.slug))?.html ?? ""))
  ).reduce((sum, html) => sum + readingTimeMinutes(html), 0);

  const featured = page === 1 && slice.length > 0 ? slice[0] : null;
  const rest = page === 1 && slice.length > 0 ? slice.slice(1) : slice;

  return (
    <div>
      <FadeUp>
        <header className="mb-10 max-w-2xl">
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{t.tutosTitle}</h1>
          <p className="mt-4 leading-relaxed text-[var(--ink-dim)]">{t.tutosIntro}</p>
          {tutos.length > 0 && (
            <p className="meta mt-4 flex gap-5 uppercase">
              <span className="text-[var(--accent)]">{t.tutosCount(tutos.length)}</span>
              {totalMinutes > 0 && <span>{t.minTotal(totalMinutes)}</span>}
            </p>
          )}
        </header>
      </FadeUp>

      {tutos.length === 0 ? (
        <div className="flex flex-col gap-6">
          <p className="nb-card max-w-md p-6 text-sm">
            {t.tutosEmpty}{" "}
            <Link href="/" className="font-semibold underline">
              {t.homePage}
            </Link>
            .
          </p>
          <div className="nb-card max-w-md border-dashed p-6">
            <p className="meta mb-3 uppercase text-[var(--accent)]">
              {lang === "en" ? "Coming soon" : "À venir"}
            </p>
            <ul className="flex flex-col gap-2 text-sm text-[var(--ink-dim)]">
              <li>→ {lang === "en" ? "Write better prompts in 10 rules" : "Écrire de meilleurs prompts en 10 règles"}</li>
              <li>→ {lang === "en" ? "Set up Claude with MCP in 5 minutes" : "Configurer Claude avec MCP en 5 minutes"}</li>
              <li>→ {lang === "en" ? "Automate your AI watch with n8n" : "Automatiser sa veille IA avec n8n"}</li>
            </ul>
          </div>
        </div>
      ) : (
        <>
          {featured && (
            <FadeUp className="mb-8">
              <Link href={`/articles/${featured.slug}`} className="group nb-card-hover block p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="nb-pill bg-[var(--accent)] text-[var(--on-accent)]">
                    {lang === "en" ? "Featured" : "À lire"}
                  </span>
                  <span className="meta uppercase">{t.guide}</span>
                </div>
                <h2 className="font-display text-2xl leading-snug group-hover:text-[var(--accent)] sm:text-3xl">
                  {localizeMeta(featured, lang).title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--ink-dim)] line-clamp-3">
                  {localizeMeta(featured, lang).excerpt}
                </p>
                <p className="meta mt-4 uppercase text-[var(--accent)]">
                  {t.readArticle}
                </p>
              </Link>
            </FadeUp>
          )}

          {rest.length > 0 && (
            <div className="cards-grid">
              {rest.map((tuto, i) => (
                <FadeUp key={tuto.slug} delay={Math.min(i * 0.05, 0.25)} className="h-full">
                  <ArticleCard article={tuto} lang={lang} />
                </FadeUp>
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} basePath="/tutos" t={t} />
        </>
      )}
    </div>
  );
}
