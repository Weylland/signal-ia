"use client";

import { useState } from "react";

type ArticleSnippet = { title: string; excerpt: string; slug: string };
type Subscriber = { id: number; email: string; created_at: string };

const S = {
  card: { background: "var(--bg-r)", border: "1px solid var(--ln)", padding: "var(--s6)" },
  label: { fontFamily: "var(--ff-m)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--ink-f)", display: "block", marginBottom: "var(--s2)" },
  h2: { fontFamily: "var(--ff-h)", fontSize: 18, fontWeight: 700, letterSpacing: "-.01em", marginBottom: "var(--s5)" },
  mono: { fontFamily: "var(--ff-m)", fontSize: 12 },
};

export function NewsletterAdmin({
  subscriberCount,
  weekArticles,
  subscribers,
}: {
  subscriberCount: number;
  weekArticles: ArticleSnippet[];
  subscribers: Subscriber[];
}) {
  const [subject, setSubject] = useState("watch·ia — Le digest de la semaine");
  const [customNote, setCustomNote] = useState("");
  const [preview, setPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [showSubs, setShowSubs] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [subs, setSubs] = useState(subscribers);

  async function deleteSub(email: string) {
    if (!confirm(`Supprimer l'abonné ${email} ?`)) return;
    const res = await fetch("/api/admin/newsletter/subscribers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) setSubs((prev) => prev.filter((s) => s.email !== email));
  }

  async function generatePreview() {
    setSending(true);
    setMsg(null);
    const res = await fetch("/api/admin/newsletter/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articles: weekArticles, customNote: customNote.trim() || undefined }),
    });
    if (res.ok) {
      const { html } = await res.json() as { html: string };
      setPreviewHtml(html);
      setPreview(true);
    } else {
      setMsg({ text: "Erreur lors de la génération de l'aperçu.", ok: false });
    }
    setSending(false);
  }

  async function send() {
    setConfirmSend(false);
    setSending(true);
    setMsg(null);
    const res = await fetch("/api/admin/newsletter/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, html: previewHtml }),
    });
    const data = await res.json() as { sent?: number; errors?: number; error?: string };
    if (res.ok) setMsg({ text: `Envoyé à ${data.sent} abonné(s).${data.errors ? ` ${data.errors} erreurs.` : ""}`, ok: true });
    else setMsg({ text: data.error ?? "Erreur lors de l'envoi.", ok: false });
    setSending(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s5)" }}>
      {/* Confirmation modal */}
      {confirmSend && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--bg-r)", border: "1px solid var(--ln-h)", padding: "var(--s7)", maxWidth: 400, width: "90%", boxShadow: "var(--sh)" }}>
            <div style={{ fontFamily: "var(--ff-h)", fontSize: 18, fontWeight: 700, marginBottom: "var(--s3)" }}>Envoyer la newsletter ?</div>
            <div style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-f)", marginBottom: "var(--s6)" }}>
              {subscriberCount} abonné{subscriberCount > 1 ? "s" : ""} vont recevoir cet email.
            </div>
            <div style={{ display: "flex", gap: "var(--s3)" }}>
              <button className="btn btn-p" style={{ flex: 1 }} onClick={send} disabled={sending}>
                {sending ? "Envoi…" : "Confirmer l'envoi"}
              </button>
              <button className="btn btn-g" style={{ flex: 1 }} onClick={() => setConfirmSend(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {subscriberCount === 0 && (
        <div style={{ ...S.card, borderLeft: "3px solid var(--wn)", color: "var(--wn)", ...S.mono }}>
          Aucun abonné pour l&apos;instant. Le formulaire d&apos;inscription est sur la page d&apos;accueil.
        </div>
      )}

      {/* Compose section */}
      <div style={S.card}>
        <div style={S.h2}>Composer le digest</div>

        {weekArticles.length === 0 ? (
          <div style={{ ...S.mono, color: "var(--ink-f)" }}>Aucun article cette semaine.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s5)" }}>
            {/* Articles list */}
            <div>
              <div style={S.label}>Articles inclus ({weekArticles.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
                {weekArticles.map((a) => (
                  <div key={a.slug} style={{ display: "flex", gap: "var(--s3)", alignItems: "flex-start", padding: "var(--s3)", border: "1px solid var(--ln)", background: "var(--bg-d)" }}>
                    <span style={{ color: "var(--ac)", flexShrink: 0, fontFamily: "var(--ff-m)", fontSize: 11 }}>·</span>
                    <div>
                      <div style={{ fontFamily: "var(--ff-h)", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{a.title}</div>
                      {a.excerpt && <div style={{ ...S.mono, fontSize: 11, color: "var(--ink-f)", marginTop: 2 }}>{a.excerpt.slice(0, 80)}…</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label style={S.label} htmlFor="nl-subject">Objet de l&apos;email</label>
              <input
                id="nl-subject"
                className="inp"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            {/* Optional note */}
            <div>
              <label style={S.label} htmlFor="nl-note">Note éditoriale (optionnel)</label>
              <textarea
                id="nl-note"
                className="inp"
                rows={3}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Un mot de l'équipe, une annonce, un contexte…"
                style={{ width: "100%", resize: "vertical" }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--s3)" }}>
              <button
                className="btn btn-g"
                onClick={generatePreview}
                disabled={sending}
                style={{ fontFamily: "var(--ff-m)", fontSize: 12 }}
              >
                {sending ? "Génération…" : "Aperçu"}
              </button>
              {preview && (
                <button
                  className="btn btn-p"
                  onClick={() => setConfirmSend(true)}
                  disabled={sending || subscriberCount === 0}
                  style={{ fontFamily: "var(--ff-m)", fontSize: 12 }}
                >
                  Envoyer à {subscriberCount} abonné{subscriberCount > 1 ? "s" : ""}
                </button>
              )}
              {msg && (
                <span style={{ ...S.mono, color: msg.ok ? "var(--ok)" : "var(--er)" }}>{msg.text}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Preview iframe */}
      {preview && previewHtml && (
        <div style={{ border: "1px solid var(--ln)", overflow: "hidden" }}>
          <div style={{ ...S.label, padding: "var(--s3) var(--s5)", borderBottom: "1px solid var(--ln)", background: "var(--bg-r)", marginBottom: 0 }}>
            Aperçu email
          </div>
          <iframe
            srcDoc={previewHtml}
            style={{ width: "100%", height: 600, border: 0, display: "block" }}
            title="Aperçu newsletter"
          />
        </div>
      )}

      {/* Subscribers list */}
      <div style={S.card}>
        <button
          type="button"
          onClick={() => setShowSubs((v) => !v)}
          style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <span style={{ fontFamily: "var(--ff-h)", fontSize: 15, fontWeight: 600 }}>Abonnés ({subs.length})</span>
          <span style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-f)" }}>{showSubs ? "▲" : "▼"}</span>
        </button>
        {showSubs && (
          <div style={{ marginTop: "var(--s5)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--ln-h)" }}>
                  {["Email", "Inscrit le", ""].map((h) => (
                    <th key={h} style={{ ...S.label, padding: "var(--s2) var(--s3)", textAlign: "left", marginBottom: 0 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid var(--ln)" }}>
                    <td style={{ padding: "var(--s3)", fontFamily: "var(--ff-m)", fontSize: 12 }}>{s.email}</td>
                    <td style={{ padding: "var(--s3)", fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink-f)" }}>{s.created_at.slice(0, 10)}</td>
                    <td style={{ padding: "var(--s3)", textAlign: "right" }}>
                      <button
                        className="btn btn-sm"
                        style={{ fontFamily: "var(--ff-m)", fontSize: 10, color: "var(--er)", borderColor: "var(--er)" }}
                        onClick={() => deleteSub(s.email)}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
                {subs.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: "var(--s7)", textAlign: "center", fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-f)" }}>
                      Aucun abonné.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
