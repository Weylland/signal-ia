import { createHash } from "node:crypto";
import { getDb } from "./db";

/**
 * Analytics maison, sans traceur tiers ni cookie.
 * L'identité visiteur est un hash salé quotidien de (ip + user-agent), donc :
 *  - un visiteur est unique par jour (impossible à ré-identifier d'un jour à l'autre)
 *  - aucune donnée personnelle (IP brute) n'est stockée
 * Modèle inspiré de Plausible : "unique visitors" = somme des uniques quotidiens.
 */

const BOT_RE =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora|pinterest|vkshare|whatsapp|telegram|discord|headless|lighthouse|gptbot|claudebot|ccbot|bytespider|ahrefs|semrush|petalbot|dataforseo|python-requests|axios|curl|wget|node-fetch|go-http/i;

function dailySalt(date = new Date()): string {
  const secret = process.env.AUTH_SECRET ?? "watch-ia-analytics";
  return `${secret}:${date.toISOString().slice(0, 10)}`;
}

export function visitorHash(ip: string, ua: string, date = new Date()): string {
  return createHash("sha256").update(`${ip}|${ua}|${dailySalt(date)}`).digest("hex").slice(0, 32);
}

export function isBot(ua: string): boolean {
  return !ua || BOT_RE.test(ua);
}

export function deviceFromUa(ua: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini/i.test(ua)) return "mobile";
  return "desktop";
}

/** Catégorie de page pour les agrégats par section. */
export function sectionForPath(path: string): { section: string; slug: string | null } {
  const clean = path.split("?")[0].replace(/\/+$/, "") || "/";
  if (clean === "/") return { section: "home", slug: null };
  const seg = clean.split("/").filter(Boolean);
  const top = seg[0];
  if (top === "articles") return { section: "article", slug: seg[1] ?? null };
  const map: Record<string, string> = {
    actus: "actus",
    tutos: "tutos",
    glossaire: "glossaire",
    "cette-semaine": "cette-semaine",
    trending: "trending",
    sources: "sources",
    recherche: "recherche",
    favoris: "favoris",
    "a-propos": "a-propos",
    contact: "contact",
  };
  return { section: map[top] ?? "other", slug: null };
}

function refHost(referrer: string | null | undefined, selfHost: string): string | null {
  if (!referrer) return null;
  const self = selfHost.split(":")[0].replace(/^www\./, ""); // host sans port
  try {
    const h = new URL(referrer).hostname.replace(/^www\./, "");
    if (!h || h === self) return null; // navigation interne
    return h;
  } catch {
    return null;
  }
}

export type PageViewInput = {
  path: string;
  ip: string;
  ua: string;
  referrer?: string | null;
  lang?: string | null;
  country?: string | null;
  selfHost?: string;
};

/** Enregistre une vue de page. Renvoie false si ignorée (bot, path admin/api). */
export function recordPageView(input: PageViewInput): boolean {
  const path = (input.path || "/").split("?")[0].slice(0, 512);
  if (path.startsWith("/admin") || path.startsWith("/api") || path.startsWith("/_next")) return false;

  const bot = isBot(input.ua);
  const db = getDb();
  const visitor = visitorHash(input.ip || "0.0.0.0", input.ua || "");
  const { section, slug } = sectionForPath(path);

  // Unique = première vue de ce visiteur aujourd'hui (toutes pages confondues).
  const today = new Date().toISOString().slice(0, 10);
  const seen = db
    .prepare("SELECT 1 FROM page_views WHERE visitor = ? AND created_at >= ? LIMIT 1")
    .get(visitor, `${today}T00:00:00.000Z`);
  const isUnique = seen ? 0 : 1;

  db.prepare(
    `INSERT INTO page_views (path, section, slug, visitor, is_unique, ref_host, device, lang, country, is_bot)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    path,
    section,
    slug,
    visitor,
    isUnique,
    refHost(input.referrer, input.selfHost ?? ""),
    bot ? "bot" : deviceFromUa(input.ua || ""),
    input.lang === "en" ? "en" : input.lang === "fr" ? "fr" : null,
    input.country ? input.country.slice(0, 2).toUpperCase() : null,
    bot ? 1 : 0
  );
  return true;
}

/** Purge des évènements anciens (RGPD / volume disque). */
export function pruneOldPageViews(retentionDays = 180): number {
  const db = getDb();
  const cutoff = new Date(Date.now() - retentionDays * 86400_000).toISOString();
  const r = db.prepare("DELETE FROM page_views WHERE created_at < ?").run(cutoff);
  return r.changes;
}

// ---------- Lecture / agrégats ----------

export type Period = "day" | "week" | "month";
export type Range = "24h" | "7d" | "30d" | "90d" | "12m";

const RANGE_DAYS: Record<Range, number> = { "24h": 1, "7d": 7, "30d": 30, "90d": 90, "12m": 365 };

function defaultBucket(range: Range): Period | "hour" {
  if (range === "24h") return "hour";
  if (range === "12m") return "month";
  return "day";
}

function bucketExpr(bucket: Period | "hour"): string {
  switch (bucket) {
    case "hour":
      return "substr(created_at, 1, 13)"; // YYYY-MM-DDTHH
    case "week":
      return "strftime('%Y-W%W', created_at)";
    case "month":
      return "substr(created_at, 1, 7)"; // YYYY-MM
    default:
      return "substr(created_at, 1, 10)"; // YYYY-MM-DD
  }
}

type SeriesRow = { bucket: string; pageviews: number; uniques: number };

export type AnalyticsData = {
  range: Range;
  bucket: Period | "hour";
  since: string;
  kpis: {
    pageviews: number;
    uniques: number;
    viewsPerVisitor: number;
    pvDelta: number | null;
    uvDelta: number | null;
    botShare: number;
    liveNow: number;
  };
  series: SeriesRow[];
  topPages: { path: string; title: string | null; views: number; uniques: number }[];
  sections: { section: string; views: number }[];
  referrers: { host: string; views: number }[];
  devices: { device: string; views: number }[];
  langs: { lang: string; views: number }[];
  countries: { country: string; views: number }[];
  hourly: { hour: number; views: number }[];
  weekday: { dow: number; views: number }[];
  reactions: { reaction: string; total: number }[];
  subscribers: { total: number; inRange: number };
};

function sumViews(db: ReturnType<typeof getDb>, since: string, until?: string): { pageviews: number; uniques: number } {
  const where = until
    ? "created_at >= ? AND created_at < ? AND is_bot = 0"
    : "created_at >= ? AND is_bot = 0";
  const args = until ? [since, until] : [since];
  const row = db
    .prepare(`SELECT COUNT(*) AS pv, SUM(is_unique) AS uv FROM page_views WHERE ${where}`)
    .get(...args) as { pv: number; uv: number | null };
  return { pageviews: row.pv, uniques: row.uv ?? 0 };
}

function pctDelta(curr: number, prev: number): number | null {
  if (prev === 0) return curr > 0 ? 100 : null;
  return Math.round(((curr - prev) / prev) * 100);
}

export function getAnalytics(opts?: { range?: Range; bucket?: Period }): AnalyticsData {
  const db = getDb();
  const range: Range = opts?.range ?? "30d";
  const bucket: Period | "hour" = opts?.bucket ?? defaultBucket(range);
  const days = RANGE_DAYS[range];
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const prevSince = new Date(Date.now() - days * 2 * 86400_000).toISOString();

  // KPIs + comparaison période précédente équivalente
  const curr = sumViews(db, since);
  const prev = sumViews(db, prevSince, since);
  const liveNow = (
    db
      .prepare("SELECT COUNT(DISTINCT visitor) AS c FROM page_views WHERE created_at >= ? AND is_bot = 0")
      .get(new Date(Date.now() - 5 * 60_000).toISOString()) as { c: number }
  ).c;
  const botRow = db
    .prepare("SELECT SUM(is_bot) AS bots, COUNT(*) AS total FROM page_views WHERE created_at >= ?")
    .get(since) as { bots: number | null; total: number };
  const botShare = botRow.total > 0 ? Math.round(((botRow.bots ?? 0) / botRow.total) * 100) : 0;

  // Série temporelle
  const expr = bucketExpr(bucket);
  const series = db
    .prepare(
      `SELECT ${expr} AS bucket, COUNT(*) AS pageviews, SUM(is_unique) AS uniques
       FROM page_views WHERE created_at >= ? AND is_bot = 0
       GROUP BY bucket ORDER BY bucket ASC`
    )
    .all(since) as SeriesRow[];

  // Top pages (+ titre d'article si applicable)
  const topPagesRaw = db
    .prepare(
      `SELECT path, slug, COUNT(*) AS views, SUM(is_unique) AS uniques
       FROM page_views WHERE created_at >= ? AND is_bot = 0
       GROUP BY path ORDER BY views DESC LIMIT 15`
    )
    .all(since) as { path: string; slug: string | null; views: number; uniques: number }[];
  const titleBySlug = new Map<string, string>();
  const slugs = topPagesRaw.map((p) => p.slug).filter(Boolean) as string[];
  if (slugs.length) {
    const rows = db
      .prepare(`SELECT slug, title FROM articles WHERE slug IN (${slugs.map(() => "?").join(",")})`)
      .all(...slugs) as { slug: string; title: string }[];
    for (const r of rows) titleBySlug.set(r.slug, r.title);
  }
  const topPages = topPagesRaw.map((p) => ({
    path: p.path,
    title: p.slug ? titleBySlug.get(p.slug) ?? null : null,
    views: p.views,
    uniques: p.uniques ?? 0,
  }));

  const sections = db
    .prepare(
      `SELECT section, COUNT(*) AS views FROM page_views WHERE created_at >= ? AND is_bot = 0
       GROUP BY section ORDER BY views DESC`
    )
    .all(since) as { section: string; views: number }[];

  const referrers = db
    .prepare(
      `SELECT ref_host AS host, COUNT(*) AS views FROM page_views
       WHERE created_at >= ? AND is_bot = 0 AND ref_host IS NOT NULL
       GROUP BY ref_host ORDER BY views DESC LIMIT 12`
    )
    .all(since) as { host: string; views: number }[];

  const devices = db
    .prepare(
      `SELECT device, COUNT(*) AS views FROM page_views WHERE created_at >= ? AND is_bot = 0 AND device != 'bot'
       GROUP BY device ORDER BY views DESC`
    )
    .all(since) as { device: string; views: number }[];

  const langs = db
    .prepare(
      `SELECT lang, COUNT(*) AS views FROM page_views WHERE created_at >= ? AND is_bot = 0 AND lang IS NOT NULL
       GROUP BY lang ORDER BY views DESC`
    )
    .all(since) as { lang: string; views: number }[];

  const countries = db
    .prepare(
      `SELECT country, COUNT(*) AS views FROM page_views WHERE created_at >= ? AND is_bot = 0 AND country IS NOT NULL
       GROUP BY country ORDER BY views DESC LIMIT 12`
    )
    .all(since) as { country: string; views: number }[];

  const hourlyRaw = db
    .prepare(
      `SELECT CAST(strftime('%H', created_at) AS INTEGER) AS hour, COUNT(*) AS views
       FROM page_views WHERE created_at >= ? AND is_bot = 0 GROUP BY hour`
    )
    .all(since) as { hour: number; views: number }[];
  const hourMap = new Map(hourlyRaw.map((h) => [h.hour, h.views]));
  const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, views: hourMap.get(h) ?? 0 }));

  const weekdayRaw = db
    .prepare(
      `SELECT CAST(strftime('%w', created_at) AS INTEGER) AS dow, COUNT(*) AS views
       FROM page_views WHERE created_at >= ? AND is_bot = 0 GROUP BY dow`
    )
    .all(since) as { dow: number; views: number }[];
  const dowMap = new Map(weekdayRaw.map((d) => [d.dow, d.views]));
  const weekday = Array.from({ length: 7 }, (_, d) => ({ dow: d, views: dowMap.get(d) ?? 0 }));

  const reactions = db
    .prepare("SELECT reaction, SUM(count) AS total FROM article_reactions GROUP BY reaction")
    .all() as { reaction: string; total: number }[];

  const subTotal = (db.prepare("SELECT COUNT(*) AS c FROM newsletter_subscribers").get() as { c: number }).c;
  const subRange = (
    db
      .prepare("SELECT COUNT(*) AS c FROM newsletter_subscribers WHERE created_at >= ?")
      .get(since) as { c: number }
  ).c;

  return {
    range,
    bucket,
    since,
    kpis: {
      pageviews: curr.pageviews,
      uniques: curr.uniques,
      viewsPerVisitor: curr.uniques > 0 ? Math.round((curr.pageviews / curr.uniques) * 10) / 10 : 0,
      pvDelta: pctDelta(curr.pageviews, prev.pageviews),
      uvDelta: pctDelta(curr.uniques, prev.uniques),
      botShare,
      liveNow,
    },
    series,
    topPages,
    sections,
    referrers,
    devices,
    langs,
    countries,
    hourly,
    weekday,
    reactions,
    subscribers: { total: subTotal, inRange: subRange },
  };
}
