import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

type Run = {
  id: number;
  started_at: string;
  finished_at: string | null;
  status: string;
  items_new: number;
  articles_created: number;
  log: string;
};

export default async function PipelinePage() {
  const db = getDb();
  const runs = db
    .prepare("SELECT * FROM pipeline_runs ORDER BY id DESC LIMIT 20")
    .all() as Run[];
  const queue = db
    .prepare(
      "SELECT COUNT(*) AS c FROM pending_news WHERE status = 'queued'"
    )
    .get() as { c: number };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Pipeline</h1>
      <p className="mt-2 text-sm text-ink/60">
        Journal des passages du pipeline (scraping → scoring → rédaction).{" "}
        {queue.c > 0 && <strong>{queue.c} news en file d&apos;attente.</strong>}
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {runs.map((run) => (
          <details key={run.id} className="nb-card p-4">
            <summary className="flex cursor-pointer flex-wrap items-center gap-3">
              <span
                className="nb-pill"
                style={{
                  background:
                    run.status === "error"
                      ? "var(--peach)"
                      : run.status === "running"
                        ? "var(--sky)"
                        : "var(--mint)",
                }}
              >
                {run.status === "error" ? "Erreur" : run.status === "running" ? "En cours" : "OK"}
              </span>
              <span className="font-semibold">
                {new Date(run.started_at).toLocaleString("fr-FR")}
              </span>
              <span className="text-sm text-ink/60">
                {run.items_new} nouveaux items · {run.articles_created} article(s) créé(s)
              </span>
            </summary>
            <pre className="mt-3 overflow-x-auto border-2 border-ink bg-[var(--cream-2)] p-3 text-xs whitespace-pre-wrap">
              {run.log || "(pas de log)"}
            </pre>
          </details>
        ))}
        {runs.length === 0 && (
          <div className="nb-card p-6 text-sm">
            Aucun passage pour l&apos;instant. Lance <code>npm run pipeline</code> ou attends la
            tâche planifiée.
          </div>
        )}
      </div>
    </div>
  );
}
