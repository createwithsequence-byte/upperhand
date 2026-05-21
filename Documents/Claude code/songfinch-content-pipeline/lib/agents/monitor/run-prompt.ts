import "server-only";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

// Grounded — simulates a real user typing into ChatGPT/Perplexity with search.
const groundedModel = google("gemini-2.5-flash", {
  useSearchGrounding: true,
});

/**
 * Run a monitor prompt against Gemini as if a real user typed it. No system
 * prompt, no brand context injected — we want the unbiased response that a
 * stranger would get when asking the LLM about our category. Captures the
 * full response_text for downstream analysis.
 *
 * Returns the raw text. Caller persists it to monitor_runs and then invokes
 * analyzeMention to fill in the structured fields.
 */
export async function runMonitorPrompt({
  prompt,
}: {
  prompt: string;
}): Promise<{ response_text: string }> {
  const result = await generateText({
    model: groundedModel,
    prompt, // Literal user prompt — no system instruction, no scaffolding
    temperature: 0.7,
  });

  return { response_text: result.text };
}
