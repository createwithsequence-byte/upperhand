"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function GenerateArticlesButton({ threadId }: { threadId: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    setPending(true);
    try {
      const res = await fetch("/api/agents/generate-articles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ thread_id: threadId, count: 8 }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Generation failed");
        return;
      }
      toast.success(`Generated ${data.count} article ideas`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "unknown error");
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      onClick={handleGenerate}
      disabled={pending}
      className="bg-zinc-950 hover:bg-zinc-800 gap-2 shrink-0"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating…
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          Generate articles
        </>
      )}
    </Button>
  );
}
