"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RichTextEditor } from "./RichTextEditor";

type EditorProps = {
  slug?: string;
  initial?: {
    title: string;
    excerpt: string;
    tags: string[];
    image: string | null;
    html: string;
    published: boolean;
    type: "news" | "tuto";
    difficulty?: string | null;
    tldr: string[];
    scheduledAt: string | null;
    titleEn?: string | null;
    excerptEn?: string | null;
    tldrEn?: string[];
    htmlEn?: string | null;
  };
};

const S = {
  label: { fontFamily: "var(--ff-m)", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--ink-f)", display: "block", marginBottom: "var(--s2)" },
  section: { display: "flex", flexDirection: "column" as const, gap: "var(--s3)" },
  divider: { borderTop: "1px solid var(--ln)", paddingTop: "var(--s5)", marginTop: "var(--s2)" },
  sectionTitle: { fontFamily: "var(--ff-h)", fontSize: 13, fontWeight: 600, letterSpacing: "-.01em", marginBottom: "var(--s3)", color: "var(--ink-f)" },
};

export function ArticleEditor({ slug, initial }: EditorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState(initial?.title ?? searchParams.get("title") ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? searchParams.get("excerpt") ?? "");
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");
  const [image, setImage] = useState(initial?.image ?? searchParams.get("image") ?? "");
  const [html, setHtml] = useState(initial?.html ?? "");
  const [type, setType] = useState<"news" | "tuto">(initial?.type ?? "news");
  const [difficulty, setDifficulty] = useState<string>(initial?.difficulty ?? "");
  const [tldr, setTldr] = useState<string[]>([
    initial?.tldr[0] ?? "",
    initial?.tldr[1] ?? "",
    initial?.tldr[2] ?? "",
  ]);
  const [scheduledAt, setScheduledAt] = useState(
    initial?.scheduledAt ? initial.scheduledAt.slice(0, 16) : ""
  );
  const [showEn, setShowEn] = useState(false);
  const [titleEn, setTitleEn] = useState(initial?.titleEn ?? "");
  const [excerptEn, setExcerptEn] = useState(initial?.excerptEn ?? "");
  const [tldrEn, setTldrEn] = useState<string[]>([
    initial?.tldrEn?.[0] ?? "",
    initial?.tldrEn?.[1] ?? "",
    initial?.tldrEn?.[2] ?? "",
  ]);
  const [htmlEn, setHtmlEn] = useState(initial?.htmlEn ?? "");
  const [translating, setTranslating] = useState(false);
  const [enSaving, setEnSaving] = useState(false);
  const [enMsg, setEnMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save(published: boolean, schedule = false) {
    setSaving(true);
    setError(null);

    const payload = {
      title,
      excerpt,
      html,
      published,
      image: image.trim() || null,
      type,
      difficulty: type === "tuto" ? difficulty || null : null,
      tldr: tldr.map((t) => t.trim()).filter(Boolean),
      scheduledAt:
        schedule && scheduledAt ? new Date(scheduledAt).toISOString() : null,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    };

    const res = await fetch(slug ? `/api/admin/articles/${slug}` : "/api/admin/articles", {
      method: slug ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push("/admin/articles");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erreur lors de l'enregistrement");
      setSaving(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    if (res.ok) {
      const { url } = await res.json();
      setImage(url);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erreur lors de l'upload");
    }
    setUploading(false);
  }

  async function autoTranslate() {
    if (!slug) return;
    setTranslating(true);
    setEnMsg(null);
    const res = await fetch(`/api/admin/articles/${slug}/translation`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autoTranslate: true }),
    });
    if (res.ok) {
      const data = await fetch(`/api/admin/articles/${slug}/translation`).then((r) => r.json()) as {
        titleEn: string; excerptEn: string; tldrEn: string[]; htmlEn: string;
      };
      setTitleEn(data.titleEn ?? "");
      setExcerptEn(data.excerptEn ?? "");
      setTldrEn([data.tldrEn?.[0] ?? "", data.tldrEn?.[1] ?? "", data.tldrEn?.[2] ?? ""]);
      setHtmlEn(data.htmlEn ?? "");
      setEnMsg("Traduction effectuée.");
    } else {
      setEnMsg("Erreur lors de la traduction.");
    }
    setTranslating(false);
  }

  async function saveEn() {
    if (!slug) return;
    setEnSaving(true);
    setEnMsg(null);
    const res = await fetch(`/api/admin/articles/${slug}/translation`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titleEn: titleEn.trim() || null,
        excerptEn: excerptEn.trim() || null,
        tldrEn: tldrEn.map((t) => t.trim()).filter(Boolean),
        htmlEn: htmlEn.trim() || null,
      }),
    });
    setEnMsg(res.ok ? "Traduction sauvegardée." : "Erreur lors de la sauvegarde.");
    setEnSaving(false);
  }

  async function handleDelete() {
    if (!slug) return;
    setSaving(true);
    const res = await fetch(`/api/admin/articles/${slug}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/articles");
      router.refresh();
    } else {
      setError("Erreur lors de la suppression");
      setSaving(false);
    }
    setConfirmDelete(false);
  }

  const canSave = !!title && !!html;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s6)" }}>
      {/* Confirm delete modal */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--bg-r)", border: "1px solid var(--ln-h)", padding: "var(--s7)", maxWidth: 380, width: "90%", boxShadow: "var(--sh)" }}>
            <div style={{ fontFamily: "var(--ff-h)", fontSize: 18, fontWeight: 700, marginBottom: "var(--s3)" }}>Supprimer cet article ?</div>
            <div style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-f)", marginBottom: "var(--s6)" }}>Cette action est irréversible.</div>
            <div style={{ display: "flex", gap: "var(--s3)" }}>
              <button
                className="btn btn-p"
                style={{ flex: 1, color: "var(--er)", background: "none", borderColor: "var(--er)" }}
                onClick={handleDelete}
                disabled={saving}
              >
                Supprimer
              </button>
              <button className="btn btn-g" style={{ flex: 1 }} onClick={() => setConfirmDelete(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Type + Difficulty */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--s3)" }}>
        <div style={{ display: "flex", gap: "var(--s2)", border: "1px solid var(--ln)", padding: 3 }}>
          {(["news", "tuto"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`btn btn-sm ${type === t ? "btn-p" : "btn-g"}`}
              style={{ fontFamily: "var(--ff-m)", fontSize: 11 }}
            >
              {t === "news" ? "Actu" : "Tuto"}
            </button>
          ))}
        </div>
        {type === "tuto" && (
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="inp inp-sm"
            style={{ minWidth: 160 }}
          >
            <option value="">Niveau (optionnel)</option>
            <option value="debutant">Débutant</option>
            <option value="intermediaire">Intermédiaire</option>
            <option value="avance">Avancé</option>
          </select>
        )}
      </div>

      {/* Title */}
      <div style={S.section}>
        <label style={S.label} htmlFor="ed-title">Titre</label>
        <input
          id="ed-title"
          className="inp"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre de l'article"
          required
          style={{ fontFamily: "var(--ff-h)", fontSize: 18, fontWeight: 600 }}
        />
        {title && <div style={{ fontFamily: "var(--ff-m)", fontSize: 10, color: "var(--ink-f)", textAlign: "right" }}>{title.length} car.</div>}
      </div>

      {/* Excerpt */}
      <div style={S.section}>
        <label style={S.label} htmlFor="ed-excerpt">Chapeau</label>
        <textarea
          id="ed-excerpt"
          className="inp"
          rows={2}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Résumé court affiché sur les cards"
          style={{ resize: "vertical" }}
        />
      </div>

      {/* TL;DR */}
      <div style={S.section}>
        <div style={S.label}>L&apos;essentiel en 3 points <span style={{ opacity: .5 }}>(optionnel)</span></div>
        {tldr.map((point, i) => (
          <input
            key={i}
            className="inp"
            value={point}
            placeholder={`Point clé ${i + 1}`}
            onChange={(e) => setTldr((prev) => prev.map((p, j) => (j === i ? e.target.value : p)))}
          />
        ))}
      </div>

      {/* Content */}
      <div style={S.section}>
        <div style={S.label}>Contenu</div>
        <RichTextEditor content={html} onChange={setHtml} />
      </div>

      {/* Tags + Image */}
      <div style={{ display: "grid", gap: "var(--s5)", gridTemplateColumns: "1fr 1fr" }}>
        <div style={S.section}>
          <label style={S.label} htmlFor="ed-tags">Tags <span style={{ opacity: .5 }}>(virgules)</span></label>
          <input
            id="ed-tags"
            className="inp"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="robotique, agents"
          />
        </div>
        <div style={S.section}>
          <div style={S.label}>Image de couverture</div>
          <div style={{ display: "flex", gap: "var(--s2)" }}>
            <input
              className="inp"
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://…"
              style={{ flex: 1 }}
            />
            <label className="btn btn-g" style={{ cursor: "pointer", fontFamily: "var(--ff-m)", fontSize: 11, whiteSpace: "nowrap" }}>
              {uploading ? "…" : "Upload"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                style={{ display: "none" }}
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          </div>
        </div>
      </div>

      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="Couverture" style={{ maxHeight: 180, width: "auto", border: "1px solid var(--ln)", objectFit: "cover" }} />
      )}

      {error && (
        <div style={{ padding: "var(--s4)", border: "1px solid var(--er)", color: "var(--er)", fontFamily: "var(--ff-m)", fontSize: 12 }}>
          {error}
        </div>
      )}

      {/* Translation block */}
      {slug && (
        <div style={{ border: "1px solid var(--ln)" }}>
          <button
            type="button"
            onClick={() => setShowEn((v) => !v)}
            style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", padding: "var(--s4) var(--s5)", background: "var(--bg-r)", border: "none", cursor: "pointer" }}
          >
            <span style={{ fontFamily: "var(--ff-h)", fontSize: 14, fontWeight: 600 }}>
              Version EN {titleEn ? <span style={{ color: "var(--ok)", fontSize: 11 }}>✓ traduit</span> : <span style={{ color: "var(--ink-f)", fontSize: 11 }}>(non traduit)</span>}
            </span>
            <span style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-f)" }}>{showEn ? "▲" : "▼"}</span>
          </button>
          {showEn && (
            <div style={{ padding: "var(--s5)", borderTop: "1px solid var(--ln)", display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)" }}>
                <button
                  type="button"
                  onClick={autoTranslate}
                  disabled={translating}
                  className="btn btn-sm btn-p"
                  style={{ fontFamily: "var(--ff-m)", fontSize: 11 }}
                >
                  {translating ? "Traduction…" : "✨ Traduire via Mistral"}
                </button>
                {enMsg && <span style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink-f)" }}>{enMsg}</span>}
              </div>

              <div style={S.section}>
                <label style={S.label}>Titre EN</label>
                <input className="inp" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder="Title in English" />
              </div>
              <div style={S.section}>
                <label style={S.label}>Chapeau EN</label>
                <textarea className="inp" rows={2} value={excerptEn} onChange={(e) => setExcerptEn(e.target.value)} placeholder="Short summary in English" style={{ resize: "vertical" }} />
              </div>
              <div style={S.section}>
                <div style={S.label}>Essentiel EN (3 points)</div>
                {tldrEn.map((point, i) => (
                  <input key={i} className="inp" value={point} placeholder={`Key point ${i + 1}`} onChange={(e) => setTldrEn((prev) => prev.map((p, j) => (j === i ? e.target.value : p)))} />
                ))}
              </div>
              <div style={S.section}>
                <div style={S.label}>Contenu EN</div>
                <RichTextEditor content={htmlEn} onChange={setHtmlEn} />
              </div>
              <button
                type="button"
                onClick={saveEn}
                disabled={enSaving}
                className="btn btn-sm btn-g"
                style={{ fontFamily: "var(--ff-m)", fontSize: 11, alignSelf: "flex-start" }}
              >
                {enSaving ? "…" : "Sauvegarder traduction EN"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Action bar */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--s3)", borderTop: "1px solid var(--ln)", paddingTop: "var(--s5)" }}>
        <button
          type="button"
          onClick={() => save(true)}
          className="btn btn-p"
          disabled={saving || !canSave}
        >
          {saving ? "…" : "Publier"}
        </button>
        <button
          type="button"
          onClick={() => save(false)}
          className="btn btn-g"
          disabled={saving || !canSave}
          style={{ fontFamily: "var(--ff-m)", fontSize: 12 }}
        >
          Brouillon
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)" }}>
          <input
            type="datetime-local"
            className="inp inp-sm"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            style={{ width: "auto" }}
          />
          <button
            type="button"
            onClick={() => save(false, true)}
            className="btn btn-sm btn-g"
            disabled={saving || !canSave || !scheduledAt}
            style={{ fontFamily: "var(--ff-m)", fontSize: 11 }}
          >
            Planifier
          </button>
        </div>

        {slug && (
          <a
            href={`/admin/articles/${slug}/apercu`}
            target="_blank"
            className="btn btn-sm btn-g"
            style={{ fontFamily: "var(--ff-m)", fontSize: 11 }}
          >
            Aperçu ↗
          </a>
        )}
        {slug && (
          <button
            type="button"
            onClick={async () => {
              const res = await fetch(`/api/admin/articles/${slug}/duplicate`, { method: "POST" });
              if (res.ok) {
                const { slug: newSlug } = await res.json() as { slug: string };
                router.push(`/admin/articles/${newSlug}`);
              }
            }}
            className="btn btn-sm btn-g"
            disabled={saving}
            style={{ fontFamily: "var(--ff-m)", fontSize: 11 }}
          >
            Dupliquer
          </button>
        )}
        {slug && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="btn btn-sm"
            disabled={saving}
            style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--er)", borderColor: "var(--er)", marginLeft: "auto" }}
          >
            Supprimer
          </button>
        )}
      </div>
    </div>
  );
}
