import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllTags, getArticlesByTag } from "@/lib/articles";
import { ArticleCard } from "@/components/ArticleCard";
import { FadeUp } from "@/components/Reveal";

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map(({ tag }) => ({ tag }));
}

export async function generateMetadata({ params }: PageProps<"/tags/[tag]">): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return {
    title: `${decoded} — toutes les actualités`,
    description: `Toutes les actualités signal·ia sur le thème ${decoded}.`,
  };
}

export default async function TagPage({ params }: PageProps<"/tags/[tag]">) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const articles = await getArticlesByTag(decoded);
  if (articles.length === 0) notFound();

  return (
    <div>
      <Link href="/" className="text-sm text-muted transition-colors hover:text-accent-deep">
        ← Toutes les actualités
      </Link>
      <h1 className="mb-8 mt-4 font-display text-3xl font-semibold sm:text-4xl">
        <span className="text-accent">#</span>
        {decoded}
        <span className="ml-3 align-middle text-base font-normal text-muted">
          {articles.length} article{articles.length > 1 ? "s" : ""}
        </span>
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article, i) => (
          <FadeUp key={article.slug} delay={Math.min(i * 0.06, 0.3)}>
            <ArticleCard article={article} />
          </FadeUp>
        ))}
      </div>
    </div>
  );
}
