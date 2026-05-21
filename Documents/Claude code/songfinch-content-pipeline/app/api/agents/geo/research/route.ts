import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { researchArticleGeo } from "@/lib/agents/geo/research-article";
import { agentErrorResponse } from "@/lib/agent-route";
import { trackAgentRun } from "@/lib/agent-runs";
import { revalidatePath } from "next/cache";
import type { Article, Brand, Thread } from "@/lib/types";

export const maxDuration = 180;

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

    const result = await trackAgentRun(
      {
        agent: "research-geo",
        articleId: article_id,
        threadId: (thread as Thread).id,
        model: "gemini-2.5-flash",
      },
      async () => {
        const r = await researchArticleGeo({
          brand: brand as Brand,
          thread: thread as Thread,
          article: article as Article,
        });
        return { value: r };
      },
    );

    const { error: upsertErr } = await supabase.from("geo_research").upsert({
      article_id,
      target_prompts: result.target_prompts,
      target_llms: ["chatgpt", "perplexity", "gemini", "claude"],
      competitor_citations: result.competitor_citations,
      citation_strategy: result.citation_strategy,
      researched_at: new Date().toISOString(),
    });
    if (upsertErr)
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });

    revalidatePath(`/article/${article_id}`);
    return NextResponse.json({
      ok: true,
      primary_prompt: result.target_prompts.find((p) => p.weight === "primary")
        ?.prompt,
      competitors: result.competitor_citations.length,
    });
  } catch (err) {
    return agentErrorResponse("geo/research", err);
  }
}
