import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { buildBrief } from "@/lib/agents/draft/build-brief";
import { agentErrorResponse } from "@/lib/agent-route";
import { revalidatePath } from "next/cache";
import type { Article, Brand, Thread } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { article_id } = await req.json();
    if (!article_id)
      return NextResponse.json(
        { error: "article_id required" },
        { status: 400 },
      );

    const supabase = getSupabase();

    const { data: article, error: articleErr } = await supabase
      .from("articles")
      .select("*")
      .eq("id", article_id)
      .maybeSingle();
    if (articleErr)
      return NextResponse.json({ error: articleErr.message }, { status: 500 });
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
    if (!thread || !brand)
      return NextResponse.json(
        { error: "brand or thread missing" },
        { status: 400 },
      );

    const brief = await buildBrief({
      brand: brand as Brand,
      thread: thread as Thread,
      article: article as Article,
    });

    const { error: updateErr } = await supabase
      .from("articles")
      .update({ brief_json: brief, status: "awaiting_human" })
      .eq("id", article_id);
    if (updateErr)
      return NextResponse.json({ error: updateErr.message }, { status: 500 });

    revalidatePath(`/article/${article_id}`);
    return NextResponse.json({
      ok: true,
      slots: brief.human_input_slots.length,
    });
  } catch (err) {
    return agentErrorResponse("build-brief", err);
  }
}
