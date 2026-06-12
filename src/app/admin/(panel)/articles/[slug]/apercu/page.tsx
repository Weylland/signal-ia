import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticle, readingTimeMinutes, formatDate } from "@/lib/articles";

export const dynamic = "force-dynamic";

export default async function ApercuPage({
  params,
}: PageProps<"/admin/articles/[slug]/apercu">) {
  const { slug } = await params;
  const article = await getArticle(slug, { includeDrafts: true });
  if (!article) notFound();

  return (
    <div>
      <div className="nb-card mb-8 flex flex-wrap items-center gap-3 bg-[var(--sunshine)] p-4">
        <span className="font-display text-sm font-bold">👁 Aperçu</span>
        <span className="text-sm">
          {article.published ? "Cet article est publié." : "Cet article est un brouillon — invisible sur le site."}
        </span>
        <Link href={`/admin/articles/${slug}`} className="nb-btn ml-auto px-3 py-1.5 text-xs">
          ← Retour à l&apos;édition
        </Link>
      </div>

      <article className="mx-auto max-w-3xl">
        <header className="mb-8">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {article.type === "tuto" && <span className="nb-pill bg-[var(--sky)]">🎓 Tuto</span>}
            <span className="font-display text-xs font-bold uppercase tracking-wider">
              {formatDate(article.date)}
            </span>
            <span className="text-xs text-ink/60">
              · {readingTimeMinutes(article.html)} min de lecture
            </span>
            {article.tags.map((tag) => (
              <span key={tag} className="nb-pill bg-[var(--mint)]">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            <span className="highlight">{article.title}</span>
          </h1>
        </header>

        {article.tldr.length > 0 && (
          <aside className="nb-card mb-10 bg-[var(--sunshine)] p-6">
            <p className="mb-3 font-display text-xs font-bold uppercase tracking-wider">
              ⚡ L&apos;essentiel
            </p>
            <ul className="flex flex-col gap-2">
              {article.tldr.map((point, i) => (
                <li key={i} className="flex gap-2 text-sm font-medium leading-relaxed">
                  <span className="font-display font-bold">{i + 1}.</span>
                  {point}
                </li>
              ))}
            </ul>
          </aside>
        )}

        {article.image && (
          <div className="nb-card relative mb-10 aspect-[16/9] overflow-hidden p-0">
            <Image
              src={article.image}
              alt={article.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        )}

        <div className="prose-article" dangerouslySetInnerHTML={{ __html: article.html }} />
      </article>
    </div>
  );
}
