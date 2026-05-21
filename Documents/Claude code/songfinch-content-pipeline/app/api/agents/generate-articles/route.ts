import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/supabase";
import { generateArticles } from "@/lib/agents/generate-articles";
import { agentErrorResponse } from "@/lib/agent-route";
import { revalidatePath } from "next/cache";
import type { Brand, Thread } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { thread_id, count } = await req.json();
    if (!thread_id)
      return NextResponse.json(
        { error: "thread_id required" },
        { status: 400 },
      );

    const supabase = getSupabase();

    const { data: thread, error: threadErr } = await supabase
      .from("threads")
      .select("*")
      .eq("id", thread_id)
      .maybeSingle();
    if (threadErr)
      return NextResponse.json({ error: threadErr.message }, { status: 500 });
    if (!thread)
      return NextResponse.json({ error: "thread not found" }, { status: 404 });
    if (thread.status !== "approved") {
      return NextResponse.json(
        { error: "Approve the thread first." },
        { status: 400 },
      );
    }

    const { data: brand, error: brandErr } = await supabase
      .from("brand")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (brandErr || !brand)
      return NextResponse.json({ error: "Brand not found" }, { status: 400 });

    const batchId = randomUUID();
    const ideas = await generateArticles({
      brand: brand as Brand,
      thread: thread as Thread,
      count: typeof count === "number" ? count : 8,
    });

    const rows = ideas
      .map((idea, i) => ({
        thread_id,
        ...idea,
        score: idea.geo_potential,
        rank: i + 1,
        status: "idea" as const,
        generation_batch: batchId,
      }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .map((row, i) => ({ ...row, rank: i + 1 }));

    const { data: inserted, error: insertErr } = await supabase
      .from("articles")
      .insert(rows)
      .select("id");
    if (insertErr)
      return NextResponse.json({ error: insertErr.message }, { status: 500 });

    revalidatePath(`/threads/${thread_id}`);
    return NextResponse.json({
      ok: true,
      batchId,
      count: inserted?.length ?? 0,
    });
  } catch (err) {
    return agentErrorResponse("generate-articles", err);
  }
}
