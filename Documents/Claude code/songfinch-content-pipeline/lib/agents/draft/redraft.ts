import "server-only";
import { generateText } from "ai";
import { models, VOICE_RULES_PROMPT } from "../../ai";
import { loadPrompt } from "../../prompts";
import type { Article, Brand, QaResult, ReferenceExample } from "../../types";

/**
 * Redraft agent — second-pass writer that takes the previous draft + QA
 * verdict and rewrites the article, fixing the specific issues called out.
 *
 * Why a separate agent (not just calling auto-draft again):
 *   - Different prompt structure: redraft INCLUDES the previous text + QA
 *     failures inline. Auto-draft writes from scratch.
 *   - Different temperature: redraft uses 0.55 (more conservative) so the
 *     model doesn't drift off the existing structure. Auto-draft uses 0.75.
 *   - Different output expectations: keep article structure (H2s, FAQ), fix
 *     issues. Not "write something new."
 *
 * Returns the full text (not streamed). The orchestrator calls this in
 * series with QA — no need for streaming UI here.
 */
export async function redraft({
  brand,
  article,
  references,
  previousDraft,
  previousQa,
}: {
  brand: Brand;
  article: Article;
  references: ReferenceExample[];
  previousDraft: string;
  previousQa: QaResult;
}): Promise<{ text: string; promptHash: string }> {
  // Static blocks (same shape as auto-draft for cache reuse)
  const emulate = references
    .filter((r) => r.voice_type === "emulate")
    .map(
      (r, i) =>
        `### Example ${i + 1}: ${r.title}\n\n${r.excerpt}\n\n_Notes: ${r.notes ?? ""}_`,
    )
    .join("\n\n---\n\n");

  const avoid = references
    .filter((r) => r.voice_type === "avoid")
    .map((r) => `- ${r.title}: ${r.notes ?? ""}`)
    .join("\n");

  const impacts = brand.customer_impact
    .filter((c) => c.situation?.trim() && c.how_brand_helps?.trim())
    .map((c) => `- ${c.situation} → ${c.how_brand_helps}`)
    .join("\n");

  // ---- QA feedback blocks ----

  const bannedPhrasesBlock = previousQa.banned_phrase_hits.length
    ? previousQa.banned_phrase_hits
        .map((b) => `- "${b.phrase}" — found in: ${b.context}`)
        .join("\n")
    : "(none)";

  const brandDriftBlock = previousQa.brand_drift_notes.length
    ? previousQa.brand_drift_notes.map((d) => `- ${d}`).join("\n")
    : "(none)";

  const orphanClaimsBlock = previousQa.orphan_claim_issues.length
    ? previousQa.orphan_claim_issues
        .map((o) => `- ${o.section}: ${o.reason}`)
        .join("\n")
    : "(none)";

  const cadenceIssuesBlock = previousQa.cadence_issues.length
    ? previousQa.cadence_issues
        .map((c) => `- Paragraph ${c.paragraph_index + 1}: ${c.reason}`)
        .join("\n")
    : "(none)";

  const factCheckBlock = previousQa.fact_check_flags.length
    ? previousQa.fact_check_flags
        .map((f) => `- "${f.claim}" — ${f.reason}`)
        .join("\n")
    : "(none)";

  const suggestedFixesBlock = previousQa.suggested_fixes.length
    ? previousQa.suggested_fixes.map((s, i) => `${i + 1}. ${s}`).join("\n")
    : "(none)";

  const { text: prompt, hash: promptHash } = loadPrompt("draft/redraft", {
    brand_name: brand.name,
    brand_about: brand.about,
    impacts_block: impacts || "(none defined)",
    voice_rules: VOICE_RULES_PROMPT,
    emulate_block: emulate,
    avoid_block: avoid,
    target_query: article.target_query,
    article_title: article.title,
    previous_draft: previousDraft,
    previous_score: previousQa.score.toFixed(2),
    banned_phrases_block: bannedPhrasesBlock,
    brand_drift_block: brandDriftBlock,
    orphan_claims_block: orphanClaimsBlock,
    cadence_issues_block: cadenceIssuesBlock,
    fact_check_block: factCheckBlock,
    suggested_fixes_block: suggestedFixesBlock,
  });

  const result = await generateText({
    model: models.smart,
    prompt,
    // Lower temperature than auto-draft (0.75) — we want adherence to the
    // fixes, not new creative wandering.
    temperature: 0.55,
    maxOutputTokens: 8192,
  });

  return { text: result.text, promptHash };
}
