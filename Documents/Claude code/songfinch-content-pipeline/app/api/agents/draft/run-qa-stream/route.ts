import { getSupabase } from "@/lib/supabase";
import { agentErrorResponse } from "@/lib/agent-route";
import {
  assembleQaResult,
  runDeterministicPhase,
  streamQaJudgment,
  type LlmJudgment,
} from "@/lib/agents/draft/run-qa";
import { revalidatePath } from "next/cache";
import type { Article, Brand, ReferenceExample } from "@/lib/types";

export const maxDuration = 180;

/**
 * Newline-delimited JSON stream. Each line is a status object:
 *   { phase: "deterministic", deterministic }       — emitted instantly so the
 *     client shows banned phrases / cadence flags before the LLM call starts
 *   { phase: "llm", judgment }                       — emitted N times as the
 *     model fills in fields one at a time
 *   { phase: "complete", qa_result }                 — final assembled QaResult
 *     with passed/score; same shape that's persisted to DB
 *   { phase: "error", error }                        — emitted if any step
 *     throws mid-stream; client should surface and stop
 */
export async function POST(req: Request) {
  try {
    const { article_id } = await req.json();
    if (!article_id) {
      return Response.json({ error: "article_id required" }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: article } = await supabase
      .from("articles")
      .select("*")
      .eq("id", article_id)
      .maybeSingle();
    if (!article) {
      return Response.json({ error: "article not found" }, { status: 404 });
    }
    if (!article.markdown) {
      return Response.json(
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
    if (!brand) {
      return Response.json({ error: "Brand not found" }, { status: 400 });
    }

    // Phase 1 — instant, deterministic.
    const deterministic = runDeterministicPhase(
      brand as Brand,
      article as Article,
    );

    // Phase 2 — streaming LLM judgment.
    const result = streamQaJudgment({
      brand: brand as Brand,
      article: article as Article,
      references: (references as ReferenceExample[]) ?? [],
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: unknown) => {
          controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
        };

        try {
          // First line — deterministic results so the client can render
          // banned-phrase and cadence flags immediately.
          send({ phase: "deterministic", deterministic });

          // Stream partial LLM judgments as they come.
          for await (const partial of result.partialObjectStream) {
            send({ phase: "llm", judgment: partial });
          }

          // Final object — fully validated against the schema.
          const finalJudgment = (await result.object) as LlmJudgment;
          const finalQa = assembleQaResult(
            brand as Brand,
            deterministic,
            finalJudgment,
          );

          // Persist and notify the client.
          const nextStatus = finalQa.passed
            ? "ready_for_review"
            : "ready_for_qa";
          const { error: updateErr } = await supabase
            .from("articles")
            .update({ qa_result: finalQa, status: nextStatus })
            .eq("id", article_id);
          if (updateErr) {
            console.error("[run-qa-stream] persist failed", updateErr);
            send({
              phase: "error",
              error: `Persist failed: ${updateErr.message}`,
            });
          } else {
            revalidatePath(`/article/${article_id}`);
            send({ phase: "complete", qa_result: finalQa });
          }
        } catch (err) {
          console.error("[run-qa-stream] mid-stream error", err);
          const message = err instanceof Error ? err.message : String(err);
          send({ phase: "error", error: message.slice(0, 300) });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "content-type": "application/x-ndjson; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    return agentErrorResponse("run-qa-stream", err);
  }
}
