import { getDb } from "./db";

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
