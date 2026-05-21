import "server-only";

/**
 * Retry + fallback wrapper for LLM calls.
 *
 * Why this exists: Gemini Flash 503-overloads transiently — we hit this
 * during the auto-draft structure extraction. The AI SDK retries 3x with
 * exponential backoff inside `streamText`/`generateObject`, but if all 3
 * attempts hit the spike, the whole step fails. This wrapper adds another
 * outer layer of retries with longer backoff, and optionally falls back to
 * a second provider on terminal failure.
 *
 * Use it from agent functions:
 *
 *   const result = await withRetry(
 *     () => researchSeo({ ... }),
 *     { tries: 2, backoffMs: 5000 }
 *   );
 *
 * Or with fallback (once we wire Groq/Claude as backup providers):
 *
 *   const result = await withFallback(
 *     () => researchSeoGemini({ ... }),
 *     () => researchSeoGroq({ ... }),
 *   );
 *
 * The wrapper is intentionally simple: it doesn't try to be smart about
 * which errors are retryable. It just retries on anything, with backoff.
 * If the same error happens 3x in a row, that's a real problem and the
 * caller's catch should surface it.
 */

export type RetryOptions = {
  /** Number of attempts total (1 = no retry, just the initial call). */
  tries?: number;
  /** Base backoff in ms; doubles each retry. */
  backoffMs?: number;
  /**
   * Returns true if the error should be retried. Default: retry on anything
   * EXCEPT auth/quota errors (those won't fix themselves with retry).
   */
  shouldRetry?: (err: unknown) => boolean;
  /** Optional callback fired before each retry; useful for logging. */
  onRetry?: (err: unknown, attempt: number) => void;
};

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, "onRetry">> = {
  tries: 2,
  backoffMs: 4000,
  shouldRetry: isTransientError,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const tries = opts.tries ?? DEFAULT_OPTIONS.tries;
  const baseBackoff = opts.backoffMs ?? DEFAULT_OPTIONS.backoffMs;
  const shouldRetry = opts.shouldRetry ?? DEFAULT_OPTIONS.shouldRetry;

  let lastErr: unknown;
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const isLast = attempt === tries - 1;
      if (isLast || !shouldRetry(err)) {
        throw err;
      }
      const wait = baseBackoff * Math.pow(2, attempt);
      opts.onRetry?.(err, attempt + 1);
      console.warn(
        `[llm-retry] attempt ${attempt + 1}/${tries} failed (${
          err instanceof Error ? err.message.slice(0, 80) : "unknown"
        }). Retrying in ${wait}ms.`,
      );
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

/**
 * Run `primary`. If it throws a non-retryable error, try `fallback`. Use
 * this once we have a second provider wired (Groq, Claude). For now it's
 * unused but the shape is here so callers can adopt it incrementally.
 */
export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  opts: { retryPrimary?: RetryOptions } = {},
): Promise<T> {
  try {
    return await withRetry(primary, opts.retryPrimary);
  } catch (primaryErr) {
    console.warn(
      "[llm-retry] primary exhausted, trying fallback:",
      primaryErr instanceof Error ? primaryErr.message : "unknown",
    );
    try {
      return await fallback();
    } catch (fallbackErr) {
      // Throw the FALLBACK error (it's the most recent), but tag the
      // primary error so observability has both.
      if (fallbackErr instanceof Error) {
        (fallbackErr as Error & { primaryError?: unknown }).primaryError =
          primaryErr;
      }
      throw fallbackErr;
    }
  }
}

/**
 * Heuristic: should we retry this error?
 *
 * RETRY (transient):
 *   - 503 / UNAVAILABLE / "overloaded" / "high demand"
 *   - 504 timeout / aborted
 *   - generic network errors
 *
 * DON'T RETRY (permanent):
 *   - 401 / 403 auth failures
 *   - 429 / RESOURCE_EXHAUSTED (quota) — waiting doesn't help if it's a
 *     daily cap; if it's a per-minute cap, the AI SDK's inner retry
 *     already waited
 *   - 400 / invalid request
 *   - schema validation failures (deterministic)
 */
export function isTransientError(err: unknown): boolean {
  if (!err) return false;
  const message = (
    err instanceof Error ? err.message : String(err)
  ).toLowerCase();

  // Quota / auth — never retry
  if (message.includes("resource_exhausted")) return false;
  if (message.includes("quota")) return false;
  if (message.includes("rate limit")) return false;
  if (message.includes("401") || message.includes("403")) return false;
  if (message.includes("unauthorized")) return false;
  if (message.includes("invalid api key")) return false;

  // Permanent client errors — never retry
  if (message.includes("400") && !message.includes("4000")) return false;
  if (message.includes("schema") && message.includes("validation"))
    return false;

  // Transient — retry
  if (message.includes("503")) return true;
  if (message.includes("504")) return true;
  if (message.includes("unavailable")) return true;
  if (message.includes("overload")) return true;
  if (message.includes("high demand")) return true;
  if (message.includes("timeout")) return true;
  if (message.includes("aborted")) return true;
  if (message.includes("network")) return true;
  if (message.includes("econnrefused")) return true;
  if (message.includes("etimedout")) return true;

  // Default: don't retry unknown errors. Better to surface than spam.
  return false;
}
