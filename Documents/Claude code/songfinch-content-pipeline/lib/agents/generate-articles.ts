import "server-only";
import { generateObject } from "ai";
import { z } from "zod";
import { models, VOICE_RULES_PROMPT } from "../ai";
import type { Brand, Thread } from "../types";

const articleFormats = [
  "listicle",
  "explainer",
  "comparison",
  "occasion-guide",
  "behind-the-song",
  "wedge",
] as const;

export const articleIdeaSchema = z.object({
  title: z.string().describe("Working title, specific not generic"),
  target_query: z
    .string()
    .describe(
      "Exactly what someone would type into ChatGPT or Google. Lowercase, no end punctuation. Real search language.",
    ),
  format: z.enum(articleFormats),
  reasoning: z
    .string()
    .describe(
      "2-3 sentences on why this article matters, what query intent it serves, what makes it ownable",
    ),
  geo_potential: z
    .number()
    .int()
    .min(1)
    .max(10)
    .describe("How citable by LLMs"),
});

export const generateArticlesSchema = z.object({
  articles: z.array(articleIdeaSchema).min(6).max(12),
});

export type ArticleIdea = z.infer<typeof articleIdeaSchema>;

export async function generateArticles({
  brand,
  thread,
  count = 8,
}: {
  brand: Brand;
  thread: Thread;
  count?: number;
}): Promise<ArticleIdea[]> {
  const prompt = `
You are generating article ideas within an approved content thread for ${brand.name}.

# Brand: ${brand.name}
${brand.about}

# Thread

**${thread.title}**
Angle: ${thread.angle}
Description: ${thread.description}
Why it matters: ${thread.reasoning}
Search intent: ${thread.search_intent ?? "n/a"}
Wedge: ${thread.wedge ? "yes" : "no"}

# Your job

Generate ${count} distinct article ideas inside this thread. Each must be a real, specific take that a real person would search for. Articles cover the thread from different angles — same strategic direction, different entry points.

Each article needs:
- A SPECIFIC title ("Best gifts for a dad who doesn't show emotion" not "Best gifts for dad")
- A real-language target_query (what someone types into Google or ChatGPT)
- A format from: ${articleFormats.join(", ")}
- Reasoning on why this specific angle is worth writing
- geo_potential 1-10

# Rules

- Spread across formats. Don't generate 8 listicles. Mix listicle, explainer, comparison, etc.
- Each article approaches the thread from a DIFFERENT angle. No duplicates.
- target_query in real search language. People type "anniversary gift when words aren't enough" not "Anniversary Gifts: When Words Aren't Enough".
- ${VOICE_RULES_PROMPT}

Return ${count} article ideas.
`.trim();

  const { object } = await generateObject({
    model: models.smart,
    schema: generateArticlesSchema,
    prompt,
    temperature: 0.8,
  });

  return object.articles;
}
