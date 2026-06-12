"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type EditorProps = {
  slug?: string;
  initial?: {
    title: string;
    excerpt: string;
    tags: string[];
    image: string | null;
    markdown: string;
  };
};

export function ArticleEditor({ slug, initial }: EditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [markdown, setMarkdown] = useState(initial?.markdown ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      title,
      excerpt,
      markdown,
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
      router.push("/admin");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erreur lors de l'enregistrement");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!slug) return;
    if (!confirm("Supprimer définitivement cet article ?")) return;
    setSaving(true);
    const res = await fetch(`/api/admin/articles/${slug}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError("Erreur lors de la suppression");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="title">
          Titre
        </label>
        <input
          id="title"
          className="field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="excerpt">
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

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="tags">
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
          <label className="mb-1.5 block text-sm font-medium" htmlFor="image">
            Image (URL https)
          </label>
          <input
            id="image"
            className="field"
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      {image.startsWith("http") && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt="Aperçu"
          className="max-h-48 w-auto rounded-xl border border-border object-cover"
        />
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="markdown">
          Contenu (Markdown)
        </label>
        <textarea
          id="markdown"
          className="field font-mono text-sm"
          rows={18}
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="flex items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Enregistrement..." : slug ? "Mettre à jour" : "Publier"}
        </button>
        {slug && (
          <button type="button" onClick={handleDelete} className="btn btn-danger" disabled={saving}>
            Supprimer
          </button>
        )}
      </div>
    </form>
  );
}
