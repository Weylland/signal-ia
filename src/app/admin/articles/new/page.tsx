import { AdminBar } from "@/components/admin/AdminBar";
import { ArticleEditor } from "@/components/admin/ArticleEditor";

export const dynamic = "force-dynamic";

export default function NewArticlePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <AdminBar title="Nouvel article" />
      <ArticleEditor />
    </div>
  );
}
