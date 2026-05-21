import { Card } from "@/components/ui/card";

type Framing = "recommended" | "mentioned" | "compared" | "negative";

const FRAMING_STYLES: Record<
  Framing,
  { label: string; bg: string; text: string }
> = {
  recommended: {
    label: "Recommended",
    bg: "bg-emerald-500",
    text: "text-emerald-900",
  },
  mentioned: { label: "Mentioned", bg: "bg-zinc-400", text: "text-zinc-900" },
  compared: { label: "Compared", bg: "bg-amber-400", text: "text-amber-900" },
  negative: { label: "Negative", bg: "bg-red-500", text: "text-red-900" },
};

const ORDER: Framing[] = ["recommended", "mentioned", "compared", "negative"];

export function FramingBreakdown({
  counts,
  total,
}: {
  counts: Record<string, number>;
  total: number;
}) {
  const segments = ORDER.map((f) => ({
    framing: f,
    count: counts[f] ?? 0,
    width: total > 0 ? ((counts[f] ?? 0) / total) * 100 : 0,
  }));

  const totalFramed = segments.reduce((acc, s) => acc + s.count, 0);

  return (
    <Card className="p-5 space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Framing · 4-week
      </p>
      {totalFramed === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No framed runs in window
        </p>
      ) : (
        <>
          <div className="h-3 rounded-full bg-zinc-100 overflow-hidden flex">
            {segments.map(
              (s) =>
                s.width > 0 && (
                  <div
                    key={s.framing}
                    className={FRAMING_STYLES[s.framing].bg}
                    style={{ width: `${s.width}%` }}
                    title={`${FRAMING_STYLES[s.framing].label}: ${s.count}`}
                  />
                ),
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            {segments.map((s) => (
              <div key={s.framing} className="flex items-center gap-1.5">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${FRAMING_STYLES[s.framing].bg}`}
                />
                <span className="text-muted-foreground">
                  {FRAMING_STYLES[s.framing].label}
                </span>
                <span className="ml-auto tabular-nums font-medium">
                  {s.count}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
