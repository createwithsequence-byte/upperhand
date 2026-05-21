import "server-only";
import { generateObject, streamObject } from "ai";
import { z } from "zod";
import { findBannedPhrases, models, VOICE_RULES_PROMPT } from "../../ai";
import { loadPrompt } from "../../prompts";
import type { Article, Brand, QaResult, ReferenceExample } from "../../types";

export const llmJudgmentSchema = z.object({
  voice_match_score: z
    .number()
    .min(1)
    .max(10)
    .describe("10 = pure emulate, 1 = pure avoid"),
  specificity: z.number().min(1).max(10).describe("Score on weakest paragraph"),
  brand_fit: z
    .number()
    .min(1)
    .max(10)
    .describe("Natural integration (10) vs shoehorned (2)"),
  orphan_claim_issues: z
    .array(z.object({ section: z.string(), reason: z.string() }))
    .describe(
      "Sections with no human anchor — pure LLM extrapolation that should be cut",
    ),
  brand_drift_notes: z.array(z.string()),
  fact_check_flags: z
    .array(z.object({ claim: z.string(), reason: z.string() }))
    .describe("Claims without [source: X] citations"),
  suggested_fixes: z
    .array(z.string())
    .describe(
      "Specific, actionable fixes. Reference exact text where possible.",
    ),
});

export type LlmJudgment = z.infer<typeof llmJudgmentSchema>;

export type DeterministicPhase = {
  banned_phrase_hits: QaResult["banned_phrase_hits"];
  cadence_issues: QaResult["cadence_issues"];
  brandMentions: number;
};

/**
 * Run the deterministic phase only — banned-phrase regex, cadence variance,
 * brand mention count. Returns instantly (<10ms). The route uses this to emit
 * an immediate first chunk to the streaming client before the LLM call.
 */
export function runDeterministicPhase(
  brand: Brand,
  article: Article,
): DeterministicPhase {
  const markdown = article.markdown ?? "";
  const banned_phrase_hits = findBannedPhrases(markdown);

  const paragraphs = markdown
    .split(/\n{2,}/)
    .filter((p) => p.trim().length > 0 && !p.trim().startsWith("#"));

  const cadence_issues: QaResult["cadence_issues"] = [];
  paragraphs.forEach((para, idx) => {
    const sentences = para
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (sentences.length < 2) return;
    const wordCounts = sentences.map((s) => s.split(/\s+/).length);
    const mean = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
    const variance =
      wordCounts.reduce((acc, n) => acc + Math.pow(n - mean, 2), 0) /
      wordCounts.length;
    const stdDev = Math.sqrt(variance);
    const ratio = stdDev / mean;
    if (ratio < 0.3) {
      cadence_issues.push({
        paragraph_index: idx,
        reason: `${sentences.length} sentences within ${Math.round(ratio * 100)}% of mean length (${mean.toFixed(1)} words). Fragment one.`,
      });
    }
    if (sentences.length > 4) {
      cadence_issues.push({
        paragraph_index: idx,
        reason: `${sentences.length} sentences in one paragraph. Max 4.`,
      });
    }
  });

  const brandMentions = (
    markdown.match(new RegExp(`\\b${brand.name}\\b`, "g")) ?? []
  ).length;

  return { banned_phrase_hits, cadence_issues, brandMentions };
}

/**
 * Build the LLM judgment prompt for QA. Shared between the blocking
 * generateObject path (`runQa`) and the streaming path (`streamQaJudgment`).
 */
export function buildQaPrompt(
  brand: Brand,
  article: Article,
  references: ReferenceExample[],
): string {
  const markdown = article.markdown ?? "";

  const emulateBlock = references
    .filter((r) => r.voice_type === "emulate")
    .map((r) => `### ${r.title}\n\n${r.excerpt}\n\n_${r.notes ?? ""}_`)
    .join("\n\n---\n\n");

  const avoidBlock = references
    .filter((r) => r.voice_type === "avoid")
    .map((r) => `### ${r.title}\n\n${r.excerpt}\n\n_${r.notes ?? ""}_`)
    .join("\n\n---\n\n");

  return loadPrompt("draft/run-qa", {
    brand_name: brand.name,
    brand_about: brand.about,
    emulate_block: emulateBlock,
    avoid_block: avoidBlock,
    voice_rules: VOICE_RULES_PROMPT,
    target_query: article.target_query,
    article_title: article.title,
    markdown,
  }).text;
}

/**
 * Streaming variant — emits partial LlmJudgment objects as the model produces
 * them. Used by the streaming API route to ship live updates to the client.
 */
export function streamQaJudgment(args: {
  brand: Brand;
  article: Article;
  references: ReferenceExample[];
}) {
  return streamObject({
    model: models.smart,
    schema: llmJudgmentSchema,
    prompt: buildQaPrompt(args.brand, args.article, args.references),
    temperature: 0.3,
  });
}

/**
 * Combine deterministic + LLM phases into the final QaResult that gets
 * persisted to `articles.qa_result`. Used by both paths.
 */
export function assembleQaResult(
  brand: Brand,
  deterministic: DeterministicPhase,
  judgment: LlmJudgment,
): QaResult {
  const { banned_phrase_hits, cadence_issues, brandMentions } = deterministic;

  const bannedPenalty = Math.min(banned_phrase_hits.length, 10);
  const cadencePenalty = Math.min(cadence_issues.length, 10);

  const score =
    judgment.voice_match_score * 0.3 +
    judgment.specificity * 0.25 +
    judgment.brand_fit * 0.25 +
    (10 - bannedPenalty) * 0.1 +
    (10 - cadencePenalty) * 0.1;

  const passed =
    score >= 7.5 &&
    banned_phrase_hits.length === 0 &&
    brandMentions >= 3 &&
    judgment.orphan_claim_issues.length === 0;

  return {
    passed,
    score: Math.round(score * 100) / 100,
    banned_phrase_hits,
    cadence_issues,
    orphan_claim_issues: judgment.orphan_claim_issues,
    brand_drift_notes: judgment.brand_drift_notes,
    fact_check_flags: judgment.fact_check_flags,
    voice_match_score: judgment.voice_match_score,
    suggested_fixes: [
      ...(brandMentions < 3
        ? [
            `Add more ${brand.name} mentions — found ${brandMentions}, need 3+. Weave in naturally with specific brand details.`,
          ]
        : []),
      ...judgment.suggested_fixes,
    ],
  };
}

export async function runQa({
  brand,
  article,
  references,
}: {
  brand: Brand;
  article: Article;
  references: ReferenceExample[];
}): Promise<QaResult> {
  const markdown = article.markdown ?? "";

  // Phase 1 — deterministic
  const banned_phrase_hits = findBannedPhrases(markdown);

  const paragraphs = markdown
    .split(/\n{2,}/)
    .filter((p) => p.trim().length > 0 && !p.trim().startsWith("#"));

  const cadence_issues: QaResult["cadence_issues"] = [];
  paragraphs.forEach((para, idx) => {
    const sentences = para
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (sentences.length < 2) return;
    const wordCounts = sentences.map((s) => s.split(/\s+/).length);
    const mean = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
    const variance =
      wordCounts.reduce((acc, n) => acc + Math.pow(n - mean, 2), 0) /
      wordCounts.length;
    const stdDev = Math.sqrt(variance);
    const ratio = stdDev / mean;
    if (ratio < 0.3) {
      cadence_issues.push({
        paragraph_index: idx,
        reason: `${sentences.length} sentences within ${Math.round(ratio * 100)}% of mean length (${mean.toFixed(1)} words). Fragment one.`,
      });
    }
    if (sentences.length > 4) {
      cadence_issues.push({
        paragraph_index: idx,
        reason: `${sentences.length} sentences in one paragraph. Max 4.`,
      });
    }
  });

  const brandMentions = (
    markdown.match(new RegExp(`\\b${brand.name}\\b`, "g")) ?? []
  ).length;

  // Phase 2 — LLM judgment.
  // Reuses buildQaPrompt (which itself loads from prompts/draft/run-qa.md)
  // so the streaming and blocking paths can't drift apart.
  const prompt = buildQaPrompt(brand, article, references);

  const { object: judgment } = await generateObject({
    model: models.smart,
    schema: llmJudgmentSchema,
    prompt,
    temperature: 0.3,
  });

  const bannedPenalty = Math.min(banned_phrase_hits.length, 10);
  const cadencePenalty = Math.min(cadence_issues.length, 10);

  const score =
    judgment.voice_match_score * 0.3 +
    judgment.specificity * 0.25 +
    judgment.brand_fit * 0.25 +
    (10 - bannedPenalty) * 0.1 +
    (10 - cadencePenalty) * 0.1;

  const passed =
    score >= 7.5 &&
    banned_phrase_hits.length === 0 &&
    brandMentions >= 3 &&
    judgment.orphan_claim_issues.length === 0;

  return {
    passed,
    score: Math.round(score * 100) / 100,
    banned_phrase_hits,
    cadence_issues,
    orphan_claim_issues: judgment.orphan_claim_issues,
    brand_drift_notes: judgment.brand_drift_notes,
    fact_check_flags: judgment.fact_check_flags,
    voice_match_score: judgment.voice_match_score,
    suggested_fixes: [
      ...(brandMentions < 3
        ? [
            `Add more ${brand.name} mentions — found ${brandMentions}, need 3+. Weave in naturally with specific brand details.`,
          ]
        : []),
      ...judgment.suggested_fixes,
    ],
  };
}
