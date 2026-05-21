import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { Card } from "@/components/ui/card";

export function MentionRateCard({
  rate,
  total,
  mentioned,
  trend,
}: {
  rate: number | null;
  total: number;
  mentioned: number;
  trend: number | null;
}) {
  const pct = rate === null ? "—" : `${Math.round(rate * 100)}%`;
  const trendPct = trend !== null ? Math.round(trend * 100) : null;

  let TrendIcon = ArrowRight;
  let trendColor = "text-muted-foreground";
  if (trendPct !== null) {
    if (trendPct > 1) {
      TrendIcon = ArrowUp;
      trendColor = "text-emerald-600";
    } else if (trendPct < -1) {
      TrendIcon = ArrowDown;
      trendColor = "text-destructive";
    }
  }

  return (
    <Card className="p-5 space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Mention rate · 4-week
      </p>
      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-semibold tabular-nums tracking-tight">
          {pct}
        </span>
        {trendPct !== null && (
          <span
            className={`flex items-center gap-0.5 text-xs tabular-nums ${trendColor}`}
            title="30-day vs prior 30-day"
          >
            <TrendIcon className="w-3.5 h-3.5" />
            {trendPct > 0 ? "+" : ""}
            {trendPct}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">
        {total === 0
          ? "No runs in window"
          : `${mentioned}/${total} runs mentioned brand`}
      </p>
    </Card>
  );
}
