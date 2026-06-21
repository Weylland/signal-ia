"use client";

import { useState } from "react";

type XPost = {
  posted_at: string;
  tweet_id: string | null;
  lang: string;
  title: string | null;
  type: string | null;
  article_slug: string;
};

export function XAdmin({ configured, posts }: { configured: boolean; posts: XPost[] }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [preview, setPreview] = useState<{ text: string; url: string; type: string } | null>(null);

  async function run(dryRun: boolean) {
    if (!dryRun && !confirm("Publier réellement ce post sur X maintenant ?")) return;
    setBusy(true);
    setMsg(null);
    if (dryRun) setPreview(null);
    try {
      const res = await fetch("/api/admin/x/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const data = await res.json() as { posted?: string; type?: string; preview?: string; url?: string; skipped?: string; error?: string };
      if (data.preview) {
        setPreview({ text: data.preview, url: data.url ?? "", type: data.type ?? "?" });
        setMsg({ text: "Aperçu généré (rien n'a été publié).", ok: true });
      } else if (data.posted) {
        setMsg({ text: `Publié : ${data.type} — ${data.posted}`, ok: true });
      } else if (data.skipped) {
        setMsg({ text: `Rien posté : ${data.skipped}`, ok: false });
      } else {
        setMsg({ text: data.error ?? "Erreur inconnue", ok: false });
      }
    } catch (err) {
      setMsg({ text: String(err), ok: false });
    }
    setBusy(false);
  }

  const card = { background: "var(--bg-r)", border: "1px solid var(--ln)", padding: "var(--s6)" } as const;
  const mono = { fontFamily: "var(--ff-m)", fontSize: 12 } as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s5)" }}>
      {!configured && (
        <div style={{ ...card, borderLeft: "3px solid var(--wn)", color: "var(--wn)", ...mono }}>
          Clés X absentes. Renseigne X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN et X_ACCESS_SECRET dans les variables Railway.
        </div>
      )}

      <div style={card}>
        <div style={{ fontFamily: "var(--ff-h)", fontSize: 18, fontWeight: 700, marginBottom: "var(--s3)" }}>Publier sur X</div>
        <p style={{ ...mono, color: "var(--ink-f)", marginBottom: "var(--s5)" }}>
          Choisit automatiquement une actu importante récente, sinon un tuto evergreen. Le lien part en réponse au tweet. Posté chaque jour ~11h30 (heure de Paris).
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)", flexWrap: "wrap" }}>
          <button className="btn btn-g" onClick={() => run(true)} disabled={busy} style={{ ...mono }}>
            {busy ? "…" : "Tester (sans publier)"}
          </button>
          <button className="btn btn-p" onClick={() => run(false)} disabled={busy || !configured} style={{ ...mono }}>
            {busy ? "Publication…" : "Poster maintenant"}
          </button>
          {msg && <span style={{ ...mono, color: msg.ok ? "var(--ok)" : "var(--er)" }}>{msg.text}</span>}
        </div>

        {preview && (
          <div style={{ marginTop: "var(--s5)", padding: "var(--s5)", background: "var(--bg-d)", border: "1px solid var(--ln)" }}>
            <div style={{ fontFamily: "var(--ff-m)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--ink-f)", marginBottom: "var(--s3)" }}>
              Aperçu du post ({preview.type}) — non publié
            </div>
            <div style={{ fontFamily: "var(--ff-h)", fontSize: 15, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{preview.text}</div>
            <div style={{ ...mono, fontSize: 11, color: "var(--ac)", marginTop: "var(--s3)" }}>↳ en réponse : → {preview.url}</div>
            <div style={{ ...mono, fontSize: 10, color: "var(--ink-f)", marginTop: "var(--s2)" }}>{preview.text.length} / 280 caractères</div>
          </div>
        )}
      </div>

      <div style={card}>
        <div style={{ fontFamily: "var(--ff-h)", fontSize: 15, fontWeight: 600, marginBottom: "var(--s5)" }}>
          Derniers posts ({posts.length})
        </div>
        {posts.length === 0 ? (
          <div style={{ ...mono, color: "var(--ink-f)" }}>Aucun post pour l&apos;instant.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {posts.map((p, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--ln)" }}>
                  <td style={{ padding: "var(--s3)", ...mono, fontSize: 11, color: "var(--ink-f)", whiteSpace: "nowrap" }}>{p.posted_at.slice(0, 16).replace("T", " ")}</td>
                  <td style={{ padding: "var(--s3)", ...mono, fontSize: 10, color: "var(--ac)", textTransform: "uppercase" }}>{p.type ?? "?"}</td>
                  <td style={{ padding: "var(--s3)", fontFamily: "var(--ff-h)", fontSize: 13 }}>{p.title ?? p.article_slug}</td>
                  <td style={{ padding: "var(--s3)", textAlign: "right" }}>
                    {p.tweet_id && (
                      <a className="btn btn-sm" style={{ ...mono, fontSize: 10 }} href={`https://x.com/i/web/status/${p.tweet_id}`} target="_blank" rel="noreferrer">Voir ↗</a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
