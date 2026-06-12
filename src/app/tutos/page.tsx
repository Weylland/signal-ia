import type { Metadata } from "next";
import { getAllArticles } from "@/lib/articles";
import { ArticleCard } from "@/components/ArticleCard";
import { FadeUp } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Tutos IA",
  description:
    "Tutoriels pratiques pour utiliser l'IA au quotidien : prompts, MCP, agents, outils. En français, sans jargon inutile.",
};

export default async function TutosPage() {
  const tutos = await getAllArticles({ type: "tuto" });

  return (
    <div>
      <FadeUp>
        <header className="mb-10 max-w-2xl">
          <h1 className="font-display text-4xl font-bold tracking-tight">
            <span className="highlight">Tutos</span>
          </h1>
          <p className="mt-4 leading-relaxed">
            Des guides pratiques pour utiliser l&apos;IA au quotidien : écrire de bons prompts,
            connecter un MCP, choisir ses outils, automatiser. Pas de jargon inutile, des étapes
            concrètes.
          </p>
        </header>
      </FadeUp>

      {tutos.length === 0 ? (
        <p className="nb-card max-w-md p-6 text-sm">
          Les premiers tutos arrivent bientôt. En attendant, l&apos;actu est sur la{" "}
          <a href="/" className="font-semibold underline">
            page d&apos;accueil
          </a>
          .
        </p>
      ) : (
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {tutos.map((tuto, i) => (
            <FadeUp key={tuto.slug} delay={Math.min(i * 0.06, 0.3)}>
              <ArticleCard article={tuto} />
            </FadeUp>
          ))}
        </div>
      )}
    </div>
  );
}
