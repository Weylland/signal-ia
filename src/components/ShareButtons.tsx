"use client";

import { useState } from "react";

type Labels = { share: string; copy: string; copied: string };
const defaults: Labels = { share: "Partager —", copy: "Copier le lien", copied: "✓ Copié" };

export function ShareButtons({
  title,
  url,
  labels = defaults,
}: {
  title: string;
  url: string;
  labels?: Labels;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const encoded = { url: encodeURIComponent(url), title: encodeURIComponent(title) };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="meta uppercase">{labels.share}</span>
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
        {copied ? labels.copied : labels.copy}
      </button>
    </div>
  );
}
