import { NextRequest, NextResponse } from "next/server";
import { generateDigestHtml } from "@/lib/newsletter";

export async function POST(req: NextRequest) {
  const { articles } = await req.json() as { articles: { title: string; excerpt: string; slug: string }[] };
  const html = await generateDigestHtml(articles);
  return NextResponse.json({ html });
}
