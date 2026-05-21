import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import type { ArticleStatus, BriefJson } from "@/lib/types";

/**
 * Brief panel — renders the article brief if one exists. Shows title
 * options, meta description, the direct-answer opener, and the H2 outline.
 * Empty state guides the user to either approve (if idea) or build a brief
 * (if approved).
 *
 * Read-only component. All writes go through the build-brief agent route.
 */
export function BriefPanel({
  brief,
  status,
}: {
  brief: BriefJson | null;
  status: ArticleStatus;
}) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold mb-4">Brief</h2>
      {!brief ? (
        <p className="text-sm text-muted-foreground">
          {status === "idea"
            ? "Approve this article on the thread page first. Once approved, click Build brief to generate the outline and human input slots."
            : "No brief yet. Click Build brief to generate the article outline and human input slots."}
        </p>
      ) : (
        <div className="space-y-4 text-sm">
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Title options
            </Label>
            <ul className="mt-1 space-y-1">
              {brief.title_options.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <Separator />
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Meta description
            </Label>
            <p className="mt-1">{brief.meta_description}</p>
          </div>
          <Separator />
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Direct answer (opens the article)
            </Label>
            <p className="mt-1 italic">{brief.direct_answer}</p>
          </div>
          <Separator />
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              H2 outline
            </Label>
            <ol className="mt-1 space-y-2 list-decimal list-inside">
              {brief.h2_outline.map((h, i) => (
                <li key={i}>
                  <span className="font-medium">{h.heading}</span>
                  {h.notes && (
                    <span className="text-muted-foreground"> — {h.notes}</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </Card>
  );
}
