import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { ImportUrlButton } from "@/components/admin/ImportUrlButton";

export const dynamic = "force-dynamic";

export default function NewArticlePage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Nouvel article</h1>
        <ImportUrlButton />
      </div>
      <ArticleEditor />
    </div>
  );
}
