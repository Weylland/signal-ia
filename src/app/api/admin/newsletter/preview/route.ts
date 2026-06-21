import { NextRequest, NextResponse } from "next/server";
import { generateDigestHtml } from "@/lib/newsletter";

export async function POST(req: NextRequest) {
  const { articles, customNote } = await req.json() as {
    articles: { title: string; excerpt: string; slug: string }[];
    customNote?: string;
  };
  const html = await generateDigestHtml(articles, customNote);
  return NextResponse.json({ html });
}
