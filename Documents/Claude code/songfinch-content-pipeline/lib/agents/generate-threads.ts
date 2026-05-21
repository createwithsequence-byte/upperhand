import "server-only";
import { generateObject } from "ai";
import { z } from "zod";
import { models, VOICE_RULES_PROMPT } from "../ai";
import type { Brand } from "../types";

export const threadSchema = z.object({
  title: z.string().describe("Specific, real-language thread title"),
  angle: z
    .string()
    .describe(
      "The strategic positioning — wedge, defense, opportunity, occasion, or persona-cut",
    ),
  description: z.string().describe("2-3 sentences on what this thread covers"),
  reasoning: z
    .string()
    .describe(
      "Why this thread matters for the brand specifically — what query intent it owns",
    ),
  search_intent: z
    .string()
    .describe(
      "What someone is actually trying to do when they search this — comparison, gift-finding, emotional research, etc.",
    ),
  seo_potential: z
    .number()
    .int()
    .min(1)
    .max(10)
    .describe(
      "1-10. 10 = uncontested wedge keyword cluster with high commercial intent and weak top-ranking competitors. 1 = saturated by high-DA publishers like Forbes/HuffPost where you'll never rank. Be willing to give 4s and 5s. Saturated commodity content gets 2-3. Most healthy threads land 5-7.",
    ),
  brand_relevance: z
    .number()
    .int()
    .min(1)
    .max(10)
    .describe(
      "1-10. 10 = unique brand wedge that no competitor can credibly write because it requires the brand's specific differentiator. 1 = generic content any blog could publish without naming the brand. Be willing to give 4s and 5s. Most threads with a clear brand connection land 6-8; only true wedges deserve 9-10.",
    ),
  wedge: z
    .boolean()
    .describe(
      "Does this lean into a competitive wedge / differentiator? Aim for 2-3 wedge threads per batch.",
    ),
});

export const generateThreadsSchema = z.object({
  threads: z.array(threadSchema).min(12).max(20),
});

export type ThreadCandidate = z.infer<typeof threadSchema>;

export async function generateThreads({
  brand,
  count = 15,
}: {
  brand: Brand;
  count?: number;
}): Promise<ThreadCandidate[]> {
  const personasBlock = brand.personas
    .map((p, i) => `${i + 1}. ${p.name} — ${p.description}`)
    .join("\n");

  const impactBlock = brand.customer_impact
    .map(
      (c, i) =>
        `${i + 1}. ${c.situation}\n   How ${brand.name} helps: ${c.how_brand_helps}`,
    )
    .join("\n");

  const prompt = `
You are a senior content strategist generating SEO thread ideas for ${brand.name}. Threads are strategic angles — content pillars — not individual articles. From one thread we'll later generate 5-10 articles. Threads should be specific enough to define an editorial direction but broad enough to support multiple pieces.

# Brand: ${brand.name}

## About
${brand.about}

## Personas
${personasBlock || "(none defined — infer from the about section)"}

## Customer impact
${impactBlock || "(none defined — infer from the about section)"}

# Your job

Generate ${count} thread candidates. Each must be a real intersection of one or more personas with one or more customer-impact situations. Be honest about specificity:

GOOD threads (specific, ownable):
- "Memorial gifts for relationships that were complicated, not Hallmark-clean"
- "Why human songwriters land differently than Suno/Udio for milestone moments"
- "Anniversary gifts for couples who've already done jewelry, trips, and experiences"

BAD threads (generic, unwinnable):
- "Best gifts for dad" (no angle)
- "Music as a gift" (too broad)
- "Unique presents under $200" (no brand wedge)

# Rules

- Each thread must include a clear ANGLE: wedge ("never AI"), occasion-specific ("retirement songs"), persona-cut ("adult children buying for parents"), or defense ("custom songs vs. generic playlists").
- At least 2-3 threads must be WEDGE threads — leaning into what makes the brand different from competitors. Set wedge=true on these.
- ${VOICE_RULES_PROMPT}

# Scoring discipline — read this twice

The two scoring fields (seo_potential, brand_relevance) ARE the editorial decision aid. If every thread gets 9 or 10, the scores tell us nothing and the rubric is broken. Force yourself to differentiate:

- Use the FULL 1-10 range. The mean across ${count} threads should land 5-6, not 8-9.
- At least 25% of the threads should have one of the two scores at 5 or below.
- A "wedge" thread with high brand_relevance can still have moderate seo_potential if the keyword volume is small.
- A high-volume, generic-feeling thread (good seo_potential) should get a LOW brand_relevance because anyone could write it.
- Do not give a 9 or 10 unless you can name the specific reason: "DR<30 competitors only" for seo_potential, "requires the artist roster + 7-day delivery wedge" for brand_relevance.

If you find yourself defaulting to 8/9 across most threads, stop and recalibrate. A flat scoring distribution is failing the user.

Return ${count} threads as structured output.
`.trim();

  const { object } = await generateObject({
    model: models.smart,
    schema: generateThreadsSchema,
    prompt,
    temperature: 0.8,
  });

  return object.threads;
}
