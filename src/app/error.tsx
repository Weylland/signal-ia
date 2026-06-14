"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CoverPattern } from "@/components/CoverPattern";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center py-10 text-center">
      <div className="mb-8 w-full max-w-md overflow-hidden border-2 border-ink shadow-[5px_5px_0_var(--ink)]">
        <div className="aspect-[16/9]">
          <CoverPattern seed="500-error" label="500" />
        </div>
      </div>
      <p className="meta uppercase text-[var(--accent)]">Erreur</p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        Quelque chose a cassé
      </h1>
      <p className="mt-4 max-w-md leading-relaxed text-[var(--ink-dim)]">
        Une erreur inattendue s&apos;est produite. Tu peux réessayer ou revenir à l&apos;accueil.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="nb-btn nb-btn-primary">
          Réessayer
        </button>
        <Link href="/" className="nb-btn">
          Accueil
        </Link>
      </div>
    </div>
  );
}
