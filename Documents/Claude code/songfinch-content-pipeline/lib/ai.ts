import "server-only";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

// Gemini 2.5 Flash for cheap/fast tasks (thread + article ideation, scoring, brief outline).
// `smart` was gemini-2.5-pro but Pro is gated behind paid billing — free-tier keys
// get `limit: 0` and every call 429s. Flash works on free tier and supports search
// grounding. Swap back to gemini-2.5-pro on `smart` once billing is enabled.
export const models = {
  fast: google("gemini-2.5-flash"),
  smart: google("gemini-2.5-flash"),
};

// Reusable banned-phrase regex, calibrated against Gemini's most common AI tells.
// Used by both the QA agent (deterministic pre-check) and as a system-prompt reminder.
export const BANNED_PHRASES = [
  "—",
  "delve",
  "delving",
  "delves",
  "tapestry",
  "in the realm of",
  "in the world of",
  "in today's world",
  "when it comes to",
  "whether you're",
  "elevate",
  "elevates",
  "elevating",
  "leverage",
  "leverages",
  "leveraging",
  "unlock",
  "unlocks",
  "unlocking",
  "harness",
  "harnesses",
  "harnessing",
  "spearhead",
  "spearheads",
  "spearheaded",
  "underscore",
  "underscores",
  "underscored",
  "navigate the complexities",
  "robust",
  "seamless",
  "seamlessly",
  "bespoke",
  "curated",
  "a testament to",
  "the perfect blend of",
  "not only",
  "it's important to note",
  "it's worth mentioning",
  "from heartfelt",
  "lyrically eloquent",
  "epitome of",
  "the very essence",
];

export function findBannedPhrases(
  text: string,
): Array<{ phrase: string; context: string }> {
  const hits: Array<{ phrase: string; context: string }> = [];
  for (const phrase of BANNED_PHRASES) {
    const idx = text.toLowerCase().indexOf(phrase.toLowerCase());
    if (idx === -1) continue;
    const start = Math.max(0, idx - 40);
    const end = Math.min(text.length, idx + phrase.length + 40);
    hits.push({ phrase, context: `…${text.slice(start, end)}…` });
  }
  return hits;
}

// System prompt fragment to include in every agent that generates prose.
// Repeats the rules so Gemini doesn't drift mid-generation.
export const VOICE_RULES_PROMPT = `
You write like a smart human marketer, not like AI. Voice rules — absolute:

NEVER use these phrases or patterns:
- Em-dashes (—). Use commas, periods, or parentheses.
- "Whether you're..." / "What if..." / "In today's world..." / "In the realm of..." / "When it comes to..."
- Verbs: elevate, delve, leverage, unlock, harness, spearhead, underscore, navigate (in cliché sense)
- Adjectives: robust, seamless, bespoke, curated, thoughtful (in marketing context)
- "from X to Y" constructions ("from heartfelt ballads to quirky anthems")
- "not only X but also Y"
- "a testament to", "the perfect blend of", "It's important to note"
- "tapestry", "epitome of", "the very essence"

ALWAYS:
- Open with the answer, not throat-clearing.
- Be specific. "A dad who doesn't show emotion" beats "emotional dads."
- Vary sentence cadence. Short. Short. Then longer. Fragments are fine.
- Use real examples. Never generic.
- Max 4 sentences per paragraph.
`.trim();
