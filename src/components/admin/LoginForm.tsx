"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { splitBrand } from "@/lib/brand";

export function LoginForm({ siteName = "watch·ia" }: { siteName?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const brand = splitBrand(siteName);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erreur de connexion");
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ width: "100%", maxWidth: 360, padding: "0 var(--s5)" }}>
        <div style={{ marginBottom: "var(--s6)", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--ff-h)", fontWeight: 700, fontSize: 22, letterSpacing: "-.03em", marginBottom: "var(--s2)" }}>
            <span style={{ color: "var(--ac)" }}>{brand.before}</span>
            {brand.after && `·${brand.after}`}
          </div>
          <div style={{ fontFamily: "var(--ff-m)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--ink-f)" }}>
            Administration
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--s4)", background: "var(--bg-r)", border: "1px solid var(--ln-h)", padding: "var(--s6)", boxShadow: "var(--sh)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
            <label htmlFor="password" style={{ fontFamily: "var(--ff-m)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--ink-f)" }}>
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              className="inp"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
          </div>
          {error && (
            <p style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--er)" }}>{error}</p>
          )}
          <button type="submit" className="btn btn-p" disabled={loading}>
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
