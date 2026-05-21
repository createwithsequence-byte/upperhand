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

const groundedModel = google("gemini-2.5-flash", {
  useSearchGrounding: true,
});

export const geoResearchSchema = z.object({
  target_prompts: z
    .array(
      z.object({
        prompt: z.string(),
        weight: z.enum(["primary", "secondary"]),
      }),
    )
    .min(1)
    .describe(
      "Prompts this article should target. Exactly one primary, others secondary.",
    ),
  competitor_citations: z
    .array(
      z.object({
        brand: z.string(),
        cited_for: z.string().describe("Which prompts this brand wins"),
        llms: z
          .array(z.enum(["chatgpt", "perplexity", "gemini", "claude"]))
          .describe("Which LLMs cite this brand for those prompts"),
        why: z.string().describe("What about their content earns the citation"),
      }),
    )
    .describe("Brands currently winning citation for this article's prompts"),
  citation_strategy: z
    .string()
    .min(40)
    .describe(
      "Narrative — 3-6 sentences — what this article needs to do to win citation. Reference real competitors. 'Write longer' is not a strategy. 'Lead with the named-entity grid the top citation lacks' is.",
    ),
});

export type GeoResearch = z.infer<typeof geoResearchSchema>;

/**
 * Per-article GEO research — pulls the citation landscape for the article's
 * primary prompt and produces a strategy to win citation. Two-pass: grounded
 * analysis -> structured extraction.
 */
export async function researchArticleGeo({
  brand,
  thread,
  article,
}: {
  brand: Brand;
  thread: Thread;
  article: Article;
}): Promise<GeoResearch> {
  const { text: groundedPrompt } = loadPrompt("geo/research-grounded", {
    brand_name: brand.name,
    brand_context: brand.about.slice(0, 400),
    thread_title: thread.title,
    thread_angle: thread.angle,
    target_query: article.target_query,
    article_title: article.title,
  });

  const grounded = await generateText({
    model: groundedModel,
    prompt: groundedPrompt,
    temperature: 0.4,
  });

  const { text: structurePrompt } = loadPrompt("geo/research-structure", {
    grounded_text: grounded.text,
    sources_block:
      grounded.sources
        ?.slice(0, 25)
        .map((s, i) => `${i + 1}. ${s.url}`)
        .join("\n") ?? "(none)",
  });

  const { object } = await generateObject({
    model: models.fast,
    schema: geoResearchSchema,
    prompt: structurePrompt,
    temperature: 0.2,
  });

  return object;
}
