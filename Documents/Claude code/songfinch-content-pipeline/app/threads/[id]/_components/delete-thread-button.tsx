"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteThread } from "../../../actions";

/**
 * Delete this thread. Confirmation-gated — cascades wipe all articles +
 * research + draft history below it. Destructive, no undo.
 *
 * Lives at the bottom of /threads/[id] in a "Danger zone" section.
 */
export function DeleteThreadButton({
  threadId,
  threadTitle,
  articleCount,
}: {
  threadId: string;
  threadTitle: string;
  articleCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteThread(threadId);
      if (!res.ok) {
        toast.error(res.error);
        setConfirming(false);
        return;
      }
      toast.success(`Deleted "${threadTitle}" and ${articleCount} articles.`);
      router.push("/threads");
    });
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Delete thread + {articleCount} articles + all research/drafts? Cannot
          be undone.
        </span>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={pending}
        >
          {pending ? "Deleting…" : "Yes, delete"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirming(false)}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setConfirming(true)}
      className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 gap-1.5"
    >
      <Trash2 className="w-3.5 h-3.5" />
      Delete thread
    </Button>
  );
}
