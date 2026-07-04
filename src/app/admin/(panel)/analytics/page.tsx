import Link from "next/link";
import { cookies } from "next/headers";
import { getAnalytics, type Range, type Period } from "@/lib/analytics";

export const dynamic = "force-dynamic";

const RANGES: { key: Range; label: string }[] = [
  { key: "24h", label: "24 h" },
  { key: "7d", label: "7 jours" },
  { key: "30d", label: "30 jours" },
  { key: "90d", label: "90 jours" },
  { key: "12m", label: "12 mois" },
];
const BUCKETS: { key: Period; label: string }[] = [
  { key: "day", label: "Jour" },
  { key: "week", label: "Semaine" },
  { key: "month", label: "Mois" },
];

const REACTIONS = [
  { key: "useful", emoji: "👍", label: "Utile" },
  { key: "fire", emoji: "🔥", label: "Important" },
  { key: "think", emoji: "🤔", label: "À creuser" },
];
const DEVICE_LABEL: Record<string, string> = { desktop: "Ordinateur", mobile: "Mobile", tablet: "Tablette" };
const SECTION_LABEL: Record<string, string> = {
  home: "Accueil",
  article: "Articles",
  actus: "Actus",
  tutos: "Tutos",
  glossaire: "Glossaire",
  "cette-semaine": "Cette semaine",
  trending: "Trending",
  sources: "Sources",
  recherche: "Recherche",
  favoris: "Favoris",
  "a-propos": "À propos",
  contact: "Contact",
  other: "Autre",
};
const WEEKDAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(["fr"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

function fmtBucket(b: string, bucket: Period | "hour"): string {
  if (bucket === "hour") return b.slice(11, 13) + "h";
  if (bucket === "month") {
    const [y, m] = b.split("-");
    return `${m}/${y.slice(2)}`;
  }
  if (bucket === "week") return b.split("-")[1];
  return b.slice(5); // MM-DD
}

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink-f)" }}>—</span>;
  const up = value >= 0;
  return (
    <span style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: up ? "var(--ok)" : "var(--er)" }}>
      {up ? "▲" : "▼"} {Math.abs(value)}%
    </span>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--bg-r)", border: "1px solid var(--ln)", padding: "var(--s6)", marginBottom: "var(--s6)" }}>
      {children}
    </div>
  );
}

function H2({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "var(--s5)" }}>
      <h2 style={{ fontFamily: "var(--ff-h)", fontSize: 15, fontWeight: 600 }}>{children}</h2>
      {hint && <span style={{ fontFamily: "var(--ff-m)", fontSize: 10, color: "var(--ink-f)" }}>{hint}</span>}
    </div>
  );
}

function BarList({
  rows,
  emptyLabel,
}: {
  rows: { label: string; sub?: string | null; value: number }[];
  emptyLabel: string;
}) {
  if (rows.length === 0)
    return <p style={{ fontFamily: "var(--ff-m)", fontSize: 13, color: "var(--ink-f)" }}>{emptyLabel}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "var(--s4)" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--s3)", marginBottom: 3 }}>
              <span style={{ fontFamily: "var(--ff-h)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.label}
                {r.sub && <span style={{ color: "var(--ink-f)", fontFamily: "var(--ff-m)", fontSize: 10 }}> · {r.sub}</span>}
              </span>
              <span style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-d)", flexShrink: 0 }}>
                {r.value.toLocaleString("fr-FR")}
              </span>
            </div>
            <div style={{ height: 4, background: "var(--bg-d)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: (r.value / max) * 100 + "%", background: "var(--ac)" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function AnalyticsPage({ searchParams }: PageProps<"/admin/analytics">) {
  const sp = await searchParams;
  const notTracked = (await cookies()).get("wia_notrack")?.value === "1";
  const range = (RANGES.some((r) => r.key === sp.range) ? sp.range : "30d") as Range;
  const bucketParam = BUCKETS.some((b) => b.key === sp.bucket) ? (sp.bucket as Period) : undefined;
  const a = getAnalytics({ range, bucket: range === "24h" ? undefined : bucketParam });

  const reactByKey = Object.fromEntries(a.reactions.map((r) => [r.reaction, r.total])) as Record<string, number>;
  const maxSeries = Math.max(...a.series.map((s) => s.pageviews), 1);
  const maxHour = Math.max(...a.hourly.map((h) => h.views), 1);
  const maxDow = Math.max(...a.weekday.map((d) => d.views), 1);

  const linkFor = (next: Partial<{ range: Range; bucket: Period }>) => {
    const r = next.range ?? range;
    const b = next.bucket ?? bucketParam;
    const qs = new URLSearchParams({ range: r });
    if (b && r !== "24h") qs.set("bucket", b);
    return `/admin/analytics?${qs.toString()}`;
  };

  const pill = (active: boolean): React.CSSProperties => ({
    fontFamily: "var(--ff-m)",
    fontSize: 11,
    padding: "var(--s2) var(--s4)",
    border: "1px solid var(--ln-h)",
    background: active ? "var(--ac)" : "var(--bg-r)",
    color: active ? "var(--bg)" : "var(--ink-d)",
    textDecoration: "none",
    whiteSpace: "nowrap",
  });

  const kpis = [
    { label: "Pages vues", value: a.kpis.pageviews.toLocaleString("fr-FR"), delta: a.kpis.pvDelta, sub: undefined as string | undefined },
    { label: "Visiteurs uniques", value: a.kpis.uniques.toLocaleString("fr-FR"), delta: a.kpis.uvDelta, sub: undefined as string | undefined },
    { label: "Pages / visiteur", value: a.kpis.viewsPerVisitor.toLocaleString("fr-FR"), delta: null, sub: undefined as string | undefined },
    {
      label: "Abonnés newsletter",
      value: a.subscribers.total.toLocaleString("fr-FR"),
      delta: null,
      sub: a.subscribers.inRange > 0 ? `+${a.subscribers.inRange} sur la période` : undefined,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--s4)", marginBottom: "var(--s6)", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--ff-h)", fontSize: 26, fontWeight: 700, letterSpacing: "-.02em" }}>Analytics</h1>
          <p style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-f)", marginTop: "var(--s2)" }}>
            Mesure maison, sans cookie ni traceur tiers · IP hashée quotidiennement
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s5)", fontFamily: "var(--ff-m)", fontSize: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: a.kpis.liveNow > 0 ? "var(--ok)" : "var(--ink-f)", display: "inline-block" }} />
            <span style={{ color: "var(--ink-d)" }}>{a.kpis.liveNow} actif{a.kpis.liveNow > 1 ? "s" : ""} (5 min)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: notTracked ? "var(--wn)" : "var(--ok)", display: "inline-block" }} />
            <span style={{ color: "var(--ink-d)" }}>
              {notTracked ? "Tu n'es pas tracké sur ce navigateur" : "Tu es tracké sur ce navigateur"}
            </span>
          </div>
          <a
            href={notTracked ? "/api/track/opt-in?back=/admin/analytics" : "/api/track/opt-out?back=/admin/analytics"}
            style={{
              fontFamily: "var(--ff-m)", fontSize: 11, padding: "var(--s2) var(--s4)",
              border: "1px solid var(--ln-h)", background: "var(--bg-r)", color: "var(--ink-d)",
              textDecoration: "none", whiteSpace: "nowrap",
            }}
            title={
              notTracked
                ? "Retire le cookie d'exclusion : tes visites du site public seront de nouveau comptées."
                : "Pose un cookie 1 an sur ce navigateur : tes propres visites du site public ne seront plus comptées."
            }
          >
            {notTracked ? "Réactiver le tracking ↗" : "Ne plus me tracker ↗"}
          </a>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: "var(--s5)", flexWrap: "wrap", marginBottom: "var(--s6)", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "var(--s2)", flexWrap: "wrap" }}>
          {RANGES.map((r) => (
            <Link key={r.key} href={linkFor({ range: r.key })} style={pill(r.key === range)}>{r.label}</Link>
          ))}
        </div>
        {range !== "24h" && (
          <div style={{ display: "flex", gap: "var(--s2)", flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--ff-m)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--ink-f)", alignSelf: "center" }}>Granularité</span>
            {BUCKETS.map((b) => (
              <Link key={b.key} href={linkFor({ bucket: b.key })} style={pill(b.key === a.bucket)}>{b.label}</Link>
            ))}
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "var(--s4)", marginBottom: "var(--s6)" }}>
        {kpis.map((m) => (
          <div key={m.label} style={{ background: "var(--bg-r)", border: "1px solid var(--ln-h)", padding: "var(--s5)", boxShadow: "2px 2px 0 var(--ln-h)", display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
            <div style={{ fontFamily: "var(--ff-m)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--ink-f)" }}>{m.label}</div>
            <div style={{ fontFamily: "var(--ff-h)", fontSize: 32, fontWeight: 700, letterSpacing: "-.02em", color: "var(--ink)", lineHeight: 1 }}>{m.value}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)" }}>
              <Delta value={m.delta} />
              {m.sub && <span style={{ fontFamily: "var(--ff-m)", fontSize: 10, color: "var(--ink-f)" }}>{m.sub}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Série temporelle */}
      <Card>
        <H2 hint={`${a.kpis.botShare}% de trafic bot exclu`}>Trafic dans le temps</H2>
        {a.series.length === 0 ? (
          <p style={{ fontFamily: "var(--ff-m)", fontSize: 13, color: "var(--ink-f)" }}>Pas encore de données sur cette période.</p>
        ) : (
          <>
            <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 160 }}>
              {a.series.map((s) => {
                const h = Math.round((s.pageviews / maxSeries) * 140);
                const uh = Math.round(((s.uniques ?? 0) / maxSeries) * 140);
                return (
                  <div key={s.bucket} title={`${s.pageviews} vues · ${s.uniques ?? 0} visiteurs`} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 0 }}>
                    <div style={{ position: "relative", width: "100%", height: 140, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                      <div style={{ width: "70%", height: Math.max(h, 2), background: "var(--ac)", opacity: 0.35 }} />
                      <div style={{ position: "absolute", bottom: 0, width: "70%", height: Math.max(uh, uh > 0 ? 2 : 0), background: "var(--ac)" }} />
                    </div>
                    <span style={{ fontFamily: "var(--ff-m)", fontSize: 9, color: "var(--ink-f)", whiteSpace: "nowrap", overflow: "hidden" }}>{fmtBucket(s.bucket, a.bucket)}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: "var(--s5)", marginTop: "var(--s4)", fontFamily: "var(--ff-m)", fontSize: 10, color: "var(--ink-f)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, background: "var(--ac)" }} /> Visiteurs uniques</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, background: "var(--ac)", opacity: 0.35 }} /> Pages vues</span>
            </div>
          </>
        )}
      </Card>

      {/* Top pages + Sources */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "var(--s6)", marginBottom: "var(--s6)" }}>
        <div style={{ background: "var(--bg-r)", border: "1px solid var(--ln)", padding: "var(--s6)" }}>
          <H2>Pages les plus vues</H2>
          <BarList
            emptyLabel="Pas encore de trafic."
            rows={a.topPages.map((p) => ({ label: p.title ?? p.path, sub: p.title ? p.path : `${p.uniques} uniques`, value: p.views }))}
          />
        </div>
        <div style={{ background: "var(--bg-r)", border: "1px solid var(--ln)", padding: "var(--s6)" }}>
          <H2 hint="hors navigation interne">Sources de trafic</H2>
          <BarList
            emptyLabel="Aucun référent externe (trafic direct)."
            rows={a.referrers.map((r) => ({ label: r.host, value: r.views }))}
          />
        </div>
      </div>

      {/* Appareils / Langues / Pays */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "var(--s6)", marginBottom: "var(--s6)" }}>
        <div style={{ background: "var(--bg-r)", border: "1px solid var(--ln)", padding: "var(--s6)" }}>
          <H2>Appareils</H2>
          <BarList emptyLabel="—" rows={a.devices.map((d) => ({ label: DEVICE_LABEL[d.device] ?? d.device, value: d.views }))} />
        </div>
        <div style={{ background: "var(--bg-r)", border: "1px solid var(--ln)", padding: "var(--s6)" }}>
          <H2>Langues</H2>
          <BarList emptyLabel="—" rows={a.langs.map((l) => ({ label: l.lang === "en" ? "Anglais" : "Français", value: l.views }))} />
        </div>
        <div style={{ background: "var(--bg-r)", border: "1px solid var(--ln)", padding: "var(--s6)" }}>
          <H2>Pays</H2>
          <BarList emptyLabel="Géolocalisation indisponible." rows={a.countries.map((c) => ({ label: countryName(c.country), sub: c.country, value: c.views }))} />
        </div>
      </div>

      {/* Sections */}
      <Card>
        <H2>Trafic par section</H2>
        <BarList emptyLabel="—" rows={a.sections.map((s) => ({ label: SECTION_LABEL[s.section] ?? s.section, value: s.views }))} />
      </Card>

      {/* Activité : heures + jours */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "var(--s6)", marginBottom: "var(--s6)" }}>
        <div style={{ background: "var(--bg-r)", border: "1px solid var(--ln)", padding: "var(--s6)" }}>
          <H2 hint="UTC">Affluence par heure</H2>
          <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 90 }}>
            {a.hourly.map((h) => (
              <div key={h.hour} title={`${h.hour}h · ${h.views} vues`} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div style={{ width: "100%", height: Math.max(Math.round((h.views / maxHour) * 70), h.views > 0 ? 2 : 0), background: "var(--ac)", opacity: 0.85 }} />
                {h.hour % 6 === 0 && <span style={{ fontFamily: "var(--ff-m)", fontSize: 8, color: "var(--ink-f)" }}>{h.hour}</span>}
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "var(--bg-r)", border: "1px solid var(--ln)", padding: "var(--s6)" }}>
          <H2>Affluence par jour</H2>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
            {a.weekday.map((d) => (
              <div key={d.dow} style={{ display: "flex", alignItems: "center", gap: "var(--s4)" }}>
                <span style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink-d)", width: 32, flexShrink: 0 }}>{WEEKDAYS[d.dow]}</span>
                <div style={{ flex: 1, height: 8, background: "var(--bg-d)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: (d.views / maxDow) * 100 + "%", background: "var(--ac)" }} />
                </div>
                <span style={{ fontFamily: "var(--ff-m)", fontSize: 11, color: "var(--ink-f)", width: 44, textAlign: "right", flexShrink: 0 }}>{d.views.toLocaleString("fr-FR")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Réactions */}
      <Card>
        <H2>Réactions des lecteurs</H2>
        <div style={{ display: "flex", gap: "var(--s4)", flexWrap: "wrap" }}>
          {REACTIONS.map((r) => (
            <div key={r.key} style={{ display: "flex", alignItems: "center", gap: "var(--s3)", border: "1px solid var(--ln)", padding: "var(--s3) var(--s5)", background: "var(--bg-d)" }}>
              <span style={{ fontSize: 20 }}>{r.emoji}</span>
              <div>
                <div style={{ fontFamily: "var(--ff-h)", fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{(reactByKey[r.key] ?? 0).toLocaleString("fr-FR")}</div>
                <div style={{ fontFamily: "var(--ff-m)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--ink-f)" }}>{r.label}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
