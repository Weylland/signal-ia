import type { Metadata } from "next";
import { getGlossary } from "@/lib/glossary";
import { getLang, getDict } from "@/lib/i18n";
import { GlossaireFilter } from "@/components/GlossaireFilter";
import { PageHeader, PageBand } from "@/components/PageShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Glossaire de l'IA",
  description:
    "Les termes de l'intelligence artificielle expliqués simplement en français : LLM, RAG, MCP, fine-tuning, agents, embeddings…",
};

export default async function GlossairePage() {
  const entries = getGlossary();
  const lang = await getLang();
  const t = getDict(lang);
  const en = lang === "en";

  const letters = [...new Set(entries.map((e) => e.term[0].toUpperCase()))].sort();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: "Glossaire de l'IA — watch·ia",
    inLanguage: "fr",
    hasDefinedTerm: entries.map((e) => ({
      "@type": "DefinedTerm",
      name: e.term,
      description: e.definitionHtml.replace(/<[^>]+>/g, ""),
    })),
  };

  return (
    <div className="-mt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHeader
        title={en ? "AI Glossary" : "Glossaire IA"}
        subtitle={en ? "The essential terms, explained simply." : "Les termes essentiels, expliqués simplement."}
      />
      <PageBand>
        <GlossaireFilter
          entries={entries}
          letters={letters}
          lang={lang}
          placeholder={t.glossaryFilterPlaceholder}
          noResult={en ? "No term found." : "Aucun terme trouvé."}
          allLabel={en ? "All" : "Tous"}
        />
      </PageBand>
    </div>
  );
}
