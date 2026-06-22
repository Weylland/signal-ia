"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type XPost = {
  id: number;
  posted_at: string;
  tweet_id: string | null;
  lang: string;
  title: string | null;
  type: string | null;
  article_slug: string;
  custom_text: string | null;
};

export function XAdmin({ configured, posts, includeLink: initialLink }: { configured: boolean; posts: XPost[]; includeLink: boolean }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [preview, setPreview] = useState<{ text: string; url: string; type: string; slug: string; withLink: boolean } | null>(null);
  const [includeLink, setIncludeLink] = useState(initialLink);
  const [deleting, setDeleting] = useState<number | null>(null);
  const router = useRouter();

  const [cText, setCText] = useState("");
  const [cTitle, setCTitle] = useState("");
  const [cTag, setCTag] = useState("ANNONCE");
  const [cLink, setCLink] = useState("");
  const [cBusy, setCBusy] = useState(false);
  const [cMsg, setCMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [cPreview, setCPreview] = useState<{ text: string; cardTitle: string; tag: string; withLink: boolean; url: string } | null>(null);

  async function runCustom(dryRun: boolean) {
    if (!cText.trim()) { setCMsg({ text: "Écris d'abord le texte du tweet.", ok: false }); return; }
    if (!dryRun && !confirm("Publier réellement ce tweet sur X maintenant ?")) return;
    setCBusy(true);
    setCMsg(null);
    if (dryRun) setCPreview(null);
    try {
      const res = await fetch("/api/admin/x/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cText, cardTitle: cTitle, tag: cTag, link: cLink, dryRun }),
      });
      const data = await res.json() as { posted?: string; preview?: string; cardTitle?: string; tag?: string; withLink?: boolean; url?: string; skipped?: string; error?: string };
      if (data.preview) {
        setCPreview({ text: data.preview, cardTitle: data.cardTitle ?? "", tag: data.tag ?? "", withLink: Boolean(data.withLink), url: data.url ?? "" });
        setCMsg({ text: "Aperçu généré (rien n'a été publié).", ok: true });
      } else if (data.posted) {
        setCMsg({ text: "Tweet publié.", ok: true });
        setCText(""); setCTitle(""); setCLink(""); setCPreview(null);
        router.refresh();
      } else if (data.skipped) {
        setCMsg({ text: `Rien posté : ${data.skipped}`, ok: false });
      } else {
        setCMsg({ text: data.error ?? "Erreur inconnue", ok: false });
      }
    } catch (err) {
      setCMsg({ text: String(err), ok: false });
    }
    setCBusy(false);
  }

  async function deletePost(id: number) {
    if (!confirm("Supprimer ce post ? (tentative de suppression sur X aussi)")) return;
    setDeleting(id);
    try {
      await fetch("/api/admin/x/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  async function toggleLink() {
    const next = !includeLink;
    setIncludeLink(next);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ xIncludeLink: next }),
    });
  }

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
      const data = await res.json() as { posted?: string; type?: string; preview?: string; url?: string; slug?: string; withLink?: boolean; skipped?: string; error?: string };
      if (data.preview) {
        setPreview({ text: data.preview, url: data.url ?? "", type: data.type ?? "?", slug: data.slug ?? "", withLink: Boolean(data.withLink) });
        setMsg({ text: "Aperçu généré (rien n'a été publié).", ok: true });
      } else if (data.posted) {
        setMsg({ text: `Publié : ${data.type} — ${data.posted}`, ok: true });
        router.refresh();
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
  const labelS = { fontFamily: "var(--ff-m)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--ink-f)", display: "block", marginBottom: "var(--s2)" } as const;

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
          Choisit automatiquement une actu importante récente, sinon un tuto evergreen. 2 posts/jour : ~11h30 (actu) et ~18h00 (tuto), heure de Paris.
        </p>

        <label style={{ display: "flex", alignItems: "flex-start", gap: "var(--s3)", marginBottom: "var(--s5)", cursor: "pointer" }}>
          <input type="checkbox" checked={includeLink} onChange={toggleLink} style={{ marginTop: 3 }} />
          <span style={{ ...mono, color: "var(--ink)" }}>
            Ajouter le lien de l&apos;article en réponse au tweet
            <span style={{ display: "block", fontSize: 11, color: "var(--ink-f)", marginTop: 2 }}>
              Activé : meilleur trafic, mais X facture ~0,20 $ par post contenant un lien. Désactivé : ~0,015 $ (le site reste visible sur la carte et dans la bio).
            </span>
          </span>
        </label>
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
            {preview.slug && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/admin/x/card?slug=${encodeURIComponent(preview.slug)}`}
                alt="Carte du post"
                style={{ display: "block", width: "100%", maxWidth: 480, marginTop: "var(--s4)", border: "1px solid var(--ln)" }}
              />
            )}
            {preview.withLink ? (
              <div style={{ ...mono, fontSize: 11, color: "var(--ac)", marginTop: "var(--s3)" }}>↳ en réponse : → {preview.url}</div>
            ) : (
              <div style={{ ...mono, fontSize: 11, color: "var(--ink-f)", marginTop: "var(--s3)" }}>Aucun lien posté (le site est sur la carte).</div>
            )}
            <div style={{ ...mono, fontSize: 10, color: "var(--ink-f)", marginTop: "var(--s2)" }}>{preview.text.length} / 280 caractères</div>
          </div>
        )}
      </div>

      <div style={card}>
        <div style={{ fontFamily: "var(--ff-h)", fontSize: 18, fontWeight: 700, marginBottom: "var(--s3)" }}>Tweet personnalisé</div>
        <p style={{ ...mono, color: "var(--ink-f)", marginBottom: "var(--s5)" }}>
          Pour un premier tweet, une annonce, un event… Tu écris le texte, une carte de marque est générée avec ton titre et ton tag.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
          <div>
            <label style={labelS} htmlFor="c-text">Texte du tweet</label>
            <textarea id="c-text" className="inp" rows={3} value={cText} onChange={(e) => setCText(e.target.value)} placeholder="Ce qui s'affiche dans le tweet…" style={{ width: "100%", resize: "vertical" }} />
            <div style={{ ...mono, fontSize: 10, color: cText.length > 280 ? "var(--er)" : "var(--ink-f)", marginTop: 2 }}>{cText.length} / 280</div>
          </div>
          <div style={{ display: "flex", gap: "var(--s4)", flexWrap: "wrap" }}>
            <div style={{ flex: "2 1 220px" }}>
              <label style={labelS} htmlFor="c-title">Titre sur la carte (optionnel)</label>
              <input id="c-title" className="inp" value={cTitle} onChange={(e) => setCTitle(e.target.value)} placeholder="défaut : le texte du tweet" style={{ width: "100%" }} />
            </div>
            <div style={{ flex: "1 1 120px" }}>
              <label style={labelS} htmlFor="c-tag">Tag de la carte</label>
              <input id="c-tag" className="inp" value={cTag} onChange={(e) => setCTag(e.target.value)} placeholder="ANNONCE" style={{ width: "100%" }} />
            </div>
          </div>
          <div>
            <label style={labelS} htmlFor="c-link">Lien en réponse (optionnel)</label>
            <input id="c-link" className="inp" value={cLink} onChange={(e) => setCLink(e.target.value)} placeholder="https://watch-ia.com" style={{ width: "100%" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)", flexWrap: "wrap" }}>
            <button className="btn btn-g" onClick={() => runCustom(true)} disabled={cBusy} style={{ ...mono }}>{cBusy ? "…" : "Tester (sans publier)"}</button>
            <button className="btn btn-p" onClick={() => runCustom(false)} disabled={cBusy || !configured} style={{ ...mono }}>{cBusy ? "Publication…" : "Publier ce tweet"}</button>
            {cMsg && <span style={{ ...mono, color: cMsg.ok ? "var(--ok)" : "var(--er)" }}>{cMsg.text}</span>}
          </div>
          {cPreview && (
            <div style={{ padding: "var(--s5)", background: "var(--bg-d)", border: "1px solid var(--ln)" }}>
              <div style={{ fontFamily: "var(--ff-h)", fontSize: 15, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{cPreview.text}</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/admin/x/card?title=${encodeURIComponent(cPreview.cardTitle)}&tag=${encodeURIComponent(cPreview.tag)}`}
                alt="Carte du tweet"
                style={{ display: "block", width: "100%", maxWidth: 480, marginTop: "var(--s4)", border: "1px solid var(--ln)" }}
              />
              {cPreview.withLink ? (
                <div style={{ ...mono, fontSize: 11, color: "var(--ac)", marginTop: "var(--s3)" }}>↳ en réponse : → {cPreview.url}</div>
              ) : (
                <div style={{ ...mono, fontSize: 11, color: "var(--ink-f)", marginTop: "var(--s3)" }}>Aucun lien (le site est sur la carte).</div>
              )}
            </div>
          )}
        </div>
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
              {posts.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--ln)" }}>
                  <td style={{ padding: "var(--s3)", ...mono, fontSize: 11, color: "var(--ink-f)", whiteSpace: "nowrap" }}>{p.posted_at.slice(0, 16).replace("T", " ")}</td>
                  <td style={{ padding: "var(--s3)", ...mono, fontSize: 10, color: "var(--ac)", textTransform: "uppercase" }}>{p.custom_text ? "custom" : (p.type ?? "?")}</td>
                  <td style={{ padding: "var(--s3)", fontFamily: "var(--ff-h)", fontSize: 13 }}>{p.custom_text ?? p.title ?? p.article_slug}</td>
                  <td style={{ padding: "var(--s3)", textAlign: "right", whiteSpace: "nowrap" }}>
                    {p.tweet_id && (
                      <a className="btn btn-sm" style={{ ...mono, fontSize: 10, marginRight: "var(--s2)" }} href={`https://x.com/i/web/status/${p.tweet_id}`} target="_blank" rel="noreferrer">Voir ↗</a>
                    )}
                    <button
                      className="btn btn-sm"
                      style={{ ...mono, fontSize: 10, color: "var(--er)", borderColor: "var(--er)" }}
                      onClick={() => deletePost(p.id)}
                      disabled={deleting === p.id}
                    >
                      {deleting === p.id ? "…" : "Supprimer"}
                    </button>
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
