import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { researchSeo } from "@/lib/agents/seo/research-article";
import { revalidatePath } from "next/cache";
import type { Article, Brand, Thread } from "@/lib/types";

export const maxDuration = 600;

// Statuses where SEO research is meaningful (article idea is committed enough to warrant analysis)
const RESEARCHABLE_STATUSES = [
  "approved",
  "awaiting_human",
  "ready_to_draft",
  "ready_for_qa",
  "ready_for_review",
  "exported",
];

const CONCURRENCY = 3;

async function chunked<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    // Use allSettled so a single failure doesn't sink the whole batch
    const settled = await Promise.allSettled(chunk.map(fn));
    for (const r of settled) {
      if (r.status === "fulfilled") results.push(r.value);
    }
  }
  return results;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { thread_id, article_ids, force } = body as {
    thread_id?: string;
    article_ids?: string[];
    force?: boolean;
  };

  if (!thread_id && (!article_ids || article_ids.length === 0)) {
    return NextResponse.json(
      { error: "Provide thread_id or article_ids" },
      { status: 400 },
    );
  }

  const supabase = getSupabase();

  // Fetch brand once — it's shared across all articles
  const { data: brand } = await supabase
    .from("brand")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (!brand)
    return NextResponse.json({ error: "Brand not found" }, { status: 400 });

  // Resolve which articles to research
  let articlesQuery = supabase
    .from("articles")
    .select("*")
    .in("status", RESEARCHABLE_STATUSES);

  if (thread_id) articlesQuery = articlesQuery.eq("thread_id", thread_id);
  if (article_ids && article_ids.length > 0)
    articlesQuery = articlesQuery.in("id", article_ids);

  const { data: articles, error: articlesErr } = await articlesQuery;
  if (articlesErr)
    return NextResponse.json({ error: articlesErr.message }, { status: 500 });

  // Filter out already-researched articles unless force=true. Previously this
  // was a single `is("seo_researched_at", null)` on articles, but that column
  // was dropped in 0005 — now we query seo_research separately and exclude
  // article_ids that already have a row.
  let articlesToResearch = articles ?? [];
  if (!force && articlesToResearch.length > 0) {
    const { data: existing } = await supabase
      .from("seo_research")
      .select("article_id")
      .in(
        "article_id",
        articlesToResearch.map((a) => a.id),
      );
    const alreadyResearched = new Set(
      (existing ?? []).map((r) => r.article_id as string),
    );
    articlesToResearch = articlesToResearch.filter(
      (a) => !alreadyResearched.has(a.id),
    );
  }
  if (articlesToResearch.length === 0) {
    return NextResponse.json({
      ok: true,
      count: 0,
      researched: 0,
      message: force
        ? "No researchable articles found."
        : "Every researchable article already has SEO data. Pass force=true to refresh.",
    });
  }

  // Fetch all unique threads referenced by these articles
  const threadIds = Array.from(
    new Set(articlesToResearch.map((a) => a.thread_id)),
  );
  const { data: threads, error: threadsErr } = await supabase
    .from("threads")
    .select("*")
    .in("id", threadIds);
  if (threadsErr)
    return NextResponse.json({ error: threadsErr.message }, { status: 500 });

  const threadById = new Map<string, Thread>(
    (threads ?? []).map((t) => [t.id, t as Thread]),
  );

  // Run research in chunks
  let succeeded = 0;
  let failed = 0;

  await chunked(
    articlesToResearch as Article[],
    async (article) => {
      const thread = threadById.get(article.thread_id);
      if (!thread) {
        failed++;
        return;
      }
      try {
        const result = await researchSeo({
          brand: brand as Brand,
          thread,
          article,
        });
        // Write to seo_research (the canonical SEO table after 0005 cleanup).
        const { error } = await supabase.from("seo_research").upsert(
          {
            article_id: article.id,
            serp_top10: result.serp_analysis.top_results,
            serp_features: result.serp_analysis.serp_features,
            search_intent: result.serp_analysis.intent_classification,
            search_volume_estimate: result.search_volume_estimate,
            keyword_difficulty: result.keyword_difficulty,
            volume_tier: result.volume_tier,
            ranking_strategy: result.ranking_strategy,
            researched_at: new Date().toISOString(),
          },
          { onConflict: "article_id" },
        );
        if (error) {
          console.error("[research-seo-bulk] upsert failed", article.id, error);
          failed++;
          return;
        }
        succeeded++;
      } catch (err) {
        console.error("[research-seo-bulk] agent failed", article.id, err);
        failed++;
      }
    },
    CONCURRENCY,
  );

  // Revalidate every touched thread + the /articles index
  for (const tid of threadIds) revalidatePath(`/threads/${tid}`);
  revalidatePath("/articles");

  return NextResponse.json({
    ok: true,
    count: articles.length,
    researched: succeeded,
    failed,
  });
}
