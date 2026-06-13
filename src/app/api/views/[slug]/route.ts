import { NextRequest, NextResponse } from "next/server";
import { incrementViews } from "@/lib/articles";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const { slug } = await params;
  if (!rateLimit(`view:${ip}:${slug}`, 1, 60 * 60_000)) {
    return NextResponse.json({ ok: true }); // silent ignore, don't expose
  }
  incrementViews(slug);
  return NextResponse.json({ ok: true });
}
