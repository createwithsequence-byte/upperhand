"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { scheduleArticle } from "../../actions";
import { STATUS_LABEL } from "@/lib/article-status";
import type { Article } from "@/lib/types";

export function ScheduledList({
  month,
  articles,
  threadTitlesById = {},
}: {
  month: string;
  articles: Article[];
  threadTitlesById?: Record<string, string>;
}) {
  const [pending, startTransition] = useTransition();
  const monthLabel = new Date(month + "-01").toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const sorted = [...articles].sort((a, b) =>
    (a.scheduled_for ?? "").localeCompare(b.scheduled_for ?? ""),
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {monthLabel}
      </h3>
      <Card className="divide-y">
        {sorted.map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="w-16 shrink-0 text-center">
              <p className="text-xs text-muted-foreground uppercase">
                {new Date(a.scheduled_for + "T00:00:00").toLocaleDateString(
                  undefined,
                  { weekday: "short" },
                )}
              </p>
              <p className="text-lg font-semibold tabular-nums leading-none">
                {new Date(a.scheduled_for + "T00:00:00").getDate()}
              </p>
            </div>
            <div className="flex-1 min-w-0">
              {/* Thread context label per 1.3 */}
              {threadTitlesById[a.thread_id] && (
                <p className="text-[10px] uppercase tracking-wide font-medium text-muted-foreground truncate mb-0.5">
                  {threadTitlesById[a.thread_id]} · {a.format}
                </p>
              )}
              <Link
                href={`/article/${a.id}`}
                className="font-medium hover:underline block truncate"
              >
                {a.title}
              </Link>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                {/* Volume tier badge removed in the 2.10 cleanup — that data
                    now lives only on seo_research, fetched on the article
                    workspace. Schedule list keeps status + angle for triage. */}
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase tracking-wide capitalize"
                >
                  {STATUS_LABEL[a.status] ?? a.status}
                </Badge>
                {a.committed_angle && (
                  <span className="text-xs text-muted-foreground truncate">
                    · {a.committed_angle}
                  </span>
                )}
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await scheduleArticle(a.id, null);
                  if (res.ok) toast.success("Removed from schedule");
                  else toast.error(res.error);
                })
              }
              aria-label="Remove from schedule"
              className="opacity-60 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </Card>
    </div>
  );
}
