import { fetchMonitorPrompts, fetchMonitorRuns } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SetupNotice } from "../_components/setup-notice";
import { RunAllButton } from "./_components/run-all-button";
import { PromptList } from "./_components/prompt-list";
import { MentionRateCard } from "./_components/mention-rate-card";
import { FramingBreakdown } from "./_components/framing-breakdown";
import { RunsTimeline } from "./_components/runs-timeline";

const FOUR_WEEKS_MS = 28 * 24 * 60 * 60 * 1000;

export default async function MonitorPage() {
  const [promptsRes, runsRes] = await Promise.all([
    fetchMonitorPrompts(),
    fetchMonitorRuns(100),
  ]);

  if (!promptsRes.configured) return <SetupNotice />;

  const prompts = promptsRes.data;
  const runs = runsRes.data;

  // Rolling 4-week window for the stats cards.
  const cutoff = Date.now() - FOUR_WEEKS_MS;
  const recentRuns = runs.filter((r) => new Date(r.ran_at).getTime() >= cutoff);

  // Mention rate: % of runs in the last 4 weeks where brand_mentioned = true.
  const totalRecent = recentRuns.length;
  const mentioned = recentRuns.filter((r) => r.brand_mentioned === true).length;
  const mentionRate = totalRecent > 0 ? mentioned / totalRecent : null;

  // Trend: compare last 30 days vs previous 30 days.
  const thirtyMs = 30 * 24 * 60 * 60 * 1000;
  const last30 = runs.filter(
    (r) => new Date(r.ran_at).getTime() >= Date.now() - thirtyMs,
  );
  const prev30 = runs.filter((r) => {
    const t = new Date(r.ran_at).getTime();
    return t >= Date.now() - 2 * thirtyMs && t < Date.now() - thirtyMs;
  });
  const last30Rate = last30.length
    ? last30.filter((r) => r.brand_mentioned).length / last30.length
    : null;
  const prev30Rate = prev30.length
    ? prev30.filter((r) => r.brand_mentioned).length / prev30.length
    : null;
  const trend =
    last30Rate !== null && prev30Rate !== null ? last30Rate - prev30Rate : null;

  // Framing breakdown
  const framingCounts = recentRuns.reduce<Record<string, number>>((acc, r) => {
    if (r.framing) acc[r.framing] = (acc[r.framing] ?? 0) + 1;
    return acc;
  }, {});

  // Most recent run time across ALL prompts (regardless of cadence window)
  const mostRecentRun = runs[0]?.ran_at ?? null;

  return (
    <div className="space-y-8">
      <div className="space-y-2 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">
          LLM Citation Monitor
        </h1>
        <p className="text-muted-foreground text-balance">
          Track how LLMs answer brand-relevant prompts. Each run captures the
          full response, checks if the brand is mentioned, where it ranks among
          named brands, and how it&apos;s framed.
        </p>
      </div>

      <Card className="p-4 flex items-center justify-between gap-4 border-zinc-200">
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="text-[10px] uppercase tracking-wide font-normal"
            title="OpenAI and Perplexity coming in v2"
          >
            Gemini only
          </Badge>
          <span className="text-xs text-muted-foreground">
            {mostRecentRun
              ? `Last run ${new Date(mostRecentRun).toLocaleString()}`
              : "No runs yet"}
          </span>
        </div>
        <RunAllButton
          activePromptCount={prompts.filter((p) => p.active).length}
        />
      </Card>

      {runsRes.error && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {runsRes.error}
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
        {/* Left column — prompts CRUD */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Saved prompts
          </h2>
          <PromptList prompts={prompts} />
        </div>

        {/* Right column — stats + timeline */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MentionRateCard
              rate={mentionRate}
              total={totalRecent}
              mentioned={mentioned}
              trend={trend}
            />
            <FramingBreakdown counts={framingCounts} total={totalRecent} />
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Recent runs
            </h2>
            <RunsTimeline runs={runs.slice(0, 20)} prompts={prompts} />
          </div>
        </div>
      </div>
    </div>
  );
}
