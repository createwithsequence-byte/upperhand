"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function BulkSeoButton({
  threadId,
  needsResearch,
  totalResearchable,
}: {
  threadId: string;
  needsResearch: number;
  totalResearchable: number;
}) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  // Hide if there's nothing to research
  if (totalResearchable === 0) return null;

  const handleRun = async (force: boolean) => {
    setPending(true);
    try {
      const res = await fetch("/api/agents/seo/research-bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ thread_id: threadId, force }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Bulk research failed");
        return;
      }
      if (data.researched === 0 && !force) {
        toast.info(data.message ?? "Nothing to research");
      } else {
        toast.success(
          `Researched ${data.researched} article${data.researched === 1 ? "" : "s"}${data.failed ? ` · ${data.failed} failed` : ""}`,
        );
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "unknown error");
    } finally {
      setPending(false);
    }
  };

  if (needsResearch === 0) {
    return (
      <Button
        onClick={() => handleRun(true)}
        disabled={pending}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Search className="w-3.5 h-3.5" />
        )}
        Refresh SEO for all {totalResearchable}
      </Button>
    );
  }

  return (
    <Button
      onClick={() => handleRun(false)}
      disabled={pending}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {pending ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Researching {needsResearch}…
        </>
      ) : (
        <>
          <Search className="w-3.5 h-3.5" />
          Research SEO for {needsResearch} article
          {needsResearch === 1 ? "" : "s"}
        </>
      )}
    </Button>
  );
}
