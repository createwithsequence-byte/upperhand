"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function RunAllButton({
  activePromptCount,
}: {
  activePromptCount: number;
}) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const handleRun = async () => {
    if (activePromptCount === 0) {
      toast.error("No active prompts to run. Add one first.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/agents/monitor/run", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? `Run failed (${res.status})`);
        return;
      }
      toast.success(
        `Ran ${data.ran}/${data.total} prompts${data.failed > 0 ? ` · ${data.failed} failed` : ""}`,
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "unknown error");
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      onClick={handleRun}
      disabled={pending || activePromptCount === 0}
      className="bg-zinc-950 hover:bg-zinc-800 gap-2"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Running…
        </>
      ) : (
        <>
          <Play className="w-3.5 h-3.5" />
          Run all now ({activePromptCount})
        </>
      )}
    </Button>
  );
}
