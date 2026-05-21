import "server-only";
import { NextResponse } from "next/server";

/**
 * Turn an unknown thrown error from an agent call into a structured JSON
 * response the client can actually parse. The default Next.js error response
 * is an empty 500 body — `await res.json()` on the client then throws
 * "Unexpected end of JSON input", hiding the real cause.
 *
 * We pull out the most common Vercel AI SDK / Gemini error shapes so the
 * client gets something useful: quota exceeded, model not available,
 * timeout, validation failure, generic message.
 */
export function agentErrorResponse(agent: string, err: unknown): NextResponse {
  const fallback = "Agent failed for an unknown reason";
  const message = err instanceof Error ? err.message : fallback;

  // Inspect for known shapes from @ai-sdk
  type AiSdkError = {
    name?: string;
    reason?: string;
    lastError?: { statusCode?: number; responseBody?: string };
    statusCode?: number;
    responseBody?: string;
  };
  const e = err as AiSdkError;

  // Surface Gemini quota errors specifically — most common cause of failures
  // when the API key is on the free tier.
  if (
    e?.lastError?.statusCode === 429 ||
    e?.statusCode === 429 ||
    /quota|rate.?limit|RESOURCE_EXHAUSTED/i.test(message)
  ) {
    const isFreeTierZero = /limit:\s*0/i.test(
      e?.lastError?.responseBody ?? e?.responseBody ?? message,
    );
    console.error(`[${agent}] Gemini quota exceeded`, message);
    return NextResponse.json(
      {
        ok: false,
        error: isFreeTierZero
          ? "Gemini model not available on free tier (limit: 0). Enable billing on your Gemini API key, or switch the agent to gemini-2.5-flash."
          : "Gemini rate limit hit. Wait a minute and try again.",
        agent,
      },
      { status: 429 },
    );
  }

  // Timeouts
  if (/timeout|aborted|ETIMEDOUT/i.test(message)) {
    console.error(`[${agent}] timeout`, message);
    return NextResponse.json(
      { ok: false, error: "Agent timed out. Retry.", agent },
      { status: 504 },
    );
  }

  // Zod / structured-output validation failure
  if (
    /schema|invalid|validation|zod/i.test(e?.name ?? "") ||
    /Schema/i.test(message)
  ) {
    console.error(`[${agent}] schema validation failed`, message);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Gemini returned data that didn't match the expected schema. Retry — usually transient.",
        detail: message.slice(0, 240),
        agent,
      },
      { status: 502 },
    );
  }

  // Generic fallback
  console.error(`[${agent}]`, err);
  return NextResponse.json(
    { ok: false, error: message.slice(0, 240), agent },
    { status: 500 },
  );
}
