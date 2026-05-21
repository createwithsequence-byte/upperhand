import "server-only";
import { streamText } from "ai";
import { models, VOICE_RULES_PROMPT } from "../../ai";
import { loadPrompt } from "../../prompts";
import type { Article, Brand, ReferenceExample, Thread } from "../../types";
import type { GeoResearchRow, SeoResearchRow } from "../../data";

/**
 * Auto-draft — generates a full Markdown article from research + brand context.
 *
 * The prompt structure puts STATIC content first (voice rules, references,
 * brand info) so Gemini's implicit prompt cache can warm up. After the first
 * article in a batch, the prefix is cached — only the article-specific bits
 * pay tokens.
 *
 * Research context is now first-class input. Without it, drafts read generic.
 * With it, the LLM knows:
 *   - Which keyword to emphasize (target_query)
 *   - What format the SERP wants (intent + serp_features)
 *   - Who it's competing against (top SERP results)
 *   - Which LLM prompts to target for citation
 *   - Who currently wins citation (so we can position against them)
 *
 * If seo/geo/keywordUniverse are null (orphan article without research), the
 * agent still works — the corresponding sections just say "(none)" instead.
 */
export function streamAutoDraft({
  brand,
  thread,
  article,
  references,
  seo,
  geo,
  keywordUniverse,
  onFinish,
}: {
  brand: Brand;
  thread: Thread;
  article: Article;
  references: ReferenceExample[];
  // New: research context. All optional — agent degrades gracefully if missing.
  seo?: SeoResearchRow | null;
  geo?: GeoResearchRow | null;
  // The thread's keyword universe (threads.keyword_research). Shape is:
  // { keywords: [{ keyword, intent, volume_tier, ... }], cluster_summary }
  keywordUniverse?: {
    keywords?: Array<{ keyword: string; volume_tier: string; intent: string }>;
  } | null;
  onFinish?: (result: {
    text: string;
    promptHash: string;
  }) => Promise<void> | void;
}) {
  // Voice exemplars block. Kept static (same for every article) so it caches.
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

  // Brand-level static blocks (cached across the batch).
  const personas = brand.personas
    .filter((p) => p.name?.trim() && p.description?.trim())
    .map((p) => `- ${p.name}: ${p.description}`)
    .join("\n");

  const impacts = brand.customer_impact
    .filter((c) => c.situation?.trim() && c.how_brand_helps?.trim())
    .map((c) => `- ${c.situation} → ${c.how_brand_helps}`)
    .join("\n");

  // ---- Research context blocks (article-specific, not cached) -------------

  // Keyword universe: take top 10 most relevant. Sort by volume tier so the
  // model sees high-volume keywords first.
  const keywordList = keywordUniverse?.keywords ?? [];
  const tierOrder = { high: 0, medium: 1, low: 2 };
  const topKeywords = keywordList
    .slice()
    .sort(
      (a, b) =>
        (tierOrder[a.volume_tier as keyof typeof tierOrder] ?? 3) -
        (tierOrder[b.volume_tier as keyof typeof tierOrder] ?? 3),
    )
    .slice(0, 10);
  const keywordUniverseBlock = topKeywords.length
    ? topKeywords
        .map((k) => `- "${k.keyword}" (${k.volume_tier} volume, ${k.intent})`)
        .join("\n")
    : "(no keyword research yet)";

  // SERP top results (compressed — just rank, title, why-ranking).
  type SerpResult = {
    rank: number;
    title: string;
    snippet: string;
    domain_type: string;
  };
  const serpResults = (seo?.serp_top10 as SerpResult[] | undefined) ?? [];
  const serpTopBlock = serpResults.length
    ? serpResults
        .slice(0, 5)
        .map(
          (r) =>
            `${r.rank}. **${r.title}** (${r.domain_type.replace(/_/g, " ")}) — ${r.snippet}`,
        )
        .join("\n")
    : "(no SERP research yet — write blind to current competition)";

  const serpFeatures = (seo?.serp_features as string[] | undefined)?.length
    ? (seo!.serp_features as string[]).join(", ")
    : "none";
  const searchIntent = seo?.search_intent ?? "unknown";
  const rankingStrategy =
    seo?.ranking_strategy ??
    "(no ranking strategy yet — focus on un-AI voice and brand specificity)";

  // GEO data
  const targetPrompts = geo?.target_prompts ?? [];
  const targetPromptsBlock = targetPrompts.length
    ? targetPrompts.map((p) => `- "${p.prompt}" (${p.weight})`).join("\n")
    : `- "${article.target_query}" (primary)`;

  const competitorCitations = geo?.competitor_citations ?? [];
  const competitorCitationsBlock = competitorCitations.length
    ? competitorCitations
        .slice(0, 4)
        .map(
          (c) =>
            `- **${c.brand}** (cited by ${c.llms.join(", ")}) — ${c.cited_for}. ${c.why}`,
        )
        .join("\n")
    : "(no GEO research yet)";

  const citationStrategy =
    geo?.citation_strategy ??
    "(no citation strategy yet — focus on naming entities, structured claims, anecdotal specificity)";

  const { text: prompt, hash: promptHash } = loadPrompt("draft/auto-draft", {
    // Static (front of prompt — cacheable)
    brand_name: brand.name,
    brand_about: brand.about,
    personas_block: personas || "(none defined)",
    impacts_block: impacts || "(none defined)",
    voice_rules: VOICE_RULES_PROMPT,
    emulate_block: emulate,
    avoid_block: avoid,
    // Thread (semi-static within a thread run)
    thread_title: thread.title,
    thread_angle: thread.angle,
    thread_description: thread.description,
    keyword_universe_block: keywordUniverseBlock,
    // Article (unique per call)
    target_query: article.target_query,
    article_title: article.title,
    format: article.format,
    reasoning: article.reasoning,
    // SEO research context
    serp_top_block: serpTopBlock,
    search_intent: searchIntent,
    serp_features: serpFeatures,
    ranking_strategy: rankingStrategy,
    // GEO research context
    target_prompts_block: targetPromptsBlock,
    competitor_citations_block: competitorCitationsBlock,
    citation_strategy: citationStrategy,
  });

  return streamText({
    model: models.smart,
    prompt,
    temperature: 0.75,
    maxOutputTokens: 8192,
    onFinish: onFinish
      ? async (event) => {
          await onFinish({ text: event.text, promptHash });
        }
      : undefined,
  });
}
