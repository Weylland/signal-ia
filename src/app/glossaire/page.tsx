import type { Metadata } from "next";
import { getGlossary } from "@/lib/glossary";
import { FadeUp } from "@/components/Reveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Glossaire de l'IA",
  description:
    "Les termes de l'intelligence artificielle expliqués simplement en français : LLM, RAG, MCP, fine-tuning, agents, embeddings…",
};

export default async function GlossairePage() {
  const entries = getGlossary();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: "Glossaire de l'IA — signal·ia",
    inLanguage: "fr",
    hasDefinedTerm: entries.map((e) => ({
      "@type": "DefinedTerm",
      name: e.term,
      description: e.definitionHtml.replace(/<[^>]+>/g, ""),
    })),
  };

  return (
    <div className="mx-auto max-w-3xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FadeUp>
        <header className="mb-10">
          <h1 className="font-display text-4xl font-bold tracking-tight">
            <span className="highlight">Glossaire</span>
          </h1>
          <p className="mt-4 leading-relaxed">
            Les termes qui reviennent dans l&apos;actu IA, expliqués simplement. Pas besoin
            d&apos;être ingénieur pour suivre.
          </p>
        </header>
      </FadeUp>

      <div className="flex flex-col gap-5">
        {entries.map((entry, i) => (
          <FadeUp key={entry.id} delay={Math.min(i * 0.03, 0.2)}>
            <section id={entry.slug} className="nb-card scroll-mt-24 p-6">
              <h2 className="font-display text-xl font-bold">{entry.term}</h2>
              <div
                className="prose-article mt-2 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: entry.definitionHtml }}
              />
            </section>
          </FadeUp>
        ))}
      </div>
    </div>
  );
}
