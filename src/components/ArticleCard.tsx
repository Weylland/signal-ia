import Image from "next/image";
import Link from "next/link";
import type { ArticleMeta } from "@/lib/articles";
import { localizeMeta, readingTimeMinutes } from "@/lib/articles";
import type { Lang } from "@/lib/i18n";
import { BookmarkButton } from "./BookmarkButton";

export function ArticleCard({ article, lang = "fr" }: { article: ArticleMeta; lang?: Lang }) {
  const loc = localizeMeta(article, lang);
  const date = new Date(article.date);
  const locale = lang === "en" ? "en-GB" : "fr-FR";
  const dateLabel = `${date.toLocaleDateString(locale, { day: "numeric", month: "short" })} · ${date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}`;
  const readMin = readingTimeMinutes(article.excerpt + " " + (loc.tldr.join(" ") ?? ""));

  return (
    <article className="nb-card-hover flex h-full flex-col gap-3.5 bg-transparent p-5">
      {article.image && (
        <Link
          href={`/articles/${article.slug}`}
          className="relative block aspect-[16/9] overflow-hidden border border-line"
        >
          <Image
            src={article.image}
            alt={loc.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        </Link>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {article.breaking && (
          <span className="nb-pill tag--hot">{lang === "en" ? "Breaking" : "À chaud"}</span>
        )}
        {article.type === "tuto" && (
          <span className="nb-pill tag--hot">{lang === "en" ? "Tutorial" : "Tuto"}</span>
        )}
        {article.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="nb-pill">
            {tag}
          </span>
        ))}
        <span className="meta uppercase">{dateLabel}</span>
      </div>
      <h3 className="font-display text-2xl leading-tight text-balance">
        <Link
          href={`/articles/${article.slug}`}
          className="transition-colors hover:text-[var(--accent)]"
        >
          {loc.title}
        </Link>
      </h3>
      <p className="line-clamp-3 text-sm leading-relaxed text-[var(--ink-dim)]">{loc.excerpt}</p>
      <div className="meta mt-auto flex items-center justify-between gap-2 pt-1 uppercase">
        <span>
          {readMin} min{article.sources.length > 0 && ` · ${article.sources.length} source${article.sources.length > 1 ? "s" : ""}`}
        </span>
        <BookmarkButton slug={article.slug} title={loc.title} lang={lang} />
      </div>
    </article>
  );
}
