import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { expandKeywords } from "@/lib/agents/seo/expand-keywords";
import { agentErrorResponse } from "@/lib/agent-route";
import { revalidatePath } from "next/cache";
import type { Brand, Thread } from "@/lib/types";

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const { thread_id, count } = await req.json();
    if (!thread_id)
      return NextResponse.json(
        { error: "thread_id required" },
        { status: 400 },
      );

    const supabase = getSupabase();

    const { data: thread } = await supabase
      .from("threads")
      .select("*")
      .eq("id", thread_id)
      .maybeSingle();
    if (!thread)
      return NextResponse.json({ error: "thread not found" }, { status: 404 });

    const { data: brand } = await supabase
      .from("brand")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (!brand)
      return NextResponse.json({ error: "Brand not found" }, { status: 400 });

    const result = await expandKeywords({
      brand: brand as Brand,
      thread: thread as Thread,
      count: typeof count === "number" ? count : 25,
    });

    const { error: updateErr } = await supabase
      .from("threads")
      .update({ keyword_research: result })
      .eq("id", thread_id);
    if (updateErr)
      return NextResponse.json({ error: updateErr.message }, { status: 500 });

    revalidatePath(`/threads/${thread_id}`);
    return NextResponse.json({
      ok: true,
      count: result.keywords.length,
      high_volume: result.keywords.filter((k) => k.volume_tier === "high")
        .length,
    });
  } catch (err) {
    return agentErrorResponse("expand-keywords", err);
  }
}
