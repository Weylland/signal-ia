"use client";

import { useState } from "react";

type Labels = {
  subscribe: string;
  subscribed: string;
  error: string;
};

const defaults: Labels = {
  subscribe: "S'inscrire",
  subscribed: "✓ Inscription enregistrée, merci !",
  error: "Erreur — vérifie l'adresse.",
};

export function NewsletterForm({ labels = defaults }: { labels?: Labels }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "ok" | "error">("idle");

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setState(res.ok ? "ok" : "error");
    if (res.ok) setEmail("");
  }

  if (state === "ok") {
    return <p className="text-sm font-semibold">{labels.subscribed}</p>;
  }

  return (
    <form onSubmit={subscribe} className="flex flex-wrap gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="ton@email.fr"
        className="field w-auto flex-1 text-sm"
        aria-label="Email"
      />
      <button type="submit" className="nb-btn nb-btn-primary px-3 py-1.5 text-sm">
        {labels.subscribe}
      </button>
      {state === "error" && <p className="w-full text-xs font-semibold">{labels.error}</p>}
    </form>
  );
}
