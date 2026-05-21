import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { agentErrorResponse } from "@/lib/agent-route";
import { runMonitorPrompt } from "@/lib/agents/monitor/run-prompt";
import { analyzeMention } from "@/lib/agents/monitor/analyze-mention";
import { revalidatePath } from "next/cache";
import type { Brand } from "@/lib/types";

export const maxDuration = 120;

/**
 * One-off monitor run — prompt is supplied inline, not tied to a saved
 * monitor_prompts row. Useful for ad-hoc checks: "what do LLMs say about
 * Songfinch right now?" without committing to a recurring cadence.
 *
 * Still writes to monitor_runs so it shows up in the timeline.
 */
export async function POST(req: Request) {
  try {
    const { prompt, brand_aliases } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "prompt required" }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: brand } = await supabase
      .from("brand")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (!brand)
      return NextResponse.json({ error: "Brand not found" }, { status: 400 });

    // Step 1 — run the prompt against Gemini with grounding
    const { response_text } = await runMonitorPrompt({ prompt: prompt.trim() });

    // Step 2 — analyze the response for brand + framing
    const analysis = await analyzeMention({
      responseText: response_text,
      brandName: (brand as Brand).name,
      brandAliases: Array.isArray(brand_aliases) ? brand_aliases : [],
    });

    // Persist as a monitor_runs row, prompt_id null (one-off, not saved)
    const { data: inserted, error } = await supabase
      .from("monitor_runs")
      .insert({
        prompt_id: null,
        llm: "gemini",
        response_text,
        brand_mentioned: analysis.brand_mentioned,
        brand_position: analysis.brand_position,
        framing: analysis.framing,
        competitors_mentioned: analysis.competitors_mentioned,
      })
      .select("id")
      .single();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    revalidatePath("/monitor");
    return NextResponse.json({
      ok: true,
      run_id: inserted.id,
      brand_mentioned: analysis.brand_mentioned,
      brand_position: analysis.brand_position,
      framing: analysis.framing,
      competitors_mentioned: analysis.competitors_mentioned,
    });
  } catch (err) {
    return agentErrorResponse("monitor/run-single", err);
  }
}
