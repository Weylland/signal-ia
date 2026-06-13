"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    tldr: string[];
    scheduledAt: string | null;
    titleEn?: string | null;
    excerptEn?: string | null;
    tldrEn?: string[];
    htmlEn?: string | null;
  };
};

export function ArticleEditor({ slug, initial }: EditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [html, setHtml] = useState(initial?.html ?? "");
  const [type, setType] = useState<"news" | "tuto">(initial?.type ?? "news");
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
      tldr: tldr.map((t) => t.trim()).filter(Boolean),
      scheduledAt:
        schedule && scheduledAt ? new Date(scheduledAt).toISOString() : null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
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
    if (!confirm("Supprimer définitivement cet article ?")) return;
    setSaving(true);
    const res = await fetch(`/api/admin/articles/${slug}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/articles");
      router.refresh();
    } else {
      setError("Erreur lors de la suppression");
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2">
        {(["news", "tuto"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`nb-btn text-sm ${type === t ? "bg-[var(--sunshine)]" : ""}`}
          >
            {t === "news" ? "📰 Actu" : "🎓 Tuto"}
          </button>
        ))}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-bold" htmlFor="title">
          Titre
        </label>
        <input
          id="title"
          className="field font-display text-lg font-semibold"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre de l'article"
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-bold" htmlFor="excerpt">
          Chapeau (résumé court)
        </label>
        <textarea
          id="excerpt"
          className="field"
          rows={2}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-bold">
          L&apos;essentiel en 3 points (affiché en haut de l&apos;article, facultatif)
        </label>
        <div className="flex flex-col gap-2">
          {tldr.map((point, i) => (
            <input
              key={i}
              className="field"
              value={point}
              placeholder={`Point clé ${i + 1}`}
              onChange={(e) =>
                setTldr((prev) => prev.map((p, j) => (j === i ? e.target.value : p)))
              }
            />
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-bold">Contenu</label>
        <RichTextEditor content={html} onChange={setHtml} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-bold" htmlFor="tags">
            Tags (séparés par des virgules)
          </label>
          <input
            id="tags"
            className="field"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="robotique, agents"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-bold" htmlFor="image">
            Image de couverture
          </label>
          <div className="flex gap-2">
            <input
              id="image"
              className="field"
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://... ou upload →"
            />
            <label className="nb-btn shrink-0 cursor-pointer text-sm">
              {uploading ? "..." : "Upload"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          </div>
        </div>
      </div>

      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt="Aperçu de la couverture"
          className="max-h-48 w-auto border-2 border-ink object-cover"
        />
      )}

      {error && <p className="border-2 border-ink bg-[var(--peach)] p-3 text-sm font-semibold">{error}</p>}

      {slug && (
        <div className="border-2 border-ink">
          <button
            type="button"
            onClick={() => setShowEn((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-bold hover:bg-[var(--bg-raised)]"
          >
            <span>🇬🇧 Version EN {titleEn ? "✓" : "(non traduit)"}</span>
            <span>{showEn ? "▲" : "▼"}</span>
          </button>
          {showEn && (
            <div className="flex flex-col gap-4 border-t-2 border-ink p-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={autoTranslate}
                  disabled={translating}
                  className="nb-btn nb-btn-primary text-sm"
                >
                  {translating ? "Traduction en cours…" : "✨ Traduire via Mistral"}
                </button>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold">Titre EN</label>
                <input
                  className="field"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="Title in English"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold">Chapeau EN</label>
                <textarea
                  className="field"
                  rows={2}
                  value={excerptEn}
                  onChange={(e) => setExcerptEn(e.target.value)}
                  placeholder="Short summary in English"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold">L&apos;essentiel EN (3 points)</label>
                <div className="flex flex-col gap-2">
                  {tldrEn.map((point, i) => (
                    <input
                      key={i}
                      className="field"
                      value={point}
                      placeholder={`Key point ${i + 1}`}
                      onChange={(e) =>
                        setTldrEn((prev) => prev.map((p, j) => (j === i ? e.target.value : p)))
                      }
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold">Contenu EN</label>
                <RichTextEditor content={htmlEn} onChange={setHtmlEn} />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={saveEn}
                  disabled={enSaving}
                  className="nb-btn text-sm"
                >
                  {enSaving ? "…" : "Sauvegarder traduction EN"}
                </button>
                {enMsg && <span className="text-sm">{enMsg}</span>}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t-2 border-ink pt-5">
        <button
          type="button"
          onClick={() => save(true)}
          className="nb-btn nb-btn-primary"
          disabled={saving || !title || !html}
        >
          {saving ? "..." : "Publier"}
        </button>
        <button
          type="button"
          onClick={() => save(false)}
          className="nb-btn"
          disabled={saving || !title || !html}
        >
          Enregistrer en brouillon
        </button>
        <div className="flex items-center gap-2">
          <input
            type="datetime-local"
            className="field w-auto text-sm"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
          <button
            type="button"
            onClick={() => save(false, true)}
            className="nb-btn text-sm"
            disabled={saving || !title || !html || !scheduledAt}
            title="L'article restera en brouillon jusqu'à cette date, puis sera publié automatiquement"
          >
            🕐 Planifier
          </button>
        </div>
        {slug && (
          <a href={`/admin/articles/${slug}/apercu`} target="_blank" className="nb-btn text-sm">
            👁 Aperçu
          </a>
        )}
        {slug && (
          <button
            type="button"
            onClick={handleDelete}
            className="nb-btn ml-auto bg-[var(--peach)]"
            disabled={saving}
          >
            Supprimer
          </button>
        )}
      </div>
    </div>
  );
}
