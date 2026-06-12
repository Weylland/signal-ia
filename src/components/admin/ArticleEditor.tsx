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
  };
};

export function ArticleEditor({ slug, initial }: EditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [html, setHtml] = useState(initial?.html ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function save(published: boolean) {
    setSaving(true);
    setError(null);

    const payload = {
      title,
      excerpt,
      html,
      published,
      image: image.trim() || null,
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
