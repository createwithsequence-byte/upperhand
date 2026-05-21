import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { scoreGeoChecklist } from "@/lib/agents/geo/score-checklist";
import { agentErrorResponse } from "@/lib/agent-route";
import { trackAgentRun } from "@/lib/agent-runs";
import { revalidatePath } from "next/cache";
import type { Article, Brand } from "@/lib/types";

export const maxDuration = 90;

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
    if (!article.markdown) {
      return NextResponse.json(
        { error: "No draft to score. Generate the draft first." },
        { status: 400 },
      );
    }

    const { data: brand } = await supabase
      .from("brand")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (!brand)
      return NextResponse.json({ error: "Brand not found" }, { status: 400 });

    const checklist = await trackAgentRun(
      {
        agent: "score-checklist",
        articleId: article_id,
        threadId: (article as Article).thread_id,
        model: "gemini-2.5-flash",
      },
      async () => {
        const c = await scoreGeoChecklist({
          brand: brand as Brand,
          article: article as Article,
        });
        return { value: c };
      },
    );

    // Merge into existing geo_research row (or create one) — we don't want to
    // wipe target_prompts / competitor_citations / citation_strategy.
    const { data: existing } = await supabase
      .from("geo_research")
      .select("article_id")
      .eq("article_id", article_id)
      .maybeSingle();

    if (existing) {
      const { error: updateErr } = await supabase
        .from("geo_research")
        .update({ citation_checklist: checklist })
        .eq("article_id", article_id);
      if (updateErr)
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
    } else {
      const { error: insertErr } = await supabase
        .from("geo_research")
        .insert({ article_id, citation_checklist: checklist });
      if (insertErr)
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    revalidatePath(`/article/${article_id}`);
    return NextResponse.json({
      ok: true,
      scores: {
        named_entities: checklist.named_entities.score,
        structured_claims: checklist.structured_claims.score,
        anecdotal_specificity: checklist.anecdotal_specificity.score,
        schema_markup: checklist.schema_markup.score,
        brand_name_density: checklist.brand_name_density.score,
      },
    });
  } catch (err) {
    return agentErrorResponse("geo/score", err);
  }
}
