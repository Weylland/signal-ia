"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PendingItem = {
  id: number;
  url: string;
  title: string;
  source_name: string;
  summary: string;
  published_at: string | null;
  score: number | null;
  status: string;
  article_slug: string | null;
  seen_at: string;
};

export function ModerationQueue({ items }: { items: PendingItem[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<number | null>(null);

  async function act(id: number, action: "publish" | "reject") {
    setLoading(id);
    await fetch("/api/admin/moderation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    router.refresh();
    setLoading(null);
  }

  if (items.length === 0) {
    return (
      <div className="border border-line bg-[var(--bg-raised)] px-6 py-10 text-center text-[var(--ink-dim)]">
        Aucun article en attente de modération.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.id} className="nb-card flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
          <div className="flex-1 min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              {item.score !== null && (
                <span
                  className={`nb-pill text-xs ${item.score >= 7 ? "tag--hot" : ""}`}
                >
                  score {item.score}/10
                </span>
              )}
              <span className="meta uppercase">{item.source_name}</span>
              {item.published_at && (
                <span className="meta uppercase">
                  {new Date(item.published_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                </span>
              )}
            </div>
            <h3 className="font-display text-lg leading-snug">{item.title}</h3>
            {item.summary && (
              <p className="mt-1.5 text-sm text-[var(--ink-dim)] line-clamp-2">{item.summary}</p>
            )}
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="meta mt-1 block truncate text-xs hover:text-[var(--accent)]"
            >
              {item.url}
            </a>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => act(item.id, "publish")}
              disabled={loading === item.id}
              className="nb-btn nb-btn-primary text-sm"
            >
              {loading === item.id ? "…" : "✓ Publier"}
            </button>
            <button
              type="button"
              onClick={() => act(item.id, "reject")}
              disabled={loading === item.id}
              className="nb-btn text-sm"
            >
              ✕ Rejeter
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
