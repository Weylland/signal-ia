import { NextRequest, NextResponse } from "next/server";
import { sendNewsletter } from "@/lib/newsletter";

export async function POST(req: NextRequest) {
  const { subject, html } = await req.json() as { subject: string; html: string };
  if (!subject || !html) return NextResponse.json({ error: "Sujet et contenu requis" }, { status: 400 });

  try {
    const result = await sendNewsletter(subject, html);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
