"use client";

import { useState } from "react";

export function PipelineTrigger() {
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function trigger() {
    setRunning(true);
    setMsg(null);
    const res = await fetch("/api/admin/pipeline/trigger", { method: "POST" });
    if (res.ok) {
      setMsg("Pipeline terminé.");
    } else {
      const data = await res.json().catch(() => ({})) as { error?: string };
      setMsg(data.error ?? "Erreur.");
    }
    setRunning(false);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={trigger}
        disabled={running}
        className="nb-btn nb-btn-primary text-sm"
      >
        {running ? "Pipeline en cours…" : "▶ Lancer le pipeline"}
      </button>
      {msg && <span className="text-sm">{msg}</span>}
    </div>
  );
}
