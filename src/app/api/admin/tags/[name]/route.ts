import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { renameTag, deleteTag } from "@/lib/articles";

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/admin/tags/[name]">) {
  const { name } = await ctx.params;
  let body: { name?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "Nouveau nom obligatoire" }, { status: 400 });
  }

  try {
    await renameTag(decodeURIComponent(name), body.name);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur" },
      { status: 400 }
    );
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/admin/tags/[name]">) {
  const { name } = await ctx.params;
  await deleteTag(decodeURIComponent(name));
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
