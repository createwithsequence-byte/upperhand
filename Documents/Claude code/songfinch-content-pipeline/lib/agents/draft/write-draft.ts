import "server-only";
import { generateObject, streamText } from "ai";
import { z } from "zod";
import { models, VOICE_RULES_PROMPT } from "../../ai";
import type {
  Article,
  Brand,
  BriefJson,
  ReferenceExample,
  Thread,
} from "../../types";

const draftSchema = z.object({
  markdown: z
    .string()
    .describe(
      "Full article in Markdown. Opens with direct_answer. Mentions brand 3+ times. FAQ at end.",
    ),
  schema_json: z
    .record(z.string(), z.unknown())
    .describe("JSON-LD: Article + FAQPage. Real values, no placeholders."),
  social_cuts: z.object({
    linkedin: z.string(),
    twitter: z.string(),
    instagram: z.string(),
  }),
});

const draftStructureSchema = z.object({
  schema_json: z
    .record(z.string(), z.unknown())
    .describe("JSON-LD: Article + FAQPage. Real values from the markdown."),
  social_cuts: z.object({
    linkedin: z.string(),
    twitter: z.string(),
    instagram: z.string(),
  }),
});

export type DraftOutput = z.infer<typeof draftSchema>;
export type DraftStructure = z.infer<typeof draftStructureSchema>;

export async function writeDraft({
  brand,
  thread,
  article,
  brief,
  humanInputs,
  references,
}: {
  brand: Brand;
  thread: Thread;
  article: Article;
  brief: BriefJson;
  humanInputs: Record<string, string>;
  references: ReferenceExample[];
}): Promise<DraftOutput> {
  const emulate = references
    .filter((r) => r.voice_type === "emulate")
    .map(
      (r, i) =>
        `### Example ${i + 1}: ${r.title}\n\n${r.excerpt}\n\n_Notes: ${r.notes ?? ""}_`,
    )
    .join("\n\n---\n\n");

  const avoid = references
    .filter((r) => r.voice_type === "avoid")
    .map((r) => `- ${r.title}: ${r.notes ?? ""}`)
    .join("\n");

  const slots = brief.human_input_slots
    .map((slot) => {
      const value = humanInputs[slot.key]?.trim() || "(empty)";
      return `### ${slot.label} (${slot.type})\n${slot.description}\n\n**Input:**\n${value}`;
    })
    .join("\n\n---\n\n");

  const prompt = `
You are writing a full article for ${brand.name}. You are NOT an AI assistant — you are a human marketer who writes.

# The job

Write a complete article in Markdown for:
- Title: ${article.title}
- Target query: ${article.target_query}
- Format: ${article.format}
- Inside thread: ${thread.title}

# What makes this article un-AI

The human inputs below. Use them VERBATIM or NEAR-VERBATIM. Light edits for prose fit only. These ingredients prove a human wrote this.

# Voice exemplars (EMULATE)

${emulate}

# Anti-voice (AVOID entirely)

${avoid}

# Brand: ${brand.name}

${brand.about}

# Brief

**Direct answer (use as opener):**
${brief.direct_answer}

**H2 outline:**
${brief.h2_outline.map((h, i) => `${i + 1}. ${h.heading} — ${h.notes ?? h.question_it_answers}`).join("\n")}

**FAQ to include at end:**
${brief.faq.map((f) => `- ${f.question}`).join("\n")}

**Internal links to weave in:**
${brief.internal_links.map((l) => `- "${l.anchor}" → ${l.target_url_pattern}`).join("\n")}

# Human inputs (USE THESE)

${slots}

# Hard rules

${VOICE_RULES_PROMPT}

ADDITIONALLY:
- Mention ${brand.name} BY NAME 3+ times. Never "the platform" or "our service".
- Each section traces back to: a human input above, a cited data point with [source: X], or a reference example. Pure LLM extrapolation = kill that section.
- Cite data points inline as [source: X]. Greg will verify.
- Vary sentence cadence (>30% length variance within paragraphs). Short. Short. Then longer. Fragments are fine.
- Max 4 sentences per paragraph.

# Output

- markdown: full article opening with the direct_answer
- schema_json: JSON-LD with Article + FAQPage, populated from this draft
- social_cuts: real linkedin/twitter/instagram cuts (same voice rules)
`.trim();

  const { object } = await generateObject({
    model: models.smart,
    schema: draftSchema,
    prompt,
    temperature: 0.75,
    maxRetries: 2,
  });

  return object;
}

/**
 * Streaming variant — returns a streamText result so the API route can pipe
 * Markdown tokens straight to the client. After the stream finishes the
 * caller is expected to run `extractDraftStructure(text)` to populate
 * schema_json + social_cuts.
 */
export function streamDraft({
  brand,
  thread,
  article,
  brief,
  humanInputs,
  references,
  onFinish,
}: {
  brand: Brand;
  thread: Thread;
  article: Article;
  brief: BriefJson;
  humanInputs: Record<string, string>;
  references: ReferenceExample[];
  onFinish?: (event: { text: string }) => void | Promise<void>;
}) {
  const prompt = buildDraftPrompt({
    brand,
    thread,
    article,
    brief,
    humanInputs,
    references,
    markdownOnly: true,
  });

  return streamText({
    model: models.smart,
    prompt,
    temperature: 0.75,
    maxOutputTokens: 8192,
    onFinish,
  });
}

/**
 * Second pass — given the streamed markdown, extract JSON-LD schema and
 * social cuts as structured data. Cheap Flash call, ~2s.
 */
export async function extractDraftStructure({
  brand,
  article,
  brief,
  markdown,
}: {
  brand: Brand;
  article: Article;
  brief: BriefJson;
  markdown: string;
}): Promise<DraftStructure> {
  const structurePrompt = `
Given this published article, produce the JSON-LD schema and three social cuts.

# Article markdown

${markdown}

# Target query
${article.target_query}

# Title
${article.title}

# Brand
${brand.name}

# FAQ from brief (use these exact questions)
${brief.faq.map((f) => `- ${f.question}`).join("\n")}

# Voice rules (still apply to social cuts)
${VOICE_RULES_PROMPT}

# Output

- schema_json: JSON-LD object with @context, @type "Article" (mainEntity for headline/datePublished/author etc.), and a FAQPage @type with the questions. Use real values pulled from the markdown.
- social_cuts: real linkedin/twitter/instagram cuts in the same voice as the article. No banned phrases.
`.trim();

  const { object } = await generateObject({
    model: models.fast,
    schema: draftStructureSchema,
    prompt: structurePrompt,
    temperature: 0.4,
  });

  return object;
}

function buildDraftPrompt(args: {
  brand: Brand;
  thread: Thread;
  article: Article;
  brief: BriefJson;
  humanInputs: Record<string, string>;
  references: ReferenceExample[];
  markdownOnly?: boolean;
}): string {
  const {
    brand,
    thread,
    article,
    brief,
    humanInputs,
    references,
    markdownOnly,
  } = args;

  const emulate = references
    .filter((r) => r.voice_type === "emulate")
    .map(
      (r, i) =>
        `### Example ${i + 1}: ${r.title}\n\n${r.excerpt}\n\n_Notes: ${r.notes ?? ""}_`,
    )
    .join("\n\n---\n\n");

  const avoid = references
    .filter((r) => r.voice_type === "avoid")
    .map((r) => `- ${r.title}: ${r.notes ?? ""}`)
    .join("\n");

  const slots = brief.human_input_slots
    .map((slot) => {
      const value = humanInputs[slot.key]?.trim() || "(empty)";
      return `### ${slot.label} (${slot.type})\n${slot.description}\n\n**Input:**\n${value}`;
    })
    .join("\n\n---\n\n");

  const outputBlock = markdownOnly
    ? `# Output\n\nReturn ONLY the Markdown article. No preamble, no JSON, no commentary. Start the response with the direct_answer paragraph.`
    : `# Output\n\n- markdown: full article opening with the direct_answer\n- schema_json: JSON-LD with Article + FAQPage, populated from this draft\n- social_cuts: real linkedin/twitter/instagram cuts (same voice rules)`;

  return `
You are writing a full article for ${brand.name}. You are NOT an AI assistant — you are a human marketer who writes.

# The job

Write a complete article in Markdown for:
- Title: ${article.title}
- Target query: ${article.target_query}
- Format: ${article.format}
- Inside thread: ${thread.title}

# What makes this article un-AI

The human inputs below. Use them VERBATIM or NEAR-VERBATIM. Light edits for prose fit only. These ingredients prove a human wrote this.

# Voice exemplars (EMULATE)

${emulate}

# Anti-voice (AVOID entirely)

${avoid}

# Brand: ${brand.name}

${brand.about}

# Brief

**Direct answer (use as opener):**
${brief.direct_answer}

**H2 outline:**
${brief.h2_outline.map((h, i) => `${i + 1}. ${h.heading} — ${h.notes ?? h.question_it_answers}`).join("\n")}

**FAQ to include at end:**
${brief.faq.map((f) => `- ${f.question}`).join("\n")}

**Internal links to weave in:**
${brief.internal_links.map((l) => `- "${l.anchor}" → ${l.target_url_pattern}`).join("\n")}

# Human inputs (USE THESE)

${slots}

# Hard rules

${VOICE_RULES_PROMPT}

ADDITIONALLY:
- Mention ${brand.name} BY NAME 3+ times. Never "the platform" or "our service".
- Each section traces back to: a human input above, a cited data point with [source: X], or a reference example. Pure LLM extrapolation = kill that section.
- Cite data points inline as [source: X]. Greg will verify.
- Vary sentence cadence (>30% length variance within paragraphs). Short. Short. Then longer. Fragments are fine.
- Max 4 sentences per paragraph.

${outputBlock}
`.trim();
}
