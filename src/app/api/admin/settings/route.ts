import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSettings, saveSettings, DEFAULT_SETTINGS, type SiteSettings } from "@/lib/settings";

export async function GET() {
  return NextResponse.json(getSettings());
}

export async function PUT(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const partial: Partial<SiteSettings> = {};
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof SiteSettings)[]) {
    if (!(key in body)) continue;
    const def = DEFAULT_SETTINGS[key];
    const value = body[key];
    if (typeof def === "number" && typeof value === "number" && Number.isFinite(value)) {
      (partial[key] as number) = value;
    } else if (typeof def === "boolean" && typeof value === "boolean") {
      (partial[key] as boolean) = value;
    } else if (typeof def === "string" && typeof value === "string") {
      (partial[key] as string) = value.trim();
    }
  }

  saveSettings(partial);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
