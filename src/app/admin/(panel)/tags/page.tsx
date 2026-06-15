import { getAllTags } from "@/lib/articles";
import { TagManager } from "@/components/admin/TagManager";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
  const tags = await getAllTags({ includeDrafts: true });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "var(--s7)" }}>
        <h1 style={{ fontFamily: "var(--ff-h)", fontSize: 26, fontWeight: 700, letterSpacing: "-.02em" }}>Gestion des tags</h1>
        <p style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-f)", marginTop: "var(--s2)" }}>
          {tags.length} tags · Renommer met à jour tous les articles · Supprimer retire le tag sans effacer les articles
        </p>
      </div>

      {/* Tag grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "var(--s3)", marginBottom: "var(--s7)" }}>
        {tags.map((t) => (
          <div key={t.tag} style={{ background: "var(--bg-r)", border: "1px solid var(--ln)", padding: "var(--s4)", display: "flex", alignItems: "center", gap: "var(--s3)" }}>
            <span className="tag" style={{ fontSize: 11, padding: "3px 8px", flexShrink: 0 }}>{t.tag}</span>
            <span style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink-f)", flex: 1 }}>{t.count} articles</span>
          </div>
        ))}
        {tags.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "var(--s9) var(--s5)", fontFamily: "var(--ff-m)", fontSize: 13, color: "var(--ink-f)" }}>
            Aucun tag
          </div>
        )}
      </div>

      <div style={{ maxWidth: 640 }}>
        <h2 style={{ fontFamily: "var(--ff-h)", fontSize: 16, fontWeight: 600, marginBottom: "var(--s5)" }}>Gérer les tags</h2>
        <TagManager tags={tags} />
      </div>
    </div>
  );
}
