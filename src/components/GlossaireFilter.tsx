"use client";

import { useState } from "react";
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
  lang: Lang;
  placeholder: string;
  noResult: string;
  allLabel: string;
};

export function GlossaireFilter({ entries, letters, lang, placeholder, noResult, allLabel }: Props) {
  const [query, setQuery] = useState("");
  const [letter, setLetter] = useState("");
  const q = query.trim().toLowerCase();

  const filtered = entries.filter((e) => {
    if (letter && e.term[0].toUpperCase() !== letter) return false;
    if (q && !e.term.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="inp inp-sm"
            style={{ width: 260, flex: "0 0 260px" }}
            autoComplete="off"
          />
          <button onClick={() => setLetter("")} className={`btn btn-sm${!letter ? " btn-p" : ""}`}>
            {allLabel}
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {letters.map((l) => (
            <button
              key={l}
              onClick={() => setLetter(letter === l ? "" : l)}
              className={`btn btn-sm${letter === l ? " btn-p" : ""}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {filtered.map((entry) => {
          const def = lang === "en" && entry.definitionEnHtml ? entry.definitionEnHtml : entry.definitionHtml;
          return (
            <div
              key={entry.id}
              id={entry.slug}
              className="grid scroll-mt-24 items-start gap-5 border border-line p-5 [grid-template-columns:140px_1fr] max-sm:grid-cols-1"
              style={{ background: "var(--bg-r)" }}
            >
              <div className="font-mono text-[16px] font-bold tracking-[-0.01em] text-[var(--ac)]">
                {entry.term}
              </div>
              <div
                className="font-serif text-[15px] leading-[1.65] text-[var(--ink-d)]"
                dangerouslySetInnerHTML={{ __html: def }}
              />
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-12 text-center font-mono text-[13px] text-[var(--ink-f)]">{noResult}</div>
        )}
      </div>
    </div>
  );
}
