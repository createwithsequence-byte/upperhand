"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircleQuestion, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PromptUniverseRow, ThreadPromptUniverse } from "@/lib/data";

const INTENT_STYLES: Record<PromptUniverseRow["intent"], string> = {
  transactional: "border-emerald-200 bg-emerald-50 text-emerald-900",
  informational: "border-zinc-200 bg-zinc-50 text-zinc-700",
  comparative: "border-amber-200 bg-amber-50 text-amber-900",
  navigational: "border-blue-200 bg-blue-50 text-blue-900",
};

const FREQUENCY_STYLES: Record<
  PromptUniverseRow["frequency_estimate"],
  string
> = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-900",
  medium: "border-amber-200 bg-amber-50 text-amber-900",
  low: "border-zinc-200 bg-zinc-50 text-zinc-700",
};

export function PromptUniversePanel({
  threadId,
  research,
}: {
  threadId: string;
  research: ThreadPromptUniverse | null;
}) {
  const [pending, setPending] = useState(false);
  const [sortKey, setSortKey] = useState<
    "score" | "difficulty" | "frequency" | "intent"
  >("score");
  const router = useRouter();

  const handleExpand = async () => {
    setPending(true);
    try {
      const res = await fetch("/api/agents/geo/expand-prompts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ thread_id: threadId, count: 25 }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "Prompt expansion failed");
        return;
      }
      toast.success(`${data.count} prompts mapped`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "unknown error");
    } finally {
      setPending(false);
    }
  };

  if (!research) {
    return (
      <Card className="p-6 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MessageCircleQuestion className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold">Prompt universe</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Map natural-language prompts users type into ChatGPT / Perplexity /
            Gemini / Claude inside this thread. Intent + frequency + citation
            difficulty per prompt.
          </p>
        </div>
        <Button
          onClick={handleExpand}
          disabled={pending}
          className="bg-zinc-950 hover:bg-zinc-800 gap-2 shrink-0"
        >
          {pending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Mapping…
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Map prompts
            </>
          )}
        </Button>
      </Card>
    );
  }

  const freqWeight = { high: 3, medium: 2, low: 1 } as const;
  const sorted = [...research.prompts].sort((a, b) => {
    switch (sortKey) {
      case "difficulty":
        return a.citation_difficulty - b.citation_difficulty;
      case "frequency":
        return (
          freqWeight[b.frequency_estimate] - freqWeight[a.frequency_estimate]
        );
      case "intent":
        return a.intent.localeCompare(b.intent);
      case "score":
      default:
        return (
          freqWeight[b.frequency_estimate] * 100 -
          b.citation_difficulty -
          (freqWeight[a.frequency_estimate] * 100 - a.citation_difficulty)
        );
    }
  });

  const intentCounts = research.prompts.reduce<
    Record<PromptUniverseRow["intent"], number>
  >(
    (acc, p) => {
      acc[p.intent]++;
      return acc;
    },
    {
      transactional: 0,
      informational: 0,
      comparative: 0,
      navigational: 0,
    },
  );

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <MessageCircleQuestion className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold">Prompt universe</h2>
            <Badge
              variant="outline"
              className="text-[10px] uppercase tracking-wide font-normal"
            >
              {research.prompts.length} mapped
            </Badge>
            {Object.entries(intentCounts).map(
              ([intent, count]) =>
                count > 0 && (
                  <Badge
                    key={intent}
                    variant="outline"
                    className={`text-[10px] uppercase tracking-wide font-normal ${INTENT_STYLES[intent as PromptUniverseRow["intent"]]}`}
                  >
                    {count} {intent}
                  </Badge>
                ),
            )}
          </div>
        </div>
        <Button
          onClick={handleExpand}
          disabled={pending}
          variant="outline"
          size="sm"
          className="gap-2 shrink-0"
        >
          {pending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          Re-map
        </Button>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">Sort by:</span>
        {(
          [
            { key: "score", label: "Best score" },
            { key: "frequency", label: "Frequency" },
            { key: "difficulty", label: "Easiest" },
            { key: "intent", label: "Intent" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSortKey(opt.key)}
            className={`px-2 py-0.5 rounded ${
              sortKey === opt.key
                ? "bg-zinc-950 text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Prompt</th>
              <th className="text-left px-4 py-2 font-medium">Intent</th>
              <th className="text-left px-4 py-2 font-medium">Frequency</th>
              <th className="text-right px-4 py-2 font-medium">
                Citation difficulty
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr
                key={p.prompt}
                className="border-t hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3 align-top">
                  <span className="font-mono text-xs">{p.prompt}</span>
                </td>
                <td className="px-4 py-3 align-top">
                  <Badge
                    variant="outline"
                    className={`text-[9px] uppercase tracking-wide font-normal ${INTENT_STYLES[p.intent]}`}
                  >
                    {p.intent}
                  </Badge>
                </td>
                <td className="px-4 py-3 align-top">
                  <Badge
                    variant="outline"
                    className={`text-[9px] uppercase tracking-wide font-normal ${FREQUENCY_STYLES[p.frequency_estimate]}`}
                  >
                    {p.frequency_estimate}
                  </Badge>
                </td>
                <td className="px-4 py-3 align-top text-right">
                  <span
                    className={`text-xs tabular-nums ${
                      p.citation_difficulty < 30
                        ? "text-emerald-700"
                        : p.citation_difficulty > 60
                          ? "text-destructive"
                          : ""
                    }`}
                  >
                    {p.citation_difficulty}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {research.researched_at && (
        <p className="text-xs text-muted-foreground text-right">
          Researched {new Date(research.researched_at).toLocaleString()}
        </p>
      )}
    </Card>
  );
}
