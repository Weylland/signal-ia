import { SignJWT, jwtVerify } from "jose";
import { getDb } from "./db";
import { getSettings } from "./settings";
import { getSecret } from "./auth";
import { getAllArticles } from "./articles";

export async function createUnsubToken(email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .sign(getSecret());
}

export async function verifyUnsubToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}

export function getSubscribers(): { id: number; email: string; created_at: string }[] {
  return getDb().prepare("SELECT * FROM newsletter_subscribers ORDER BY created_at DESC").all() as { id: number; email: string; created_at: string }[];
}

export function removeSubscriber(email: string): void {
  getDb().prepare("DELETE FROM newsletter_subscribers WHERE email = ?").run(email);
}

export async function sendNewsletter(subject: string, html: string): Promise<{ sent: number; errors: number }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY manquante dans .env.local");

  const from = process.env.NEWSLETTER_FROM ?? `${getSettings().siteName} <newsletter@watch-ia.com>`;
  const subscribers = getSubscribers();

  let sent = 0;
  let errors = 0;

  for (let i = 0; i < subscribers.length; i += 100) {
    const batch = subscribers.slice(i, i + 100);
    const messages = await Promise.all(
      batch.map(async (s) => ({
        from,
        to: s.email,
        subject,
        html: html.replace(/\{\{token\}\}/g, await createUnsubToken(s.email)),
      }))
    );
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(messages),
    });
    if (res.ok) sent += batch.length;
    else errors += batch.length;
  }

  getDb()
    .prepare("INSERT INTO newsletter_sends (subject, recipients, errors) VALUES (?, ?, ?)")
    .run(subject, sent, errors);

  return { sent, errors };
}

// Articles de la semaine écoulée, max 5 — même logique que l'admin newsletter.
function getWeekArticles(): Promise<DigestArticle[]> {
  return getAllArticles({ limit: 20 }).then((articles) => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
    return articles
      .filter((a) => a.date >= weekAgo)
      .slice(0, 5)
      .map((a) => ({ title: a.title, excerpt: a.excerpt, slug: a.slug }));
  });
}

// Envoi automatique du digest hebdo. Idempotent : ne renvoie pas si un envoi a déjà eu lieu dans les 6 derniers jours.
export async function sendWeeklyDigest(): Promise<{ skipped: string } | { sent: number; errors: number }> {
  if (getSubscribers().length === 0) return { skipped: "aucun abonné" };

  const sixDaysAgo = new Date(Date.now() - 6 * 24 * 3600_000).toISOString();
  const recent = getDb()
    .prepare("SELECT COUNT(*) AS c FROM newsletter_sends WHERE sent_at >= ?")
    .get(sixDaysAgo) as { c: number };
  if (recent.c > 0) return { skipped: "envoi déjà effectué cette semaine" };

  const articles = await getWeekArticles();
  if (articles.length === 0) return { skipped: "aucun article cette semaine" };

  const { siteName } = getSettings();
  const html = await generateDigestHtml(articles);
  return sendNewsletter(`${siteName} — Le digest de la semaine`, html);
}

type DigestArticle = { title: string; excerpt: string; slug: string };

// Édito d'angle de la semaine + un "pourquoi ça compte" par article, généré en un appel.
async function generateEditorial(
  articles: DigestArticle[]
): Promise<{ intro: string; hooks: Record<string, string> }> {
  const fallback = {
    intro: "Les sujets IA qui ont compté cette semaine, et ce qu'ils changent concrètement.",
    hooks: {} as Record<string, string>,
  };
  const key = process.env.MISTRAL_API_KEY;
  if (!key) return fallback;

  try {
    const list = articles
      .map((a, i) => `${i + 1}. [${a.slug}] ${a.title} — ${a.excerpt}`)
      .join("\n");
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "mistral-small-latest",
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [{
          role: "user",
          content: `Tu es le rédacteur en chef d'une newsletter hebdo sur l'IA, en français. Ton : direct, vivant, concret. Pas de formules creuses, pas de superlatifs marketing, pas de "dans un monde où".

À partir des articles de la semaine, renvoie un JSON STRICT :
{"intro": "...", "items": [{"slug": "...", "hook": "..."}]}

- "intro" : 2 ou 3 phrases qui dégagent l'angle de la semaine — ce qui relie ces sujets ou la tendance qui ressort. Une vraie accroche éditoriale, pas un sommaire.
- "hook" : pour chaque article (reprends son slug exact), UNE phrase qui dit ce qu'on y apprend de concret ou pourquoi ça vaut le clic. Surtout pas une reformulation du titre — un angle, une promesse précise.

Articles :
${list}`,
        }],
      }),
    });
    if (!res.ok) return fallback;
    const data = await res.json() as { choices: { message: { content: string } }[] };
    const raw = data.choices[0].message.content.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(raw) as { intro?: string; items?: { slug: string; hook: string }[] };
    const hooks: Record<string, string> = {};
    for (const it of parsed.items ?? []) {
      if (it?.slug && it?.hook) hooks[it.slug] = it.hook;
    }
    return { intro: parsed.intro?.trim() || fallback.intro, hooks };
  } catch {
    return fallback;
  }
}

export async function generateDigestHtml(articles: DigestArticle[], customNote?: string): Promise<string> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { siteName } = getSettings();
  const { intro, hooks } = await generateEditorial(articles);

  const articlesHtml = articles
    .map((a, i) => {
      const why = hooks[a.slug] || a.excerpt;
      const url = `${siteUrl}/articles/${a.slug}`;
      return `
      <tr>
        <td style="padding:22px 0;border-bottom:1px solid #2d3b2c;">
          <span style="font-family:monospace;font-size:12px;color:#c8f54e;letter-spacing:0.05em;">${String(i + 1).padStart(2, "0")}</span>
          <a href="${url}" style="display:block;color:#f0ede4;font-size:19px;font-weight:bold;text-decoration:none;font-family:Georgia,serif;line-height:1.3;margin:6px 0 8px;">${a.title}</a>
          <p style="color:#a9bba6;font-size:14px;margin:0 0 12px;font-family:sans-serif;line-height:1.6;">${why}</p>
          <a href="${url}" style="color:#c8f54e;font-size:13px;font-family:monospace;text-decoration:none;">Lire l'article →</a>
        </td>
      </tr>`;
    })
    .join("");

  const noteHtml = customNote
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr>
        <td style="padding:16px 18px;background:#181e17;border-left:3px solid #c8f54e;">
          <p style="color:#8a9b88;font-size:11px;font-family:monospace;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.1em;">Le mot de la rédaction</p>
          <p style="color:#f0ede4;font-size:14px;line-height:1.6;font-family:sans-serif;margin:0;">${customNote}</p>
        </td></tr></table>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#181e17;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#181e17;">
    <tr><td align="center" style="padding:20px 10px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1d2620;border:2px solid #c8f54e;">
        <tr>
          <td style="padding:32px 32px 24px;border-bottom:2px solid #c8f54e;">
            <span style="font-family:Georgia,serif;font-size:28px;color:#c8f54e;font-weight:bold;">${siteName}</span>
            <p style="color:#8a9b88;font-size:12px;font-family:monospace;margin:4px 0 0;text-transform:uppercase;letter-spacing:0.1em;">Digest hebdomadaire</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 8px;">
            <p style="color:#f0ede4;font-size:16px;line-height:1.7;font-family:Georgia,serif;margin:0 0 24px;">${intro}</p>
            ${noteHtml}
            <table width="100%" cellpadding="0" cellspacing="0">${articlesHtml}</table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;border-top:1px solid #2d3b2c;">
            <p style="color:#4a5c49;font-size:11px;font-family:monospace;margin:0;line-height:1.6;">
              ${siteName} — <a href="${siteUrl}" style="color:#c8f54e;">${siteUrl}</a><br>
              Pour vous désabonner : <a href="${siteUrl}/unsubscribe?token={{token}}" style="color:#4a5c49;">cliquez ici</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
