import { NextRequest, NextResponse } from "next/server";

/** Annule l'opt-out : retire le cookie wia_notrack pour redevenir tracké. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const back = url.searchParams.get("back") || "/";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = NextResponse.redirect(new URL(back, siteUrl));
  res.cookies.delete("wia_notrack");
  return res;
}
