"use client";

import { useState } from "react";
import Link from "next/link";

export function UnsubscribeConfirm({ token, email }: { token: string; email: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function confirm() {
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <>
        <p className="font-display text-3xl">Désinscription effectuée</p>
        <p className="mt-4 text-[var(--ink-dim)]">{email} a été retiré de la liste.</p>
        <Link href="/" className="nb-btn mt-8 inline-block">← Retour au site</Link>
      </>
    );
  }

  return (
    <>
      <p className="font-display text-3xl">Se désinscrire</p>
      <p className="mt-4 text-[var(--ink-dim)]">
        Confirme le retrait de <strong>{email}</strong> de la newsletter.
      </p>
      {status === "error" && (
        <p className="mt-4 font-mono text-[12px]" style={{ color: "var(--er)" }}>
          Une erreur est survenue. Réessaie.
        </p>
      )}
      <div className="mt-8 flex items-center justify-center gap-3">
        <button onClick={confirm} disabled={status === "loading"} className="nb-btn disabled:opacity-50">
          {status === "loading" ? "…" : "Confirmer la désinscription"}
        </button>
        <Link href="/" className="text-[var(--ink-dim)] underline">
          Annuler
        </Link>
      </div>
    </>
  );
}
