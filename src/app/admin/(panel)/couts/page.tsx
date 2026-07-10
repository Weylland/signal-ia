import { getLlmSummary } from "@/lib/llm-metrics";

export const dynamic = "force-dynamic";

const TASK_LABELS: Record<string, string> = {
  scoring: "Scoring / groupage",
  articles: "Rédaction articles",
  tutos: "Génération tutos",
  tweets: "Tweets X",
  translation: "Traduction EN",
};

const MODEL_LABELS: Record<string, string> = {
  "mistral-small-latest": "Mistral small",
  "claude-haiku-4-5-20251001": "Claude Haiku",
  "claude-sonnet-5": "Claude Sonnet",
  "claude-opus-4-8": "Claude Opus",
};

function usd(n: number): string {
  return n < 0.01 && n > 0 ? "< 0,01 $" : `${n.toFixed(2)} $`;
}

const card: React.CSSProperties = {
  background: "var(--bg-r)",
  border: "1px solid var(--ln-h)",
  padding: "var(--s5)",
  boxShadow: "2px 2px 0 var(--ln-h)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--s2)",
};
const cardLabel: React.CSSProperties = {
  fontFamily: "var(--ff-m)",
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: ".1em",
  color: "var(--ink-f)",
};
const cardValue: React.CSSProperties = {
  fontFamily: "var(--ff-h)",
  fontSize: 30,
  fontWeight: 700,
  letterSpacing: "-.02em",
  lineHeight: 1,
};
const th: React.CSSProperties = {
  fontFamily: "var(--ff-m)",
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: ".08em",
  color: "var(--ink-f)",
  padding: "var(--s2) var(--s3)",
  textAlign: "left",
  fontWeight: 500,
};
const td: React.CSSProperties = {
  padding: "var(--s3)",
  fontFamily: "var(--ff-m)",
  fontSize: 12,
  color: "var(--ink-d)",
  whiteSpace: "nowrap",
};

export default function CoutsPage() {
  const s = getLlmSummary(30);
  const maxDayCost = Math.max(0.0001, ...s.byDay.map((d) => d.cost));

  return (
    <div>
      <div style={{ marginBottom: "var(--s7)" }}>
        <h1 style={{ fontFamily: "var(--ff-h)", fontSize: 26, fontWeight: 700, letterSpacing: "-.02em" }}>Coûts IA</h1>
        <p style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-f)", marginTop: "var(--s2)" }}>
          Usage des modèles sur 30 jours · tarifs indicatifs (USD / million de tokens). Le modèle par tâche se règle dans{" "}
          <a href="/admin/reglages#ia" style={{ color: "var(--ac)" }}>Réglages → Modèles IA</a>.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "var(--s4)", marginBottom: "var(--s7)" }}>
        <div style={card}>
          <div style={cardLabel}>Coût (30 j)</div>
          <div style={cardValue}>{usd(s.totalCost)}</div>
        </div>
        <div style={card}>
          <div style={cardLabel}>Appels</div>
          <div style={cardValue}>{s.totalCalls.toLocaleString("fr-FR")}</div>
        </div>
        <div style={card}>
          <div style={cardLabel}>Latence moyenne</div>
          <div style={cardValue}>{s.avgLatency ? `${Math.round(s.avgLatency)} ms` : "—"}</div>
        </div>
        <div style={card}>
          <div style={cardLabel}>Taux d&apos;échec</div>
          <div style={{ ...cardValue, color: s.errorRate > 0.1 ? "var(--er)" : "var(--ink)" }}>
            {(s.errorRate * 100).toFixed(1)} %
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "var(--s7)" }}>
        <h2 style={{ fontFamily: "var(--ff-h)", fontSize: 16, fontWeight: 600, marginBottom: "var(--s5)" }}>Par tâche</h2>
        {s.byTask.length === 0 ? (
          <div style={{ textAlign: "center", padding: "var(--s7)", fontFamily: "var(--ff-m)", fontSize: 13, color: "var(--ink-f)" }}>
            Aucun appel enregistré pour l&apos;instant. Les coûts apparaîtront au fil des passages du pipeline et des posts X.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--ln-h)" }}>
                  <th style={th}>Tâche</th>
                  <th style={th}>Modèle</th>
                  <th style={{ ...th, textAlign: "right" }}>Appels</th>
                  <th style={{ ...th, textAlign: "right" }}>Tokens (in / out)</th>
                  <th style={{ ...th, textAlign: "right" }}>Latence</th>
                  <th style={{ ...th, textAlign: "right" }}>Échecs</th>
                  <th style={{ ...th, textAlign: "right" }}>Coût</th>
                </tr>
              </thead>
              <tbody>
                {s.byTask.map((r) => (
                  <tr key={`${r.task}-${r.model}`} style={{ borderBottom: "1px solid var(--ln)" }}>
                    <td style={{ ...td, fontFamily: "var(--ff-h)", color: "var(--ink)" }}>{TASK_LABELS[r.task] ?? r.task}</td>
                    <td style={td}>{MODEL_LABELS[r.model] ?? r.model}</td>
                    <td style={{ ...td, textAlign: "right" }}>{r.calls.toLocaleString("fr-FR")}</td>
                    <td style={{ ...td, textAlign: "right" }}>
                      {r.tokensIn.toLocaleString("fr-FR")} / {r.tokensOut.toLocaleString("fr-FR")}
                    </td>
                    <td style={{ ...td, textAlign: "right" }}>{r.avgLatency ? `${Math.round(r.avgLatency)} ms` : "—"}</td>
                    <td style={{ ...td, textAlign: "right", color: r.errors > 0 ? "var(--er)" : "var(--ink-f)" }}>{r.errors}</td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 700, color: "var(--ink)" }}>{usd(r.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {s.byDay.length > 0 && (
        <div>
          <h2 style={{ fontFamily: "var(--ff-h)", fontSize: 16, fontWeight: 600, marginBottom: "var(--s5)" }}>Coût par jour</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
            {s.byDay.map((d) => (
              <div key={d.day} style={{ display: "flex", alignItems: "center", gap: "var(--s3)" }}>
                <span style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink-f)", width: 88, flexShrink: 0 }}>{d.day}</span>
                <div style={{ flex: 1, background: "var(--bg-d)", height: 14, position: "relative" }}>
                  <div style={{ position: "absolute", inset: 0, width: `${(d.cost / maxDayCost) * 100}%`, background: "var(--ac)", minWidth: d.cost > 0 ? 2 : 0 }} />
                </div>
                <span style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink-d)", width: 72, textAlign: "right", flexShrink: 0 }}>{usd(d.cost)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
