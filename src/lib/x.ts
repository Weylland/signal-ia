import { TwitterApi, EUploadMimeType } from "twitter-api-v2";
import { getDb } from "./db";
import { getSettings } from "./settings";
import { generateXCard } from "./x-card";
import { parisOffsetMs } from "./status";
import { callLLM } from "./llm";
import { computeSlots } from "./x-schedule";

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

const MAX_LEN = 278;

// Retire le markdown que X n'interprète pas (astérisques d'emphase, gras).
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Nettoie + ramène sous la limite. Priorité à une PHRASE COMPLÈTE (pas de « … »
// trompeur). Coupe au mot + « … » seulement en dernier recours.
function cleanTruncate(text: string, max: number = MAX_LEN): string {
  const clean = stripMarkdown(text);
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max);
  const lastSentence = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("! "), slice.lastIndexOf("? "));
  // Fin de phrase exploitable → on garde jusque-là, terminé proprement.
  if (lastSentence >= 80) return slice.slice(0, lastSentence + 1).trim();
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > 0 ? slice.slice(0, lastSpace) : slice).trimEnd() + "…";
}

// Génère le texte du tweet : un angle, voix humaine, pas de hashtag ni emoji en rafale.
async function generatePostText(a: Candidate, lang: PostLang, maxLen: number = MAX_LEN): Promise<string> {
  const fallback = cleanTruncate(a.title, maxLen);

  const kind = a.type === "tuto" ? "tutoriel pratique (contenu intemporel)" : "actualité du moment";
  const points = a.tldr.length ? `\nFaits / points clés (sers-t'en) :\n- ${a.tldr.join("\n- ")}` : "";
  const langRule = lang === "fr" ? "Écris en français." : "Write in English.";

  try {
    const raw = await callLLM([{
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
- Inventer un chiffre, un fait ou une conséquence absent du sujet. Reste strictement sur ce qui est fourni.
- Mal interpréter les chiffres : ne dis jamais "passe de X à Y" ou "réduit/augmente" sauf si le sujet l'affirme explicitement. Des variantes d'un même produit (tiny/small/medium…) sont une gamme, pas une évolution.
- Empiler des questions rhétoriques ("et si… ? le pari de… ?") — au plus UNE question, et seulement si elle fait mouche.
- Hashtags, liens, emojis en rafale (un seul emoji max, et seulement s'il est naturel).
- Tout markdown : pas d'astérisques *, pas de gras, pas de _ ni de backticks. X affiche ces signes en clair. Pour insister, choisis tes mots, pas du formatage.
- Terminer par « … » ou laisser une phrase en suspens.
- Formules creuses : "découvrez", "à ne pas manquer", "dans un monde où", "révolution", "🚀", "game changer".

Exemples du NIVEAU attendu (ton, densité — invente sur TON sujet) :
- "OpenAI casse ses prix de 40%. Traduction : la bataille des modèles ne se joue plus sur le benchmark mais sur le coût par token. Anthropic et Google vont devoir suivre."
- "Un agent qui lit tes mails peut être détourné par un simple mail piégé. La prompt injection n'a aucun équivalent en sécu classique — et la majorité des apps IA y sont vulnérables par défaut."

Longueur : entre 180 et 240 caractères MAXIMUM (compte-les), et termine TOUJOURS sur une phrase complète ponctuée (. ! ?) — jamais coupé, jamais de « … » final. Renvoie un JSON STRICT : {"text": "..."}`,
    }], true, true, 0.8);
    const parsed = JSON.parse(raw) as { text?: string };
    const text = parsed.text?.trim();
    if (!text) return fallback;
    return cleanTruncate(text, maxLen);
  } catch {
    return fallback;
  }
}

// Anti double-fire rapproché : a-t-on posté dans les dernières minutes ?
// La cadence réelle vient des créneaux (computeSlots) ; ce garde-fou n'évite qu'un
// re-déclenchement accidentel (ex. tick du cron + appel au boot quasi simultanés).
const MIN_GAP_MINUTES = 20;
function postedRecently(lang: PostLang): boolean {
  const since = new Date(Date.now() - MIN_GAP_MINUTES * 60_000).toISOString();
  const row = getDb()
    .prepare("SELECT COUNT(*) AS c FROM x_posts WHERE lang = ? AND posted_at >= ?")
    .get(lang, since) as { c: number };
  return row.c > 0;
}

export type XResult =
  | { skipped: string }
  | { posted: string; type: "news" | "tuto"; tweetId: string }
  | { preview: string; url: string; slug: string; type: "news" | "tuto"; withLink: boolean };

// Choisit le candidat selon la préférence du créneau (midi = actu, soir = tuto),
// avec repli sur l'autre type si rien de dispo. Le lien part en réponse (anti-throttle).
// dryRun : génère le post et le retourne SANS rien publier ni enregistrer.
export async function runXDigest(
  lang: PostLang = "fr",
  opts: { dryRun?: boolean; prefer?: "news" | "tuto" } = {}
): Promise<XResult> {
  const dryRun = opts.dryRun ?? false;
  const prefer = opts.prefer ?? "news";
  const client = getClient();
  if (!client && !dryRun) return { skipped: "X non configuré (clés manquantes)" };
  if (!dryRun && postedRecently(lang)) return { skipped: `déjà posté il y a moins de ${MIN_GAP_MINUTES} min` };

  const candidate =
    prefer === "tuto" ? (pickTuto(lang) ?? pickNews(lang)) : (pickNews(lang) ?? pickTuto(lang));
  if (!candidate) return { skipped: "rien de pertinent à poster" };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://watch-ia.com";
  // Un tuto sans lien est inutile (rien à lire) : on force toujours le lien pour les tutos.
  // Pour une actu, l'angle se suffit, donc on respecte le réglage (le lien coûte plus cher côté X).
  const settings = getSettings();
  const includeLink = candidate.type === "tuto" ? settings.xTutoIncludeLink : settings.xIncludeLink;
  // Si le lien va dans le tweet, on réserve sa place (X compte une URL pour 23 + 2 sauts de ligne).
  const text = await generatePostText(candidate, lang, includeLink ? MAX_LEN - 25 : MAX_LEN);
  const url = `${siteUrl}/articles/${candidate.slug}`;

  if (dryRun) {
    return { preview: text, url, slug: candidate.slug, type: candidate.type, withLink: includeLink };
  }

  // Avec lien : on le place dans le tweet principal pour que X déplie la carte de marque
  // (image OG de l'article). Une seule carte, pas de doublon image+aperçu, et un seul post.
  // Sans lien : on uploade la carte de marque en illustration (aucun lien à déplier).
  let main;
  if (includeLink) {
    main = await client!.v2.tweet(`${text}\n\n${url}`);
  } else {
    let mediaIds: string[] = [];
    try {
      const card = await generateXCard({ title: candidate.title, kind: candidate.type });
      const mediaId = await client!.v1.uploadMedia(card, { mimeType: EUploadMimeType.Png });
      mediaIds = [mediaId];
    } catch {
      mediaIds = [];
    }
    main = mediaIds.length
      ? await client!.v2.tweet(text, { media: { media_ids: mediaIds as [string] } })
      : await client!.v2.tweet(text);
  }
  const tweetId = main.data.id;

  getDb()
    .prepare("INSERT INTO x_posts (article_slug, tweet_id, lang) VALUES (?, ?, ?)")
    .run(candidate.slug, tweetId, lang);

  return { posted: candidate.slug, type: candidate.type, tweetId };
}

// Heure murale Paris (heures, minutes) à l'instant donné.
function parisHourMinute(at = new Date()): { mins: number } {
  const dtf = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
  const m: Record<string, string> = {};
  for (const p of dtf.formatToParts(at)) m[p.type] = p.value;
  return { mins: +m.hour * 60 + +m.minute };
}

// ISO UTC de minuit (début de journée) Paris aujourd'hui.
function todayStartIso(): string {
  const now = new Date();
  const offset = parisOffsetMs(now);
  const pn = new Date(now.getTime() + offset);
  const base = new Date(Date.UTC(pn.getUTCFullYear(), pn.getUTCMonth(), pn.getUTCDate(), 0, 0, 0));
  return new Date(base.getTime() - offset).toISOString();
}

// Nombre de posts auto déjà publiés aujourd'hui (jour calendaire Paris).
function postsTodayParis(lang: PostLang = "fr"): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS c FROM x_posts WHERE lang = ? AND posted_at >= ?")
    .get(lang, todayStartIso()) as { c: number };
  return row.c;
}

// Vérificateur de publication, appelé périodiquement (toutes les 30 min) et au boot.
// Pilote 100 % des posts auto depuis les réglages : nombre/jour + fenêtre horaire.
// Publie au plus UN créneau par appel ; rattrape naturellement un créneau raté
// (redéploiement Railway) au tick suivant. Rien après 22h pour éviter une heure incongrue.
export async function runXScheduled(): Promise<XResult> {
  const { xPostsPerDay, xFirstHour, xLastHour } = getSettings();
  if (xPostsPerDay <= 0) return { skipped: "publication X désactivée (0 post/jour)" };

  const slots = computeSlots(xPostsPerDay, xFirstHour, xLastHour);
  const done = postsTodayParis();
  if (done >= slots.length) return { skipped: "quota du jour atteint" };

  const { mins } = parisHourMinute();
  if (mins > 22 * 60) return { skipped: "trop tard pour publier aujourd'hui" };
  if (mins < slots[done]) return { skipped: "prochain créneau pas encore arrivé" };

  // Dernier créneau de la journée = tuto/insight ; les précédents = actu fraîche.
  const prefer = xPostsPerDay >= 2 && done === slots.length - 1 ? "tuto" : "news";
  return runXDigest("fr", { prefer });
}

export type XCustomResult =
  | { skipped: string }
  | { posted: string; tweetId: string }
  | { preview: string; cardTitle: string; tag: string; withLink: boolean; url: string };

// Tweet rédigé à la main + carte de marque (titre/tag libres). Lien optionnel.
export async function postCustomTweet(opts: {
  text: string;
  cardTitle?: string;
  tag?: string;
  link?: string;
  dryRun?: boolean;
}): Promise<XCustomResult> {
  const text = cleanTruncate(opts.text.trim());
  if (!text) return { skipped: "texte vide" };

  const cardTitle = opts.cardTitle?.trim() || opts.text.trim();
  const tag = opts.tag?.trim() || "ANNONCE";
  const link = opts.link?.trim() || "";
  const dryRun = opts.dryRun ?? false;

  if (dryRun) {
    return { preview: text, cardTitle, tag, withLink: Boolean(link), url: link };
  }

  const client = getClient();
  if (!client) return { skipped: "X non configuré (clés manquantes)" };

  let mediaIds: string[] = [];
  try {
    const card = await generateXCard({ title: cardTitle, kind: "news", tag });
    const mediaId = await client.v1.uploadMedia(card, { mimeType: EUploadMimeType.Png });
    mediaIds = [mediaId];
  } catch {
    mediaIds = [];
  }

  const main = mediaIds.length
    ? await client.v2.tweet(text, { media: { media_ids: mediaIds as [string] } })
    : await client.v2.tweet(text);
  const tweetId = main.data.id;

  if (link) {
    await client.v2.tweet(`→ ${link}`, { reply: { in_reply_to_tweet_id: tweetId } });
  }

  const label = cardTitle.slice(0, 80);
  getDb()
    .prepare("INSERT INTO x_posts (article_slug, tweet_id, lang, custom_text) VALUES (?, ?, ?, ?)")
    .run("", tweetId, "fr", label);

  return { posted: label, tweetId };
}

// Supprime une entrée de l'historique. Tente aussi de supprimer le tweet sur X (best-effort).
export async function deleteXPost(id: number): Promise<{ ok: true; removedOnX: boolean }> {
  const db = getDb();
  const row = db.prepare("SELECT tweet_id FROM x_posts WHERE id = ?").get(id) as { tweet_id: string | null } | undefined;

  let removedOnX = false;
  const client = getClient();
  if (client && row?.tweet_id) {
    try {
      await client.v2.deleteTweet(row.tweet_id);
      removedOnX = true;
    } catch {
      removedOnX = false;
    }
  }

  db.prepare("DELETE FROM x_posts WHERE id = ?").run(id);
  return { ok: true, removedOnX };
}
