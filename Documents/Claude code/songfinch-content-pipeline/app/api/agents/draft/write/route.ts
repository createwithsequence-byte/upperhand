import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { writeDraft } from "@/lib/agents/draft/write-draft";
import { agentErrorResponse } from "@/lib/agent-route";
import { revalidatePath } from "next/cache";
import type {
  Article,
  Brand,
  BriefJson,
  ReferenceExample,
  Thread,
} from "@/lib/types";

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
    if (article.status !== "ready_to_draft") {
      return NextResponse.json(
        {
          error:
            "Article must be in 'ready_to_draft' status (fill all human input slots first).",
        },
        { status: 400 },
      );
    }

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
    const { data: references } = await supabase
      .from("reference_examples")
      .select("*");

    if (!thread || !brand)
      return NextResponse.json(
        { error: "brand or thread missing" },
        { status: 400 },
      );

    const draft = await writeDraft({
      brand: brand as Brand,
      thread: thread as Thread,
      article: article as Article,
      brief: article.brief_json as BriefJson,
      humanInputs: (article.human_inputs as Record<string, string>) ?? {},
      references: (references as ReferenceExample[]) ?? [],
    });

    const { error: updateErr } = await supabase
      .from("articles")
      .update({
        markdown: draft.markdown,
        schema_json: draft.schema_json,
        social_cuts: draft.social_cuts,
        status: "ready_for_qa",
      })
      .eq("id", article_id);
    if (updateErr)
      return NextResponse.json({ error: updateErr.message }, { status: 500 });

    revalidatePath(`/article/${article_id}`);
    return NextResponse.json({
      ok: true,
      wordCount: draft.markdown.split(/\s+/).length,
    });
  } catch (err) {
    return agentErrorResponse("write-draft", err);
  }
}
