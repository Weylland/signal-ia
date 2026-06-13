import { getDb } from "@/lib/db";
import { ModerationQueue } from "@/components/admin/ModerationQueue";

export const dynamic = "force-dynamic";

type PendingRow = {
  id: number;
  url: string;
  title: string;
  source_name: string;
  summary: string;
  published_at: string | null;
  score: number | null;
  status: string;
  article_slug: string | null;
  seen_at: string;
};

export default function ModerationPage() {
  const db = getDb();
  const pending = db
    .prepare(
      `SELECT * FROM pending_news
       WHERE status IN ('queue','new')
       ORDER BY score DESC, seen_at DESC
       LIMIT 100`
    )
    .all() as PendingRow[];

  const stats = db
    .prepare(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status='queue' THEN 1 ELSE 0 END) AS queued,
        SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) AS published,
        SUM(CASE WHEN status='rejected' THEN 1 ELSE 0 END) AS rejected
       FROM pending_news`
    )
    .get() as { total: number; queued: number; published: number; rejected: number };

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="font-display text-3xl font-bold">Modération pipeline</h1>
        <div className="flex gap-4 text-sm">
          <span className="nb-pill">{stats.queued ?? 0} en attente</span>
          <span className="opacity-50">{stats.published ?? 0} publiés · {stats.rejected ?? 0} rejetés</span>
        </div>
      </div>
      <ModerationQueue items={pending} />
    </div>
  );
}
