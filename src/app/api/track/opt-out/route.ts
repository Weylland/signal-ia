import { NextRequest, NextResponse } from "next/server";

/**
 * Visite cette URL une fois pour ne plus jamais apparaître dans les Analytics
 * (cookie 1 an). Pratique pour exclure ses propres visites du site public.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const back = url.searchParams.get("back") || "/";
  // request.url reflète l'adresse interne du conteneur derrière le reverse-proxy
  // (ex. localhost:8080) : on redirige toujours vers le domaine public.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = NextResponse.redirect(new URL(back, siteUrl));
  res.cookies.set("wia_notrack", "1", {
    maxAge: 365 * 24 * 3600,
    path: "/",
    sameSite: "lax",
  });
  return res;
}
