import { getDb } from "./db";

// Tarifs indicatifs en USD par million de tokens (entrée / sortie).
// À ajuster si les grilles fournisseurs changent.
const PRICE: Record<string, { in: number; out: number }> = {
  "mistral-small-latest": { in: 0.2, out: 0.6 },
  "claude-haiku-4-5-20251001": { in: 1, out: 5 },
  "claude-sonnet-5": { in: 3, out: 15 },
  "claude-opus-4-8": { in: 5, out: 25 },
};

export function costUsd(model: string, tin: number, tout: number): number {
  const p = PRICE[model] ?? { in: 0, out: 0 };
  return (tin * p.in + tout * p.out) / 1_000_000;
}

// Enregistre un appel LLM. Ne jette jamais : la télémétrie ne doit pas casser un appel.
export function recordLlmTrace(t: {
  task: string;
  model: string;
  tokensIn: number | null;
  tokensOut: number | null;
  latencyMs: number;
  status: string;
}): void {
  try {
    getDb()
      .prepare(
        `INSERT INTO llm_traces (task, model, tokens_in, tokens_out, cost, latency_ms, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        t.task,
        t.model,
        t.tokensIn,
        t.tokensOut,
        costUsd(t.model, t.tokensIn ?? 0, t.tokensOut ?? 0),
        t.latencyMs,
        t.status
      );
  } catch {
    /* télémétrie best-effort */
  }
}

export type LlmTaskRow = {
  task: string;
  model: string;
  calls: number;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  avgLatency: number;
  errors: number;
};
export type LlmDayRow = { day: string; cost: number; calls: number };

export type LlmSummary = {
  totalCost: number;
  totalCalls: number;
  errorRate: number;
  avgLatency: number;
  byTask: LlmTaskRow[];
  byDay: LlmDayRow[];
};

export function getLlmSummary(days = 30): LlmSummary {
  const db = getDb();
  const since = new Date(Date.now() - days * 24 * 3600_000).toISOString();

  const totals = db
    .prepare(
      `SELECT COUNT(*) AS calls, COALESCE(SUM(cost), 0) AS cost,
              AVG(latency_ms) AS latency,
              AVG(CASE WHEN status = 'ok' THEN 0 ELSE 1 END) AS errorRate
       FROM llm_traces WHERE ts >= ?`
    )
    .get(since) as { calls: number; cost: number; latency: number | null; errorRate: number | null };

  const byTask = db
    .prepare(
      `SELECT task, model, COUNT(*) AS calls,
              COALESCE(SUM(tokens_in), 0) AS tokensIn,
              COALESCE(SUM(tokens_out), 0) AS tokensOut,
              COALESCE(SUM(cost), 0) AS cost,
              AVG(latency_ms) AS avgLatency,
              SUM(CASE WHEN status = 'ok' THEN 0 ELSE 1 END) AS errors
       FROM llm_traces WHERE ts >= ? GROUP BY task, model ORDER BY cost DESC`
    )
    .all(since) as LlmTaskRow[];

  const byDay = db
    .prepare(
      `SELECT substr(ts, 1, 10) AS day, COALESCE(SUM(cost), 0) AS cost, COUNT(*) AS calls
       FROM llm_traces WHERE ts >= ? GROUP BY day ORDER BY day DESC LIMIT 30`
    )
    .all(since) as LlmDayRow[];

  return {
    totalCost: totals.cost,
    totalCalls: totals.calls,
    errorRate: totals.errorRate ?? 0,
    avgLatency: totals.latency ?? 0,
    byTask,
    byDay,
  };
}

// Purge des traces anciennes (appelée par le cron backup).
export function pruneOldLlmTraces(days = 90): number {
  const cutoff = new Date(Date.now() - days * 24 * 3600_000).toISOString();
  return getDb().prepare("DELETE FROM llm_traces WHERE ts < ?").run(cutoff).changes;
}
