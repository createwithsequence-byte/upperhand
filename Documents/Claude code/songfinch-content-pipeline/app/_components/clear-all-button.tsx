"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { clearAllContent } from "../actions";

const REQUIRED_PHRASE = "DELETE EVERYTHING";

/**
 * Nuclear button — wipes ALL content (threads, articles, research, drafts,
 * agent_runs). Preserves brand + reference_examples + monitor_prompts.
 *
 * Lives at the bottom of /brand. Two-step confirm: open the section, then
 * type the phrase EXACTLY before the destroy button enables.
 */
export function ClearAllButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [phrase, setPhrase] = useState("");

  const canDestroy = phrase === REQUIRED_PHRASE && !pending;

  const handleDestroy = () => {
    startTransition(async () => {
      const res = await clearAllContent(phrase);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `Wiped ${res.data.threadsDeleted} threads + ${res.data.runsDeleted} agent runs. Brand and references preserved.`,
      );
      setOpen(false);
      setPhrase("");
      router.push("/");
      router.refresh();
    });
  };

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 gap-1.5"
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        Clear all content
      </Button>
    );
  }

  return (
    <Card className="p-4 border-destructive/40 bg-destructive/5 space-y-3 max-w-xl">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium">
            This wipes every thread, article, draft, research row, and agent
            run.
          </p>
          <p className="text-muted-foreground mt-1">
            Brand info and voice reference examples are preserved. Cannot be
            undone.
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">
          Type{" "}
          <code className="font-mono font-semibold">{REQUIRED_PHRASE}</code> to
          confirm:
        </label>
        <Input
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder={REQUIRED_PHRASE}
          className="font-mono"
          disabled={pending}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDestroy}
          disabled={!canDestroy}
        >
          {pending ? "Wiping…" : "Destroy all content"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false);
            setPhrase("");
          }}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </Card>
  );
}
