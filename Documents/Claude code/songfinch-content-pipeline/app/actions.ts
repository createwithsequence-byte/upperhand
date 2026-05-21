"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";
import { validateTransition } from "@/lib/article-status";
import type {
  ActionResult,
  ArticleStatus,
  Brand,
  CustomerImpact,
  Persona,
  ThreadStatus,
} from "@/lib/types";

// ---------- Brand ----------

export async function saveBrand(input: {
  name: string;
  about: string;
  personas: Persona[];
  customer_impact: CustomerImpact[];
}): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = getSupabase();
    const { data: existing } = await supabase
      .from("brand")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabase
        .from("brand")
        .update(input)
        .eq("id", existing.id);
      if (error) return { ok: false, error: error.message };
      revalidatePath("/");
      revalidatePath("/threads");
      revalidatePath("/articles");
      revalidatePath("/schedule");
      return { ok: true, data: { id: existing.id } };
    } else {
      const { data, error } = await supabase
        .from("brand")
        .insert(input)
        .select("id")
        .single();
      if (error) return { ok: false, error: error.message };
      revalidatePath("/");
      revalidatePath("/threads");
      revalidatePath("/articles");
      revalidatePath("/schedule");
      return { ok: true, data: { id: data.id } };
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown error",
    };
  }
}

// ---------- Threads ----------

export async function setThreadStatus(
  id: string,
  status: ThreadStatus,
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = getSupabase();
    const patch: Record<string, unknown> = { status };
    if (status === "approved") patch.approved_at = new Date().toISOString();
    const { error } = await supabase.from("threads").update(patch).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/threads");
    return { ok: true, data: { id } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown error",
    };
  }
}

export async function deleteAllPendingThreads(): Promise<
  ActionResult<{ count: number }>
> {
  try {
    const supabase = getSupabase();
    const { error, count } = await supabase
      .from("threads")
      .delete({ count: "exact" })
      .eq("status", "pending");
    if (error) return { ok: false, error: error.message };
    revalidatePath("/threads");
    return { ok: true, data: { count: count ?? 0 } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown error",
    };
  }
}

// ---------- Keywords → Auto-draft (Path A) ----------

type KeywordToArticleInput = {
  keyword: string;
  intent?: string;
  volume_tier?: "high" | "medium" | "low" | null;
  search_volume_estimate?: number | null;
  difficulty?: number | null;
  note?: string;
};

/**
 * Path A entry point: turn N approved keywords from a thread into N article
 * rows in status='drafting'. The client then fires /api/agents/draft/auto-draft for
 * each returned article ID (with concurrency 3 to respect Gemini rate limits).
 *
 * Articles created here intentionally have NO brief and NO human inputs — the
 * auto-draft path skips both. Voice fidelity comes from voice rules + reference
 * exemplars + the auto QA pass.
 */
export async function approveKeywordsAsArticles(
  threadId: string,
  keywords: KeywordToArticleInput[],
): Promise<ActionResult<{ articleIds: string[]; count: number }>> {
  try {
    if (!Array.isArray(keywords) || keywords.length === 0) {
      return { ok: false, error: "No keywords provided" };
    }
    const supabase = getSupabase();

    // Build article rows from keywords. Title defaults to a polished version of
    // the keyword (capitalize first word, leave the rest lowercase) — the
    // draft agent can refine further inside the prose.
    const titleFor = (k: string) =>
      k.charAt(0).toUpperCase() + k.slice(1).toLowerCase();

    const rows = keywords.map((k) => ({
      thread_id: threadId,
      title: titleFor(k.keyword),
      target_query: k.keyword.toLowerCase().trim(),
      format: "explainer" as const,
      reasoning: k.note ?? "Approved from keyword universe",
      geo_potential:
        k.volume_tier === "high" ? 9 : k.volume_tier === "medium" ? 6 : 4,
      status: "drafting" as const,
      search_volume_estimate: k.search_volume_estimate ?? null,
      keyword_difficulty: k.difficulty ?? null,
      volume_tier: k.volume_tier ?? null,
      approved_at: new Date().toISOString(),
    }));

    const { data: inserted, error } = await supabase
      .from("articles")
      .insert(rows)
      .select("id");
    if (error) return { ok: false, error: error.message };

    revalidatePath(`/threads/${threadId}`);
    revalidatePath("/articles");

    return {
      ok: true,
      data: {
        articleIds: (inserted ?? []).map((r) => r.id),
        count: inserted?.length ?? 0,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown error",
    };
  }
}

// ---------- Articles ----------

export async function setArticleStatus(
  id: string,
  status: ArticleStatus,
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = getSupabase();

    // Validate the transition against the state machine before writing.
    // Catches bugs like "approving an exported article" or "skipping straight
    // from idea to ready_for_review."
    const { data: existing } = await supabase
      .from("articles")
      .select("status")
      .eq("id", id)
      .maybeSingle();
    if (!existing) return { ok: false, error: "Article not found" };

    const transitionError = validateTransition(
      existing.status as ArticleStatus,
      status,
    );
    if (transitionError) {
      return { ok: false, error: transitionError };
    }

    const patch: Record<string, unknown> = { status };
    if (status === "approved") patch.approved_at = new Date().toISOString();
    if (status === "exported") patch.exported_at = new Date().toISOString();
    const { error } = await supabase
      .from("articles")
      .update(patch)
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/articles");
    revalidatePath(`/article/${id}`);
    return { ok: true, data: { id } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown error",
    };
  }
}

export async function scheduleArticle(
  id: string,
  date: string | null,
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("articles")
      .update({ scheduled_for: date })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/schedule");
    revalidatePath(`/article/${id}`);
    return { ok: true, data: { id } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown error",
    };
  }
}

export async function bulkScheduleArticles(
  ids: string[],
  startDate: string,
  cadenceDays: number,
  committedAngle?: string,
): Promise<ActionResult<{ count: number }>> {
  try {
    const supabase = getSupabase();
    const start = new Date(startDate);
    const updates = ids.map((id, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i * cadenceDays);
      return supabase
        .from("articles")
        .update({
          scheduled_for: date.toISOString().slice(0, 10),
          ...(committedAngle ? { committed_angle: committedAngle } : {}),
        })
        .eq("id", id);
    });
    const results = await Promise.all(updates);
    const firstError = results.find((r) => r.error);
    if (firstError?.error)
      return { ok: false, error: firstError.error.message };
    revalidatePath("/schedule");
    return { ok: true, data: { count: ids.length } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown error",
    };
  }
}

export async function saveArticleHumanInputs(
  id: string,
  inputs: Record<string, string>,
): Promise<ActionResult<{ status: ArticleStatus }>> {
  try {
    const supabase = getSupabase();
    const { data: existing, error: readErr } = await supabase
      .from("articles")
      .select("brief_json, status")
      .eq("id", id)
      .maybeSingle();
    if (readErr) return { ok: false, error: readErr.message };
    if (!existing) return { ok: false, error: "article not found" };

    const slots =
      (existing.brief_json as { human_input_slots?: { key: string }[] } | null)
        ?.human_input_slots ?? [];
    const allFilled =
      slots.length > 0 &&
      slots.every((s) => (inputs[s.key] ?? "").trim().length > 0);

    let nextStatus: ArticleStatus = existing.status as ArticleStatus;
    if (
      nextStatus === "awaiting_human" ||
      nextStatus === "ready_to_draft" ||
      nextStatus === "approved"
    ) {
      nextStatus = allFilled ? "ready_to_draft" : "awaiting_human";
    }

    const { error } = await supabase
      .from("articles")
      .update({ human_inputs: inputs, status: nextStatus })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/article/${id}`);
    return { ok: true, data: { status: nextStatus } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown error",
    };
  }
}

// ---------- Destructive actions ----------
//
// All deletes rely on the `on delete cascade` foreign keys set up in the
// migrations:
//   threads → articles → seo_research / geo_research / article_drafts / agent_runs
//   threads → thread_prompt_universe
//
// So deleting a thread row wipes everything downstream automatically. No
// manual cascade logic needed here.

/**
 * Delete one thread + everything below it (articles, research, drafts,
 * agent_runs for those articles, prompt_universe).
 */
export async function deleteThread(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from("threads").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/threads");
    revalidatePath("/");
    return { ok: true, data: { id } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown error",
    };
  }
}

/**
 * Delete one article + its research + draft history.
 */
export async function deleteArticle(
  id: string,
): Promise<ActionResult<{ id: string; threadId: string | null }>> {
  try {
    const supabase = getSupabase();
    // Capture thread_id BEFORE delete so we can redirect to the thread page.
    const { data: existing } = await supabase
      .from("articles")
      .select("thread_id")
      .eq("id", id)
      .maybeSingle();
    const threadId = existing?.thread_id ?? null;

    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/");
    if (threadId) revalidatePath(`/threads/${threadId}`);
    return { ok: true, data: { id, threadId } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown error",
    };
  }
}

/**
 * Nuclear option — wipe ALL content (threads, articles, research, drafts,
 * agent_runs) while preserving brand, reference_examples, monitor_prompts.
 *
 * Type-to-confirm guard: caller must pass the literal string
 * "DELETE EVERYTHING" or the action no-ops. Defense against accidental
 * fires from a malformed client call.
 */
export async function clearAllContent(
  confirmation: string,
): Promise<ActionResult<{ threadsDeleted: number; runsDeleted: number }>> {
  if (confirmation !== "DELETE EVERYTHING") {
    return {
      ok: false,
      error:
        "Confirmation phrase didn't match. Type DELETE EVERYTHING exactly.",
    };
  }
  try {
    const supabase = getSupabase();

    // agent_runs has nullable article_id / thread_id, so cascades won't
    // necessarily clear it. Wipe it explicitly first.
    const { error: runsErr, count: runsCount } = await supabase
      .from("agent_runs")
      .delete({ count: "exact" })
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (runsErr) return { ok: false, error: runsErr.message };

    // Now the big one — deleting threads cascades to everything else
    const { error: threadsErr, count: threadsCount } = await supabase
      .from("threads")
      .delete({ count: "exact" })
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (threadsErr) return { ok: false, error: threadsErr.message };

    revalidatePath("/");
    revalidatePath("/threads");
    revalidatePath("/brand");

    return {
      ok: true,
      data: {
        threadsDeleted: threadsCount ?? 0,
        runsDeleted: runsCount ?? 0,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown error",
    };
  }
}
