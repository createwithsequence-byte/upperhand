import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  fetchArticlesForThread,
  fetchSeoResearchedArticleIds,
  fetchThread,
  fetchThreadPromptUniverse,
} from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SetupNotice } from "../../_components/setup-notice";
import { GenerateArticlesButton } from "./_components/generate-button";
import { RunThreadButton } from "./_components/run-thread-button";
import { ArticleRow } from "./_components/article-row";
import { KeywordResearchPanel } from "./_components/keyword-research";
import { PromptUniversePanel } from "./_components/prompt-universe";
import { BulkSeoButton } from "./_components/bulk-seo-button";
import { DeleteThreadButton } from "./_components/delete-thread-button";

const RESEARCHABLE_STATUSES = [
  "approved",
  "awaiting_human",
  "ready_to_draft",
  "ready_for_qa",
  "ready_for_review",
  "exported",
];

export default async function ThreadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [threadRes, articlesRes, promptUniverseRes] = await Promise.all([
    fetchThread(params.id),
    fetchArticlesForThread(params.id),
    fetchThreadPromptUniverse(params.id),
  ]);

  if (!threadRes.configured) return <SetupNotice />;

  if (!threadRes.data) {
    return (
      <Card className="p-8 max-w-2xl">
        <h2 className="text-lg font-semibold">Thread not found</h2>
        <p className="text-sm text-muted-foreground mt-2">
          No thread with id{" "}
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

  const thread = threadRes.data;
  const researchable = articlesRes.data.filter((a) =>
    RESEARCHABLE_STATUSES.includes(a.status),
  );

  // Determine which articles need SEO research by querying seo_research
  // separately. After the 0005 cleanup migration, the seo_researched_at
  // column no longer exists on articles — the canonical source is the
  // seo_research table.
  const researchedIds = await fetchSeoResearchedArticleIds(
    researchable.map((a) => a.id),
  );
  const needsResearch = researchable.filter(
    (a) => !researchedIds.has(a.id),
  ).length;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Link
          href="/threads"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Threads
        </Link>

        <div className="flex items-start justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              {thread.wedge && (
                <Badge className="bg-orange-600 hover:bg-orange-600 text-[10px] uppercase tracking-wide">
                  Wedge
                </Badge>
              )}
              {!(thread.wedge && thread.angle?.toLowerCase() === "wedge") && (
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase tracking-wide font-normal"
                >
                  {thread.angle}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {thread.title}
            </h1>
            <p className="text-muted-foreground text-balance">
              {thread.description}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <RunThreadButton threadId={thread.id} />
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">
                Or just ideate (no research/draft)
              </summary>
              <div className="mt-2">
                <GenerateArticlesButton threadId={thread.id} />
              </div>
            </details>
          </div>
        </div>
      </div>

      <Card className="p-5 bg-zinc-50 border-zinc-200">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Why this thread
        </p>
        <p className="text-sm leading-relaxed">{thread.reasoning}</p>
      </Card>

      {/* 2.8 — tabbed research surface. Prompt universe (GEO) is the default
          since GEO is the primary brand goal; Keyword universe (SEO) is second. */}
      <Tabs defaultValue="prompts" className="space-y-3">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="prompts">LLM prompts (GEO)</TabsTrigger>
          <TabsTrigger value="keywords">Google keywords (SEO)</TabsTrigger>
        </TabsList>
        <TabsContent value="prompts" className="mt-0">
          <PromptUniversePanel
            threadId={thread.id}
            research={promptUniverseRes.data}
          />
        </TabsContent>
        <TabsContent value="keywords" className="mt-0">
          <KeywordResearchPanel
            threadId={thread.id}
            research={thread.keyword_research}
          />
        </TabsContent>
      </Tabs>

      {articlesRes.data.length === 0 ? (
        <Card className="p-16 text-center">
          <p className="text-muted-foreground">No article ideas yet.</p>
          <p className="text-xs text-muted-foreground mt-3">
            Click <strong>Generate articles</strong> to ideate 6-12 specific
            articles inside this thread.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Articles · {articlesRes.data.length}
            </h2>
            <BulkSeoButton
              threadId={thread.id}
              needsResearch={needsResearch}
              totalResearchable={researchable.length}
            />
          </div>
          {articlesRes.data.map((article) => (
            <ArticleRow
              key={article.id}
              article={article}
              threadTitle={thread.title}
            />
          ))}
        </div>
      )}

      {/* Danger zone — bottom of page, isolated visually so it's not part of
          the main workflow. Cascades wipe all articles + research + drafts. */}
      <div className="pt-12 mt-12 border-t">
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
          Danger zone
        </p>
        <DeleteThreadButton
          threadId={thread.id}
          threadTitle={thread.title}
          articleCount={articlesRes.data.length}
        />
      </div>
    </div>
  );
}
