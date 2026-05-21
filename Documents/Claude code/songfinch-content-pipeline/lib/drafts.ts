import "server-only";
import { getSupabase } from "./supabase";
import type { BriefJson, QaResult } from "./types";

/**
 * Helpers for the article_drafts table — versioned draft history.
 *
 * Pattern: when an agent route generates a new draft, it calls
 * `saveDraftVersion()`. That picks the next version number for this
 * article, inserts a row, and (importantly) ALSO updates articles.markdown
 * so the workspace renders the latest without joining tables. The
 * historical rows in article_drafts are read-only after insert.
 *
 * Why dual-write: keeping articles.markdown as the "current draft" makes
 * reads fast and avoids changing the workspace component. The versioned
 * history is additive — you can ignore it if you don't care, or query it
 * to render a diff/compare view.
 */

export type DraftRow = {
  id: string;
  article_id: string;
  version: number;
  markdown: string;
  schema_json: Record<string, unknown> | null;
  social_cuts: BriefJson["social_cuts"] | null;
  qa_result: QaResult | null;
  agent: "auto-draft" | "write-draft" | "manual";
  prompt_hash: string | null;
  created_at: string;
};

export type SaveDraftInput = {
  articleId: string;
  markdown: string;
  schemaJson?: Record<string, unknown> | null;
  socialCuts?: BriefJson["social_cuts"] | null;
  qaResult?: QaResult | null;
  agent: "auto-draft" | "write-draft" | "manual";
  promptHash?: string | null;
};

/**
 * Persists a new draft version + updates the article's current-draft
 * columns. Returns the new version number.
 *
 * If two callers race for the same article_id, the second insert will fail
 * the unique constraint — caller can retry with the updated version.
 * For the current single-user setup this race is effectively impossible
 * (Greg clicks one button at a time), but the constraint protects us if
 * we add scheduled bulk drafts.
 */
export async function saveDraftVersion(
  input: SaveDraftInput,
): Promise<{ ok: true; version: number } | { ok: false; error: string }> {
  const supabase = getSupabase();

  // Pick the next version number. RACE WINDOW: if two saves run in parallel
  // for the same article they could both read max=N and both try to insert
  // version N+1. The unique constraint catches it; the loser would need to
  // retry. For now we just trust the single-user case.
  const { data: latest, error: maxErr } = await supabase
    .from("article_drafts")
    .select("version")
    .eq("article_id", input.articleId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (maxErr) {
    return {
      ok: false,
      error: `next-version lookup failed: ${maxErr.message}`,
    };
  }
  const nextVersion = (latest?.version ?? 0) + 1;

  // Insert versioned row.
  const { error: insertErr } = await supabase.from("article_drafts").insert({
    article_id: input.articleId,
    version: nextVersion,
    markdown: input.markdown,
    schema_json: input.schemaJson ?? null,
    social_cuts: input.socialCuts ?? null,
    qa_result: input.qaResult ?? null,
    agent: input.agent,
    prompt_hash: input.promptHash ?? null,
  });
  if (insertErr) {
    return { ok: false, error: `draft insert failed: ${insertErr.message}` };
  }

  // Mirror current draft onto articles.* for fast reads.
  const { error: updateErr } = await supabase
    .from("articles")
    .update({
      markdown: input.markdown,
      schema_json: input.schemaJson ?? null,
      social_cuts: input.socialCuts ?? null,
      // qa_result is left to the caller (auto-draft sets it after QA runs;
      // write-draft doesn't run QA so it stays null until the user clicks).
    })
    .eq("id", input.articleId);
  if (updateErr) {
    return {
      ok: false,
      error: `current-draft mirror failed: ${updateErr.message}`,
    };
  }

  return { ok: true, version: nextVersion };
}

/**
 * Fetches all drafts for an article, newest first. Used by the workspace's
 * future "draft history" panel.
 */
export async function fetchDraftHistory(
  articleId: string,
): Promise<DraftRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("article_drafts")
    .select("*")
    .eq("article_id", articleId)
    .order("version", { ascending: false });
  if (error) {
    console.warn("[fetchDraftHistory]", error);
    return [];
  }
  return (data as DraftRow[]) ?? [];
}

/**
 * Patches the qa_result on a specific draft version. Called by the
 * auto-draft route after auto-QA completes — the draft was already
 * inserted before QA ran, so we update that row in place.
 */
export async function patchDraftQa(
  articleId: string,
  version: number,
  qaResult: QaResult,
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("article_drafts")
    .update({ qa_result: qaResult })
    .eq("article_id", articleId)
    .eq("version", version);
  if (error) console.warn("[patchDraftQa]", error);
}
