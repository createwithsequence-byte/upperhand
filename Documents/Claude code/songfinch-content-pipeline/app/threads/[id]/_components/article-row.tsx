"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { setArticleStatus } from "../../../actions";
import type { Article } from "@/lib/types";

export function ArticleRow({
  article,
  threadTitle,
}: {
  article: Article;
  threadTitle?: string;
}) {
  const [pending, startTransition] = useTransition();

  const act = (status: "approved" | "rejected") =>
    startTransition(async () => {
      const res = await setArticleStatus(
        article.id,
        status === "approved" ? "approved" : "idea",
      );
      if (status === "rejected") {
        // For ideas, "reject" just deletes — but we don't have delete here.
        // Soft option: leave as idea, no-op for now.
      }
      if (res.ok) toast.success(status === "approved" ? "Approved" : "Skipped");
      else toast.error(res.error);
    });

  const showActions = article.status === "idea";

  return (
    <Card className="p-5 transition-all hover:shadow-md hover:border-zinc-300">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          {/* Thread context label per 1.3 — Thread · FORMAT · STATUS */}
          {threadTitle && (
            <p className="text-[10px] uppercase tracking-wide font-medium text-muted-foreground truncate">
              {threadTitle} · {article.format} ·{" "}
              {article.status.replace(/_/g, " ")}
            </p>
          )}
          {!threadTitle && (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="text-[10px] uppercase tracking-wide font-normal"
              >
                {article.format}
              </Badge>
              {article.status !== "idea" && (
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase tracking-wide capitalize"
                >
                  {article.status.replace(/_/g, " ")}
                </Badge>
              )}
            </div>
          )}
          <h2 className="font-semibold leading-tight">{article.title}</h2>
          <p className="text-xs font-mono text-muted-foreground">
            {article.target_query}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-2 pt-1">
            {article.reasoning}
          </p>
        </div>
        <div className="text-xs tabular-nums text-muted-foreground shrink-0">
          GEO {article.geo_potential ?? "—"}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        {showActions ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => act("rejected")}
              disabled={pending}
            >
              <X className="w-3.5 h-3.5 mr-1" /> Skip
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
          <span className="text-xs text-muted-foreground" />
        )}
        {article.status !== "idea" && (
          <Link href={`/article/${article.id}`}>
            <Button size="sm" variant="ghost" className="gap-1">
              Workspace <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}
