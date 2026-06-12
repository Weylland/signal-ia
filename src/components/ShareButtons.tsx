"use client";

import { useState } from "react";

export function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const encoded = { url: encodeURIComponent(url), title: encodeURIComponent(title) };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-display text-xs font-bold uppercase tracking-wider">Partager :</span>
      <a
        href={`https://x.com/intent/tweet?text=${encoded.title}&url=${encoded.url}`}
        target="_blank"
        rel="noopener noreferrer"
        className="nb-btn px-3 py-1.5 text-xs"
      >
        X
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded.url}`}
        target="_blank"
        rel="noopener noreferrer"
        className="nb-btn px-3 py-1.5 text-xs"
      >
        LinkedIn
      </a>
      <button onClick={copy} className="nb-btn px-3 py-1.5 text-xs">
        {copied ? "✓ Copié" : "Copier le lien"}
      </button>
    </div>
  );
}
