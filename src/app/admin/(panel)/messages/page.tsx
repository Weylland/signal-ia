import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

type MsgRow = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  read: number;
};

export default function MessagesPage() {
  const db = getDb();
  const msgs = db
    .prepare("SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 100")
    .all() as MsgRow[];

  const unread = msgs.filter((m) => !m.read).length;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "var(--s7)" }}>
        <h1 style={{ fontFamily: "var(--ff-h)", fontSize: 26, fontWeight: 700, letterSpacing: "-.02em" }}>Messages</h1>
        <p style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-f)", marginTop: "var(--s2)" }}>
          {unread > 0 ? `${unread} non lu${unread > 1 ? "s" : ""}` : "Tous lus"}
        </p>
      </div>

      {msgs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "var(--s9) var(--s5)", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--s4)" }}>
          <span style={{ fontFamily: "var(--ff-m)", fontSize: 40, color: "var(--ln-h)" }}>◷</span>
          <div style={{ fontFamily: "var(--ff-h)", fontSize: 18, fontWeight: 600, color: "var(--ink-d)" }}>Aucun message</div>
          <div style={{ fontFamily: "var(--ff-b)", fontSize: 14, color: "var(--ink-f)" }}>Les messages du formulaire de contact apparaîtront ici.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
          {msgs.map((m) => (
            <div
              key={m.id}
              style={{
                background: "var(--bg-r)",
                border: "1px solid var(--ln)",
                borderLeft: !m.read ? "3px solid var(--ac)" : "3px solid var(--ln)",
                padding: "var(--s5)",
              }}
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
              <div style={{ fontFamily: "var(--ff-h)", fontSize: 13, fontWeight: 600, marginBottom: "var(--s2)", color: "var(--ink-d)" }}>{m.subject}</div>
              <p style={{ fontFamily: "var(--ff-b)", fontSize: 13, color: "var(--ink-d)", lineHeight: 1.6, marginBottom: "var(--s4)" }}>{m.message}</p>
              <div style={{ display: "flex", gap: "var(--s3)" }}>
                <a
                  href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`}
                  className="btn btn-sm btn-p"
                  style={{ fontFamily: "var(--ff-m)", fontSize: 11 }}
                >
                  Répondre ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
