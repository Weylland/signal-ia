import { NextRequest, NextResponse } from "next/server";
import { incrementViews } from "@/lib/articles";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  incrementViews(slug);
  return NextResponse.json({ ok: true });
}
