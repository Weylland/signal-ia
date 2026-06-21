import Link from "next/link";
import { getDb } from "@/lib/db";
import { Pagination } from "@/components/Pagination";

export const dynamic = "force-dynamic";

const PER = 20;

type MsgRow = {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  created_at: string;
  read: number;
};

export default async function MessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const statut = typeof sp.statut === "string" ? sp.statut : "tous";
  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1") || 1);

  const all = getDb()
    .prepare("SELECT * FROM contact_messages ORDER BY created_at DESC")
    .all() as MsgRow[];

  let msgs = all;
  if (statut === "lus") msgs = msgs.filter((m) => m.read);
  if (statut === "non-lus") msgs = msgs.filter((m) => !m.read);
  if (q) {
    const needle = q.toLowerCase();
    msgs = msgs.filter(
      (m) =>
        m.name.toLowerCase().includes(needle) ||
        m.email.toLowerCase().includes(needle) ||
        m.message.toLowerCase().includes(needle)
    );
  }

  const totalUnread = all.filter((m) => !m.read).length;
  const totalPages = Math.max(1, Math.ceil(msgs.length / PER));
  const cur = Math.min(page, totalPages);
  const slice = msgs.slice((cur - 1) * PER, cur * PER);

  const query: Record<string, string> = {};
  if (q) query.q = q;
  if (statut !== "tous") query.statut = statut;

  return (
    <div>
      <div style={{ marginBottom: "var(--s7)" }}>
        <h1 style={{ fontFamily: "var(--ff-h)", fontSize: 26, fontWeight: 700, letterSpacing: "-.02em" }}>Messages</h1>
        <p style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-f)", marginTop: "var(--s2)" }}>
          {all.length} message{all.length > 1 ? "s" : ""} · {totalUnread > 0 ? `${totalUnread} non lu${totalUnread > 1 ? "s" : ""}` : "tous lus"}
        </p>
      </div>

      <form method="get" style={{ display: "flex", gap: "var(--s3)", marginBottom: "var(--s5)", flexWrap: "wrap", alignItems: "center" }}>
        <input name="q" defaultValue={q} placeholder="Rechercher (nom, email, contenu)…" className="inp inp-sm" style={{ width: 260 }} />
        <select name="statut" defaultValue={statut} className="inp inp-sm" style={{ width: "auto" }}>
          <option value="tous">Tous</option>
          <option value="non-lus">Non lus</option>
          <option value="lus">Lus</option>
        </select>
        <button type="submit" className="btn btn-sm btn-p">Filtrer</button>
        {(q || statut !== "tous") && (
          <Link href="/admin/messages" className="btn btn-sm btn-g" style={{ color: "var(--ink-f)" }}>× Réinitialiser</Link>
        )}
        <span style={{ marginLeft: "auto", fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink-f)" }}>
          {msgs.length} résultat{msgs.length > 1 ? "s" : ""}
        </span>
      </form>

      {slice.length === 0 ? (
        <div style={{ textAlign: "center", padding: "var(--s9) var(--s5)", fontFamily: "var(--ff-m)", fontSize: 13, color: "var(--ink-f)" }}>
          Aucun message.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
          {slice.map((m) => (
            <div
              key={m.id}
              style={{ background: "var(--bg-r)", border: "1px solid var(--ln)", borderLeft: !m.read ? "3px solid var(--ac)" : "3px solid var(--ln)", padding: "var(--s5)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--s4)", marginBottom: "var(--s3)", flexWrap: "wrap", alignItems: "flex-start" }}>
                <div>
                  <span style={{ fontFamily: "var(--ff-h)", fontSize: 14, fontWeight: m.read ? 400 : 700 }}>{m.name}</span>
                  <span style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink-f)", marginLeft: "var(--s3)" }}>{m.email}</span>
                </div>
                <span style={{ fontFamily: "var(--ff-m)", fontSize: 10, color: "var(--ink-f)", whiteSpace: "nowrap" }}>
                  {new Date(m.created_at).toLocaleString("fr-FR")}
                </span>
              </div>
              {m.subject && <div style={{ fontFamily: "var(--ff-h)", fontSize: 13, fontWeight: 600, marginBottom: "var(--s2)", color: "var(--ink-d)" }}>{m.subject}</div>}
              <p style={{ fontFamily: "var(--ff-b)", fontSize: 13, color: "var(--ink-d)", lineHeight: 1.6, marginBottom: "var(--s4)" }}>{m.message}</p>
              <div style={{ display: "flex", gap: "var(--s3)" }}>
                <a href={`mailto:${m.email}`} className="btn btn-sm btn-p" style={{ fontFamily: "var(--ff-m)", fontSize: 11 }}>
                  Répondre ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={cur} totalPages={totalPages} basePath="/admin/messages" query={query} />
    </div>
  );
}
