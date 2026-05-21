import Link from "next/link";
import { Card } from "@/components/ui/card";
import { fetchArticle } from "@/lib/data";
import { SetupNotice } from "../../_components/setup-notice";
import { ArticleWorkspace } from "./workspace";

export default async function ArticlePage({
  params,
}: {
  params: { id: string };
}) {
  const { data, configured, error } = await fetchArticle(params.id);
  if (!configured) return <SetupNotice />;

  if (error) {
    return (
      <Card className="p-8 max-w-2xl border-destructive/40 bg-destructive/5">
        <h2 className="text-lg font-semibold">Error loading article</h2>
        <p className="text-sm text-destructive mt-2">{error}</p>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="p-8 max-w-2xl">
        <h2 className="text-lg font-semibold">Article not found</h2>
        <p className="text-sm text-muted-foreground mt-2">
          No article with id{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-xs">
            {params.id}
          </code>
          .{" "}
          <Link href="/threads" className="underline">
            Back to threads →
          </Link>
        </p>
      </Card>
    );
  }

  return (
    <ArticleWorkspace
      article={data.article}
      thread={data.thread}
      seo={data.seo}
      geo={data.geo}
    />
  );
}
