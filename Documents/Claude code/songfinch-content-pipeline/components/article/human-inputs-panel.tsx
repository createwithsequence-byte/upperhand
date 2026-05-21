"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { HumanInputSlot } from "@/lib/types";

/**
 * Human Layer panel — where Greg pastes Loom transcripts, real quotes,
 * anecdotes, and customer stories. These are the "un-AI ingredients" the
 * draft writer is required to use verbatim or near-verbatim.
 *
 * Render-controlled by parent: parent owns `inputs` state and `onSave`
 * action. This component is just the form UI. When `allFilled` is true,
 * saving flips the article from awaiting_human → ready_to_draft (handled
 * by app/actions.ts saveArticleHumanInputs).
 */
export function HumanInputsPanel({
  slots,
  inputs,
  onChange,
  onSave,
  pending,
  allFilled,
  hasBrief,
}: {
  slots: HumanInputSlot[];
  inputs: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  onSave: () => void;
  pending: boolean;
  allFilled: boolean;
  hasBrief: boolean;
}) {
  const filledCount = Object.values(inputs).filter((v) => v.trim()).length;

  if (!hasBrief || slots.length === 0) {
    return (
      <Card className="p-5">
        <h2 className="font-semibold mb-3">Human Layer</h2>
        <p className="text-sm text-muted-foreground">
          Human input slots will appear here once a brief is built. These are
          the un-AI ingredients — Loom transcripts, real quotes, anecdotes —
          that anchor the draft.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="font-semibold">Human Layer</h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {filledCount}/{slots.length}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        The un-AI ingredients. The draft cannot be written without these.
      </p>
      <div className="space-y-5">
        {slots.map((slot) => (
          <div key={slot.key}>
            <Label className="font-medium">{slot.label}</Label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">
              {slot.description}
            </p>
            <Textarea
              rows={slot.type === "loom_transcript" ? 8 : 4}
              value={inputs[slot.key] ?? ""}
              onChange={(e) =>
                onChange({ ...inputs, [slot.key]: e.target.value })
              }
              placeholder={`Paste your ${slot.type.replace(/_/g, " ")} here…`}
              className="text-sm"
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-5 pt-4 border-t">
        <span className="text-xs text-muted-foreground">
          {allFilled
            ? "All slots filled — ready to draft."
            : "Fill all slots to enable drafting."}
        </span>
        <Button size="sm" onClick={onSave} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </Card>
  );
}
