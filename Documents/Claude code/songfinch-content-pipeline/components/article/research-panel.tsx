"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { GeoResearchRow } from "@/lib/data";
import type { SerpAnalysis, VolumeTier } from "@/lib/types";

/**
 * Research panel — the right-column workhorse. Renders GEO above SEO per
 * Phase 2.8 spec (GEO is the primary brand goal; SEO is supporting).
 *
 * Three sub-components are exported but kept in this file because they're
 * coupled: GeoSubSection, SeoPanel, VolumeTierBadge all share data
 * conventions and only get used inside ResearchPanel. If any of them grows
 * its own life (e.g. SeoPanel shown standalone on /seo-analysis page), pull
 * it out then.
 */
export function ResearchPanel({
  articleId,
  hasDraft,
  geo,
  seoAnalysis,
  seoStrategy,
  seoVolume,
  seoTier,
  seoDifficulty,
}: {
  articleId: string;
  hasDraft: boolean;
  geo: GeoResearchRow | null;
  seoAnalysis: SerpAnalysis | null;
  seoStrategy: string | null;
  seoVolume: number | null;
  seoTier: VolumeTier | null;
  seoDifficulty: number | null;
}) {
  void articleId; // Reserved for future "refresh this section" inline actions.
  return (
    <Card className="p-5 space-y-5">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-semibold">Research</h2>
      </div>

      {/* GEO sub-section — primary surface per the brand goal */}
      <GeoSubSection geo={geo} hasDraft={hasDraft} />

      <Separator />

      {/* SEO sub-section */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          SEO
        </p>
        {seoAnalysis ? (
          <SeoPanel
            analysis={seoAnalysis}
            strategy={seoStrategy}
            volume={seoVolume}
            tier={seoTier}
            difficulty={seoDifficulty}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Click <strong>Research SEO</strong> to fetch real Google rankings
            for this article&apos;s target keyword.
          </p>
        )}
      </div>
    </Card>
  );
}

// ---- GEO sub-section --------------------------------------------------------

const GEO_CHECKLIST_LABELS: Record<string, string> = {
  named_entities: "Named entities",
  structured_claims: "Structured claims",
  anecdotal_specificity: "Anecdotal specificity",
  schema_markup: "Schema markup",
  brand_name_density: "Brand name density",
};

function GeoSubSection({
  geo,
  hasDraft,
}: {
  geo: GeoResearchRow | null;
  hasDraft: boolean;
}) {
  const [strategyOpen, setStrategyOpen] = useState(false);

  const targetPrompts = geo?.target_prompts ?? null;
  const checklist = geo?.citation_checklist ?? null;
  const strategy = geo?.citation_strategy ?? null;
  const competitors = geo?.competitor_citations ?? null;

  if (!geo) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          GEO
        </p>
        <p className="text-sm text-muted-foreground">
          Click <strong>Research GEO</strong> in the action bar to map citation
          competitors and strategy
          {hasDraft ? ", then Score against checklist." : "."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        GEO
      </p>

      {targetPrompts && targetPrompts.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Target prompts
          </p>
          <div className="flex flex-wrap gap-1.5">
            {targetPrompts.map((tp, i) => (
              <Badge
                key={i}
                variant="outline"
                className={`font-normal text-xs ${
                  tp.weight === "primary"
                    ? "bg-zinc-950 text-white border-zinc-950"
                    : "bg-white"
                }`}
                title={tp.weight}
              >
                {tp.prompt}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {checklist && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Citation checklist
          </p>
          <div className="border rounded-md divide-y">
            {(
              Object.keys(GEO_CHECKLIST_LABELS) as Array<keyof typeof checklist>
            ).map((key) => {
              const row = checklist[key];
              if (!row) return null;
              const scoreColor =
                row.score >= 8
                  ? "text-emerald-700"
                  : row.score <= 4
                    ? "text-destructive"
                    : "";
              return (
                <div key={key} className="p-3 flex items-start gap-3">
                  <span className="text-sm font-medium w-40 shrink-0">
                    {GEO_CHECKLIST_LABELS[key]}
                  </span>
                  <span
                    className={`tabular-nums font-mono text-sm w-12 text-right ${scoreColor}`}
                  >
                    {row.score}/10
                  </span>
                  <span className="text-xs text-muted-foreground flex-1">
                    {row.note}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {strategy && (
        <details
          className="space-y-1.5"
          open={strategyOpen}
          onToggle={(e) =>
            setStrategyOpen((e.target as HTMLDetailsElement).open)
          }
        >
          <summary className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            Citation strategy
          </summary>
          <p className="text-sm leading-relaxed pt-1">{strategy}</p>
        </details>
      )}

      {competitors && competitors.length > 0 && (
        <details className="space-y-1.5">
          <summary className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            Competitor citations ({competitors.length})
          </summary>
          <ul className="text-xs space-y-2 pt-1">
            {competitors.map((c, i) => (
              <li key={i} className="border-l-2 border-zinc-200 pl-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{c.brand}</span>
                  <span className="text-muted-foreground">
                    via {c.llms.join(", ")}
                  </span>
                </div>
                <p className="text-muted-foreground mt-0.5">{c.cited_for}</p>
                <p className="mt-0.5">{c.why}</p>
              </li>
            ))}
          </ul>
        </details>
      )}

      {geo.researched_at && (
        <p className="text-[10px] text-muted-foreground text-right tabular-nums">
          Researched {new Date(geo.researched_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

// ---- SEO sub-section --------------------------------------------------------

export function VolumeTierBadge({
  tier,
  estimate,
}: {
  tier: VolumeTier;
  estimate: number | null;
}) {
  const cls =
    tier === "high"
      ? "bg-emerald-100 text-emerald-900 border-emerald-200"
      : tier === "medium"
        ? "bg-amber-100 text-amber-900 border-amber-200"
        : "bg-zinc-100 text-zinc-700 border-zinc-200";
  return (
    <Badge
      variant="outline"
      className={`text-[10px] uppercase tracking-wide font-normal border ${cls}`}
    >
      {tier} vol · {estimate ? estimate.toLocaleString() : "?"}/mo
    </Badge>
  );
}

function SeoPanel({
  analysis,
  strategy,
  volume,
  tier,
  difficulty,
}: {
  analysis: SerpAnalysis;
  strategy: string | null;
  volume: number | null;
  tier: VolumeTier | null;
  difficulty: number | null;
}) {
  void tier;
  return (
    <Card className="p-5 space-y-5 border-zinc-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold">SEO research</h2>
        </div>
        <div className="flex items-center gap-4 text-xs tabular-nums text-muted-foreground">
          <span>
            Volume{" "}
            <span className="text-foreground font-medium">
              {volume?.toLocaleString() ?? "?"}/mo
            </span>
          </span>
          <span>
            Difficulty{" "}
            <span className="text-foreground font-medium">
              {difficulty ?? "?"}/100
            </span>
          </span>
          <span>
            Intent{" "}
            <span className="text-foreground font-medium capitalize">
              {analysis.intent_classification}
            </span>
          </span>
          {analysis.serp_features.length > 0 && (
            <span>
              SERP{" "}
              <span className="text-foreground font-medium">
                {analysis.serp_features
                  .filter((f) => f !== "none")
                  .join(", ") || "plain"}
              </span>
            </span>
          )}
        </div>
      </div>

      {strategy && (
        <div className="border-l-2 border-zinc-950 bg-zinc-50 p-4 rounded-r-md">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
            Strategy to rank
          </p>
          <p className="text-sm leading-relaxed">{strategy}</p>
        </div>
      )}

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
          Top {analysis.top_results.length} ranking now
        </p>
        <ol className="space-y-2">
          {analysis.top_results.map((r) => (
            <li key={r.rank} className="flex items-start gap-3 text-sm">
              <span className="font-mono text-xs text-muted-foreground tabular-nums w-6 shrink-0 pt-0.5">
                #{r.rank}
              </span>
              <div className="flex-1 min-w-0">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline truncate block"
                >
                  {r.title}
                </a>
                <p className="text-xs text-muted-foreground truncate font-mono">
                  {r.url}
                </p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {r.snippet}
                </p>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] uppercase tracking-wide font-normal capitalize shrink-0"
              >
                {r.domain_type.replace(/_/g, " ")}
              </Badge>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}
