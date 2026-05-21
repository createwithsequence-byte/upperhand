"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteArticle } from "../../app/actions";

/**
 * Delete this article. Cascades wipe seo_research + geo_research +
 * article_drafts. Redirects back to the parent thread on success.
 *
 * Lives in the article workspace's danger zone at the bottom.
 */
export function DeleteArticleButton({
  articleId,
  articleTitle,
}: {
  articleId: string;
  articleTitle: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteArticle(articleId);
      if (!res.ok) {
        toast.error(res.error);
        setConfirming(false);
        return;
      }
      toast.success(`Deleted "${articleTitle}".`);
      if (res.data.threadId) {
        router.push(`/threads/${res.data.threadId}`);
      } else {
        router.push("/");
      }
    });
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">
          Delete this article + all drafts + research? Cannot be undone.
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
      Delete article
    </Button>
  );
}
