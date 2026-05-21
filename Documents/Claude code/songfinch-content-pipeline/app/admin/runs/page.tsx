import { fetchAgentRuns, summarizeAgentRuns } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SetupNotice } from "../../_components/setup-notice";

// Force fresh data every load — observability page should never be stale.
export const dynamic = "force-dynamic";

/**
 * Agent observability dashboard. Reads from agent_runs (populated by
 * trackAgentRun wrapper in agent routes).
 *
 * Answers four questions in one screen:
 *   1. How much have I spent today / total?
 *   2. Which agents fail most?
 *   3. What's the failure mode distribution? (rate limits, overloads, schema, etc.)
 *   4. What were the last few failures (with timestamps + error messages)?
 */
export default async function AgentRunsPage() {
  const { data: runs, configured, error } = await fetchAgentRuns(500);
  if (!configured) return <SetupNotice />;

  if (error) {
    return (
      <Card className="p-8 max-w-2xl border-destructive/40 bg-destructive/5">
        <h2 className="text-lg font-semibold">Error loading runs</h2>
        <p className="text-sm text-destructive mt-2">{error}</p>
        <p className="text-xs text-muted-foreground mt-3">
          If the table doesn&apos;t exist yet, apply migration
          0006_agent_runs.sql to Supabase.
        </p>
      </Card>
    );
  }

  const summary = summarizeAgentRuns(runs);

  // Today bucket — count + cost for runs in the last 24 hours
  const dayCutoff = Date.now() - 24 * 60 * 60 * 1000;
  const today = runs.filter((r) => new Date(r.ran_at).getTime() > dayCutoff);
  const todaySummary = summarizeAgentRuns(today);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Agent runs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Observability for every LLM call. Last {runs.length} runs across all
          agents.
        </p>
      </div>

      {/* Top-line stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total runs (24h)"
          value={todaySummary.totalRuns.toLocaleString()}
        />
        <StatCard
          label="Cost (24h)"
          value={`$${todaySummary.totalCostUsd.toFixed(4)}`}
        />
        <StatCard
          label="All-time cost"
          value={`$${summary.totalCostUsd.toFixed(2)}`}
        />
        <StatCard
          label="Avg duration"
          value={`${Math.round(summary.avgDurationMs / 1000)}s`}
        />
      </div>

      {/* Per-agent breakdown */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4">Per-agent breakdown</h2>
        {summary.byAgent.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No runs recorded yet. The first time you click Research GEO,
            Research SEO, Run QA, or Score against checklist, a row will land
            here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b">
                  <th className="py-2 pr-4 font-medium">Agent</th>
                  <th className="py-2 pr-4 font-medium text-right">Runs</th>
                  <th className="py-2 pr-4 font-medium text-right">Success</th>
                  <th className="py-2 pr-4 font-medium text-right">Failed</th>
                  <th className="py-2 pr-4 font-medium text-right">
                    Success rate
                  </th>
                  <th className="py-2 pr-4 font-medium text-right">Cost</th>
                  <th className="py-2 pr-4 font-medium text-right">Avg time</th>
                </tr>
              </thead>
              <tbody>
                {summary.byAgent.map((row) => {
                  const successRate =
                    row.runs > 0 ? (row.successes / row.runs) * 100 : 0;
                  return (
                    <tr key={row.agent} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">
                        {row.agent}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {row.runs}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums text-emerald-700">
                        {row.successes}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums text-red-700">
                        {row.failures || ""}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        <span
                          className={
                            successRate >= 90
                              ? "text-emerald-700"
                              : successRate >= 70
                                ? "text-amber-700"
                                : "text-red-700"
                          }
                        >
                          {successRate.toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums font-mono text-xs">
                        ${row.totalCostUsd.toFixed(4)}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums font-mono text-xs text-muted-foreground">
                        {Math.round(row.avgDurationMs / 1000)}s
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Failure mode distribution */}
      {summary.byErrorKind.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold mb-4">Failure modes</h2>
          <div className="flex flex-wrap gap-2">
            {summary.byErrorKind.map((row) => (
              <Badge
                key={row.errorKind}
                variant="outline"
                className="text-xs font-mono"
              >
                {row.errorKind} · {row.count}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Recent failures */}
      {summary.recentFailures.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold mb-4">Recent failures</h2>
          <div className="space-y-3">
            {summary.recentFailures.map((row) => (
              <div key={row.id} className="border-l-2 border-red-500 pl-3 py-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono">{row.agent}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {row.error_kind}
                  </Badge>
                  <span className="text-muted-foreground">
                    {new Date(row.ran_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm mt-1 text-red-900">{row.error_message}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent runs list */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4">
          Recent runs · {Math.min(runs.length, 50)} shown
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b">
                <th className="py-2 pr-4 font-medium">When</th>
                <th className="py-2 pr-4 font-medium">Agent</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium text-right">Duration</th>
                <th className="py-2 pr-4 font-medium text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {runs.slice(0, 50).map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="py-1.5 pr-4 text-xs text-muted-foreground tabular-nums">
                    {new Date(row.ran_at).toLocaleString()}
                  </td>
                  <td className="py-1.5 pr-4 font-mono text-xs">{row.agent}</td>
                  <td className="py-1.5 pr-4">
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase tracking-wide ${
                        row.status === "failed"
                          ? "border-red-200 bg-red-50 text-red-900"
                          : "border-emerald-200 bg-emerald-50 text-emerald-900"
                      }`}
                    >
                      {row.status.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="py-1.5 pr-4 text-right tabular-nums font-mono text-xs text-muted-foreground">
                    {row.duration_ms != null
                      ? `${(row.duration_ms / 1000).toFixed(1)}s`
                      : "—"}
                  </td>
                  <td className="py-1.5 pr-4 text-right tabular-nums font-mono text-xs">
                    {row.cost_usd != null ? `$${row.cost_usd.toFixed(4)}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-2xl font-semibold mt-1 tabular-nums">{value}</p>
    </Card>
  );
}
