import { getDb } from "./db";
import { getSettings } from "./settings";
import { computeSlots } from "./x-schedule";

export type SystemStatus = {
  level: "ok" | "degraded" | "stale" | "idle";
  fr: string;
  en: string;
};

/**
 * État réel du système, déduit du dernier passage du pipeline.
 * Aucune valeur en dur : reflète la table pipeline_runs.
 */
export function getSystemStatus(): SystemStatus {
  let last: { status: string; finished_at: string | null } | undefined;
  try {
    last = getDb()
      .prepare("SELECT status, finished_at FROM pipeline_runs ORDER BY id DESC LIMIT 1")
      .get() as { status: string; finished_at: string | null } | undefined;
  } catch {
    last = undefined;
  }

  if (!last) {
    return { level: "idle", fr: "En attente de la première synchro", en: "Awaiting first sync" };
  }
  if (last.status !== "ok") {
    return { level: "degraded", fr: "Incident sur la collecte", en: "Collection incident" };
  }
  const finished = last.finished_at ? new Date(last.finished_at).getTime() : 0;
  const staleAfter = 26 * 3600_000; // tolérance > 24h (le cron tourne quotidiennement)
  if (!finished || Date.now() - finished > staleAfter) {
    return { level: "stale", fr: "Synchro en retard", en: "Sync delayed" };
  }
  return { level: "ok", fr: "Tous systèmes opérationnels", en: "All systems operational" };
}

// --- Suivi des automatisations (crons) -------------------------------------

export type Job = {
  key: "pipeline" | "newsletter" | "x";
  label: string;
  schedule: string;
  lastAt: string | null;
  lastInfo: string;
  lastOk: boolean | null;
  nextAt: number | null;
  warn: string | null;
};

// Décalage (ms) entre l'horloge murale de Paris et l'UTC à l'instant donné.
export function parisOffsetMs(at: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const m: Record<string, string> = {};
  for (const p of dtf.formatToParts(at)) m[p.type] = p.value;
  const asUTC = Date.UTC(+m.year, +m.month - 1, +m.day, +m.hour, +m.minute, +m.second);
  return asUTC - at.getTime();
}

// Prochaine occurrence d'une heure "murale" Paris (weekday optionnel : 0=dim … 2=mar).
function nextParis(hour: number, minute: number, weekday?: number): number {
  const now = new Date();
  const offset = parisOffsetMs(now);
  const parisNow = new Date(now.getTime() + offset); // horloge murale Paris vue comme de l'UTC
  for (let add = 0; add < 14; add++) {
    const base = new Date(
      Date.UTC(parisNow.getUTCFullYear(), parisNow.getUTCMonth(), parisNow.getUTCDate(), hour, minute, 0)
    );
    base.setUTCDate(base.getUTCDate() + add);
    if (weekday !== undefined && base.getUTCDay() !== weekday) continue;
    const realMs = base.getTime() - offset;
    if (realMs > now.getTime()) return realMs;
  }
  return now.getTime();
}

function nextPipeline(): number {
  const interval = parseInt(process.env.PIPELINE_INTERVAL_MIN ?? "30", 10);
  const now = new Date();
  const next = new Date(now);
  const mark = Math.ceil((now.getMinutes() + 1) / interval) * interval;
  next.setMinutes(mark, 0, 0);
  return next.getTime();
}

type LastRow = { ts: string; ok: number; info: string } | undefined;

export function getJobs(): Job[] {
  const db = getDb();
  const safe = (fn: () => LastRow): LastRow => {
    try {
      return fn();
    } catch {
      return undefined;
    }
  };

  const pipe = safe(
    () =>
      db
        .prepare(
          `SELECT started_at AS ts, CASE WHEN status='ok' THEN 1 ELSE 0 END AS ok,
                  (items_new || ' items · ' || articles_created || ' créé(s)') AS info
           FROM pipeline_runs ORDER BY id DESC LIMIT 1`
        )
        .get() as LastRow
  );

  const news = safe(
    () =>
      db
        .prepare(
          `SELECT sent_at AS ts, CASE WHEN errors=0 THEN 1 ELSE 0 END AS ok,
                  (recipients || ' dest · ' || errors || ' erreur(s)') AS info
           FROM newsletter_sends ORDER BY id DESC LIMIT 1`
        )
        .get() as LastRow
  );

  const x = safe(
    () =>
      db
        .prepare(
          `SELECT posted_at AS ts, 1 AS ok,
                  COALESCE(custom_text, article_slug, 'post') AS info
           FROM x_posts ORDER BY id DESC LIMIT 1`
        )
        .get() as LastRow
  );

  const interval = parseInt(process.env.PIPELINE_INTERVAL_MIN ?? "30", 10);
  const xConfigured = Boolean(
    process.env.X_API_KEY && process.env.X_API_SECRET && process.env.X_ACCESS_TOKEN && process.env.X_ACCESS_SECRET
  );

  const { xPostsPerDay, xFirstHour, xLastHour } = getSettings();
  const xSlots = computeSlots(xPostsPerDay, xFirstHour, xLastHour);
  const xNextAt = xSlots.length
    ? Math.min(...xSlots.map((m) => nextParis(Math.floor(m / 60), m % 60)))
    : null;
  const xSchedule = xSlots.length
    ? `${xPostsPerDay}/jour entre ${xFirstHour}h et ${xLastHour}h (Paris)`
    : "Publication désactivée";
  const xWarn = !xConfigured
    ? "Clés X absentes — rien ne sera publié"
    : xSlots.length === 0
      ? "0 post/jour — publication en pause"
      : null;

  return [
    {
      key: "pipeline",
      label: "Pipeline de collecte",
      schedule: `Toutes les ${interval} min`,
      lastAt: pipe?.ts ?? null,
      lastInfo: pipe?.info ?? "—",
      lastOk: pipe ? pipe.ok === 1 : null,
      nextAt: nextPipeline(),
      warn: null,
    },
    {
      key: "newsletter",
      label: "Newsletter hebdo",
      schedule: "Mardi 09h00 (Paris)",
      lastAt: news?.ts ?? null,
      lastInfo: news?.info ?? "Jamais envoyée",
      lastOk: news ? news.ok === 1 : null,
      nextAt: nextParis(9, 0, 2),
      warn: null,
    },
    {
      key: "x",
      label: `Posts X (${xPostsPerDay}/jour)`,
      schedule: xSchedule,
      lastAt: x?.ts ?? null,
      lastInfo: x?.info ?? "Aucun post",
      lastOk: x ? x.ok === 1 : null,
      nextAt: xNextAt,
      warn: xWarn,
    },
  ];
}
