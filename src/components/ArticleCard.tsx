import Image from "next/image";
import Link from "next/link";
import type { ArticleMeta } from "@/lib/articles";
import { localizeMeta } from "@/lib/articles";
import type { Lang } from "@/lib/i18n";
import { CoverPattern } from "./CoverPattern";
import { CategoryBadge } from "./Tag";

export function ArticleCard({ article, lang = "fr" }: { article: ArticleMeta; lang?: Lang }) {
  const loc = localizeMeta(article, lang);
  const date = new Date(article.date);
  const locale = lang === "en" ? "en-GB" : "fr-FR";
  const dateLabel = date.toLocaleDateString(locale, { day: "numeric", month: "short" });
  const readMin = article.readingMinutes;
  const nSources = article.sources.length;

  return (
    <Link href={`/articles/${article.slug}`} className="card-mag flex h-full flex-col overflow-hidden">
      <div className="img-vignette has-scanlines relative h-[150px] shrink-0 overflow-hidden">
        {article.image ? (
          <Image
            src={article.image}
            alt={loc.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <CoverPattern seed={article.slug} label={article.tags[0] ?? loc.title} />
        )}
        {article.breaking && (
          <span
            className="absolute left-2.5 top-2.5 z-[4] font-mono text-[9px] font-bold uppercase tracking-[0.1em]"
            style={{ background: "var(--ac)", color: "var(--on-ac)", padding: "3px 8px" }}
          >
            {lang === "en" ? "Breaking" : "À chaud"}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2">
          <CategoryBadge tags={article.tags} lang={lang} fallbackText={loc.title} />
          <span className="ml-auto font-mono text-[10px] text-[var(--ink-f)]">{dateLabel}</span>
        </div>
        <h3 className="text-[15px] font-semibold leading-snug tracking-[-0.01em]">{loc.title}</h3>
        <p className="line-clamp-3 flex-1 font-serif text-[13px] leading-relaxed text-[var(--ink-d)]">
          {loc.excerpt}
        </p>
        <div className="flex gap-2 font-mono text-[11px] text-[var(--ink-f)]">
          <span>{readMin} min</span>
          {nSources > 0 && (
            <span className="ml-auto text-[var(--ac)]">
              {nSources} source{nSources > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
