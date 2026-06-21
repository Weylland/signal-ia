"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GlossaryTranslateAll() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    if (!confirm("Traduire en anglais toutes les définitions qui n'ont pas encore de version EN ?")) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/glossary/translate-all", { method: "POST" });
      const data = await res.json() as { translated?: number; remaining?: number; error?: string };
      if (typeof data.translated === "number") {
        setMsg(`${data.translated} traduit(s)${data.remaining ? `, ${data.remaining} en échec` : ""}.`);
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
    <div className="flex items-center gap-3">
      <button onClick={run} disabled={busy} className="nb-btn text-xs">
        {busy ? "Traduction…" : "Tout traduire en EN"}
      </button>
      {msg && <span className="meta">{msg}</span>}
    </div>
  );
}
