import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllTags, getArticlesByTag } from "@/lib/articles";
import { getLang, getDict } from "@/lib/i18n";
import { ArticleCard } from "@/components/ArticleCard";
import { Pagination, paginate, parsePage } from "@/components/Pagination";
import { FadeUp } from "@/components/Reveal";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/tags/[tag]">): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return {
    title: `${decoded} — toutes les actualités`,
    description: `Toutes les actualités watch·ia sur le thème ${decoded}.`,
  };
}

export default async function TagPage({ params, searchParams }: PageProps<"/tags/[tag]">) {
  const { tag } = await params;
  const sp = await searchParams;
  const decoded = decodeURIComponent(tag);
  const page = parsePage(sp.page);
  const lang = await getLang();
  const t = getDict(lang);

  const articles = await getArticlesByTag(decoded);
  if (articles.length === 0) notFound();
  const { slice, totalPages } = paginate(articles, page);

  const otherTags = (await getAllTags()).filter(({ tag: name }) => name !== decoded).slice(0, 12);

  return (
    <div>
      <FadeUp>
        <header className="mb-10">
          <Link href="/" className="meta uppercase transition-colors hover:text-[var(--accent)]">
            ← {t.navNews}
          </Link>
          <h1 className="font-display mt-3 text-4xl tracking-tight sm:text-5xl">
            <span className="text-[var(--accent)]">#</span>
            {decoded}
          </h1>
          <p className="meta mt-3 uppercase">{t.tagIntro(articles.length, decoded)}</p>
        </header>
      </FadeUp>

      <div className="cards-grid">
        {slice.map((article, i) => (
          <FadeUp key={article.slug} delay={Math.min(i * 0.05, 0.25)} className="h-full">
            <ArticleCard article={article} lang={lang} />
          </FadeUp>
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath={`/tags/${encodeURIComponent(decoded)}`}
        t={t}
      />

      {otherTags.length > 0 && (
        <FadeUp>
          <section className="mt-12">
            <div className="section-head">
              <span className="idx">→</span>
              <h2>{t.otherTags}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {otherTags.map(({ tag: name, count }) => (
                <Link key={name} href={`/tags/${encodeURIComponent(name)}`} className="nb-pill">
                  {name} <span className="ml-1.5 text-[var(--accent)]">{count}</span>
                </Link>
              ))}
            </div>
          </section>
        </FadeUp>
      )}
    </div>
  );
}
