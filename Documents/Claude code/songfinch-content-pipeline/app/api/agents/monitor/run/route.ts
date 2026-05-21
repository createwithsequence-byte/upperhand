import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { runMonitorPrompt } from "@/lib/agents/monitor/run-prompt";
import { analyzeMention } from "@/lib/agents/monitor/analyze-mention";
import { agentErrorResponse } from "@/lib/agent-route";
import { revalidatePath } from "next/cache";
import type { Brand } from "@/lib/types";

export const maxDuration = 300;

const CONCURRENCY = 3;

/**
 * Batch monitor run — for every active monitor_prompt, run against Gemini and
 * analyze the mention. Uses Promise.allSettled with concurrency 3 to respect
 * Gemini Flash's 250K input tokens/min budget. Returns a summary of what ran
 * + what failed. The /monitor page reads monitor_runs to show the timeline.
 */
export async function POST() {
  try {
    const supabase = getSupabase();

    const { data: brand } = await supabase
      .from("brand")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (!brand)
      return NextResponse.json({ error: "Brand not found" }, { status: 400 });

    const { data: prompts, error: promptsErr } = await supabase
      .from("monitor_prompts")
      .select("*")
      .eq("active", true);
    if (promptsErr)
      return NextResponse.json({ error: promptsErr.message }, { status: 500 });
    if (!prompts || prompts.length === 0) {
      return NextResponse.json({
        ok: true,
        ran: 0,
        failed: 0,
        message: "No active prompts to run.",
      });
    }

    const brandName = (brand as Brand).name;
    let cursor = 0;
    let ran = 0;
    let failed = 0;
    const errors: string[] = [];

    const runOne = async (p: (typeof prompts)[0]) => {
      try {
        // Step 1 — fire prompt at Gemini with grounding
        const { response_text } = await runMonitorPrompt({ prompt: p.prompt });

        // Step 2 — analyze for brand mention
        const analysis = await analyzeMention({
          responseText: response_text,
          brandName,
          brandAliases: [],
        });

        // Persist + bump last_run_at on the prompt
        const { error: insertErr } = await supabase
          .from("monitor_runs")
          .insert({
            prompt_id: p.id,
            llm: "gemini",
            response_text,
            brand_mentioned: analysis.brand_mentioned,
            brand_position: analysis.brand_position,
            framing: analysis.framing,
            competitors_mentioned: analysis.competitors_mentioned,
          });
        if (insertErr) throw new Error(insertErr.message);

        await supabase
          .from("monitor_prompts")
          .update({ last_run_at: new Date().toISOString() })
          .eq("id", p.id);

        ran++;
      } catch (err) {
        failed++;
        errors.push(
          `${p.prompt.slice(0, 60)}…: ${err instanceof Error ? err.message : "unknown"}`,
        );
      }
    };

    // Bounded-concurrency worker pool — same pattern as bulk SEO research.
    const workers: Promise<void>[] = [];
    const next = async () => {
      while (cursor < prompts.length) {
        const i = cursor++;
        await runOne(prompts[i]);
      }
    };
    for (let i = 0; i < Math.min(CONCURRENCY, prompts.length); i++) {
      workers.push(next());
    }
    await Promise.all(workers);

    revalidatePath("/monitor");
    return NextResponse.json({
      ok: true,
      ran,
      failed,
      total: prompts.length,
      errors: errors.slice(0, 5),
    });
  } catch (err) {
    return agentErrorResponse("monitor/run", err);
  }
}
