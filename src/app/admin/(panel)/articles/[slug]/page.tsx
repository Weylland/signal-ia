import { notFound } from "next/navigation";
import { getArticle } from "@/lib/articles";
import { ArticleEditor } from "@/components/admin/ArticleEditor";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
}: PageProps<"/admin/articles/[slug]">) {
  const { slug } = await params;
  const article = await getArticle(slug, { includeDrafts: true });
  if (!article) notFound();

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold">Editer l&apos;article</h1>
      <ArticleEditor
        slug={slug}
        initial={{
          title: article.title,
          excerpt: article.excerpt,
          tags: article.tags,
          image: article.image,
          html: article.html,
          published: article.published,
          type: article.type,
          tldr: article.tldr,
          scheduledAt: article.scheduledAt,
        }}
      />
    </div>
  );
}