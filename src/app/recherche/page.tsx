import type { Metadata } from "next";
import { getAllArticles } from "@/lib/articles";
import { ArticleCard } from "@/components/ArticleCard";
import { FadeUp } from "@/components/Reveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recherche",
  description: "Rechercher dans les actualités et tutos IA de signal·ia.",
  robots: { index: false },
};

export default async function RecherchePage({
  searchParams,
}: PageProps<"/recherche">) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const results = query ? await getAllArticles({ search: query }) : [];

  return (
    <div>
      <FadeUp>
        <header className="mb-8 max-w-xl">
          <h1 className="font-display text-4xl font-bold tracking-tight">
            <span className="highlight">Recherche</span>
          </h1>
          <form method="get" className="mt-6 flex gap-2">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="modèle, outil, entreprise, concept…"
              className="field flex-1"
              autoFocus
            />
            <button type="submit" className="nb-btn nb-btn-primary">
              Chercher
            </button>
          </form>
        </header>
      </FadeUp>

      {query && (
        <p className="mb-6 text-sm text-ink/60">
          {results.length} résultat{results.length !== 1 ? "s" : ""} pour «{" "}
          <strong>{query}</strong> »
        </p>
      )}

      <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((article, i) => (
          <FadeUp key={article.slug} delay={Math.min(i * 0.05, 0.25)}>
            <ArticleCard article={article} />
          </FadeUp>
        ))}
      </div>
    </div>
  );
}
