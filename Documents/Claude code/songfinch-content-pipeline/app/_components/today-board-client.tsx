"use client";

import Link from "next/link";
import { CheckCircle2, FileEdit, RefreshCw, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TodayCard } from "@/lib/data";

/**
 * Today Board (assembly-line variant) — articles bucketed by QA OUTCOME.
 *
 * Three primary columns:
 *   READY TO SHIP   = score ≥ 8, just review and export
 *   NEEDS POLISH    = score 6-8, suggested fixes available
 *   RE-DRAFT        = score < 6, regenerate with stricter prompt
 *
 * Two secondary surfaces (collapsed below):
 *   WORKING ON IT   = system mid-pipeline (drafting / researching)
 *   NO DRAFT YET    = approved but never assembly-lined
 *
 * No bulk select needed here — the bulk action lives on /threads (Run this
 * thread). The board is a review surface, not a launcher.
 */
export function TodayBoardClient({
  ready,
  polish,
  redraft,
  working,
  noDraft,
}: {
  ready: TodayCard[];
  polish: TodayCard[];
  redraft: TodayCard[];
  working: TodayCard[];
  noDraft: TodayCard[];
}) {
  const hasBackstage = working.length > 0 || noDraft.length > 0;

  return (
    <div className="space-y-6">
      {/* Three-column grid — the editorial review surface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Column
          label="Ready to ship"
          tone="emerald"
          count={ready.length}
          icon={<CheckCircle2 className="w-4 h-4" />}
          emptyMessage="Nothing scored ≥ 8 yet. Run a thread to produce shippable drafts."
        >
          {ready.map((card) => (
            <ArticleCard key={card.id} card={card} tone="emerald" />
          ))}
        </Column>

        <Column
          label="Needs polish"
          tone="amber"
          count={polish.length}
          icon={<FileEdit className="w-4 h-4" />}
          emptyMessage="No drafts in the 6-8 range. These usually need light edits to ship."
        >
          {polish.map((card) => (
            <ArticleCard key={card.id} card={card} tone="amber" />
          ))}
        </Column>

        <Column
          label="Re-draft"
          tone="zinc"
          count={redraft.length}
          icon={<RefreshCw className="w-4 h-4" />}
          emptyMessage="No drafts scored below 6. Healthy."
        >
          {redraft.map((card) => (
            <ArticleCard key={card.id} card={card} tone="zinc" />
          ))}
        </Column>
      </div>

      {/* Backstage — collapsed sections for in-progress + orphan articles.
          Surfaced so nothing's truly hidden, but not the primary focus. */}
      {hasBackstage && (
        <div className="space-y-3 pt-4 border-t">
          {working.length > 0 && (
            <Backstage
              label="Working on it"
              hint="System is mid-pipeline — research or drafting in flight."
              icon={<Loader2 className="w-3.5 h-3.5 animate-spin" />}
              cards={working}
            />
          )}
          {noDraft.length > 0 && (
            <Backstage
              label="No draft yet"
              hint="Approved articles that haven't been put through the assembly line."
              cards={noDraft}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ---- Column wrapper --------------------------------------------------------

function Column({
  label,
  tone,
  count,
  icon,
  emptyMessage,
  children,
}: {
  label: string;
  tone: "emerald" | "amber" | "zinc";
  count: number;
  icon: React.ReactNode;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50/50"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50/50"
        : "border-zinc-200 bg-zinc-50/50";

  return (
    <div className={`rounded-lg border ${toneClass} p-4 space-y-3`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            {label}
          </h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            {count}
          </span>
        </div>
      </div>
      {count === 0 ? (
        <p className="text-xs text-muted-foreground italic py-6 text-center">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </div>
  );
}

// ---- Article cards ---------------------------------------------------------

function ArticleCard({
  card,
  tone,
}: {
  card: TodayCard;
  tone: "emerald" | "amber" | "zinc";
}) {
  const scoreColor =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "amber"
        ? "text-amber-700"
        : "text-zinc-600";
  const hoverBorder =
    tone === "emerald"
      ? "hover:border-emerald-400"
      : tone === "amber"
        ? "hover:border-amber-400"
        : "hover:border-zinc-400";

  return (
    <Link href={`/article/${card.id}`} className="block group">
      <Card className={`p-3 transition-all hover:shadow-md ${hoverBorder}`}>
        <p className="text-sm font-medium leading-snug group-hover:underline">
          {card.title}
        </p>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
          <span className="truncate">{card.threadTitle}</span>
          {card.isWedge && (
            <Badge className="bg-orange-600 hover:bg-orange-600 text-white text-[9px] px-1.5 py-0">
              WEDGE
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-zinc-100">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground tabular-nums">
            {card.bannedCount > 0 && (
              <span className="text-red-600">{card.bannedCount} banned</span>
            )}
            {card.cadenceCount > 0 && <span>{card.cadenceCount} cadence</span>}
          </div>
          {card.qaScore != null && (
            <span
              className={`text-sm tabular-nums font-mono font-semibold ${scoreColor}`}
            >
              {card.qaScore.toFixed(1)}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}

// ---- Backstage (collapsed sub-sections below the main board) --------------

function Backstage({
  label,
  hint,
  icon,
  cards,
}: {
  label: string;
  hint: string;
  icon?: React.ReactNode;
  cards: TodayCard[];
}) {
  return (
    <details className="group">
      <summary className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground">
        {icon}
        <span className="font-medium uppercase tracking-wide">{label}</span>
        <span className="tabular-nums">{cards.length}</span>
        <span className="opacity-60">— {hint}</span>
      </summary>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
        {cards.map((card) => (
          <Link
            key={card.id}
            href={`/article/${card.id}`}
            className="block group/card"
          >
            <Card className="p-2 transition-all hover:shadow-sm hover:border-zinc-400">
              <p className="text-xs font-medium leading-snug group-hover/card:underline line-clamp-2">
                {card.title}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 truncate">
                {card.threadTitle}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </details>
  );
}
