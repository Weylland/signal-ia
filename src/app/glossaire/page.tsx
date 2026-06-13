import type { Metadata } from "next";
import { getGlossary } from "@/lib/glossary";
import { getLang, getDict } from "@/lib/i18n";
import { FadeUp } from "@/components/Reveal";
import { GlossaireFilter } from "@/components/GlossaireFilter";

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

  const byLetterMap = new Map<string, typeof entries>();
  for (const entry of entries) {
    const letter = entry.term[0].toUpperCase();
    byLetterMap.set(letter, [...(byLetterMap.get(letter) ?? []), entry]);
  }
  const letters = [...byLetterMap.keys()].sort();
  const byLetter = Object.fromEntries(byLetterMap);

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
        <header className="mb-8">
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{t.glossaryTitle}</h1>
          <p className="mt-4 leading-relaxed text-[var(--ink-dim)]">{t.glossaryIntro}</p>
          <p className="meta mt-3 uppercase">
            <span className="text-[var(--accent)]">{t.terms(entries.length)}</span>
          </p>
        </header>
      </FadeUp>

      {letters.length > 0 && (
        <FadeUp>
          <nav
            className="mb-6 flex flex-wrap gap-1.5 border-y border-line py-3"
            aria-label="Index alphabétique"
          >
            {letters.map((letter) => (
              <a key={letter} href={`#lettre-${letter}`} className="nb-btn px-2.5 py-1 text-xs">
                {letter}
              </a>
            ))}
          </nav>
        </FadeUp>
      )}

      <GlossaireFilter
        entries={entries}
        letters={letters}
        byLetter={byLetter}
        lang={lang}
        placeholder={t.glossaryFilterPlaceholder}
        noResult={t.glossaryNoResult}
        termLabel={t.terms}
      />
    </div>
  );
}
