import Link from "next/link";
import { getAllArticles } from "@/lib/articles";
import { ArticlesTable } from "@/components/admin/ArticlesTable";

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
      <ArticlesTable articles={slice} />

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
