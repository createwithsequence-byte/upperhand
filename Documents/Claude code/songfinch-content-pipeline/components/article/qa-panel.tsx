"use client";

import { Card } from "@/components/ui/card";
import type { QaResult } from "@/lib/types";

/**
 * Shape of NDJSON lines emitted by /api/agents/draft/run-qa-stream.
 *
 * Kept here (next to QaPanel) rather than in workspace.tsx because this
 * panel is the only consumer. If a second consumer ever appears, lift it
 * to lib/types.ts.
 */
export type QaStreamState = {
  phase: "deterministic" | "llm" | "complete" | "error";
  deterministic?: {
    banned_phrase_hits: QaResult["banned_phrase_hits"];
    cadence_issues: QaResult["cadence_issues"];
    brandMentions: number;
  };
  judgment?: Partial<{
    voice_match_score: number;
    specificity: number;
    brand_fit: number;
    orphan_claim_issues: Array<{ section: string; reason: string }>;
    brand_drift_notes: string[];
    fact_check_flags: Array<{ claim: string; reason: string }>;
    suggested_fixes: string[];
  }>;
  qa_result?: QaResult;
  error?: string;
};

/**
 * QaPanel — renders QA verdict + suggested fixes for an article draft.
 *
 * Three states:
 *   - empty: no QA started yet
 *   - streaming: live partial results while the stream is open (NDJSON
 *     events update `streamed`)
 *   - final: full QA result loaded from `articles.qa_result`
 *
 * During streaming, we show the partial deterministic phase (banned
 * phrases, cadence) before the LLM phase (voice judgment, fixes) starts.
 */
export function QaPanel({
  result,
  streaming = false,
  streamed = null,
}: {
  result: QaResult | null;
  streaming?: boolean;
  streamed?: QaStreamState | null;
}) {
  const deterministic = streamed?.deterministic;
  const judgment = streamed?.judgment;
  const inProgressResult = streamed?.qa_result;

  const finalResult = inProgressResult ?? result;
  const showingFinal = !!finalResult && !streaming;

  const isEmpty = !streaming && !finalResult;
  if (isEmpty) {
    return (
      <Card className="p-5">
        <h2 className="font-semibold mb-3">QA</h2>
        <p className="text-sm text-muted-foreground">
          QA report appears here after Run QA is run. Catches banned phrases,
          cadence issues, orphan claims, and voice drift before publish.
        </p>
      </Card>
    );
  }

  // `passed` (the legacy boolean) is intentionally no longer used in this
  // component — the verdict is derived from score buckets below. Kept the
  // field on QaResult so downstream code that reads articles.qa_result.passed
  // continues to work.
  const score = showingFinal ? finalResult!.score : judgment?.voice_match_score;

  const banned =
    finalResult?.banned_phrase_hits ?? deterministic?.banned_phrase_hits ?? [];
  const cadence =
    finalResult?.cadence_issues ?? deterministic?.cadence_issues ?? [];
  const orphan =
    finalResult?.orphan_claim_issues ?? judgment?.orphan_claim_issues ?? [];
  const drift =
    finalResult?.brand_drift_notes ?? judgment?.brand_drift_notes ?? [];
  const facts =
    finalResult?.fact_check_flags ?? judgment?.fact_check_flags ?? [];
  const fixes = finalResult?.suggested_fixes ?? judgment?.suggested_fixes ?? [];

  // Reframed buckets — same data, less punishing language. Aligns with the
  // Today Board's Ready / Polish / Re-draft bucketing so the workspace and
  // board speak the same vocabulary.
  type Verdict = "ready" | "polish" | "redraft" | "pending";
  const verdict: Verdict =
    typeof score !== "number"
      ? "pending"
      : score >= 8
        ? "ready"
        : score >= 6
          ? "polish"
          : "redraft";

  const verdictLabel: Record<Verdict, string> = {
    ready: "Ready to ship",
    polish: "Needs polish",
    redraft: "Re-draft recommended",
    pending: "QA pending",
  };

  const verdictClass: Record<Verdict, string> = {
    ready: "border-emerald-300 bg-emerald-50",
    polish: "border-amber-300 bg-amber-50",
    redraft: "border-zinc-300 bg-zinc-50",
    pending: "border-zinc-200 bg-zinc-50",
  };

  return (
    <Card className={`p-5 ${verdictClass[verdict]}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">
          {streaming
            ? streamed?.phase === "llm"
              ? "Judging draft…"
              : streamed?.phase === "deterministic"
                ? "Scanning…"
                : streamed?.phase === "error"
                  ? `Failed: ${streamed.error ?? "stream error"}`
                  : "Running QA…"
            : verdictLabel[verdict]}
        </h2>
        <div className="flex items-center gap-2">
          {streaming && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Live
            </span>
          )}
          <span className="tabular-nums font-mono text-sm">
            {typeof score === "number" ? score.toFixed(2) : "—"} / 10
          </span>
        </div>
      </div>

      {banned.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Banned phrases ({banned.length})
          </p>
          <ul className="text-sm space-y-1">
            {banned.map((h, i) => (
              <li key={i}>
                <code className="bg-white px-1 py-0.5 rounded text-xs">
                  {h.phrase}
                </code>{" "}
                <span className="text-muted-foreground">— {h.context}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {cadence.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Cadence
          </p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            {cadence.map((c, i) => (
              <li key={i}>
                <span className="font-medium">
                  Paragraph {c.paragraph_index + 1}
                </span>{" "}
                — {c.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {orphan.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Orphan claims
          </p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            {orphan.map((o, i) => (
              <li key={i}>
                <span className="font-medium">{o?.section}</span> — {o?.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {drift.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Brand drift
          </p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            {drift.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      {facts.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Fact-check
          </p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            {facts.map((f, i) => (
              <li key={i}>
                <span className="font-medium">&ldquo;{f?.claim}&rdquo;</span> —{" "}
                {f?.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {fixes.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Suggested fixes
          </p>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            {fixes.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      )}

      {streaming && !banned.length && !orphan.length && !fixes.length && (
        <p className="text-sm text-muted-foreground italic">
          {streamed?.phase === "deterministic"
            ? "Running deterministic checks…"
            : "Waiting for Gemini…"}
        </p>
      )}
    </Card>
  );
}
