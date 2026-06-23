import { NextRequest, NextResponse } from "next/server";
import { recordPageView } from "@/lib/analytics";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

  // Garde-fou anti-flood : 120 évènements / minute / IP.
  if (!rateLimit(`track:${ip}`, 120, 60_000)) {
    return NextResponse.json({ ok: true });
  }

  let body: { path?: string; ref?: string | null; lang?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!body?.path || typeof body.path !== "string") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ua = request.headers.get("user-agent") ?? "";
  const country =
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    request.headers.get("x-country") ??
    null;
  const host = request.headers.get("host") ?? "";

  try {
    recordPageView({
      path: body.path,
      ip,
      ua,
      referrer: body.ref ?? null,
      lang: body.lang ?? null,
      country,
      selfHost: host,
    });
  } catch {
    // ne jamais casser la navigation pour de l'analytics
  }

  return NextResponse.json({ ok: true });
}
