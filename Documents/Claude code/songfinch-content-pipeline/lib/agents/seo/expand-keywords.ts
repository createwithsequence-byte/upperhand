import "server-only";
import { generateObject } from "ai";
import { z } from "zod";
import { models } from "../../ai";
import type { Brand, Thread } from "../../types";

// Keyword expansion used to do a grounded search pass per call. That blew
// through the free-tier 250K input tokens/min quota (~25 keywords × Gemini's
// internal searches per keyword + grounded results fed back as context = 250s+
// of retries on a 429). Switched to single-pass non-grounded — Gemini's
// intrinsic knowledge produces solid keyword variants without per-keyword SERP
// fetches. Real SERP data is still available per-article via /research-seo,
// which scopes grounding to one query at a time.

const keywordSchema = z.object({
  keyword: z
    .string()
    .describe("Real-language search phrase, lowercase, no end punctuation"),
  intent: z.enum([
    "informational",
    "commercial",
    "transactional",
    "navigational",
    "mixed",
  ]),
  volume_tier: z
    .enum(["high", "medium", "low"])
    .describe("high: >5000/mo, medium: 500-5000/mo, low: <500/mo"),
  search_volume_estimate: z.number().int().min(0),
  difficulty: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe("0-100. Based on competitor type observed in SERP."),
  competitor_type: z
    .enum([
      "brand_owned",
      "competitor",
      "publisher",
      "forum",
      "marketplace",
      "blog",
      "mixed",
    ])
    .describe(
      "Dominant type ranking for this keyword. Forum/blog dominant = winnable. Marketplaces/Amazon = unwinnable for content.",
    ),
  top_competitor: z
    .string()
    .describe(
      "The domain (just the domain, not URL) of the strongest currently-ranking page",
    ),
  note: z
    .string()
    .describe(
      "One-line strategy: should we target this? Why or why not? Reference what's ranking.",
    ),
});

export const expandKeywordsSchema = z.object({
  keywords: z.array(keywordSchema).min(10).max(25),
  cluster_summary: z
    .string()
    .describe(
      "2-3 sentences on the overall keyword landscape for this thread. Where are the gaps? Which intent dominates? What's the best entry point?",
    ),
});

export type KeywordResearch = z.infer<typeof expandKeywordsSchema>;
export type KeywordRow = z.infer<typeof keywordSchema>;

export async function expandKeywords({
  brand,
  thread,
  count = 15,
}: {
  brand: Brand;
  thread: Thread;
  count?: number;
}): Promise<KeywordResearch> {
  // Single-pass, NON-grounded. Gemini's intrinsic knowledge produces good
  // keyword variants without per-keyword search overhead. Volume / difficulty
  // estimates are LLM inferences (always have been — even with grounding they
  // were guesses, not measurements). Real SERP data for individual queries
  // still lives in research-seo per-article.
  const prompt = `
You are mapping a keyword universe for one content thread at ${brand.name}.

# Brand: ${brand.name}
${brand.about.slice(0, 300)}

# Thread

**${thread.title}**
Angle: ${thread.angle}
${thread.description}
Search intent: ${thread.search_intent ?? "mixed"}
${thread.wedge ? "This is a wedge thread — competitive positioning matters." : ""}

# Your job

Generate ~${count} keyword variants people actually search for inside this thread's angle. For each, infer:

- Real-language search phrase (lowercase, casual — how people search, not blog-post titles)
- Intent — informational | commercial | transactional | navigational | mixed
- Volume tier — high (>5K/mo), medium (500-5K/mo), low (<500/mo)
- Volume estimate (best inference)
- Difficulty 0-100 (inferred from how competitive the phrase feels — branded/marketplace queries = high, niche long-tail = low)
- Competitor type that likely dominates — publisher, brand, forum, marketplace, blog, mixed, brand_owned
- Top competitor domain — your best guess at the dominant ranking domain (e.g. "reddit.com", "amazon.com")
- Strategy note — ONE line: should ${brand.name} target this? Why or why not?

# Rules

- Spread across volume tiers. Don't return only high-volume — long-tail low-difficulty wins matter most.
- Mix intents.
- Be HONEST about unwinnable keywords (Amazon/Etsy dominant = mark difficulty 85+).
- Flag low-volume / low-difficulty / brand-fit keywords as wins in the note.
- Specific over generic ("best gifts for a dad who doesn't show emotion" beats "best gifts").

End with a 2-3 sentence cluster_summary describing the strategic landscape.
`.trim();

  const { object } = await generateObject({
    model: models.fast,
    schema: expandKeywordsSchema,
    prompt,
    temperature: 0.5,
  });

  // Sort: high volume + low difficulty first
  object.keywords.sort((a, b) => {
    const tierWeight = { high: 3, medium: 2, low: 1 };
    const aScore = tierWeight[a.volume_tier] * 100 - a.difficulty;
    const bScore = tierWeight[b.volume_tier] * 100 - b.difficulty;
    return bScore - aScore;
  });

  return object;
}
