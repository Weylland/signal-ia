import { SignJWT, jwtVerify } from "jose";
import { getDb } from "./db";
import { getSettings } from "./settings";
import { getSecret } from "./auth";

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

  // Resend supports batch up to 100 emails
  for (let i = 0; i < subscribers.length; i += 50) {
    const batch = subscribers.slice(i, i + 50);
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
  return { sent, errors };
}

export async function generateDigestHtml(articles: { title: string; excerpt: string; slug: string }[]): Promise<string> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const key = process.env.MISTRAL_API_KEY;
  const { siteName } = getSettings();

  let intro = "Voici les 5 articles IA les plus importants de la semaine.";
  if (key) {
    try {
      const titles = articles.map((a) => `- ${a.title}`).join("\n");
      const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "mistral-small-latest",
          temperature: 0.6,
          messages: [{
            role: "user",
            content: `Écris une intro de 2 phrases pour une newsletter IA hebdomadaire. Ton : informatif, direct, pas de formules. Résume l'ambiance de la semaine basée sur ces titres :\n${titles}\n\nRetourne uniquement les 2 phrases.`,
          }],
        }),
      });
      if (res.ok) {
        const data = await res.json() as { choices: { message: { content: string } }[] };
        intro = data.choices[0].message.content.trim();
      }
    } catch {}
  }

  const articlesHtml = articles
    .map(
      (a) => `
      <tr>
        <td style="padding:16px 0;border-bottom:1px solid #2d3b2c;">
          <a href="${siteUrl}/articles/${a.slug}" style="color:#c8f54e;font-size:18px;font-weight:bold;text-decoration:none;font-family:Georgia,serif;">${a.title}</a>
          <p style="color:#8a9b88;font-size:14px;margin:6px 0 0;font-family:sans-serif;line-height:1.5;">${a.excerpt}</p>
        </td>
      </tr>`
    )
    .join("");

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
          <td style="padding:24px 32px;">
            <p style="color:#f0ede4;font-size:15px;line-height:1.7;font-family:sans-serif;margin:0 0 24px;">${intro}</p>
            <table width="100%" cellpadding="0" cellspacing="0">${articlesHtml}</table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #2d3b2c;">
            <p style="color:#4a5c49;font-size:11px;font-family:monospace;margin:0;">
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
