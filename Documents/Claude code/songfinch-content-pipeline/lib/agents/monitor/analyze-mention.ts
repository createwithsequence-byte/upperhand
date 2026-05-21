import "server-only";
import { generateObject } from "ai";
import { z } from "zod";
import { models } from "../../ai";

export const mentionAnalysisSchema = z.object({
  brand_mentioned: z
    .boolean()
    .describe(
      "Is the brand (or any of its aliases) referenced in the response?",
    ),
  brand_position: z
    .number()
    .int()
    .min(1)
    .nullable()
    .describe(
      "If mentioned, the ORDER it appears among named brands. 1 = first named, 2 = second, etc. null if not mentioned.",
    ),
  framing: z
    .enum(["recommended", "mentioned", "compared", "negative"])
    .nullable()
    .describe(
      "How the brand is framed. recommended = LLM endorses as top choice. mentioned = listed without endorsement. compared = neutral comparison to competitors. negative = LLM steers away. null if not mentioned.",
    ),
  competitors_mentioned: z
    .array(z.string())
    .describe(
      "Other brands named in the response. Even if our brand isn't mentioned, capturing competitors is valuable signal.",
    ),
});

export type MentionAnalysis = z.infer<typeof mentionAnalysisSchema>;

/**
 * Analyze a raw LLM response for brand mentions. Cheap Flash structured call.
 * Brand aliases let us catch variants ("Songfinch" / "songfinch.com" / "Song
 * Finch"). Competitors are surfaced even when the brand isn't mentioned —
 * that's still actionable intelligence.
 */
export async function analyzeMention({
  responseText,
  brandName,
  brandAliases = [],
}: {
  responseText: string;
  brandName: string;
  brandAliases?: string[];
}): Promise<MentionAnalysis> {
  const aliasList = [brandName, ...brandAliases].filter(Boolean).join(", ");

  const prompt = `
Analyze this LLM response for brand mentions and framing.

# Target brand
Primary name: ${brandName}
Aliases to also match: ${aliasList}

# Definitions

- brand_mentioned: is the brand or any alias referenced in the response?
- brand_position: among ALL named brands in the response, what order does this brand appear? 1 = first named, 2 = second, etc. null if not mentioned.
- framing:
  - recommended: the LLM endorses the brand as a top choice ("I'd recommend...", "the best...", appears in a numbered "top 5" list)
  - mentioned: the brand is listed alongside others without endorsement
  - compared: the LLM compares the brand to competitors neutrally
  - negative: the LLM steers the user away ("avoid...", "alternatives like X are better than Y")
- competitors_mentioned: any other brand names in the response, in the order they appear

# Response to analyze

\`\`\`
${responseText}
\`\`\`

Be conservative on framing. If the LLM says "options include X, Y, Z" without ranking, that's "mentioned" not "recommended". Only mark "recommended" when there's a clear endorsement.

Return as structured output.
`.trim();

  const { object } = await generateObject({
    model: models.fast,
    schema: mentionAnalysisSchema,
    prompt,
    temperature: 0.2,
  });

  return object;
}
