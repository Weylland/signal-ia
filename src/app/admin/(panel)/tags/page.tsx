import { getAllTags } from "@/lib/articles";
import { TagManager } from "@/components/admin/TagManager";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
  const tags = await getAllTags({ includeDrafts: true });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Tags</h1>
      <p className="mt-2 text-sm text-ink/60">
        Renommer un tag le met à jour sur tous les articles. Supprimer un tag le retire des
        articles sans les supprimer.
      </p>
      <div className="mt-6 max-w-2xl">
        <TagManager tags={tags} />
      </div>
    </div>
  );
}
