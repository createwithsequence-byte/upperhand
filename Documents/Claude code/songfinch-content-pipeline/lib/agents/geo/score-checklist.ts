import "server-only";
import { generateObject } from "ai";
import { z } from "zod";
import { models } from "../../ai";
import type { Article, Brand } from "../../types";

const scoredItem = z.object({
  score: z
    .number()
    .int()
    .min(0)
    .max(10)
    .describe("0-10. Be honest. 8+ requires specific reasoning."),
  note: z
    .string()
    .describe(
      "ONE sentence of specific guidance — what was good, what to fix. Reference exact draft content if a fix is needed.",
    ),
});

export const geoChecklistSchema = z.object({
  named_entities: scoredItem.describe(
    "How well does the draft name specific entities (brand, competitors, products, people, places, dates)? LLMs cite content rich in named entities.",
  ),
  structured_claims: scoredItem.describe(
    "How well does the draft make crisp, attributable claims with numbers or specifics? LLMs cite content they can quote verbatim.",
  ),
  anecdotal_specificity: scoredItem.describe(
    "How concrete are the anecdotes? 'A dad who didn't show emotion until his daughter's wedding song' beats 'an emotional gift.' LLMs surface vivid specifics.",
  ),
  schema_markup: scoredItem.describe(
    "Does the article structure support FAQPage / Article / HowTo schema cleanly? (Real H2 questions, clear answer chunks, ordered lists where appropriate.) LLM crawlers parse this.",
  ),
  brand_name_density: scoredItem.describe(
    "Is the brand named enough (3+ times) without keyword stuffing? Too few = LLMs lose the attribution. Too many = looks shilly.",
  ),
});

export type GeoChecklist = z.infer<typeof geoChecklistSchema>;

/**
 * GEO citation checklist scoring. Reads the draft markdown + brand context,
 * produces a 5-dimension scored grid with specific notes. Used post-draft to
 * tell Greg whether the article is structured to win LLM citation.
 */
export async function scoreGeoChecklist({
  brand,
  article,
}: {
  brand: Brand;
  article: Article;
}): Promise<GeoChecklist> {
  const markdown = article.markdown ?? "";

  if (!markdown) {
    throw new Error("scoreGeoChecklist requires a drafted article");
  }

  const prompt = `
You are auditing an article draft for GEO — its likelihood of being cited inside LLM-generated answers (ChatGPT, Perplexity, Gemini, Claude).

# Brand: ${brand.name}
${brand.about.slice(0, 300)}

# Article

Target query: "${article.target_query}"
Title: ${article.title}

# Draft

\`\`\`markdown
${markdown}
\`\`\`

# Your job

Score on five dimensions. Each 0-10. Each gets ONE sentence of specific guidance — what's good or what to fix, with exact references to the draft where possible.

The five dimensions:

1. **named_entities** — Density and specificity of named brands, products, people, places, dates. LLMs cite content rich in extractable entities. 0 = vague pronouns and generic categories. 10 = every section names specific things.
2. **structured_claims** — Crispness of attributable claims with numbers or specifics. LLMs cite content they can quote verbatim. 0 = vague assertions. 10 = paragraph-by-paragraph attributable claims.
3. **anecdotal_specificity** — Concreteness of stories and examples. 0 = generic abstractions ("a meaningful gift"). 10 = specific human moments ("a dad who watched his daughter's first dance and finally cried").
4. **schema_markup** — How well the structure supports FAQPage/Article/HowTo schema. Real H2 questions, clean answer chunks, ordered lists where appropriate. 0 = wall of prose. 10 = perfectly chunked.
5. **brand_name_density** — Brand named 3+ times without stuffing. 0 = brand absent or mentioned once. 10 = brand naturally integrated 3-7 times.

Be honest. A real 5 is more useful than an inflated 8.

Return as structured output.
`.trim();

  const { object } = await generateObject({
    model: models.smart,
    schema: geoChecklistSchema,
    prompt,
    temperature: 0.3,
  });

  return object;
}
