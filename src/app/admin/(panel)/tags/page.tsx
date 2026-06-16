import { getAllTags } from "@/lib/articles";
import { TagManager } from "@/components/admin/TagManager";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
  const tags = await getAllTags({ includeDrafts: true });

  return (
    <div>
      <div style={{ marginBottom: "var(--s7)" }}>
        <h1 style={{ fontFamily: "var(--ff-h)", fontSize: 26, fontWeight: 700, letterSpacing: "-.02em" }}>Gestion des tags</h1>
        <p style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-f)", marginTop: "var(--s2)" }}>
          {tags.length} tag{tags.length > 1 ? "s" : ""} · Renommer met à jour tous les articles · Supprimer retire le tag sans effacer les articles
        </p>
      </div>
      <TagManager tags={tags} />
    </div>
  );
}
