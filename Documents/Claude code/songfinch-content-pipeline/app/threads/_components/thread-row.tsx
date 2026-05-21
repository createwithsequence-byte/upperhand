"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { setThreadStatus } from "../../actions";
import type { Thread } from "@/lib/types";

export function ThreadRow({ thread }: { thread: Thread }) {
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();

  const act = (status: "approved" | "rejected") =>
    startTransition(async () => {
      const res = await setThreadStatus(thread.id, status);
      if (res.ok)
        toast.success(status === "approved" ? "Approved" : "Rejected");
      else toast.error(res.error);
    });

  return (
    <Card className="p-5 transition-all hover:shadow-md hover:border-zinc-300">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {thread.wedge && (
                <Badge className="bg-orange-600 hover:bg-orange-600 text-[10px] uppercase tracking-wide">
                  Wedge
                </Badge>
              )}
              {/* Hide angle badge when it duplicates the wedge tag above */}
              {!(thread.wedge && thread.angle?.toLowerCase() === "wedge") && (
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase tracking-wide font-normal"
                >
                  {thread.angle}
                </Badge>
              )}
              {thread.status !== "pending" && (
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase tracking-wide capitalize"
                >
                  {thread.status}
                </Badge>
              )}
            </div>
            <h2 className="font-semibold leading-tight text-foreground">
              {thread.title}
            </h2>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {thread.description}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex gap-3 text-xs tabular-nums text-muted-foreground">
              <span>SEO {thread.seo_potential}</span>
              <span>Fit {thread.brand_relevance}</span>
              <span className="font-semibold text-foreground">
                {thread.score?.toFixed(1) ?? "—"}
              </span>
            </div>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t space-y-3 text-sm">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Reasoning
            </p>
            <p>{thread.reasoning}</p>
          </div>
          {thread.search_intent && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Search intent
              </p>
              <p>{thread.search_intent}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        {thread.status === "pending" ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => act("rejected")}
              disabled={pending}
            >
              <X className="w-3.5 h-3.5 mr-1" /> Reject
            </Button>
            <Button
              size="sm"
              onClick={() => act("approved")}
              disabled={pending}
              className="bg-zinc-950 hover:bg-zinc-800"
            >
              <Check className="w-3.5 h-3.5 mr-1" /> Approve
            </Button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">
            {thread.status === "approved" && thread.approved_at
              ? `Approved ${new Date(thread.approved_at).toLocaleDateString()}`
              : ""}
          </span>
        )}
        {thread.status === "approved" && (
          <Link href={`/threads/${thread.id}`}>
            <Button size="sm" variant="ghost" className="gap-1">
              Articles <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}
