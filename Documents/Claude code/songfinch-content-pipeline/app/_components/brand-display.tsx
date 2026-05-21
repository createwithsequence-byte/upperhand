import { Check, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Brand } from "@/lib/types";

/**
 * Read-only summary of the persisted brand. Renders at the top of the
 * homepage above the editor so Greg always sees what's actually stored —
 * the editor below is the work area. After save + revalidate, this card
 * updates with the new data.
 */
export function BrandDisplay({ brand }: { brand: Brand }) {
  const hasBrand =
    brand.id && (brand.name?.trim() || (brand.about?.trim()?.length ?? 0) > 0);

  if (!hasBrand) return null;

  const personasFilled = brand.personas.filter(
    (p) => p.name?.trim() && p.description?.trim(),
  );
  const impactsFilled = brand.customer_impact.filter(
    (c) => c.situation?.trim() && c.how_brand_helps?.trim(),
  );
  const updated = new Date(brand.updated_at);
  const updatedAgo = formatRelativeTime(updated);

  return (
    <Card className="p-6 space-y-5 border-zinc-200 bg-gradient-to-br from-white to-zinc-50">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-emerald-100 text-emerald-900 border-emerald-200 hover:bg-emerald-100 text-[10px] uppercase tracking-wide font-normal gap-1">
              <Check className="w-3 h-3" />
              Stored
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              Updated {updatedAgo}
            </span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {brand.name || "(unnamed)"}
          </h2>
          {brand.about && (
            <p className="text-sm text-muted-foreground leading-relaxed pt-1 line-clamp-3">
              {brand.about}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0 text-right">
          <span className="text-xs text-muted-foreground tabular-nums">
            {personasFilled.length}{" "}
            {personasFilled.length === 1 ? "persona" : "personas"}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {impactsFilled.length}{" "}
            {impactsFilled.length === 1 ? "impact" : "impacts"}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {brand.about?.length ?? 0} chars
          </span>
        </div>
      </div>

      {personasFilled.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Personas
            </p>
            <div className="flex flex-wrap gap-1.5">
              {personasFilled.map((p, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="font-normal text-xs bg-white"
                  title={p.description}
                >
                  {p.name}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {impactsFilled.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Customer impact
            </p>
            <ul className="space-y-1.5 text-sm">
              {impactsFilled.map((c, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-muted-foreground shrink-0">·</span>
                  <span className="line-clamp-1">{c.situation}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <p className="text-xs text-muted-foreground pt-2">
        Edit anything below — your changes overwrite this card on save.
      </p>
    </Card>
  );
}

function formatRelativeTime(date: Date): string {
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return "—";
  const now = Date.now();
  const diff = (now - date.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}
