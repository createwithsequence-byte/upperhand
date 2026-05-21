import { getSupabase } from "@/lib/supabase";
import { agentErrorResponse } from "@/lib/agent-route";
import { streamAutoDraft } from "@/lib/agents/draft/auto-draft";
import { extractDraftStructure } from "@/lib/agents/draft/write-draft";
import { runQa } from "@/lib/agents/draft/run-qa";
import { withRetry } from "@/lib/llm-retry";
import { saveDraftVersion, patchDraftQa } from "@/lib/drafts";
import type { SeoResearchRow, GeoResearchRow } from "@/lib/data";
import { revalidatePath } from "next/cache";
import type {
  Article,
  Brand,
  BriefJson,
  ReferenceExample,
  Thread,
} from "@/lib/types";

export const maxDuration = 300;

/**
 * Path A auto-draft pipeline. Skips the brief + human-input ceremony. Inputs:
 * an article row created from an approved keyword. Outputs: streamed Markdown
 * + persisted schema_json + social_cuts. QA still runs but is fired separately
 * by the client (or as a follow-up call).
 *
 * Response: text stream of Markdown. After stream finishes, onFinish runs
 * server-side to extract structure + persist + revalidate. The client should
 * call /api/agents/run-qa-stream once this stream completes.
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
    // Auto-draft is allowed at any pre-draft status. If you've already drafted,
    // use /api/agents/write-draft-stream instead (which respects the brief).
    if (article.markdown) {
      return Response.json(
        {
          error:
            "Article already has a draft. Use the regular write-draft endpoint to revise.",
        },
        { status: 400 },
      );
    }

    // Parallel fetch — thread + brand + references + the research data the
    // draft prompt now consumes (seo_research, geo_research, plus the
    // thread's keyword_research universe).
    const [threadRes, brandRes, referencesRes, seoRes, geoRes] =
      await Promise.all([
        supabase
          .from("threads")
          .select("*")
          .eq("id", article.thread_id)
          .maybeSingle(),
        supabase.from("brand").select("*").limit(1).maybeSingle(),
        supabase.from("reference_examples").select("*"),
        supabase
          .from("seo_research")
          .select("*")
          .eq("article_id", article_id)
          .maybeSingle(),
        supabase
          .from("geo_research")
          .select("*")
          .eq("article_id", article_id)
          .maybeSingle(),
      ]);

    const thread = threadRes.data;
    const brand = brandRes.data;
    const references = referencesRes.data;

    if (!thread || !brand) {
      return Response.json(
        { error: "brand or thread missing" },
        { status: 400 },
      );
    }

    // Mark as drafting so other browsers / refreshes see the in-flight state.
    await supabase
      .from("articles")
      .update({ status: "drafting" })
      .eq("id", article_id);

    const result = streamAutoDraft({
      brand: brand as Brand,
      thread: thread as Thread,
      article: article as Article,
      references: (references as ReferenceExample[]) ?? [],
      // New: research context. Standalone auto-draft (workspace button) now
      // gets the same research-informed prompt as the assembly line. If the
      // article has no research yet, the agent degrades gracefully.
      seo: (seoRes.data as SeoResearchRow | null) ?? null,
      geo: (geoRes.data as GeoResearchRow | null) ?? null,
      keywordUniverse:
        (thread.keyword_research as {
          keywords?: Array<{
            keyword: string;
            volume_tier: string;
            intent: string;
          }>;
        } | null) ?? null,
      onFinish: async ({ text, promptHash }) => {
        try {
          // Best-effort structure extraction. If it fails, save the markdown
          // anyway so Greg doesn't lose the draft.
          let schema_json: Record<string, unknown> | null = null;
          let social_cuts: BriefJson["social_cuts"] | null = null;
          try {
            // Wrap in withRetry — this call hit Gemini 503 overload during
            // smoke testing. The AI SDK retries 3x internally with short
            // backoff; this wrapper adds 2 more outer retries with longer
            // (4s, 8s) backoff that gives the spike time to clear.
            const structured = await withRetry(
              () =>
                extractDraftStructure({
                  brand: brand as Brand,
                  article: article as Article,
                  brief: {
                    title_options: [(article as Article).title],
                    meta_description: text.slice(0, 155),
                    h1: (article as Article).title,
                    h2_outline: [],
                    direct_answer: text.split("\n\n")[0] ?? "",
                    faq: [],
                    human_input_slots: [],
                    schema_recommendation: "Article + FAQPage",
                    internal_links: [],
                    social_cuts: { linkedin: "", twitter: "", instagram: "" },
                  },
                  markdown: text,
                }),
              { tries: 2, backoffMs: 4000 },
            );
            schema_json = structured.schema_json;
            social_cuts = structured.social_cuts;
          } catch (extractErr) {
            console.warn(
              "[auto-draft] structure extraction failed (incl. retries), saving markdown only",
              extractErr,
            );
          }

          // Persist as a new versioned draft AND mirror to articles.markdown
          // for fast workspace reads. The draft history (article_drafts) is
          // append-only; the articles row reflects the latest version.
          const saveResult = await saveDraftVersion({
            articleId: article_id,
            markdown: text,
            schemaJson: schema_json,
            socialCuts: social_cuts,
            agent: "auto-draft",
            promptHash,
          });
          if (!saveResult.ok) {
            console.error(
              "[auto-draft] persist failed",
              article_id,
              saveResult.error,
            );
            revalidatePath(`/article/${article_id}`);
            revalidatePath(`/threads/${(thread as Thread).id}`);
            revalidatePath("/articles");
            return;
          }
          const draftVersion = saveResult.version;

          // Bump status separately — saveDraftVersion only touches content
          // columns. Status is part of the state machine, not the draft.
          await supabase
            .from("articles")
            .update({ status: "ready_for_qa" })
            .eq("id", article_id);

          // Auto-run QA. Greg's Path A spec says "automatically turned into
          // full articles (without em dashes)" — QA is what enforces the
          // em-dash + voice rules. Running it inline here means the article
          // lands in ready_for_review (or stays in ready_for_qa if it fails)
          // without an extra click.
          try {
            const articleWithDraft: Article = {
              ...(article as Article),
              markdown: text,
            };
            const qa = await withRetry(
              () =>
                runQa({
                  brand: brand as Brand,
                  article: articleWithDraft,
                  references: (references as ReferenceExample[]) ?? [],
                }),
              { tries: 2, backoffMs: 4000 },
            );
            const nextStatus = qa.passed ? "ready_for_review" : "ready_for_qa";
            await supabase
              .from("articles")
              .update({ qa_result: qa, status: nextStatus })
              .eq("id", article_id);
            // Also patch the draft history row so the per-version QA is
            // queryable for compare views. Fire-and-forget; if it fails the
            // current-draft qa_result on articles still works.
            await patchDraftQa(article_id, draftVersion, qa).catch((err) =>
              console.warn("[auto-draft] patchDraftQa failed", err),
            );
          } catch (qaErr) {
            console.warn(
              "[auto-draft] auto-QA failed (incl. retries), leaving article in ready_for_qa",
              qaErr,
            );
          }

          revalidatePath(`/article/${article_id}`);
          revalidatePath(`/threads/${(thread as Thread).id}`);
          revalidatePath("/articles");
        } catch (err) {
          console.error("[auto-draft] onFinish error", err);
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (err) {
    return agentErrorResponse("auto-draft", err);
  }
}
