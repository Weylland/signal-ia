"use client";

import { useState } from "react";
import type { Reaction } from "@/lib/articles";
import type { Lang } from "@/lib/i18n";

const REACTIONS: { key: Reaction; emoji: string; fr: string; en: string }[] = [
  { key: "useful", emoji: "👍", fr: "Utile", en: "Useful" },
  { key: "fire", emoji: "🔥", fr: "Important", en: "Important" },
  { key: "think", emoji: "🤔", fr: "À creuser", en: "Think about it" },
];

export function ReactionBar({
  slug,
  initial,
  lang = "fr",
}: {
  slug: string;
  initial: Record<Reaction, number>;
  lang?: Lang;
}) {
  const [counts, setCounts] = useState(initial);
  const [voted, setVoted] = useState<Reaction | null>(null);
  const [loading, setLoading] = useState(false);

  async function react(reaction: Reaction) {
    if (voted || loading) return;
    setLoading(true);
    const res = await fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, reaction }),
    });
    if (res.ok) {
      const updated = await res.json() as Record<Reaction, number>;
      setCounts(updated);
      setVoted(reaction);
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-1">
      <span className="meta mr-2 uppercase">{lang === "en" ? "React:" : "Réagir :"}</span>
      {REACTIONS.map(({ key, emoji, fr, en }) => (
        <button
          key={key}
          type="button"
          onClick={() => react(key)}
          disabled={!!voted || loading}
          title={lang === "en" ? en : fr}
          className={`meta flex items-center gap-1 border border-line px-2.5 py-1 text-xs uppercase transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-60 ${voted === key ? "border-[var(--accent)] text-[var(--accent)]" : ""}`}
        >
          <span>{emoji}</span>
          {counts[key] > 0 && <span>{counts[key]}</span>}
        </button>
      ))}
    </div>
  );
}
