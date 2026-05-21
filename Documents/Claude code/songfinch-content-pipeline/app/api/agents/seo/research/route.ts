import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { researchSeo } from "@/lib/agents/seo/research-article";
import { agentErrorResponse } from "@/lib/agent-route";
import { trackAgentRun } from "@/lib/agent-runs";
import { revalidatePath } from "next/cache";
import type { Article, Brand, Thread } from "@/lib/types";

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const { article_id } = await req.json();
    if (!article_id)
      return NextResponse.json(
        { error: "article_id required" },
        { status: 400 },
      );

    const supabase = getSupabase();

    const { data: article } = await supabase
      .from("articles")
      .select("*")
      .eq("id", article_id)
      .maybeSingle();
    if (!article)
      return NextResponse.json({ error: "article not found" }, { status: 404 });

    const { data: thread } = await supabase
      .from("threads")
      .select("*")
      .eq("id", article.thread_id)
      .maybeSingle();
    const { data: brand } = await supabase
      .from("brand")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (!brand || !thread)
      return NextResponse.json(
        { error: "brand or thread missing" },
        { status: 400 },
      );

    // Wrap the agent call so each invocation gets a row in agent_runs.
    // The dashboard reads this for cost + reliability stats.
    const result = await trackAgentRun(
      {
        agent: "research-seo",
        articleId: article_id,
        threadId: (thread as Thread).id,
        model: "gemini-2.5-flash",
      },
      async () => {
        const r = await researchSeo({
          brand: brand as Brand,
          thread: thread as Thread,
          article: article as Article,
        });
        // researchSeo doesn't yet expose token counts. When we add usage
        // capture in the agent function, return them here for cost tracking.
        return { value: r };
      },
    );

    // Canonical write target: seo_research (one row per article, upsert).
    // The legacy articles.* mirror was removed in migration 0005 (2.10 cleanup).
    const { error: upsertErr } = await supabase.from("seo_research").upsert(
      {
        article_id,
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
    if (upsertErr)
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });

    revalidatePath(`/article/${article_id}`);
    return NextResponse.json({
      ok: true,
      volume_tier: result.volume_tier,
      difficulty: result.keyword_difficulty,
      competitors: result.serp_analysis.top_results.length,
    });
  } catch (err) {
    return agentErrorResponse("research-seo", err);
  }
}
