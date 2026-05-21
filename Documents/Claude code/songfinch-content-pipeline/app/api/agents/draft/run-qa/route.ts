import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { runQa } from "@/lib/agents/draft/run-qa";
import { agentErrorResponse } from "@/lib/agent-route";
import { trackAgentRun } from "@/lib/agent-runs";
import { revalidatePath } from "next/cache";
import type { Article, Brand, ReferenceExample } from "@/lib/types";

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
        { error: "No draft to QA. Generate the draft first." },
        { status: 400 },
      );
    }

    const { data: brand } = await supabase
      .from("brand")
      .select("*")
      .limit(1)
      .maybeSingle();
    const { data: references } = await supabase
      .from("reference_examples")
      .select("*");
    if (!brand)
      return NextResponse.json({ error: "Brand not found" }, { status: 400 });

    const result = await trackAgentRun(
      {
        agent: "run-qa",
        articleId: article_id,
        threadId: (article as Article).thread_id,
        model: "gemini-2.5-flash",
      },
      async () => {
        const r = await runQa({
          brand: brand as Brand,
          article: article as Article,
          references: (references as ReferenceExample[]) ?? [],
        });
        return { value: r };
      },
    );

    const nextStatus = result.passed ? "ready_for_review" : "ready_for_qa";

    const { error: updateErr } = await supabase
      .from("articles")
      .update({ qa_result: result, status: nextStatus })
      .eq("id", article_id);
    if (updateErr)
      return NextResponse.json({ error: updateErr.message }, { status: 500 });

    revalidatePath(`/article/${article_id}`);
    return NextResponse.json({
      ok: true,
      passed: result.passed,
      score: result.score,
    });
  } catch (err) {
    return agentErrorResponse("run-qa", err);
  }
}
