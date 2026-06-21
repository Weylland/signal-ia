import { getDb } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { XAdmin } from "@/components/admin/XAdmin";

export const dynamic = "force-dynamic";

type XPostRow = {
  id: number;
  posted_at: string;
  tweet_id: string | null;
  lang: string;
  title: string | null;
  type: string | null;
  article_slug: string;
};

export default async function XPage() {
  const configured = Boolean(
    process.env.X_API_KEY &&
      process.env.X_API_SECRET &&
      process.env.X_ACCESS_TOKEN &&
      process.env.X_ACCESS_SECRET
  );

  const posts = getDb()
    .prepare(
      `SELECT x.id, x.posted_at, x.tweet_id, x.lang, x.article_slug, a.title, a.type
       FROM x_posts x LEFT JOIN articles a ON a.slug = x.article_slug
       ORDER BY x.posted_at DESC LIMIT 20`
    )
    .all() as XPostRow[];

  return (
    <div>
      <div style={{ marginBottom: "var(--s7)" }}>
        <h1 style={{ fontFamily: "var(--ff-h)", fontSize: 26, fontWeight: 700, letterSpacing: "-.02em" }}>Réseaux — X</h1>
        <p style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink-f)", marginTop: "var(--s2)" }}>
          Publication automatique quotidienne · cascade actu → tuto
        </p>
      </div>

      <XAdmin configured={configured} posts={posts} includeLink={getSettings().xIncludeLink} />
    </div>
  );
}
