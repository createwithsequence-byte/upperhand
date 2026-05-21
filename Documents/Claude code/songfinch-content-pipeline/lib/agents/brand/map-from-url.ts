import "server-only";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { models, VOICE_RULES_PROMPT } from "../../ai";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

// Pro is paid-only on free Gemini tier; use Flash with grounding for free-tier compatibility.
const groundedModel = google("gemini-2.5-flash", {
  useSearchGrounding: true,
});

export const brandMapSchema = z.object({
  name: z.string().describe("Brand name as it appears on the homepage"),
  about: z
    .string()
    .min(200)
    .max(800)
    .describe(
      "What this brand is, who it's for, what makes it different. 3-5 sentences. Specific, not marketing-speak.",
    ),
  personas: z
    .array(
      z.object({
        name: z
          .string()
          .describe(
            "Short persona name. Specific. 'Adult children buying for parents' beats 'gift-givers'.",
          ),
        description: z
          .string()
          .describe(
            "Who they are, what they're doing when they encounter this brand, what they want. 2-3 sentences.",
          ),
      }),
    )
    .min(3)
    .max(6),
  customer_impact: z
    .array(
      z.object({
        situation: z
          .string()
          .describe(
            "Specific situation, not a generic category. 'Memorial for a parent who didn't get a real funeral' beats 'grieving customers'.",
          ),
        how_brand_helps: z
          .string()
          .describe(
            "How the brand changes outcomes — what the customer walks away with that they couldn't get elsewhere",
          ),
      }),
    )
    .min(3)
    .max(6),
});

export type BrandMap = z.infer<typeof brandMapSchema>;

export async function mapBrandFromUrls(urls: string[]): Promise<BrandMap> {
  const urlList = urls.map((u) => u.trim()).filter(Boolean);
  if (urlList.length === 0) throw new Error("No URLs provided");

  // Step 1 — grounded research. Gemini fetches the URLs (Google Search tool resolves them) and synthesizes.
  const groundedPrompt = `
You are mapping a brand from its web presence. The output is a structured brand graph that will feed an entire content pipeline — so be specific, not generic. Marketing-speak produces marketing-speak downstream.

# URLs to research

${urlList.map((u, i) => `${i + 1}. ${u}`).join("\n")}

# Your job

Read these pages (homepage, about, customer reviews, sample artist pages, blog posts — whatever's there). Then produce a brand graph with these four parts:

1. **name**: Brand name as it appears on the homepage.

2. **about** (3-5 sentences): What the brand is, who it's for, what makes it different. Plain language. Skip the marketing slogans. Capture the real wedge — the thing this brand does that competitors can't or won't.

3. **personas** (3-6): Who buys. Be specific. "Adult children buying for parents who don't show emotion" beats "gift-givers". For each persona, 2-3 sentences on who they are and what they're trying to accomplish when they hit this brand.

4. **customer_impact** (3-6): Specific situations where the brand changes outcomes. "Memorial for a parent who didn't get a real funeral" beats "grieving customers". For each: the situation, and how the brand specifically changes what the customer walks away with.

# Voice rules

These rules apply to the brand graph text itself. Vague brand graph = vague topics downstream.

${VOICE_RULES_PROMPT}

Use lowercase casual phrasing where it fits. Real customer language beats marketing language. If you see specific scenarios in customer reviews or testimonials, use those.

Now research the URLs and produce the brand graph.
`.trim();

  const grounded = await generateText({
    model: groundedModel,
    prompt: groundedPrompt,
    temperature: 0.5,
  });

  // Step 2 — structure the grounded analysis into the schema.
  const structurePrompt = `
Extract structured brand data from this analysis. Pull verbatim language where the analysis is specific. Do not invent personas or situations not mentioned.

# Analysis

${grounded.text}

Return as structured output.
`.trim();

  const { object } = await generateObject({
    model: models.fast,
    schema: brandMapSchema,
    prompt: structurePrompt,
    temperature: 0.2,
  });

  return object;
}
