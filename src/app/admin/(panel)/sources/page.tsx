import { getSources } from "@/lib/sources";
import { SourceManager } from "@/components/admin/SourceManager";

export const dynamic = "force-dynamic";

export default function SourcesPage() {
  const sources = getSources();

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "var(--s7)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--s5)", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--ff-h)", fontSize: 26, fontWeight: 700, letterSpacing: "-.02em" }}>Sources RSS</h1>
          <p style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-f)", marginTop: "var(--s2)" }}>
            {sources.length} sources · Santé des flux et statistiques d&apos;ingestion
          </p>
        </div>
      </div>

      {/* Sources table */}
      <div style={{ overflowX: "auto", marginBottom: "var(--s7)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--ln-h)" }}>
              {["État", "Nom", "URL", "Dernier fetch", "Actions"].map((h) => (
                <th key={h} style={{ fontFamily: "var(--ff-m)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--ink-f)", padding: "var(--s2) var(--s3)", textAlign: "left", fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid var(--ln)" }}>
                <td style={{ padding: "var(--s3)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className={s.active ? "s-ok" : "s-err"} />
                    <span style={{ fontFamily: "var(--ff-m)", fontSize: 10, color: s.active ? "var(--ok)" : "var(--er)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                      {s.active ? "actif" : "inactif"}
                    </span>
                  </div>
                </td>
                <td style={{ padding: "var(--s3)", fontFamily: "var(--ff-h)", fontSize: 13, fontWeight: 500 }}>{s.name}</td>
                <td style={{ padding: "var(--s3)", maxWidth: 240 }}>
                  <a href={s.url} target="_blank" rel="noreferrer" style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink-f)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", textDecoration: "none" }}>
                    {s.url}
                  </a>
                </td>
                <td style={{ padding: "var(--s3)", fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink-f)" }}>
                  {s.lastFetchAt ? new Date(s.lastFetchAt).toLocaleString("fr-FR") : "—"}
                </td>
                <td style={{ padding: "var(--s3)" }}>
                  <div style={{ display: "flex", gap: "var(--s2)" }}>
                    <span style={{ fontFamily: "var(--ff-m)", fontSize: 10, color: "var(--ink-f)" }}>voir SourceManager ↓</span>
                  </div>
                </td>
              </tr>
            ))}
            {sources.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "var(--s9)", textAlign: "center", fontFamily: "var(--ff-m)", fontSize: 13, color: "var(--ink-f)" }}>
                  Aucune source configurée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontFamily: "var(--ff-h)", fontSize: 16, fontWeight: 600, marginBottom: "var(--s5)" }}>Gérer les sources</h2>
      <SourceManager sources={sources} />
    </div>
  );
}
