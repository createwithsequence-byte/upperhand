import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { agentErrorResponse } from "@/lib/agent-route";
import { revalidatePath } from "next/cache";

// CRUD for saved monitor prompts.

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("monitor_prompts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, prompts: data ?? [] });
  } catch (err) {
    return agentErrorResponse("monitor/prompts:GET", err);
  }
}

export async function POST(req: Request) {
  try {
    const { prompt, cadence_days } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "prompt required" }, { status: 400 });
    }
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("monitor_prompts")
      .insert({
        prompt: prompt.trim(),
        cadence_days: typeof cadence_days === "number" ? cadence_days : 7,
      })
      .select("*")
      .single();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    revalidatePath("/monitor");
    return NextResponse.json({ ok: true, prompt: data });
  } catch (err) {
    return agentErrorResponse("monitor/prompts:POST", err);
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, prompt, active, cadence_days } = await req.json();
    if (!id)
      return NextResponse.json({ error: "id required" }, { status: 400 });
    const supabase = getSupabase();
    const patch: Record<string, unknown> = {};
    if (typeof prompt === "string") patch.prompt = prompt.trim();
    if (typeof active === "boolean") patch.active = active;
    if (typeof cadence_days === "number") patch.cadence_days = cadence_days;
    if (Object.keys(patch).length === 0)
      return NextResponse.json({ error: "nothing to update" }, { status: 400 });
    const { error } = await supabase
      .from("monitor_prompts")
      .update(patch)
      .eq("id", id);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    revalidatePath("/monitor");
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return agentErrorResponse("monitor/prompts:PATCH", err);
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id)
      return NextResponse.json({ error: "id required" }, { status: 400 });
    const supabase = getSupabase();
    const { error } = await supabase
      .from("monitor_prompts")
      .delete()
      .eq("id", id);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    revalidatePath("/monitor");
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return agentErrorResponse("monitor/prompts:DELETE", err);
  }
}
