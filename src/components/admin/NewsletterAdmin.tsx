"use client";

import { useState } from "react";

type ArticleSnippet = { title: string; excerpt: string; slug: string };
type Subscriber = { id: number; email: string; created_at: string };

export function NewsletterAdmin({
  subscriberCount,
  weekArticles,
  subscribers,
}: {
  subscriberCount: number;
  weekArticles: ArticleSnippet[];
  subscribers: Subscriber[];
}) {
  const [subject, setSubject] = useState("signal·ia — Le digest de la semaine");
  const [preview, setPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showSubs, setShowSubs] = useState(false);

  async function generatePreview() {
    setSending(true);
    const res = await fetch("/api/admin/newsletter/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articles: weekArticles }),
    });
    if (res.ok) {
      const { html } = await res.json() as { html: string };
      setPreviewHtml(html);
      setPreview(true);
    }
    setSending(false);
  }

  async function send() {
    if (!confirm(`Envoyer à ${subscriberCount} abonné(s) ?`)) return;
    setSending(true);
    setMsg(null);
    const res = await fetch("/api/admin/newsletter/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, html: previewHtml }),
    });
    const data = await res.json() as { sent?: number; errors?: number; error?: string };
    if (res.ok) setMsg(`Envoyé à ${data.sent} abonné(s). ${data.errors ? `${data.errors} erreurs.` : ""}`);
    else setMsg(data.error ?? "Erreur.");
    setSending(false);
  }

  return (
    <div className="flex flex-col gap-6">
      {subscriberCount === 0 && (
        <div className="border border-line bg-[var(--bg-raised)] p-4 text-sm text-[var(--ink-dim)]">
          Aucun abonné pour l&apos;instant. Le formulaire d&apos;inscription est sur la page d&apos;accueil.
        </div>
      )}

      <div className="nb-card p-5">
        <h2 className="mb-4 font-display text-lg font-bold">Envoyer un digest</h2>
        {weekArticles.length === 0 ? (
          <p className="text-sm text-[var(--ink-dim)]">Aucun article cette semaine.</p>
        ) : (
          <>
            <p className="mb-3 text-sm text-[var(--ink-dim)]">
              Articles de la semaine inclus ({weekArticles.length}) :
            </p>
            <ul className="mb-4 flex flex-col gap-1 text-sm">
              {weekArticles.map((a) => <li key={a.slug} className="truncate text-[var(--ink-dim)]">· {a.title}</li>)}
            </ul>
            <label className="mb-3 block">
              <span className="meta mb-1 block text-sm uppercase">Sujet de l&apos;email</span>
              <input className="field" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </label>
            <div className="flex gap-2">
              <button onClick={generatePreview} disabled={sending} className="nb-btn text-sm">
                {sending ? "…" : "Générer l'aperçu"}
              </button>
              {preview && (
                <button onClick={send} disabled={sending || subscriberCount === 0} className="nb-btn nb-btn-primary text-sm">
                  {sending ? "Envoi…" : `Envoyer à ${subscriberCount} abonné(s)`}
                </button>
              )}
            </div>
            {msg && <p className="mt-3 text-sm font-semibold">{msg}</p>}
          </>
        )}
      </div>

      {preview && previewHtml && (
        <div className="nb-card overflow-hidden p-0">
          <div className="meta border-b border-line px-4 py-2.5 uppercase">Aperçu email</div>
          <iframe
            srcDoc={previewHtml}
            className="h-[600px] w-full border-0"
            title="Aperçu newsletter"
          />
        </div>
      )}

      <div className="nb-card p-5">
        <button
          type="button"
          onClick={() => setShowSubs((v) => !v)}
          className="flex w-full items-center justify-between text-sm font-bold"
        >
          <span>Liste des abonnés ({subscriberCount})</span>
          <span>{showSubs ? "▲" : "▼"}</span>
        </button>
        {showSubs && (
          <div className="mt-4 flex flex-col gap-1 text-sm">
            {subscribers.map((s) => (
              <div key={s.id} className="flex items-center justify-between border-b border-line py-1.5">
                <span className="font-mono">{s.email}</span>
                <span className="meta text-xs uppercase">{s.created_at.slice(0, 10)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
