"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Run this thread — the assembly line button. Fires
 * POST /api/threads/[id]/run which:
 *   1. Generates N article ideas
 *   2. For each: research (SEO + GEO) → draft → QA
 *   3. Returns summary (ready / polish / redraft / failed counts)
 *
 * Takes 3-6 minutes for 8 articles. The button shows a progress hint
 * ("Researching, drafting, QA-ing…") but the actual progress is per-article
 * in the orchestrator — we don't surface that detail here. After the request
 * completes, we toast the summary and redirect to /today where the user can
 * see what landed.
 *
 * Why a separate route vs. extending generate-articles: the assembly line is
 * a different mental model — "produce shippable articles" vs "ideate ideas."
 * Keep generate-articles as the ideation-only option (still on this page).
 */
export function RunThreadButton({
  threadId,
  defaultCount = 6,
}: {
  threadId: string;
  defaultCount?: number;
}) {
  const [pending, setPending] = useState(false);
  const [count, setCount] = useState(defaultCount);
  const router = useRouter();

  const handleRun = async () => {
    if (pending) return;
    const confirmed = window.confirm(
      `Run this thread? Will generate ${count} articles, research each, draft each, and QA each. Takes ~${Math.ceil(count * 0.5)}-${count} minutes. Approximate cost: $${(count * 0.05).toFixed(2)}.`,
    );
    if (!confirmed) return;

    setPending(true);
    toast.info(`Running thread — ${count} articles inbound`, {
      duration: 5000,
    });

    try {
      const res = await fetch(`/api/threads/${threadId}/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ count }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Thread run failed");
        return;
      }
      const parts: string[] = [];
      if (data.ready > 0) parts.push(`${data.ready} ready`);
      if (data.polish > 0) parts.push(`${data.polish} need polish`);
      if (data.redraft > 0) parts.push(`${data.redraft} need re-draft`);
      if (data.failed > 0) parts.push(`${data.failed} failed`);
      toast.success(`${data.articleCount} articles done · ${parts.join(", ")}`);
      // Redirect to /today where the cards are now waiting
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "unknown error");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex items-center gap-2 shrink-0">
      {!pending && (
        <select
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="h-9 text-xs border border-input rounded-md px-2 bg-background"
          aria-label="Number of articles"
        >
          {[3, 5, 6, 8, 10].map((n) => (
            <option key={n} value={n}>
              {n} articles
            </option>
          ))}
        </select>
      )}
      <Button
        onClick={handleRun}
        disabled={pending}
        className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
      >
        {pending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Running the line…
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Run this thread
          </>
        )}
      </Button>
    </div>
  );
}
