import "server-only";
import { generateObject } from "ai";
import { z } from "zod";
import { models, VOICE_RULES_PROMPT } from "../../ai";
import type { Article, Brand, Thread } from "../../types";

const humanInputSlotSchema = z.object({
  key: z
    .string()
    .describe("Short snake_case identifier. Example: loom_about_stoic_dads"),
  label: z.string().describe("UI label. Example: 'Loom about stoic dads'"),
  type: z.enum([
    "loom_transcript",
    "quote",
    "anecdote",
    "artist_quote",
    "customer_story",
  ]),
  description: z
    .string()
    .describe(
      "1-2 sentences telling Greg exactly what input goes here. SPECIFIC — vague slots produce vague drafts.",
    ),
});

export const briefSchema = z.object({
  title_options: z.array(z.string()).length(3),
  meta_description: z.string().max(160),
  h1: z.string(),
  h2_outline: z
    .array(
      z.object({
        heading: z.string(),
        question_it_answers: z.string(),
        notes: z.string().optional(),
      }),
    )
    .min(4)
    .max(7),
  direct_answer: z
    .string()
    .describe(
      "ACTUAL first 40-60 words of the article. Real prose. Mentions brand by name. No banned phrases.",
    ),
  faq: z
    .array(
      z.object({
        question: z
          .string()
          .describe("Real user search language — lowercase, casual"),
        suggested_answer_notes: z.string(),
      }),
    )
    .min(5)
    .max(8),
  human_input_slots: z.array(humanInputSlotSchema).min(3).max(6),
  schema_recommendation: z
    .string()
    .describe("'Article + FAQPage' default, add Product if listicle"),
  internal_links: z
    .array(z.object({ anchor: z.string(), target_url_pattern: z.string() }))
    .min(2)
    .max(5),
  social_cuts: z.object({
    linkedin: z.string(),
    twitter: z.string(),
    instagram: z.string(),
  }),
});

export type BriefJson = z.infer<typeof briefSchema>;

export async function buildBrief({
  brand,
  thread,
  article,
}: {
  brand: Brand;
  thread: Thread;
  article: Article;
}): Promise<BriefJson> {
  const prompt = `
You are building an editorial brief for an article. When this is done, the Draft Writer has everything except the human inputs.

# Brand: ${brand.name}
${brand.about}

# Thread
**${thread.title}** — ${thread.angle}
${thread.description}

# Article to brief

Title: ${article.title}
Target query: ${article.target_query}
Format: ${article.format}
Reasoning: ${article.reasoning}

# Your job

Build a complete brief. Specific instructions:

**Title options (exactly 3):** Each specific, each matches real search language, no clickbait.

**Meta description:** Under 155 chars. Direct answer to target_query. No marketing speak.

**H2 outline:** 4-7 H2s. Each phrased as a real human question someone would ask an LLM.

**Direct answer:** WRITE THE ACTUAL OPENING. 40-60 words. Mentions ${brand.name} by name. Answers the query immediately. No throat-clearing. This goes into the article verbatim.

**FAQ:** 5+ Q&A pairs. Questions in REAL user language (lowercase, casual).

**Human input slots (3-6):** The most important section. The un-AI ingredients. Each slot must be SPECIFIC — not "a personal anecdote" but "the moment you watched your own dad receive a meaningful gift and what you noticed."

**Social cuts:** Real drafts, not templates. Same voice rules.

# Voice rules

${VOICE_RULES_PROMPT}

Return as structured output.
`.trim();

  const { object } = await generateObject({
    model: models.smart,
    schema: briefSchema,
    prompt,
    temperature: 0.7,
  });

  return object;
}
