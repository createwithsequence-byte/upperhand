import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/supabase";
import { generateThreads } from "@/lib/agents/generate-threads";
import { agentErrorResponse } from "@/lib/agent-route";
import { revalidatePath } from "next/cache";
import type { Brand } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { count } = await req.json().catch(() => ({ count: 15 }));
    const supabase = getSupabase();

    const { data: brand, error: brandErr } = await supabase
      .from("brand")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (brandErr)
      return NextResponse.json({ error: brandErr.message }, { status: 500 });
    if (!brand)
      return NextResponse.json(
        { error: "Save your brand first." },
        { status: 400 },
      );
    if (!brand.about || brand.about.length < 50) {
      return NextResponse.json(
        {
          error:
            "Brand 'about' is too short — add a real description (50+ chars) before generating threads.",
        },
        { status: 400 },
      );
    }

    const batchId = randomUUID();
    const candidates = await generateThreads({
      brand: brand as Brand,
      count: typeof count === "number" ? count : 15,
    });

    const ranked = candidates
      .map((c, i) => ({
        brand_id: brand.id,
        ...c,
        score:
          c.seo_potential * 0.4 + c.brand_relevance * 0.5 + (c.wedge ? 1 : 0),
        generation_batch: batchId,
        rank: i + 1,
        status: "pending" as const,
      }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .map((row, i) => ({ ...row, rank: i + 1 }));

    const { data: inserted, error: insertErr } = await supabase
      .from("threads")
      .insert(ranked)
      .select("id");
    if (insertErr)
      return NextResponse.json({ error: insertErr.message }, { status: 500 });

    revalidatePath("/threads");
    return NextResponse.json({
      ok: true,
      batchId,
      count: inserted?.length ?? 0,
    });
  } catch (err) {
    return agentErrorResponse("generate-threads", err);
  }
}
