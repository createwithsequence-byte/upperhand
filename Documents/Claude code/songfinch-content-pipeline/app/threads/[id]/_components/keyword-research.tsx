"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Search, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { approveKeywordsAsArticles } from "../../../actions";
import type { KeywordResearch as KR, KeywordRow } from "@/lib/types";

// Limit how many auto-drafts run in parallel. Gemini Flash free tier is
// 250K input tokens/min — drafting in tight bursts of more than ~3 at once
// will burst-blow the budget the same way ungated keyword expansion did.
const DRAFT_CONCURRENCY = 3;

const TIER_STYLES: Record<KeywordRow["volume_tier"], string> = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-900",
  medium: "border-amber-200 bg-amber-50 text-amber-900",
  low: "border-zinc-200 bg-zinc-50 text-zinc-700",
};

const COMPETITOR_TYPE_LABEL: Record<KeywordRow["competitor_type"], string> = {
  brand_owned: "Brand",
  competitor: "Competitor",
  publisher: "Publisher",
  forum: "Forum",
  marketplace: "Marketplace",
  blog: "Blog",
  mixed: "Mixed",
};

export function KeywordResearchPanel({
  threadId,
  research,
}: {
  threadId: string;
  research: KR | null;
}) {
  const [pending, setPending] = useState(false);
  const [sortKey, setSortKey] = useState<
    "score" | "volume" | "difficulty" | "alpha"
  >("score");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [approving, setApproving] = useState(false);
  const [draftProgress, setDraftProgress] = useState<{
    done: number;
    total: number;
    failed: number;
  } | null>(null);
  const router = useRouter();

  const toggleKeyword = (keyword: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(keyword)) next.delete(keyword);
      else next.add(keyword);
      return next;
    });
  };

  const toggleAllVisible = (keywords: KeywordRow[]) => {
    setSelected((prev) => {
      const allSelected = keywords.every((k) => prev.has(k.keyword));
      if (allSelected) return new Set();
      return new Set(keywords.map((k) => k.keyword));
    });
  };

  /**
   * Path A approval flow: selected keywords -> article rows -> auto-drafts.
   * Articles are created server-side in one shot (fast), then drafts fire
   * client-side in parallel with concurrency 3 so we don't blow Gemini's
   * 250K/min input token budget.
   */
  const handleApproveAsArticles = async (kwRows: KeywordRow[]) => {
    const selectedRows = kwRows.filter((k) => selected.has(k.keyword));
    if (selectedRows.length === 0) {
      toast.error("Pick at least one keyword");
      return;
    }
    setApproving(true);
    setDraftProgress({ done: 0, total: selectedRows.length, failed: 0 });
    try {
      const actionRes = await approveKeywordsAsArticles(
        threadId,
        selectedRows.map((k) => ({
          keyword: k.keyword,
          intent: k.intent,
          volume_tier: k.volume_tier,
          search_volume_estimate: k.search_volume_estimate,
          difficulty: k.difficulty,
          note: k.note,
        })),
      );
      if (!actionRes.ok) {
        toast.error(actionRes.error);
        return;
      }
      const articleIds = actionRes.data.articleIds;
      toast.success(
        `${articleIds.length} article${articleIds.length === 1 ? "" : "s"} created. Drafting in background…`,
      );
      router.refresh();
      setSelected(new Set());

      // Fire auto-drafts with bounded concurrency. We don't await each draft's
      // stream here — we just kick off the requests and let the server's
      // onFinish handler persist results. The /articles page will show each
      // article transitioning drafting -> ready_for_qa as it lands.
      let cursor = 0;
      let done = 0;
      let failed = 0;
      const runOne = async (articleId: string) => {
        try {
          const res = await fetch("/api/agents/draft/auto-draft", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ article_id: articleId }),
          });
          if (!res.ok) {
            failed++;
          } else if (res.body) {
            // Drain the stream so the server's onFinish runs to completion.
            const reader = res.body.getReader();
            while (true) {
              const { done: streamDone } = await reader.read();
              if (streamDone) break;
            }
          }
        } catch {
          failed++;
        } finally {
          done++;
          setDraftProgress({ done, total: articleIds.length, failed });
        }
      };

      const workers: Promise<void>[] = [];
      const next = async () => {
        while (cursor < articleIds.length) {
          const i = cursor++;
          await runOne(articleIds[i]);
        }
      };
      for (let i = 0; i < Math.min(DRAFT_CONCURRENCY, articleIds.length); i++) {
        workers.push(next());
      }
      await Promise.all(workers);

      toast.success(
        `Drafts complete: ${done - failed}/${articleIds.length}${failed ? ` (${failed} failed)` : ""}. Find them in /articles.`,
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "unknown error");
    } finally {
      setApproving(false);
      setDraftProgress(null);
    }
  };

  const handleExpand = async () => {
    setPending(true);
    try {
      const res = await fetch("/api/agents/seo/expand-keywords", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ thread_id: threadId, count: 25 }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Expansion failed");
        return;
      }
      toast.success(
        `${data.count} keywords mapped (${data.high_volume} high volume)`,
      );
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
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold">Keyword universe</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Map 20-30 keywords inside this thread with volume, difficulty, and
            who&apos;s currently ranking. Use this to decide what&apos;s worth
            pursuing before generating articles.
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
              Mapping (~60s)…
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Map keywords
            </>
          )}
        </Button>
      </Card>
    );
  }

  // Sort
  const tierWeight = { high: 3, medium: 2, low: 1 } as const;
  const sorted = [...research.keywords].sort((a, b) => {
    switch (sortKey) {
      case "volume":
        return b.search_volume_estimate - a.search_volume_estimate;
      case "difficulty":
        return a.difficulty - b.difficulty;
      case "alpha":
        return a.keyword.localeCompare(b.keyword);
      case "score":
      default:
        return (
          tierWeight[b.volume_tier] * 100 -
          b.difficulty -
          (tierWeight[a.volume_tier] * 100 - a.difficulty)
        );
    }
  });

  const tierCounts = research.keywords.reduce(
    (acc, k) => {
      acc[k.volume_tier]++;
      return acc;
    },
    { high: 0, medium: 0, low: 0 } as Record<KeywordRow["volume_tier"], number>,
  );

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold">Keyword universe</h2>
            <Badge
              variant="outline"
              className="text-[10px] uppercase tracking-wide font-normal"
            >
              {research.keywords.length} mapped
            </Badge>
            <Badge
              variant="outline"
              className={`text-[10px] uppercase tracking-wide font-normal ${TIER_STYLES.high}`}
            >
              {tierCounts.high} high
            </Badge>
            <Badge
              variant="outline"
              className={`text-[10px] uppercase tracking-wide font-normal ${TIER_STYLES.medium}`}
            >
              {tierCounts.medium} med
            </Badge>
            <Badge
              variant="outline"
              className={`text-[10px] uppercase tracking-wide font-normal ${TIER_STYLES.low}`}
            >
              {tierCounts.low} low
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {research.cluster_summary}
          </p>
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
            { key: "volume", label: "Volume" },
            { key: "difficulty", label: "Easiest" },
            { key: "alpha", label: "A→Z" },
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
              <th className="px-3 py-2 w-8">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={
                    sorted.length > 0 &&
                    sorted.every((k) => selected.has(k.keyword))
                  }
                  onChange={() => toggleAllVisible(sorted)}
                  className="cursor-pointer accent-zinc-950"
                />
              </th>
              <th className="text-left px-4 py-2 font-medium">Keyword</th>
              <th className="text-left px-4 py-2 font-medium">Intent</th>
              <th className="text-right px-4 py-2 font-medium">Volume</th>
              <th className="text-right px-4 py-2 font-medium">KD</th>
              <th className="text-left px-4 py-2 font-medium">Top now</th>
              <th className="text-left px-4 py-2 font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((k) => (
              <tr
                key={k.keyword}
                onClick={() => toggleKeyword(k.keyword)}
                className={`border-t cursor-pointer transition-colors ${
                  selected.has(k.keyword)
                    ? "bg-emerald-50 hover:bg-emerald-100"
                    : "hover:bg-muted/30"
                }`}
              >
                <td className="px-3 py-3 align-top w-8">
                  <input
                    type="checkbox"
                    aria-label={`Select ${k.keyword}`}
                    checked={selected.has(k.keyword)}
                    onChange={() => toggleKeyword(k.keyword)}
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer accent-zinc-950"
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex items-start gap-2">
                    <span
                      className={`shrink-0 mt-0.5 inline-block w-2 h-2 rounded-full ${
                        k.volume_tier === "high"
                          ? "bg-emerald-500"
                          : k.volume_tier === "medium"
                            ? "bg-amber-500"
                            : "bg-zinc-300"
                      }`}
                    />
                    <span className="font-mono text-xs">{k.keyword}</span>
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <span className="text-xs text-muted-foreground capitalize">
                    {k.intent}
                  </span>
                </td>
                <td className="px-4 py-3 align-top text-right tabular-nums">
                  <span className="text-xs">
                    {k.search_volume_estimate.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3 align-top text-right tabular-nums">
                  <span
                    className={`text-xs ${
                      k.difficulty < 30
                        ? "text-emerald-700"
                        : k.difficulty > 60
                          ? "text-destructive"
                          : ""
                    }`}
                  >
                    {k.difficulty}
                  </span>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="space-y-0.5">
                    <p className="text-xs font-mono truncate max-w-[14ch]">
                      {k.top_competitor}
                    </p>
                    <Badge
                      variant="outline"
                      className="text-[9px] uppercase tracking-wide font-normal"
                    >
                      {COMPETITOR_TYPE_LABEL[k.competitor_type]}
                    </Badge>
                  </div>
                </td>
                <td className="px-4 py-3 align-top max-w-md">
                  <p className="text-xs text-muted-foreground leading-snug">
                    {k.note}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Approve → auto-draft bar */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t">
        <div className="text-sm">
          {selected.size === 0 ? (
            <span className="text-muted-foreground">
              Pick keywords to auto-draft. Each becomes a full article (no
              brief, no human paste).
            </span>
          ) : (
            <span>
              <span className="font-medium">{selected.size}</span> keyword
              {selected.size === 1 ? "" : "s"} selected
              {selected.size > DRAFT_CONCURRENCY && (
                <span className="text-muted-foreground">
                  {" "}
                  · drafts run {DRAFT_CONCURRENCY} at a time
                </span>
              )}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {draftProgress && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {draftProgress.done}/{draftProgress.total} drafted
              {draftProgress.failed > 0 && ` · ${draftProgress.failed} failed`}
            </span>
          )}
          <Button
            onClick={() => handleApproveAsArticles(sorted)}
            disabled={approving || selected.size === 0}
            className="bg-zinc-950 hover:bg-zinc-800 gap-2"
          >
            {approving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Drafting…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Approve {selected.size > 0 ? selected.size : ""} → auto-draft
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
