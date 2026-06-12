"use client";

import { useState } from "react";

export function NewsletterForm() {
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
    return <p className="text-sm font-semibold">✓ Inscription enregistrée, merci !</p>;
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
        aria-label="Adresse email"
      />
      <button type="submit" className="nb-btn nb-btn-primary px-3 py-1.5 text-sm">
        S&apos;inscrire
      </button>
      {state === "error" && (
        <p className="w-full text-xs font-semibold">Erreur — vérifie l&apos;adresse.</p>
      )}
    </form>
  );
}
