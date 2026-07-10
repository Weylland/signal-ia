import { TwitterApi, EUploadMimeType } from "twitter-api-v2";
import { getDb } from "./db";
import { getSettings } from "./settings";
import { generateXCard } from "./x-card";
import { parisOffsetMs } from "./status";
import { callLLM, CLAUDE_MODEL_FRONTIER } from "./llm";
import { computeSlots } from "./x-schedule";
import { generateTuto } from "./tuto-generator";

export type PostLang = "fr" | "en";

type Candidate = {
  slug: string;
  title: string;
  excerpt: string;
  tldr: string[];
  type: "news" | "tuto";
  titleEn?: string | null;
  excerptEn?: string | null;
  tldrEn?: string[] | null;
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
  const { breakingThreshold, xNewsMaxAgeDays } = getSettings();
  const maxAge = new Date(Date.now() - Math.max(1, xNewsMaxAgeDays) * 24 * 3600_000).toISOString();
  const row = getDb()
    .prepare(
      `SELECT slug, title, excerpt, tldr, type, title_en, excerpt_en, tldr_en FROM articles a
       WHERE type = 'news' AND published = 1
         AND date >= ?
         AND COALESCE(score, 0) >= ?
         AND NOT EXISTS (SELECT 1 FROM x_posts x WHERE x.article_slug = a.slug AND x.lang = ?)
       ORDER BY COALESCE(score, 0) DESC, date DESC
       LIMIT 1`
    )
    .get(maxAge, breakingThreshold, lang) as Omit<Candidate, "tldr" | "tldrEn"> & { tldr: string; tldr_en: string | null; title_en: string | null; excerpt_en: string | null } | undefined;
  if (!row) return null;
  return { ...row, tldr: parseTldr(row.tldr), titleEn: row.title_en, excerptEn: row.excerpt_en, tldrEn: row.tldr_en ? parseTldr(row.tldr_en) : null };
}

// Tuto evergreen pas posté depuis le cooldown réglé ; jamais posté en priorité, sinon le plus ancien.
function pickTuto(lang: PostLang): Candidate | null {
  const cooldownDays = Math.max(1, getSettings().xTutoCooldownDays);
  const cooldown = new Date(Date.now() - cooldownDays * 24 * 3600_000).toISOString();
  const row = getDb()
    .prepare(
      `SELECT slug, title, excerpt, tldr, type, title_en, excerpt_en, tldr_en FROM articles a
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
    .get(lang, cooldown, lang, lang) as Omit<Candidate, "tldr" | "tldrEn"> & { tldr: string; tldr_en: string | null; title_en: string | null; excerpt_en: string | null } | undefined;
  if (!row) return null;
  return { ...row, tldr: parseTldr(row.tldr), titleEn: row.title_en, excerptEn: row.excerpt_en, tldrEn: row.tldr_en ? parseTldr(row.tldr_en) : null };
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
  const fallback = cleanTruncate((lang === "en" && a.titleEn) ? a.titleEn : a.title, maxLen);

  const isTuto = a.type === "tuto";
  const kind = isTuto ? "tutoriel pratique (contenu intemporel)" : "actualité du moment";
  const isEn = lang === "en";
  const title = (isEn && a.titleEn) ? a.titleEn : a.title;
  const excerpt = (isEn && a.excerptEn) ? a.excerptEn : a.excerpt;
  const tldr = (isEn && a.tldrEn?.length) ? a.tldrEn : a.tldr;
  const points = tldr.length ? `\nFaits / points clés (sers-t'en) :\n- ${tldr.join("\n- ")}` : "";
  const langRule = isEn ? "Write in English." : "Écris en français.";

  // Un tuto se vend par la VALEUR REPRODUCTIBLE (ce que le lecteur saura faire),
  // pas par une prise de position comme une actu. D'où deux briefs distincts.
  const intro = isTuto
    ? `Tu animes un compte X de veille IA. Ce post présente un TUTO pratique du site : ton job est de donner envie de le faire en montrant la valeur concrète qu'on en retire. ${langRule}`
    : `Tu animes un compte X de veille IA qu'on suit pour ses PRISES DE POSITION, pas pour relayer des titres. ${langRule}`;

  // Rotation d'angles : sans ça, tous les posts suivent le même moule (« fait + opinion »)
  // et se ressemblent quand on les lit à la suite — c'est ce qui fait « écrit par une IA ».
  // Un angle tiré au hasard par post force une structure et une accroche différentes.
  const newsAngles = [
    { brief: "Prends le CONTRE-PIED de la lecture évidente : ce que tout le monde va retenir de travers ou négliger.", ex: "Tout le monde va parler du benchmark. Le vrai signal, c'est que ça tourne sur un laptop : pour cette tâche, le cloud n'est plus obligatoire." },
    { brief: "Pars d'un CHIFFRE du sujet et déplie ce qu'il implique vraiment, sans le paraphraser.", ex: "300 000 requêtes par seconde annoncées. À ce rythme le goulot n'est plus le modèle mais ta base de données, et la plupart des archis cassent avant l'IA." },
    { brief: "Dis ce que ça CHANGE CONCRÈTEMENT pour un dev ou un indépendant, dès cette semaine.", ex: "Tu peux remplacer ton script de classification maison par un appel d'API, pour moins cher qu'un café par mois. Le fait-main sur ce genre de tâche n'a plus de sens." },
    { brief: "Démonte une IDÉE REÇUE que le sujet vient contredire.", ex: "On répète que l'IA code à notre place. Cette sortie montre l'inverse : elle accélère qui sait déjà ce qu'il veut, et perd les autres." },
    { brief: "Relie le sujet à une TENDANCE DE FOND, en une observation posée, sans emphase.", ex: "Encore un labo qui ouvre ses poids. Le vrai basculement de l'année, ce n'est pas la performance, c'est que l'open weight devient l'option par défaut." },
  ];
  const tutoAngles = [
    { brief: "Pars du PIÈGE que le tuto évite : le truc qui fait perdre deux heures et qu'on aurait aimé connaître avant.", ex: "Un RAG qui répond à côté, 9 fois sur 10 c'est le découpage des documents, pas le modèle. Le tuto montre comment chunker avant de vectoriser." },
    { brief: "Dis le RÉSULTAT CONCRET : ce que le lecteur saura faire après, en une phrase nette.", ex: "À la fin tu fais tourner un modèle en local, hors ligne, en une install et une commande. Le seul vrai arbitrage, c'est la RAM." },
    { brief: "Donne le RACCOURCI non évident du tuto, celui qu'on ne trouve pas en cherchant vite fait.", ex: "Pour du JSON fiable d'un LLM, le secret n'est pas le prompt : c'est de renvoyer l'erreur de validation au modèle pour qu'il se corrige tout seul." },
    { brief: "Attaque par le MYTHE « c'est compliqué » que le tuto dégonfle.", ex: "Se faire un assistant IA sur mesure, on imagine du code. En vrai c'est trois paragraphes d'instructions et deux fichiers, zéro ligne de code." },
  ];
  const pool = isTuto ? tutoAngles : newsAngles;
  const angle = pool[Math.floor(Math.random() * pool.length)];

  try {
    const raw = await callLLM([{
      role: "user",
      content: `${intro}

Sujet (${kind}) : "${title}"
${excerpt}${points}

Écris UN post pour X, 1 à 3 phrases. ANGLE IMPOSÉ pour ce post : ${angle.brief}
${isTuto ? "Ton de quelqu'un qui l'a vraiment fait et partage ce qu'il aurait aimé savoir avant." : "Ton humain et affûté, comme quelqu'un de calé qui lâche une observation à ses abonnés."}

INTERDIT (c'est exactement ça qui fait « écrit par une IA ») :
- Recopier ou paraphraser le titre.
- Les béquilles de transition toutes faites : "Traduction :", "En clair :", "Le vrai sujet :", "Spoiler :", "Résultat :", "Bref". Enchaîne tes idées sans étiquette.
- Ouvrir comme un post type : varie la première phrase (pas systématiquement un nom propre suivi d'un verbe, pas systématiquement une question).
- Inventer un chiffre, un fait, une commande ou une conséquence absent du sujet. Reste strictement sur ce qui est fourni.
- Mal interpréter les chiffres : jamais "passe de X à Y" ni "réduit/augmente" sauf si le sujet l'affirme explicitement. Des variantes d'un même produit (tiny/small/medium…) sont une gamme, pas une évolution.
- Empiler les questions rhétoriques — au plus UNE, et seulement si elle fait mouche.
- Hashtags, liens, emojis en rafale (un seul emoji max, et seulement s'il est naturel).
- Tout markdown (astérisques, gras, _, backticks) : X l'affiche en clair. Pour insister, choisis tes mots.
- Terminer par « … » ou laisser une phrase en suspens.
- Formules creuses : "découvrez", "à ne pas manquer", "dans un monde où", "révolution", "🚀", "game changer".

Exemple du NIVEAU et du TON attendus (invente sur TON sujet, ne le copie surtout pas) :
« ${angle.ex} »

Longueur : entre 180 et 240 caractères MAXIMUM (compte-les), et termine TOUJOURS sur une phrase complète ponctuée (. ! ?) — jamais coupé, jamais de « … » final. Renvoie un JSON STRICT : {"text": "..."}`,
    }], true, "tweets", 0.9, CLAUDE_MODEL_FRONTIER);
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

  // Au plus 1 tuto par jour : un créneau actu sans actu éligible ne doit jamais se
  // rabattre indéfiniment sur des tutos (cause de la surpublication). Une fois le tuto
  // du jour posté, les créneaux suivants n'acceptent plus que des actus.
  const tutoAllowed = tutosTodayParis(lang) === 0;
  let candidate: Candidate | null;
  if (prefer === "tuto" && tutoAllowed) {
    // Créneau tuto du soir : on pioche un tuto evergreen jamais posté. S'il n'en reste
    // aucun de frais, on GÉNÈRE un brouillon (frontier) à relire — il n'est PAS posté
    // maintenant (published=0) : ce créneau se rabat alors sur une actu, et le tuto
    // partira sur X une fois relu et publié à la main.
    candidate = pickTuto(lang);
    if (!candidate && !dryRun && getSettings().xGenerateTuto) {
      await generateTuto();
    }
    candidate = candidate ?? pickNews(lang);
  } else if (prefer === "tuto") {
    // Tuto déjà publié aujourd'hui : ce créneau ne prend plus que de l'actu.
    candidate = pickNews(lang);
  } else {
    candidate = pickNews(lang) ?? (tutoAllowed ? pickTuto(lang) : null);
  }
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

// Tutos déjà publiés aujourd'hui (jour Paris) pour cette langue. Plafonne les tutos à
// 1/jour/langue : sans ça, chaque créneau actu sans actu éligible se rabat sur un tuto
// et on en publie autant que de créneaux vides.
function tutosTodayParis(lang: PostLang): number {
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) AS c FROM x_posts x
       JOIN articles a ON a.slug = x.article_slug
       WHERE x.lang = ? AND x.posted_at >= ? AND a.type = 'tuto'`
    )
    .get(lang, todayStartIso()) as { c: number };
  return row.c;
}

// Vérificateur de publication, appelé périodiquement (toutes les 30 min) et au boot.
// Pilote 100 % des posts auto depuis les réglages : nombre/jour + fenêtre horaire.
// Publie au plus UN créneau par appel ; rattrape naturellement un créneau raté
// (redéploiement) au tick suivant. Rien après 22h pour éviter une heure incongrue.
export async function runXScheduled(): Promise<XResult> {
  const { xPostsPerDay, xFirstHour, xLastHour } = getSettings();
  if (xPostsPerDay <= 0) return { skipped: "publication X désactivée (0 post/jour)" };

  const slots = computeSlots(xPostsPerDay, xFirstHour, xLastHour);
  const { mins } = parisHourMinute();
  if (mins > 22 * 60) return { skipped: "trop tard pour publier aujourd'hui" };

  // Le créneau courant est piloté par l'HEURE, pas par le nombre de posts déjà faits :
  // un créneau actu sans actu disponible est sauté sans bloquer les créneaux suivants,
  // et un redéploiement ne compresse plus plusieurs créneaux d'un coup hors fenêtre.
  const dueSlots = slots.filter((s) => mins >= s).length;
  if (dueSlots === 0) return { skipped: "prochain créneau pas encore arrivé" };

  // Le compte X est francophone : on ne publie qu'en FR, donc le nombre de posts du jour
  // colle exactement au réglage de l'admin. Les versions EN existent pour le site, pas pour X.
  const done = postsTodayParis("fr");
  if (done >= dueSlots) return { skipped: "quota du jour atteint" };

  // Dernier créneau de la journée = tuto/insight ; les précédents = actu fraîche.
  // Le plafond strict de 1 tuto/jour est appliqué dans runXDigest.
  const prefer = xPostsPerDay >= 2 && dueSlots === slots.length ? "tuto" : "news";

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
