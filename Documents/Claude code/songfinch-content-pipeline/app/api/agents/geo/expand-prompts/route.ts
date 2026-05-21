import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { expandPrompts } from "@/lib/agents/geo/expand-prompts";
import { agentErrorResponse } from "@/lib/agent-route";
import { revalidatePath } from "next/cache";
import type { Brand, Thread } from "@/lib/types";

export const maxDuration = 180;

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

    const result = await expandPrompts({
      brand: brand as Brand,
      thread: thread as Thread,
      count: typeof count === "number" ? count : 25,
    });

    const { error: upsertErr } = await supabase
      .from("thread_prompt_universe")
      .upsert({
        thread_id,
        prompts: result.prompts,
        researched_at: new Date().toISOString(),
      });
    if (upsertErr)
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });

    revalidatePath(`/threads/${thread_id}`);
    return NextResponse.json({
      ok: true,
      count: result.prompts.length,
      transactional: result.prompts.filter((p) => p.intent === "transactional")
        .length,
      comparative: result.prompts.filter((p) => p.intent === "comparative")
        .length,
    });
  } catch (err) {
    return agentErrorResponse("geo/expand-prompts", err);
  }
}
