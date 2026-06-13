import type { Metadata } from "next";
import { getAllArticles } from "@/lib/articles";
import { getLang, getDict } from "@/lib/i18n";
import { ArticleCard } from "@/components/ArticleCard";
import { Pagination, paginate, parsePage } from "@/components/Pagination";
import { FadeUp } from "@/components/Reveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Toutes les actus",
  description: "L'archive complète des actualités IA et robotique de signal·ia.",
};

export default async function ActusPage({ searchParams }: PageProps<"/actus">) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const lang = await getLang();
  const t = getDict(lang);

  const articles = await getAllArticles({ type: "news" });
  const { slice, totalPages } = paginate(articles, page);

  return (
    <div>
      <FadeUp>
        <header className="mb-10 max-w-2xl">
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{t.allNewsTitle}</h1>
          <p className="mt-4 leading-relaxed text-[var(--ink-dim)]">{t.allNewsIntro}</p>
          <p className="meta mt-3 uppercase">{t.weekArticles(articles.length)}</p>
        </header>
      </FadeUp>

      <div className="cards-grid">
        {slice.map((article, i) => (
          <FadeUp key={article.slug} delay={Math.min(i * 0.04, 0.2)} className="h-full">
            <ArticleCard article={article} lang={lang} />
          </FadeUp>
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} basePath="/actus" t={t} />
    </div>
  );
}
