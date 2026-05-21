"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MonitorPrompt, MonitorRun } from "@/lib/data";

type Framing = NonNullable<MonitorRun["framing"]>;

const FRAMING_STYLES: Record<Framing, { label: string; className: string }> = {
  recommended: {
    label: "Recommended",
    className: "bg-emerald-100 text-emerald-900 border-emerald-200",
  },
  mentioned: {
    label: "Mentioned",
    className: "bg-zinc-100 text-zinc-700 border-zinc-200",
  },
  compared: {
    label: "Compared",
    className: "bg-amber-100 text-amber-900 border-amber-200",
  },
  negative: {
    label: "Negative",
    className: "bg-red-100 text-red-900 border-red-200",
  },
};

export function RunsTimeline({
  runs,
  prompts,
}: {
  runs: MonitorRun[];
  prompts: MonitorPrompt[];
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const promptText = (id: string | null) =>
    id
      ? (prompts.find((p) => p.id === id)?.prompt ?? "(prompt deleted)")
      : "(one-off run)";

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (runs.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        No runs yet. Add a prompt and click <strong>Run all now</strong> to
        start the timeline.
      </Card>
    );
  }

  return (
    <Card className="divide-y">
      {runs.map((r) => {
        const isOpen = expanded.has(r.id);
        const framingStyle = r.framing ? FRAMING_STYLES[r.framing] : null;
        const preview = r.response_text?.slice(0, 200) ?? "";
        const truncated = (r.response_text?.length ?? 0) > 200;
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => toggle(r.id)}
            className="w-full text-left p-4 hover:bg-muted/30 transition-colors block"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0 text-muted-foreground">
                {isOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase tracking-wide font-medium text-muted-foreground tabular-nums">
                    {new Date(r.ran_at).toLocaleString()}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase tracking-wide font-normal capitalize"
                  >
                    {r.llm}
                  </Badge>
                  {framingStyle && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase tracking-wide font-normal ${framingStyle.className}`}
                    >
                      {framingStyle.label}
                    </Badge>
                  )}
                  {typeof r.brand_position === "number" && (
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase tracking-wide font-normal"
                      title="Position among named brands in the response"
                    >
                      #{r.brand_position}
                    </Badge>
                  )}
                  {r.brand_mentioned === false && (
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase tracking-wide font-normal border-zinc-200 text-muted-foreground"
                    >
                      Not mentioned
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium leading-snug">
                  {promptText(r.prompt_id)}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isOpen ? r.response_text : preview}
                  {!isOpen && truncated && "…"}
                </p>
                {r.competitors_mentioned &&
                  r.competitors_mentioned.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Competitors:
                      </span>
                      {r.competitors_mentioned.map((c) => (
                        <Badge
                          key={c}
                          variant="outline"
                          className="text-[10px] font-normal"
                        >
                          {c}
                        </Badge>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </button>
        );
      })}
    </Card>
  );
}
