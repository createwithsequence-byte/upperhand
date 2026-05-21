"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MonitorPrompt } from "@/lib/data";

export function PromptList({ prompts }: { prompts: MonitorPrompt[] }) {
  const [editing, setEditing] = useState<MonitorPrompt | null>(null);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const handleToggle = async (id: string, next: boolean) => {
    const res = await fetch("/api/agents/monitor/prompts", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, active: next }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      toast.error(data?.error ?? "Update failed");
      return;
    }
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this prompt? Past runs are kept.")) return;
    const res = await fetch("/api/agents/monitor/prompts", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      toast.error(data?.error ?? "Delete failed");
      return;
    }
    toast.success("Deleted");
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <Card className="p-3">
        <Button
          onClick={() => setCreating(true)}
          variant="outline"
          size="sm"
          className="w-full justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add prompt
        </Button>
      </Card>

      {prompts.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No prompts yet. Add one above to start monitoring.
        </Card>
      ) : (
        <Card className="divide-y">
          {prompts.map((p) => (
            <div key={p.id} className="p-4 flex items-start gap-3 group">
              <label className="flex items-center gap-2 shrink-0 mt-0.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={p.active}
                  onChange={(e) => handleToggle(p.id, e.target.checked)}
                  className="accent-zinc-950 cursor-pointer"
                  aria-label="Active"
                />
              </label>
              <div className="flex-1 min-w-0 space-y-1">
                <p
                  className={`text-sm leading-snug ${
                    p.active
                      ? "text-foreground"
                      : "text-muted-foreground line-through"
                  }`}
                >
                  {p.prompt}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
                  every {p.cadence_days}d
                  {p.last_run_at && (
                    <> · last {new Date(p.last_run_at).toLocaleDateString()}</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setEditing(p)}
                  aria-label="Edit prompt"
                  className="h-7 w-7"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(p.id)}
                  aria-label="Delete prompt"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <PromptModal
        open={creating || editing !== null}
        prompt={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={() => {
          setCreating(false);
          setEditing(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function PromptModal({
  open,
  prompt,
  onClose,
  onSaved,
}: {
  open: boolean;
  prompt: MonitorPrompt | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [text, setText] = useState(prompt?.prompt ?? "");
  const [cadenceDays, setCadenceDays] = useState(prompt?.cadence_days ?? 7);
  const [pending, setPending] = useState(false);

  // When the modal opens / target prompt changes, sync the local state.
  if (open && prompt && prompt.id && text === "" && cadenceDays === 7) {
    setText(prompt.prompt);
    setCadenceDays(prompt.cadence_days);
  }

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error("Prompt can't be empty");
      return;
    }
    setPending(true);
    try {
      const body = prompt
        ? {
            id: prompt.id,
            prompt: trimmed,
            cadence_days: cadenceDays,
          }
        : { prompt: trimmed, cadence_days: cadenceDays };
      const res = await fetch("/api/agents/monitor/prompts", {
        method: prompt ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "Save failed");
        return;
      }
      toast.success(prompt ? "Updated" : "Prompt added");
      setText("");
      setCadenceDays(7);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "unknown error");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setText("");
          setCadenceDays(7);
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {prompt ? "Edit monitor prompt" : "Add monitor prompt"}
          </DialogTitle>
          <DialogDescription>
            How a real user would ask an LLM about your category. Lowercase and
            casual.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="monitor-prompt-text">Prompt</Label>
            <Textarea
              id="monitor-prompt-text"
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="best custom song service for memorials"
              disabled={pending}
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="monitor-cadence">Cadence (days)</Label>
            <Input
              id="monitor-cadence"
              type="number"
              min={1}
              max={90}
              value={cadenceDays}
              onChange={(e) =>
                setCadenceDays(Number.parseInt(e.target.value, 10) || 7)
              }
              className="max-w-xs text-sm"
              disabled={pending}
            />
            <p className="text-xs text-muted-foreground">
              How often to re-run this prompt automatically.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={pending || text.trim().length === 0}
            className="bg-zinc-950 hover:bg-zinc-800"
          >
            {pending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
