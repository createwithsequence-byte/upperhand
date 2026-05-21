import Link from "next/link";
import { fetchTodayBoard, fetchBrand } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { SetupNotice } from "./_components/setup-notice";
import { TodayBoardClient } from "./_components/today-board-client";

// Today Board — assembly-line variant.
//
// Articles bucketed by QA OUTCOME (not by process step):
//   Ready to ship  = score ≥ 8
//   Needs polish   = score 6-8 (suggested fixes inline)
//   Re-draft       = score < 6 (regenerate with stricter prompt)
//
// Plus two backstage sections (collapsed):
//   Working on it  = system mid-pipeline
//   No draft yet   = approved but never assembly-lined
//
// To put articles on this board: go to /threads/[id] and click "Run this
// thread." That orchestrator handles the full pipeline (research + draft + QA).

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  // Brand name in the header — small but meaningful framing. Multi-brand
  // is theoretical; for now it's always Songfinch.
  const [boardRes, brandRes] = await Promise.all([
    fetchTodayBoard(),
    fetchBrand(),
  ]);

  if (!boardRes.configured) return <SetupNotice />;

  if (boardRes.error) {
    return (
      <Card className="p-8 max-w-2xl border-destructive/40 bg-destructive/5">
        <h2 className="text-lg font-semibold">Error loading board</h2>
        <p className="text-sm text-destructive mt-2">{boardRes.error}</p>
      </Card>
    );
  }

  const { ready, polish, redraft, working, noDraft, totals } = boardRes.data;
  const brandName = brandRes.data?.name?.trim() || "Songfinch";
  const totalOnBoard = totals.ready + totals.polish + totals.redraft;

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {brandName}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Today</h1>
          <p className="text-sm text-muted-foreground">
            {totalOnBoard === 0
              ? totals.working > 0
                ? `${totals.working} ${totals.working === 1 ? "article" : "articles"} cooking. Check back in a few minutes.`
                : "No drafts on the board. Run a thread to start producing."
              : `${totals.ready} ready to ship · ${totals.polish} need polish · ${totals.redraft} re-draft`}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/threads" className="hover:text-foreground underline">
            Run a thread →
          </Link>
        </div>
      </div>

      {totalOnBoard === 0 && totals.working === 0 && totals.noDraft === 0 ? (
        <EmptyState />
      ) : (
        <TodayBoardClient
          ready={ready}
          polish={polish}
          redraft={redraft}
          working={working}
          noDraft={noDraft}
        />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="p-12 text-center space-y-3">
      <p className="text-lg font-medium">Nothing on the board yet.</p>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Open a thread and click <strong>Run this thread</strong>. The system
        will generate articles, research them, draft them, and run QA — then
        they&apos;ll land here bucketed by score.
      </p>
      <div className="pt-2">
        <Link
          href="/threads"
          className="inline-block bg-zinc-950 text-white text-sm px-4 py-2 rounded-md hover:bg-zinc-800 transition-colors"
        >
          Pick a thread
        </Link>
      </div>
    </Card>
  );
}
