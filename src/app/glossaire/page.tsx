import type { Metadata } from "next";
import { getGlossary } from "@/lib/glossary";
import { getLang, getDict } from "@/lib/i18n";
import { FadeUp } from "@/components/Reveal";

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

  const byLetter = new Map<string, typeof entries>();
  for (const entry of entries) {
    const letter = entry.term[0].toUpperCase();
    byLetter.set(letter, [...(byLetter.get(letter) ?? []), entry]);
  }
  const letters = [...byLetter.keys()].sort();

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

      <FadeUp>
        <nav
          className="mb-10 flex flex-wrap gap-1.5 border-y border-line py-3"
          aria-label="Index alphabétique"
        >
          {letters.map((letter) => (
            <a key={letter} href={`#lettre-${letter}`} className="nb-btn px-2.5 py-1 text-xs">
              {letter}
            </a>
          ))}
        </nav>
      </FadeUp>

      <div className="flex flex-col gap-12">
        {letters.map((letter) => (
          <section key={letter} id={`lettre-${letter}`} className="scroll-mt-24">
            <div className="section-head">
              <span className="idx">{letter}</span>
              <h2>{byLetter.get(letter)!.length} {lang === "en" ? "term(s)" : "terme(s)"}</h2>
            </div>
            <div className="flex flex-col gap-5">
              {byLetter.get(letter)!.map((entry, i) => {
                const defHtml = lang === "en" && entry.definitionEnHtml ? entry.definitionEnHtml : entry.definitionHtml;
                return (
                  <FadeUp key={entry.id} delay={Math.min(i * 0.03, 0.15)}>
                    <section id={entry.slug} className="nb-card scroll-mt-24 p-6">
                      <h3 className="font-display text-xl">{entry.term}</h3>
                      <div
                        className="mt-2 text-sm leading-relaxed text-[var(--ink-dim)]"
                        dangerouslySetInnerHTML={{ __html: defHtml }}
                      />
                    </section>
                  </FadeUp>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
