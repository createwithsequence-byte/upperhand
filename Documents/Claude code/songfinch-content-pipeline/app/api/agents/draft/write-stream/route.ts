import { getSupabase } from "@/lib/supabase";
import {
  extractDraftStructure,
  streamDraft,
} from "@/lib/agents/draft/write-draft";
import { revalidatePath } from "next/cache";
import type {
  Article,
  Brand,
  BriefJson,
  ReferenceExample,
  Thread,
} from "@/lib/types";

export const maxDuration = 300;

// Pre-flight check that responds with a JSON error if anything's missing,
// before we open the stream. Streaming a JSON error mid-flight is uglier UX
// than a clean 400/404 up front.
async function loadContext(article_id: string) {
  const supabase = getSupabase();

  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("id", article_id)
    .maybeSingle();
  if (!article) return { error: "article not found", status: 404 as const };
  if (article.status !== "ready_to_draft") {
    return {
      error:
        "Article must be in 'ready_to_draft' status (fill all human input slots first).",
      status: 400 as const,
    };
  }
  if (!article.brief_json) {
    return { error: "Article has no brief yet", status: 400 as const };
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

  if (!thread || !brand) {
    return { error: "brand or thread missing", status: 400 as const };
  }

  return {
    article: article as Article,
    thread: thread as Thread,
    brand: brand as Brand,
    brief: article.brief_json as BriefJson,
    references: (references as ReferenceExample[]) ?? [],
    supabase,
  };
}

export async function POST(req: Request) {
  const { article_id } = await req.json();
  if (!article_id) {
    return Response.json({ error: "article_id required" }, { status: 400 });
  }

  const ctx = await loadContext(article_id);
  if ("error" in ctx) {
    return Response.json({ error: ctx.error }, { status: ctx.status });
  }

  const { brand, thread, article, brief, references, supabase } = ctx;

  // Flip status to 'drafting' so the UI shows accurate state during the stream
  await supabase
    .from("articles")
    .update({ status: "drafting" })
    .eq("id", article_id);

  const result = streamDraft({
    brand,
    thread,
    article,
    brief,
    humanInputs: (article.human_inputs as Record<string, string>) ?? {},
    references,
    onFinish: async ({ text }) => {
      try {
        const structured = await extractDraftStructure({
          brand,
          article,
          brief,
          markdown: text,
        });
        const { error } = await supabase
          .from("articles")
          .update({
            markdown: text,
            schema_json: structured.schema_json,
            social_cuts: structured.social_cuts,
            status: "ready_for_qa",
          })
          .eq("id", article_id);
        if (error) {
          console.error(
            "[write-draft-stream] persist failed",
            article_id,
            error,
          );
        }
      } catch (err) {
        console.error(
          "[write-draft-stream] extract structure failed",
          article_id,
          err,
        );
        // Even if structure extraction fails, save the markdown so Greg
        // doesn't lose the draft
        await supabase
          .from("articles")
          .update({ markdown: text, status: "ready_for_qa" })
          .eq("id", article_id);
      }
      revalidatePath(`/article/${article_id}`);
    },
  });

  return result.toTextStreamResponse();
}
