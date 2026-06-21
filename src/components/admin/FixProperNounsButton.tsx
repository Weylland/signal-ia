"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FixProperNounsButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    if (!confirm("Corriger les noms propres mal francisés (ex. « le Verge » → « The Verge ») sur tous les articles ?")) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/articles/fix-proper-nouns", { method: "POST" });
      const data = await res.json() as { articlesChanged?: number; replacements?: number; error?: string };
      if (typeof data.articlesChanged === "number") {
        setMsg(`${data.articlesChanged} article(s) corrigé(s), ${data.replacements} remplacement(s).`);
        router.refresh();
      } else {
        setMsg(data.error ?? "Erreur");
      }
    } catch (err) {
      setMsg(String(err));
    }
    setBusy(false);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)" }}>
      <button onClick={run} disabled={busy} className="btn btn-sm btn-g" style={{ fontFamily: "var(--ff-m)", fontSize: 11 }}>
        {busy ? "Correction…" : "Corriger les noms propres"}
      </button>
      {msg && <span style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink-f)" }}>{msg}</span>}
    </div>
  );
}
