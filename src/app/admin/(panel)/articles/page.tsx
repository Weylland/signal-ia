import Link from "next/link";
import { getAllArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

const PER = 20;

export default async function AdminArticlesPage({ searchParams }: PageProps<"/admin/articles">) {
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q : "";
  const filter = typeof params.statut === "string" ? params.statut : "tous";
  const page = Math.max(1, parseInt(typeof params.page === "string" ? params.page : "1") || 1);

  let articles = await getAllArticles({ includeDrafts: true, search: search || undefined });
  if (filter === "publies") articles = articles.filter((a) => a.published);
  if (filter === "brouillons") articles = articles.filter((a) => !a.published);

  const totalPages = Math.max(1, Math.ceil(articles.length / PER));
  const cur = Math.min(page, totalPages);
  const slice = articles.slice((cur - 1) * PER, cur * PER);

  function pageHref(p: number) {
    const qs = new URLSearchParams();
    if (search) qs.set("q", search);
    if (filter !== "tous") qs.set("statut", filter);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return `/admin/articles${s ? `?${s}` : ""}`;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "var(--s7)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--s5)", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--ff-h)", fontSize: 26, fontWeight: 700, letterSpacing: "-.02em" }}>Articles</h1>
          <p style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-f)", marginTop: "var(--s2)" }}>{articles.length} articles au total</p>
        </div>
        <Link href="/admin/articles/new" className="btn btn-p">+ Nouvel article</Link>
      </div>

      {/* Filters */}
      <form method="get" style={{ display: "flex", gap: "var(--s3)", marginBottom: "var(--s5)", flexWrap: "wrap", alignItems: "center" }}>
        <input name="q" defaultValue={search} placeholder="Rechercher un article…" className="inp inp-sm" style={{ width: 260 }} />
        <select name="statut" defaultValue={filter} className="inp inp-sm" style={{ width: "auto" }}>
          <option value="tous">Tous statuts</option>
          <option value="publies">Publiés</option>
          <option value="brouillons">Brouillons</option>
        </select>
        <button type="submit" className="btn btn-sm btn-p">Filtrer</button>
        {(search || filter !== "tous") && (
          <Link href="/admin/articles" className="btn btn-sm btn-g" style={{ color: "var(--ink-f)" }}>× Réinitialiser</Link>
        )}
        <span style={{ marginLeft: "auto", fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink-f)" }}>
          {articles.length} résultats
        </span>
      </form>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--ln-h)" }}>
              {["Titre", "Type", "Statut", "Date", "Vues", "Actions"].map((h) => (
                <th key={h} style={{ fontFamily: "var(--ff-m)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--ink-f)", padding: "var(--s2) var(--s3)", textAlign: "left", fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((a) => (
              <tr key={a.slug} style={{ borderBottom: "1px solid var(--ln)" }}>
                <td style={{ padding: "var(--s3)", maxWidth: 300 }}>
                  <div style={{ fontFamily: "var(--ff-h)", fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <Link href={`/admin/articles/${a.slug}`} style={{ color: "var(--ac)", textDecoration: "none" }}>{a.title}</Link>
                  </div>
                  <div style={{ fontFamily: "var(--ff-m)", fontSize: 10, color: "var(--ink-f)", marginTop: 2 }}>
                    {a.tags.slice(0, 2).join(" · ")}
                  </div>
                </td>
                <td style={{ padding: "var(--s3)" }}>
                  <span style={{ fontFamily: "var(--ff-m)", fontSize: 10, padding: "2px 6px", border: "1px solid var(--ln-h)", color: "var(--ink-f)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                    {a.type}
                  </span>
                </td>
                <td style={{ padding: "var(--s3)" }}>
                  <StatusBadge published={a.published} scheduled={!!a.scheduledAt} />
                </td>
                <td style={{ padding: "var(--s3)", fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-f)", whiteSpace: "nowrap" }}>
                  {a.date.slice(0, 10)}
                </td>
                <td style={{ padding: "var(--s3)", fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-d)" }}>
                  {a.views.toLocaleString("fr-FR")}
                </td>
                <td style={{ padding: "var(--s3)" }}>
                  <div style={{ display: "flex", gap: "var(--s2)" }}>
                    <Link href={`/admin/articles/${a.slug}`} className="btn btn-sm btn-g" style={{ fontFamily: "var(--ff-m)", fontSize: 10 }}>Éditer</Link>
                    {a.published && (
                      <Link href={`/articles/${a.slug}`} target="_blank" className="btn btn-sm btn-g" style={{ fontFamily: "var(--ff-m)", fontSize: 10, color: "var(--ink-f)" }}>Voir ↗</Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {slice.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "var(--s9)", textAlign: "center", fontFamily: "var(--ff-m)", fontSize: 13, color: "var(--ink-f)" }}>
                  Aucun article trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "var(--s2)", marginTop: "var(--s6)" }}>
          {cur > 1 && <Link href={pageHref(cur - 1)} className="btn btn-sm">← Préc.</Link>}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={pageHref(p)} className={`btn btn-sm${p === cur ? " btn-p" : ""}`}>{p}</Link>
          ))}
          {cur < totalPages && <Link href={pageHref(cur + 1)} className="btn btn-sm">Suiv. →</Link>}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ published, scheduled }: { published: boolean; scheduled: boolean }) {
  const cfg = published
    ? { l: "Publié", c: "var(--ok)" }
    : scheduled
      ? { l: "Planifié", c: "var(--wn)" }
      : { l: "Brouillon", c: "var(--ink-f)" };
  return (
    <span style={{ fontFamily: "var(--ff-m)", fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".08em", padding: "2px 6px", border: "1px solid currentColor", color: cfg.c, whiteSpace: "nowrap" }}>
      {cfg.l}
    </span>
  );
}
