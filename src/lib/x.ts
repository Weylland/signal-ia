import { TwitterApi, EUploadMimeType } from "twitter-api-v2";
import { getDb } from "./db";
import { getSettings } from "./settings";
import { generateXCard } from "./x-card";

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
  const points = a.tldr.length ? `\nFaits / points clés (sers-t'en) :\n- ${a.tldr.join("\n- ")}` : "";
  const langRule = lang === "fr" ? "Écris en français." : "Write in English.";

  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "mistral-small-latest",
        temperature: 0.8,
        response_format: { type: "json_object" },
        messages: [{
          role: "user",
          content: `Tu animes un compte X de veille IA qu'on suit pour ses PRISES DE POSITION, pas pour relayer des titres. ${langRule}

Sujet (${kind}) : "${a.title}"
${a.excerpt}${points}

Écris UN post (1 à 3 phrases) qui apporte une vraie valeur :
- Pars d'un FAIT CONCRET du sujet (un chiffre, un nom, une décision, une conséquence) et ajoute TON ANGLE : ce que ça révèle, pourquoi c'est important, ou une opinion assumée.
- Donne envie de lire la suite par la substance, pas par le racolage.
- Ton humain, vif, comme quelqu'un de calé qui balance une observation à ses abonnés.

INTERDIT :
- Recopier ou paraphraser le titre.
- Empiler des questions rhétoriques ("et si… ? le pari de… ?") — au plus UNE question, et seulement si elle fait mouche.
- Hashtags, liens, emojis en rafale (un seul emoji max, et seulement s'il est naturel).
- Formules creuses : "découvrez", "à ne pas manquer", "dans un monde où", "révolution", "🚀", "game changer".

Exemples du NIVEAU attendu (ton, densité — invente sur TON sujet) :
- "OpenAI casse ses prix de 40%. Traduction : la bataille des modèles ne se joue plus sur le benchmark mais sur le coût par token. Anthropic et Google vont devoir suivre."
- "Un agent qui lit tes mails peut être détourné par un simple mail piégé. La prompt injection n'a aucun équivalent en sécu classique — et la majorité des apps IA y sont vulnérables par défaut."

Vise 150 à 270 caractères. Renvoie un JSON STRICT : {"text": "..."}`,
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
  | { posted: string; type: "news" | "tuto"; tweetId: string }
  | { preview: string; url: string; slug: string; type: "news" | "tuto" };

// Cascade : actu importante → sinon tuto evergreen. Le lien part en réponse au tweet (anti-throttle).
// dryRun : génère le post et le retourne SANS rien publier ni enregistrer.
export async function runXDigest(
  lang: PostLang = "fr",
  opts: { dryRun?: boolean } = {}
): Promise<XResult> {
  const dryRun = opts.dryRun ?? false;
  const client = getClient();
  if (!client && !dryRun) return { skipped: "X non configuré (clés manquantes)" };
  if (!dryRun && postedRecently(lang)) return { skipped: "déjà posté dans les 12 dernières heures" };

  const candidate = pickNews(lang) ?? pickTuto(lang);
  if (!candidate) return { skipped: "rien de pertinent à poster" };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://watch-ia.com";
  const text = await generatePostText(candidate, lang);
  const url = `${siteUrl}/articles/${candidate.slug}`;

  if (dryRun) {
    return { preview: text, url, slug: candidate.slug, type: candidate.type };
  }

  // Carte de marque en illustration ; si la génération/upload échoue, on poste sans image.
  let mediaIds: string[] = [];
  try {
    const card = await generateXCard({ title: candidate.title, kind: candidate.type });
    const mediaId = await client!.v1.uploadMedia(card, { mimeType: EUploadMimeType.Png });
    mediaIds = [mediaId];
  } catch {
    mediaIds = [];
  }

  const main = mediaIds.length
    ? await client!.v2.tweet(text, { media: { media_ids: mediaIds as [string] } })
    : await client!.v2.tweet(text);
  const tweetId = main.data.id;
  await client!.v2.tweet(`→ ${url}`, {
    reply: { in_reply_to_tweet_id: tweetId },
  });

  getDb()
    .prepare("INSERT INTO x_posts (article_slug, tweet_id, lang) VALUES (?, ?, ?)")
    .run(candidate.slug, tweetId, lang);

  return { posted: candidate.slug, type: candidate.type, tweetId };
}
