import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles, readingTimeMinutes, getArticle } from "@/lib/articles";
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

  return (
    <div>
      <FadeUp>
        <header className="mb-10 max-w-2xl">
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{t.tutosTitle}</h1>
          <p className="mt-4 leading-relaxed text-[var(--ink-dim)]">{t.tutosIntro}</p>
          {tutos.length > 0 && (
            <p className="meta mt-4 flex gap-5 uppercase">
              <span className="text-[var(--accent)]">{t.tutosCount(tutos.length)}</span>
              <span>{t.minTotal(totalMinutes)}</span>
            </p>
          )}
        </header>
      </FadeUp>

      {tutos.length === 0 ? (
        <p className="nb-card max-w-md p-6 text-sm">
          {t.tutosEmpty}{" "}
          <Link href="/" className="font-semibold underline">
            {t.homePage}
          </Link>
          .
        </p>
      ) : (
        <>
          <div className="cards-grid">
            {slice.map((tuto, i) => (
              <FadeUp key={tuto.slug} delay={Math.min(i * 0.05, 0.25)} className="h-full">
                <ArticleCard article={tuto} lang={lang} />
              </FadeUp>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} basePath="/tutos" t={t} />
        </>
      )}
    </div>
  );
}
