import { NextRequest, NextResponse } from "next/server";
import { postCustomTweet } from "@/lib/x";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as
    | { text?: string; cardTitle?: string; tag?: string; link?: string; dryRun?: boolean }
    | null;
  if (!body || typeof body.text !== "string") {
    return NextResponse.json({ error: "texte requis" }, { status: 400 });
  }
  try {
    const result = await postCustomTweet({
      text: body.text,
      cardTitle: body.cardTitle,
      tag: body.tag,
      link: body.link,
      dryRun: Boolean(body.dryRun),
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
