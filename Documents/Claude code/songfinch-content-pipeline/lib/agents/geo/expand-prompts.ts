import "server-only";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { models } from "../../ai";
import type { Brand, Thread } from "../../types";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

const groundedModel = google("gemini-2.5-flash", {
  useSearchGrounding: true,
});

const promptRowSchema = z.object({
  prompt: z
    .string()
    .describe(
      "Natural-language prompt a real user types into ChatGPT/Perplexity/Gemini/Claude. Casual, lowercase, the way people actually ask.",
    ),
  intent: z
    .enum(["transactional", "informational", "comparative", "navigational"])
    .describe(
      "Dominant intent. transactional = ready to buy, informational = research, comparative = vs/alternatives, navigational = looking for a specific brand",
    ),
  frequency_estimate: z
    .enum(["high", "medium", "low"])
    .describe(
      "How often real users type something like this. high = daily across many users, medium = weekly, low = rare/long-tail",
    ),
  citation_difficulty: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe(
      "0-100. How hard for ANY brand to win citation here. Marketplace/aggregator dominant = 80+. Niche question with no clear answer leader = 30-50. Brand-specific = depends on brand authority.",
    ),
});

export const promptUniverseSchema = z.object({
  prompts: z.array(promptRowSchema).min(15).max(30),
});

export type PromptUniverse = z.infer<typeof promptUniverseSchema>;
export type PromptRow = z.infer<typeof promptRowSchema>;

/**
 * Per-thread prompt universe — natural language queries users type into LLMs
 * inside this thread's angle. Two-pass like the rest of the grounded agents:
 * grounded text first to anchor in real LLM-usage patterns, then a structured
 * extraction pass.
 */
export async function expandPrompts({
  brand,
  thread,
  count = 25,
}: {
  brand: Brand;
  thread: Thread;
  count?: number;
}): Promise<PromptUniverse> {
  const groundedPrompt = `
You are mapping the LLM prompt universe for one content thread at ${brand.name}.

# Brand: ${brand.name}
${brand.about.slice(0, 300)}

# Thread

**${thread.title}**
Angle: ${thread.angle}
${thread.description}
Search intent: ${thread.search_intent ?? "mixed"}

# Your job

Search the web for patterns of how real users ask LLMs (ChatGPT, Perplexity, Gemini, Claude) about this thread's topic. Surface ~${count} natural-language prompts users actually type. Examples of REAL prompt patterns to mimic:

- "what's a good gift for my dad who never shows emotion"  (informational, casual)
- "songfinch vs cameo for memorials"  (comparative)
- "best custom song service for wedding"  (transactional)
- "is songfinch real or AI"  (navigational + skeptical)

For each prompt:
- Real natural-language text (lowercase, casual — how people TYPE, not how they title articles)
- Intent: transactional, informational, comparative, navigational
- Frequency estimate: high, medium, low
- Citation difficulty 0-100 — how hard ANY brand is to win citation. High if marketplaces dominate. Low if it's a niche question with no clear leader.

# Rules

- Spread across intents and frequencies. Don't return only transactional or only high-frequency.
- Be HONEST about citation difficulty. If the SERP shows Amazon/Etsy dominating, mark 80+.
- Skip generic / branded-for-other-companies prompts.
- The most valuable prompts: medium frequency + low-medium citation difficulty + ${brand.name}'s wedge fits.

Search the web, observe real LLM-usage patterns, then synthesize.
`.trim();

  const grounded = await generateText({
    model: groundedModel,
    prompt: groundedPrompt,
    temperature: 0.6,
  });

  // Structure pass — cheap Flash, no grounding.
  const structurePrompt = `
Extract structured prompt research from this analysis. Pull verbatim phrasing where specific. Do not invent data.

# Grounded analysis

${grounded.text}

# Sources cited

${grounded.sources?.map((s, i) => `${i + 1}. ${s.url}`).join("\n") ?? "(none)"}

Return ${count} prompts as structured output.
`.trim();

  const { object } = await generateObject({
    model: models.fast,
    schema: promptUniverseSchema,
    prompt: structurePrompt,
    temperature: 0.2,
  });

  return object;
}
