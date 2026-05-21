import "server-only";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { models } from "../../ai";
import { loadPrompt } from "../../prompts";
import type { Article, Brand, Thread } from "../../types";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

// Pro is paid-only on free Gemini tier; use Flash with grounding for free-tier compatibility.
const groundedModel = google("gemini-2.5-flash", {
  useSearchGrounding: true,
});

// Structured output schema for the second-pass extraction.
export const serpAnalysisSchema = z.object({
  search_volume_estimate: z
    .number()
    .int()
    .min(0)
    .describe(
      "Estimated monthly Google searches for the target query. LLM inference, low confidence — bucketed into tiers below.",
    ),
  volume_tier: z
    .enum(["high", "medium", "low"])
    .describe(
      "high: >5000/mo, medium: 500-5000/mo, low: <500/mo. This is the trustworthy signal even when the number isn't.",
    ),
  keyword_difficulty: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe(
      "0-100. Based on top competitors: high-DA domains + comprehensive content = high difficulty. Niche/blog competitors = low difficulty.",
    ),
  serp_analysis: z.object({
    top_results: z
      .array(
        z.object({
          rank: z.number().int().min(1).max(10),
          url: z.string(),
          title: z.string(),
          snippet: z
            .string()
            .describe(
              "Why this URL is ranking — content angle, format, depth, freshness",
            ),
          domain_type: z
            .enum([
              "brand_owned",
              "competitor",
              "publisher",
              "forum",
              "marketplace",
              "blog",
              "other",
            ])
            .describe("Quick classification of who's ranking"),
        }),
      )
      .min(3)
      .max(10),
    serp_features: z
      .array(
        z.enum([
          "featured_snippet",
          "people_also_ask",
          "knowledge_panel",
          "video",
          "images",
          "shopping",
          "local_pack",
          "ai_overview",
          "none",
        ]),
      )
      .describe("SERP features observed — informs format strategy"),
    intent_classification: z
      .enum([
        "informational",
        "commercial",
        "transactional",
        "navigational",
        "mixed",
      ])
      .describe("Dominant search intent observed in the SERP"),
  }),
  ranking_strategy: z
    .string()
    .describe(
      "2-4 sentences: what specifically to do to rank in top 5. Reference the actual competitors. Examples: 'The top 3 are all generic listicles — write the one emotional anecdote-led piece nobody else has.' 'AI Overview is dominant — structure FAQ-first with direct-answer formatting.' Be specific, not generic SEO advice.",
    ),
  notes: z
    .string()
    .describe(
      "1-2 sentences of additional observations — recent SERP shifts, brand opportunity, why this is or isn't winnable",
    ),
});

export type SerpAnalysis = z.infer<typeof serpAnalysisSchema>;

export async function researchSeo({
  brand,
  thread,
  article,
}: {
  brand: Brand;
  thread: Thread;
  article: Article;
}): Promise<SerpAnalysis> {
  // Step 1 — grounded search. Pull real SERP for the target_query.
  const { text: groundedPrompt } = loadPrompt("seo/research-grounded", {
    brand_name: brand.name,
    target_query: article.target_query,
    article_title: article.title,
    brand_context: brand.about.slice(0, 400),
  });

  const grounded = await generateText({
    model: groundedModel,
    prompt: groundedPrompt,
    temperature: 0.4,
  });

  // Step 2 — extract structured data from the grounded analysis.
  const { text: structurePrompt } = loadPrompt("seo/research-structure", {
    grounded_text: grounded.text,
    sources_block:
      grounded.sources?.map((s, i) => `${i + 1}. ${s.url}`).join("\n") ??
      "(no sources captured)",
  });

  const { object } = await generateObject({
    model: models.fast,
    schema: serpAnalysisSchema,
    prompt: structurePrompt,
    temperature: 0.2,
  });

  return object;
}
