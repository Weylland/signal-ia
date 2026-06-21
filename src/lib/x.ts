import { TwitterApi } from "twitter-api-v2";
import { getDb } from "./db";
import { getSettings } from "./settings";

export type PostLang = "fr" | "en";

type Candidate = {
  slug: string;
  title: string;
  excerpt: string;
  tldr: string[];
  type: "news" | "tuto";
};

function getClient(): TwitterApi | null {
  const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET } = process.env;
  if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_SECRET) return null;
  return new TwitterApi({
    appKey: X_API_KEY,
    appSecret: X_API_SECRET,
    accessToken: X_ACCESS_TOKEN,
    accessSecret: X_ACCESS_SECRET,
  });
}

function parseTldr(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

// Actu importante récente, jamais postée sur ce compte/langue.
function pickNews(lang: PostLang): Candidate | null {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 3600_000).toISOString();
  const { breakingThreshold } = getSettings();
  const row = getDb()
    .prepare(
      `SELECT slug, title, excerpt, tldr, type FROM articles a
       WHERE type = 'news' AND published = 1
         AND date >= ?
         AND COALESCE(score, 0) >= ?
         AND NOT EXISTS (SELECT 1 FROM x_posts x WHERE x.article_slug = a.slug AND x.lang = ?)
       ORDER BY COALESCE(score, 0) DESC, date DESC
       LIMIT 1`
    )
    .get(twoDaysAgo, breakingThreshold, lang) as Omit<Candidate, "tldr"> & { tldr: string } | undefined;
  return row ? { ...row, tldr: parseTldr(row.tldr) } : null;
}

// Tuto evergreen pas posté depuis au moins 60 jours ; jamais posté en priorité, sinon le plus ancien.
function pickTuto(lang: PostLang): Candidate | null {
  const cooldown = new Date(Date.now() - 60 * 24 * 3600_000).toISOString();
  const row = getDb()
    .prepare(
      `SELECT slug, title, excerpt, tldr, type FROM articles a
       WHERE type = 'tuto' AND published = 1
         AND NOT EXISTS (
           SELECT 1 FROM x_posts x
           WHERE x.article_slug = a.slug AND x.lang = ? AND x.posted_at >= ?
         )
       ORDER BY
         CASE WHEN (SELECT MAX(posted_at) FROM x_posts x2 WHERE x2.article_slug = a.slug AND x2.lang = ?) IS NULL THEN 0 ELSE 1 END,
         (SELECT MAX(posted_at) FROM x_posts x3 WHERE x3.article_slug = a.slug AND x3.lang = ?) ASC,
         RANDOM()
       LIMIT 1`
    )
    .get(lang, cooldown, lang, lang) as Omit<Candidate, "tldr"> & { tldr: string } | undefined;
  return row ? { ...row, tldr: parseTldr(row.tldr) } : null;
}

const FALLBACK_LIMIT = 260;

// Génère le texte du tweet : un angle, voix humaine, pas de hashtag ni emoji en rafale.
async function generatePostText(a: Candidate, lang: PostLang): Promise<string> {
  const fallback = a.title.slice(0, FALLBACK_LIMIT);
  const key = process.env.MISTRAL_API_KEY;
  if (!key) return fallback;

  const kind = a.type === "tuto" ? "tutoriel pratique (contenu intemporel)" : "actualité du moment";
  const points = a.tldr.length ? `\nPoints clés :\n- ${a.tldr.join("\n- ")}` : "";
  const langRule =
    lang === "fr"
      ? "Écris en français."
      : "Write in English.";

  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "mistral-small-latest",
        temperature: 0.85,
        response_format: { type: "json_object" },
        messages: [{
          role: "user",
          content: `Tu écris UN post pour le compte X d'un média de veille IA. ${langRule}

Sujet (${kind}) : "${a.title}"
${a.excerpt}${points}

Règles ABSOLUES :
- Le post porte un ANGLE, une idée ou une prise de position concrète — surtout pas le titre recopié.
- Ton humain, direct, vivant. Comme un humain qui partage un truc qu'il trouve intéressant, pas un communiqué.
- AUCUN hashtag. AUCUN lien (il sera ajouté à part). Pas d'emoji, ou un seul max si vraiment naturel.
- Pas de formule creuse ("dans un monde où", "découvrez", "à ne pas manquer", "🚀").
- Varie l'accroche : parfois une question, un constat, un chiffre, un avis tranché.
- Maximum 260 caractères.

Renvoie un JSON STRICT : {"text": "..."}`,
        }],
      }),
    });
    if (!res.ok) return fallback;
    const data = await res.json() as { choices: { message: { content: string } }[] };
    const raw = data.choices[0].message.content.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(raw) as { text?: string };
    const text = parsed.text?.trim();
    if (!text) return fallback;
    return text.length > 280 ? text.slice(0, FALLBACK_LIMIT) : text;
  } catch {
    return fallback;
  }
}

// Déjà posté quelque chose dans les 12 dernières heures sur cette langue ? (garde anti double-fire)
function postedRecently(lang: PostLang): boolean {
  const twelveHoursAgo = new Date(Date.now() - 12 * 3600_000).toISOString();
  const row = getDb()
    .prepare("SELECT COUNT(*) AS c FROM x_posts WHERE lang = ? AND posted_at >= ?")
    .get(lang, twelveHoursAgo) as { c: number };
  return row.c > 0;
}

export type XResult =
  | { skipped: string }
  | { posted: string; type: "news" | "tuto"; tweetId: string };

// Cascade : actu importante → sinon tuto evergreen. Le lien part en réponse au tweet (anti-throttle).
export async function runXDigest(lang: PostLang = "fr"): Promise<XResult> {
  const client = getClient();
  if (!client) return { skipped: "X non configuré (clés manquantes)" };
  if (postedRecently(lang)) return { skipped: "déjà posté dans les 12 dernières heures" };

  const candidate = pickNews(lang) ?? pickTuto(lang);
  if (!candidate) return { skipped: "rien de pertinent à poster" };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://watch-ia.com";
  const text = await generatePostText(candidate, lang);

  const main = await client.v2.tweet(text);
  const tweetId = main.data.id;
  await client.v2.tweet(`→ ${siteUrl}/articles/${candidate.slug}`, {
    reply: { in_reply_to_tweet_id: tweetId },
  });

  getDb()
    .prepare("INSERT INTO x_posts (article_slug, tweet_id, lang) VALUES (?, ?, ?)")
    .run(candidate.slug, tweetId, lang);

  return { posted: candidate.slug, type: candidate.type, tweetId };
}
