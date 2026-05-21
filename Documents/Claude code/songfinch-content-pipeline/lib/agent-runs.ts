import "server-only";
import { getSupabase } from "./supabase";

// Gemini 2.5 Flash pricing (per 1M tokens). Used to estimate cost at write
// time so the dashboard can show totals without hitting Google's billing API.
// When we go multi-provider, extend this map. The numbers are conservative
// (output assumes thinking-on rate) so cost estimates lean high not low.
const MODEL_PRICING: Record<
  string,
  { inputUsdPerM: number; outputUsdPerM: number }
> = {
  "gemini-2.5-flash": { inputUsdPerM: 0.3, outputUsdPerM: 2.5 },
  "gemini-2.5-pro": { inputUsdPerM: 1.25, outputUsdPerM: 10 },
  "claude-sonnet-4-5": { inputUsdPerM: 3, outputUsdPerM: 15 },
  "claude-haiku-4-5": { inputUsdPerM: 1, outputUsdPerM: 5 },
};

const DEFAULT_MODEL = "gemini-2.5-flash";

export type AgentRunStatus =
  | "success"
  | "retried_success"
  | "failed"
  | "cancelled";

export type AgentRunInput = {
  agent: string;
  articleId?: string | null;
  threadId?: string | null;
  model?: string;
  metadata?: Record<string, unknown>;
};

export type AgentRunResult = {
  status: AgentRunStatus;
  durationMs: number;
  inputTokens?: number;
  outputTokens?: number;
  errorMessage?: string;
  errorKind?: string;
  retryCount?: number;
};

/**
 * Records one agent run into agent_runs. Fire-and-forget — failures here
 * should NEVER bubble up to the agent route; observability code dying
 * silently is better than breaking the user's request. Logs to console
 * if the write fails so we'd at least see it in dev.
 *
 * Cost is computed from token counts at write time. If tokens are missing
 * (some SDKs don't expose them), cost_usd stays null.
 */
export async function recordAgentRun(
  input: AgentRunInput,
  result: AgentRunResult,
): Promise<void> {
  const model = input.model ?? DEFAULT_MODEL;
  const pricing = MODEL_PRICING[model];
  const cost =
    pricing && result.inputTokens != null && result.outputTokens != null
      ? (result.inputTokens * pricing.inputUsdPerM) / 1_000_000 +
        (result.outputTokens * pricing.outputUsdPerM) / 1_000_000
      : null;

  try {
    const supabase = getSupabase();
    const { error } = await supabase.from("agent_runs").insert({
      article_id: input.articleId ?? null,
      thread_id: input.threadId ?? null,
      agent: input.agent,
      status: result.status,
      duration_ms: result.durationMs,
      input_tokens: result.inputTokens ?? null,
      output_tokens: result.outputTokens ?? null,
      cost_usd: cost,
      model,
      error_message: result.errorMessage ?? null,
      error_kind: result.errorKind ?? null,
      retry_count: result.retryCount ?? 0,
      metadata: input.metadata ?? null,
    });
    if (error) {
      console.warn("[agent-runs] insert failed", error.message);
    }
  } catch (err) {
    console.warn("[agent-runs] threw", err);
  }
}

/**
 * Convenience wrapper. Runs an agent function, captures timing + tokens,
 * writes one row to agent_runs, returns the function's value. Throws if
 * the inner function throws — so caller's existing try/catch still works.
 *
 * Usage:
 *
 *   const result = await trackAgentRun(
 *     { agent: "research-seo", articleId, threadId },
 *     async () => {
 *       const r = await researchSeo({ brand, thread, article });
 *       return { value: r, inputTokens: r._usage?.input, outputTokens: r._usage?.output };
 *     }
 *   );
 *
 * The inner function must return `{ value, inputTokens?, outputTokens? }`.
 * `value` is what trackAgentRun returns to the caller. The token fields are
 * optional — if missing, the run is still recorded but cost_usd is null.
 */
export async function trackAgentRun<T>(
  input: AgentRunInput,
  fn: () => Promise<{
    value: T;
    inputTokens?: number;
    outputTokens?: number;
  }>,
): Promise<T> {
  const start = Date.now();
  try {
    const out = await fn();
    await recordAgentRun(input, {
      status: "success",
      durationMs: Date.now() - start,
      inputTokens: out.inputTokens,
      outputTokens: out.outputTokens,
    });
    return out.value;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const errorKind = classifyError(message);
    await recordAgentRun(input, {
      status: "failed",
      durationMs: Date.now() - start,
      errorMessage: message,
      errorKind,
    });
    throw err;
  }
}

/**
 * Buckets a free-form error message into a category for dashboard analysis.
 * Read together with lib/agent-route.ts which surfaces similar buckets to
 * the user.
 */
export function classifyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("resource_exhausted") || m.includes("rate limit")) {
    return "rate_limit";
  }
  if (m.includes("quota") || m.includes("free_tier") || m.includes("billing")) {
    return "quota";
  }
  if (
    m.includes("503") ||
    m.includes("unavailable") ||
    m.includes("overload")
  ) {
    return "overload";
  }
  if (
    m.includes("timeout") ||
    m.includes("timed out") ||
    m.includes("aborted")
  ) {
    return "timeout";
  }
  if (
    m.includes("schema") ||
    m.includes("zod") ||
    m.includes("invalid_response") ||
    m.includes("json")
  ) {
    return "schema";
  }
  if (m.includes("auth") || m.includes("unauthorized") || m.includes("401")) {
    return "auth";
  }
  return "unknown";
}
