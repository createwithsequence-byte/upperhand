import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { fetchAllArticles, fetchThreads } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SetupNotice } from "../_components/setup-notice";
import { STATUS_LABEL } from "@/lib/article-status";
import type { Article, ArticleStatus, Thread } from "@/lib/types";

const STATUSES: ArticleStatus[] = [
  "approved",
  "awaiting_human",
  "ready_to_draft",
  "drafting",
  "ready_for_qa",
  "ready_for_review",
  "exported",
];

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  const status = STATUSES.includes(searchParams?.status as ArticleStatus)
    ? (searchParams!.status as ArticleStatus)
    : undefined;

  // Fetch ALL articles regardless of filter, plus threads. We apply the filter
  // client-side so each thread group can collapse to a one-line "no articles
  // in this stage" message instead of disappearing entirely.
  const [articlesRes, threadsRes] = await Promise.all([
    fetchAllArticles(),
    fetchThreads(),
  ]);
  if (!articlesRes.configured) return <SetupNotice />;

  const allArticles = articlesRes.data;
  const threads = threadsRes.data;

  // Index articles by thread_id, dropping threads with zero articles entirely.
  const byThread = new Map<string, Article[]>();
  for (const a of allArticles) {
    const list = byThread.get(a.thread_id) ?? [];
    list.push(a);
    byThread.set(a.thread_id, list);
  }

  // Thread groups, sorted by most recently updated article (proxy for "thread
  // activity"). Threads with no articles are excluded entirely — we don't
  // need empty headers cluttering the page.
  const threadGroups = threads
    .filter((t) => byThread.has(t.id))
    .map((t) => {
      const list = byThread.get(t.id) ?? [];
      const lastUpdated = list.reduce<string>(
        (acc, a) => (a.updated_at > acc ? a.updated_at : acc),
        "",
      );
      return { thread: t, articles: list, lastUpdated };
    })
    .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));

  // Orphan articles — threads that no longer exist (shouldn't happen with FK
  // cascades, but defensive).
  const orphans: Article[] = [];
  for (const a of allArticles) {
    if (!threads.some((t) => t.id === a.thread_id)) orphans.push(a);
  }

  const filteredCount = status
    ? allArticles.filter((a) => a.status === status).length
    : allArticles.length;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Articles</h1>
        <p className="text-muted-foreground max-w-xl">
          All articles in flight across every thread. Filter by stage to see
          what needs your attention.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/articles"
          className={`px-3 py-1 rounded-md border transition-colors ${
            !status
              ? "bg-zinc-950 text-white border-zinc-950"
              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
          }`}
        >
          all · {allArticles.length}
        </Link>
        {STATUSES.map((s) => {
          const count = allArticles.filter((a) => a.status === s).length;
          return (
            <Link
              key={s}
              href={`/articles?status=${s}`}
              className={`px-3 py-1 rounded-md border transition-colors capitalize ${
                status === s
                  ? "bg-zinc-950 text-white border-zinc-950"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
              }`}
            >
              {STATUS_LABEL[s]} · {count}
            </Link>
          );
        })}
      </div>

      {articlesRes.error && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {articlesRes.error}
        </Card>
      )}

      {allArticles.length === 0 ? (
        <Card className="p-16 text-center">
          <p className="text-muted-foreground">No articles yet.</p>
          <p className="text-xs text-muted-foreground mt-3">
            Approve a thread, then generate articles inside it.{" "}
            <Link href="/threads" className="underline">
              Threads →
            </Link>
          </p>
        </Card>
      ) : status && filteredCount === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground text-sm">
            No articles in{" "}
            <Badge variant="outline">{STATUS_LABEL[status]}</Badge> across any
            thread.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {threadGroups.map(({ thread, articles }) => (
            <ThreadGroup
              key={thread.id}
              thread={thread}
              articles={articles}
              filterStatus={status}
            />
          ))}
          {orphans.length > 0 && (
            <OrphanGroup orphans={orphans} filterStatus={status} />
          )}
        </div>
      )}
    </div>
  );
}

function ThreadGroup({
  thread,
  articles,
  filterStatus,
}: {
  thread: Thread;
  articles: Article[];
  filterStatus?: ArticleStatus;
}) {
  const filtered = filterStatus
    ? articles.filter((a) => a.status === filterStatus)
    : articles;

  // Status breakdown for the header (always reflects all articles, not the
  // filtered subset — gives the full picture of the thread).
  const breakdown = articles.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});
  const breakdownText = Object.entries(breakdown)
    .map(([s, n]) => `${n} ${STATUS_LABEL[s as ArticleStatus] ?? s}`)
    .join(" · ");

  return (
    <details open className="group">
      <summary className="cursor-pointer list-none">
        <div className="flex items-center justify-between gap-4 py-3 px-4 -mx-4 rounded-lg hover:bg-muted/40 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-0 -rotate-90" />
            <div className="space-y-0.5 min-w-0">
              <h2 className="font-semibold tracking-tight truncate">
                {thread.title}
              </h2>
              <p className="text-xs text-muted-foreground tabular-nums">
                {articles.length}{" "}
                {articles.length === 1 ? "article" : "articles"} ·{" "}
                {breakdownText}
              </p>
            </div>
          </div>
          <Link
            href={`/threads/${thread.id}`}
            className="text-xs text-muted-foreground hover:text-foreground shrink-0"
          >
            Open thread →
          </Link>
        </div>
      </summary>

      <div className="pl-8 pr-1 mt-2 space-y-2">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-3 px-4">
            No articles in {STATUS_LABEL[filterStatus as ArticleStatus]} for
            this thread.
          </p>
        ) : (
          filtered.map((article) => (
            <ArticleListRow
              key={article.id}
              article={article}
              threadTitle={thread.title}
            />
          ))
        )}
      </div>
    </details>
  );
}

function OrphanGroup({
  orphans,
  filterStatus,
}: {
  orphans: Article[];
  filterStatus?: ArticleStatus;
}) {
  const filtered = filterStatus
    ? orphans.filter((a) => a.status === filterStatus)
    : orphans;
  if (filtered.length === 0) return null;
  return (
    <details open className="group">
      <summary className="cursor-pointer list-none">
        <div className="flex items-center gap-3 py-3 px-4 -mx-4 rounded-lg bg-amber-50">
          <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-0 -rotate-90" />
          <div>
            <h2 className="font-semibold tracking-tight text-amber-900">
              Articles without a thread
            </h2>
            <p className="text-xs text-amber-900/70">
              {filtered.length} orphaned
            </p>
          </div>
        </div>
      </summary>
      <div className="pl-8 pr-1 mt-2 space-y-2">
        {filtered.map((a) => (
          <ArticleListRow key={a.id} article={a} threadTitle="(no thread)" />
        ))}
      </div>
    </details>
  );
}

function ArticleListRow({
  article,
  threadTitle,
}: {
  article: Article;
  threadTitle: string;
}) {
  return (
    <Link href={`/article/${article.id}`} className="block">
      <Card className="p-4 transition-all hover:shadow-md hover:border-zinc-300 cursor-pointer">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            {/* Thread context label per 1.3 — appears above the title on every article row. */}
            <p className="text-[10px] uppercase tracking-wide font-medium text-muted-foreground truncate">
              {threadTitle} · {article.format} · {STATUS_LABEL[article.status]}
            </p>
            <h3 className="font-medium leading-tight truncate">
              {article.title}
            </h3>
            <p className="text-xs font-mono text-muted-foreground truncate">
              {article.target_query}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>
      </Card>
    </Link>
  );
}
