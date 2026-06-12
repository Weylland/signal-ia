import { notFound } from "next/navigation";
import { getArticle } from "@/lib/articles";
import { AdminBar } from "@/components/admin/AdminBar";
import { ArticleEditor } from "@/components/admin/ArticleEditor";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
}: PageProps<"/admin/articles/[slug]">) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <AdminBar title="Éditer l'article" />
      <ArticleEditor
        slug={slug}
        initial={{
          title: article.title,
          excerpt: article.excerpt,
          tags: article.tags,
          image: article.image,
          markdown: article.markdown,
        }}
      />
    </div>
  );
}
