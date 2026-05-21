"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Clipboard,
  FileText,
  Loader2,
  PenLine,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { setArticleStatus } from "../../actions";
import { STATUS_LABEL } from "@/lib/article-status";
// BriefPanel + HumanInputsPanel intentionally NOT imported — Path A doesn't
// use them. They still exist in components/article/ for the future Path B.
import {
  ResearchPanel,
  VolumeTierBadge,
} from "@/components/article/research-panel";
import { DraftPanel } from "@/components/article/draft-panel";
import { QaPanel, type QaStreamState } from "@/components/article/qa-panel";
import { DeleteArticleButton } from "@/components/article/delete-article-button";
import type { Article, ArticleStatus, SerpAnalysis, Thread } from "@/lib/types";

// STATUS_LABEL moved to lib/article-status.ts so all surfaces share one source.

export function ArticleWorkspace({
  article,
  thread,
  seo,
  geo,
}: {
  article: Article;
  thread: Thread;
  seo: SeoResearchRow | null;
  geo: GeoResearchRow | null;
}) {
  const router = useRouter();
  // Path A workspace state. Path B's brief + human-input state was removed
  // when the BriefPanel + HumanInputsPanel got hidden from this view (the
  // components still exist in components/article/ if Path B ever returns).
  const [pending, startTransition] = useTransition();
  const [running, setRunning] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [streamedMarkdown, setStreamedMarkdown] = useState("");
  const [streamingQa, setStreamingQa] = useState(false);
  const [streamedQa, setStreamedQa] = useState<QaStreamState | null>(null);

  // Routes were reorganized into domain folders in 2.3. The label is used
  // for the running state and toast message.
  const AGENT_ROUTES: Record<string, string> = {
    "build-brief": "/api/agents/draft/build-brief",
    "write-draft": "/api/agents/draft/write",
    "run-qa": "/api/agents/draft/run-qa",
    "research-seo": "/api/agents/seo/research",
    "research-geo": "/api/agents/geo/research",
    "score-checklist": "/api/agents/geo/score",
  };

  const runAgent = async (
    key:
      | "build-brief"
      | "write-draft"
      | "run-qa"
      | "research-seo"
      | "research-geo"
      | "score-checklist",
    label: string,
  ) => {
    setRunning(label);
    try {
      const res = await fetch(AGENT_ROUTES[key], {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ article_id: article.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Failed");
        return;
      }
      toast.success(`${label} complete`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "unknown error");
    } finally {
      setRunning(null);
    }
  };

  const handleStreamDraft = async () => {
    setStreaming(true);
    setStreamedMarkdown("");
    try {
      const res = await fetch("/api/agents/draft/write-stream", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ article_id: article.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? `Stream failed (${res.status})`);
        return;
      }
      if (!res.body) {
        toast.error("No response body");
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setStreamedMarkdown(acc);
      }
      toast.success("Draft complete — ready for QA");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "unknown error");
    } finally {
      setStreaming(false);
    }
  };

  const handleStreamQa = async () => {
    setStreamingQa(true);
    setStreamedQa(null);
    try {
      const res = await fetch("/api/agents/draft/run-qa-stream", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ article_id: article.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? `QA stream failed (${res.status})`);
        return;
      }
      if (!res.body) {
        toast.error("No response body");
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // NDJSON: split on newlines, keep the trailing partial line in the
        // buffer for the next iteration.
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const partial: QaStreamState = JSON.parse(line);
            setStreamedQa(partial);
            if (partial.phase === "error" && partial.error) {
              toast.error(partial.error);
            }
          } catch (parseErr) {
            console.warn("[run-qa-stream] parse error", parseErr, line);
          }
        }
      }
      toast.success("QA complete");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "unknown error");
    } finally {
      setStreamingQa(false);
    }
  };

  const handleApprove = () =>
    startTransition(async () => {
      const res = await setArticleStatus(article.id, "approved");
      if (res.ok) toast.success("Approved");
      else toast.error(res.error);
    });

  const handleCopy = async () => {
    if (!article.markdown) return;
    await navigator.clipboard.writeText(article.markdown);
    toast.success("Markdown copied");
  };

  const handleExport = () =>
    startTransition(async () => {
      const res = await setArticleStatus(article.id, "exported");
      if (res.ok) toast.success("Marked exported");
      else toast.error(res.error);
    });

  // Pick the primary action based on status
  const primaryAction = (() => {
    if (article.status === "idea") {
      return (
        <Button onClick={handleApprove} disabled={pending}>
          <Check className="w-4 h-4 mr-1" /> Approve article
        </Button>
      );
    }
    if (article.status === "approved") {
      // Path A: approved articles go straight to auto-draft. Previously this
      // button said "Build brief" and fired the brief agent; in the new flow,
      // it's "Auto-draft" and fires /api/agents/draft/auto-draft. The brief
      // path is still available by hitting the legacy route directly.
      return (
        <Button
          onClick={async () => {
            setRunning("Auto-draft");
            try {
              const res = await fetch("/api/agents/draft/auto-draft", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ article_id: article.id }),
              });
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                toast.error(err.error ?? "Auto-draft failed");
                return;
              }
              // The route streams markdown. We don't pipe it here because
              // this is the primary action button — the workspace will
              // refresh after the route completes and show the saved draft.
              await res.text(); // drain the stream
              toast.success("Draft complete");
              router.refresh();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "unknown");
            } finally {
              setRunning(null);
            }
          }}
          disabled={running !== null}
          className="bg-zinc-950 hover:bg-zinc-800 gap-2"
        >
          {running === "Auto-draft" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Auto-draft
        </Button>
      );
    }
    if (article.status === "ready_to_draft" || article.status === "drafting") {
      return (
        <Button
          onClick={handleStreamDraft}
          disabled={streaming || running !== null}
          className="bg-zinc-950 hover:bg-zinc-800 gap-2"
        >
          {streaming ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Streaming
              {streamedMarkdown.length > 0
                ? ` · ${streamedMarkdown.split(/\s+/).length} words`
                : "…"}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {article.status === "drafting" ? "Resume draft" : "Write draft"}
            </>
          )}
        </Button>
      );
    }
    if (article.status === "ready_for_qa") {
      return (
        <Button
          onClick={handleStreamQa}
          disabled={streamingQa || running !== null}
          className="bg-zinc-950 hover:bg-zinc-800 gap-2"
        >
          {streamingQa ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {streamedQa?.phase === "llm" ? "Judging draft…" : "Scanning…"}
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Run QA
            </>
          )}
        </Button>
      );
    }
    if (article.status === "ready_for_review") {
      return (
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCopy}>
            <Clipboard className="w-4 h-4 mr-1" /> Copy markdown
          </Button>
          <Button
            onClick={handleExport}
            disabled={pending}
            className="bg-zinc-950 hover:bg-zinc-800"
          >
            <Check className="w-4 h-4 mr-1" /> Mark exported
          </Button>
        </div>
      );
    }
    if (article.status === "exported") {
      return (
        <Button variant="outline" onClick={handleCopy}>
          <Clipboard className="w-4 h-4 mr-1" /> Copy markdown
        </Button>
      );
    }
    return null;
  })();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/threads" className="hover:text-foreground">
            <ArrowLeft className="w-3.5 h-3.5 inline mr-1" />
            Threads
          </Link>
          <span>/</span>
          <Link
            href={`/threads/${thread.id}`}
            className="hover:text-foreground truncate max-w-xs"
          >
            {thread.title}
          </Link>
        </div>

        <div className="flex items-start justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="text-[10px] uppercase tracking-wide font-normal"
              >
                {article.format}
              </Badge>
              <Badge className="bg-zinc-950 hover:bg-zinc-950 text-[10px] uppercase tracking-wide">
                {STATUS_LABEL[article.status]}
              </Badge>
              {/* Volume / KD now read from seo_research (no more legacy article.* fallback). */}
              {seo?.volume_tier && (
                <VolumeTierBadge
                  tier={seo.volume_tier}
                  estimate={seo.search_volume_estimate}
                />
              )}
              {typeof seo?.keyword_difficulty === "number" && (
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase tracking-wide font-normal"
                >
                  KD {seo.keyword_difficulty}
                </Badge>
              )}
              {article.scheduled_for && (
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase tracking-wide font-normal"
                >
                  📅 {new Date(article.scheduled_for).toLocaleDateString()}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {article.title}
            </h1>
            <p className="text-xs font-mono text-muted-foreground">
              {article.target_query}
            </p>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-2 min-w-[180px]">
            {primaryAction}
            {article.status !== "idea" && (
              <>
                {/* GEO research is primary per the brand goal — listed above SEO. */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runAgent("research-geo", "GEO")}
                  disabled={running !== null}
                  className="gap-1.5 w-full justify-start"
                >
                  {running === "GEO" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  {geo?.researched_at ? "Refresh GEO" : "Research GEO"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runAgent("score-checklist", "Checklist")}
                  disabled={running !== null || !article.markdown}
                  className="gap-1.5 w-full justify-start"
                  title={
                    article.markdown
                      ? "Score the draft against the GEO citation checklist"
                      : "Enabled once a draft exists"
                  }
                >
                  {running === "Checklist" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  Score against checklist
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runAgent("research-seo", "SEO")}
                  disabled={running !== null}
                  className="gap-1.5 w-full justify-start"
                >
                  {running === "SEO" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  {seo?.researched_at ? "Refresh SEO" : "Research SEO"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Single-column layout. The previous 60/40 split was for Path B
          (brief + human inputs). Path A doesn't use those — the auto-draft
          jumps from approval → research → draft → QA. The BriefPanel and
          HumanInputsPanel components still exist in components/article/ if
          we ever want to bring them back, but they don't render here. */}
      <div className="max-w-3xl space-y-4">
        <ResearchPanel
          articleId={article.id}
          hasDraft={!!article.markdown}
          geo={geo}
          // The seo_research table stores top_results, serp_features, and
          // intent as separate columns. The SeoPanel still wants the unified
          // SerpAnalysis shape, so we reconstruct it here.
          seoAnalysis={
            seo
              ? ({
                  top_results:
                    (seo.serp_top10 as SerpAnalysis["top_results"]) ?? [],
                  serp_features:
                    (seo.serp_features as SerpAnalysis["serp_features"]) ?? [],
                  intent_classification:
                    (seo.search_intent as SerpAnalysis["intent_classification"]) ??
                    "informational",
                } as SerpAnalysis)
              : null
          }
          seoStrategy={seo?.ranking_strategy ?? null}
          seoVolume={seo?.search_volume_estimate ?? null}
          seoTier={seo?.volume_tier ?? null}
          seoDifficulty={seo?.keyword_difficulty ?? null}
        />
        <DraftPanel
          markdown={streaming ? streamedMarkdown : article.markdown}
          status={article.status}
          streaming={streaming}
        />
        <QaPanel
          result={article.qa_result as QaResult | null}
          streaming={streamingQa}
          streamed={streamedQa}
        />

        {/* Danger zone — bottom of workspace. Cascades wipe drafts +
            research. Use when an article is genuinely dead, not for
            iteration (use re-draft for that). */}
        <div className="pt-12 mt-12 border-t">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
            Danger zone
          </p>
          <DeleteArticleButton
            articleId={article.id}
            articleTitle={article.title}
          />
        </div>
      </div>
    </div>
  );
}
