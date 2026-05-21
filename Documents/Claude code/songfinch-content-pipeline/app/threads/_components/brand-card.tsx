import Link from "next/link";
import { Check, Pencil, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GenerateThreadsButton } from "./generate-button";
import type { Brand } from "@/lib/types";

/**
 * Brand-as-card in Step 2. The brand is the *operational unit* here — the
 * Generate Threads button lives inside the card so the action belongs to
 * the brand. Pencil icon links back to Step 1 for full editing. Future
 * multi-brand work just renders one of these per stored brand.
 */
export function BrandCard({
  brand,
  threadCount,
}: {
  brand: Brand;
  threadCount: number;
}) {
  const ready = brand.id && brand.about && brand.about.length > 50;

  const personasFilled = brand.personas.filter(
    (p) => p.name?.trim() && p.description?.trim(),
  );
  const impactsFilled = brand.customer_impact.filter(
    (c) => c.situation?.trim() && c.how_brand_helps?.trim(),
  );

  if (!brand.id) {
    return (
      <Card className="p-6 border-dashed border-amber-300 bg-amber-50">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-semibold">No brand stored yet</h2>
            <p className="text-sm text-muted-foreground">
              Define a brand in Step 1 before generating threads.
            </p>
          </div>
          <Link href="/">
            <button className="text-sm font-medium underline">
              Go to Step 1 →
            </button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-5 border-zinc-200 bg-gradient-to-br from-white to-zinc-50">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-emerald-100 text-emerald-900 border-emerald-200 hover:bg-emerald-100 text-[10px] uppercase tracking-wide font-normal gap-1">
              <Check className="w-3 h-3" />
              Stored
            </Badge>
            {!ready && (
              <Badge
                variant="outline"
                className="text-[10px] uppercase tracking-wide font-normal border-amber-300 text-amber-900 bg-amber-50"
              >
                Needs setup
              </Badge>
            )}
            <span className="text-xs text-muted-foreground tabular-nums">
              · {threadCount} {threadCount === 1 ? "thread" : "threads"}{" "}
              generated
            </span>
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight">
              {brand.name || "(unnamed)"}
            </h2>
            <Link
              href="/"
              aria-label="Edit brand"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Link>
          </div>
          {brand.about && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 pt-1 max-w-2xl">
              {brand.about}
            </p>
          )}
        </div>
        <div className="shrink-0">
          <GenerateThreadsButton brandReady={!!ready} />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Personas ({personasFilled.length})
          </p>
          {personasFilled.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              None defined yet
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {personasFilled.slice(0, 6).map((p, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="font-normal text-xs bg-white"
                  title={p.description}
                >
                  {p.name}
                </Badge>
              ))}
              {personasFilled.length > 6 && (
                <span className="text-xs text-muted-foreground self-center">
                  +{personasFilled.length - 6} more
                </span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Impacts ({impactsFilled.length})
          </p>
          {impactsFilled.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              None defined yet
            </p>
          ) : (
            <ul className="space-y-1 text-sm">
              {impactsFilled.slice(0, 4).map((c, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-muted-foreground shrink-0">·</span>
                  <span className="line-clamp-1">{c.situation}</span>
                </li>
              ))}
              {impactsFilled.length > 4 && (
                <li className="text-xs text-muted-foreground pl-3">
                  +{impactsFilled.length - 4} more
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      {!ready && (
        <div className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-md p-3">
          Needs at least a name, 50+ char about, one persona, and one impact
          before Generate Threads is enabled.{" "}
          <Link href="/" className="underline font-medium">
            Edit in Step 1 →
          </Link>
        </div>
      )}
    </Card>
  );
}
