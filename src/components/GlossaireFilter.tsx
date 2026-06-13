"use client";

import { useState } from "react";
import { FadeUp } from "./Reveal";
import type { Lang } from "@/lib/i18n";

type Entry = {
  id: number;
  slug: string;
  term: string;
  definitionHtml: string;
  definitionEnHtml?: string | null;
};

type Props = {
  entries: Entry[];
  letters: string[];
  byLetter: Record<string, Entry[]>;
  lang: Lang;
  placeholder: string;
  noResult: (q: string) => string;
  termLabel: (n: number) => string;
};

export function GlossaireFilter({ entries, letters, byLetter, lang, placeholder, noResult, termLabel }: Props) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filtered = q.length > 0
    ? entries.filter((e) => e.term.toLowerCase().includes(q))
    : null;

  return (
    <div>
      {/* Barre de recherche */}
      <div className="mb-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="field w-full max-w-sm"
          autoComplete="off"
        />
      </div>

      {filtered !== null ? (
        /* Résultats filtrés */
        filtered.length === 0 ? (
          <p className="nb-card max-w-md p-6 text-sm text-[var(--ink-dim)]">{noResult(query.trim())}</p>
        ) : (
          <div className="flex flex-col gap-5">
            <p className="meta uppercase">{termLabel(filtered.length)}</p>
            {filtered.map((entry) => {
              const defHtml = lang === "en" && entry.definitionEnHtml ? entry.definitionEnHtml : entry.definitionHtml;
              return (
                <section key={entry.id} id={entry.slug} className="nb-card scroll-mt-24 p-6">
                  <h3 className="font-display text-xl">{entry.term}</h3>
                  <div
                    className="mt-2 text-sm leading-relaxed text-[var(--ink-dim)]"
                    dangerouslySetInnerHTML={{ __html: defHtml }}
                  />
                </section>
              );
            })}
          </div>
        )
      ) : (
        /* Vue alphabétique */
        <div className="flex flex-col gap-12">
          {letters.map((letter) => (
            <section key={letter} id={`lettre-${letter}`} className="scroll-mt-24">
              <div className="section-head">
                <span className="idx">{letter}</span>
                <h2>{byLetter[letter].length} {lang === "en" ? "term(s)" : "terme(s)"}</h2>
              </div>
              <div className="flex flex-col gap-5">
                {byLetter[letter].map((entry, i) => {
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
      )}
    </div>
  );
}
