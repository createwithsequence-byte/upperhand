"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bulkScheduleArticles } from "../../actions";
import { STATUS_LABEL } from "@/lib/article-status";
import type { Article } from "@/lib/types";

const CADENCES = [
  { label: "Daily", days: 1 },
  { label: "Every other day", days: 2 },
  { label: "Twice a week", days: 3 },
  { label: "Weekly", days: 7 },
  { label: "Bi-weekly", days: 14 },
];

export function ScheduleForm({
  unscheduled,
  threadOptions,
}: {
  unscheduled: Article[];
  threadOptions: Array<{ id: string; title: string }>;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [cadenceDays, setCadenceDays] = useState(7);
  const [angle, setAngle] = useState("");
  const [filterThread, setFilterThread] = useState<string | "all">("all");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const filtered = useMemo(
    () =>
      filterThread === "all"
        ? unscheduled
        : unscheduled.filter((a) => a.thread_id === filterThread),
    [unscheduled, filterThread],
  );

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((a) => a.id)));
  };

  const handleCommit = () => {
    if (selected.size === 0) {
      toast.error("Pick at least one article first.");
      return;
    }
    const ids = filtered.filter((a) => selected.has(a.id)).map((a) => a.id);
    startTransition(async () => {
      const res = await bulkScheduleArticles(
        ids,
        startDate,
        cadenceDays,
        angle.trim() || undefined,
      );
      if (res.ok) {
        toast.success(
          `Scheduled ${res.data.count} articles starting ${startDate}`,
        );
        setSelected(new Set());
        setAngle("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-semibold">Commit to an angle</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label className="text-xs">Start date</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Cadence</Label>
          <select
            value={cadenceDays}
            onChange={(e) => setCadenceDays(parseInt(e.target.value, 10))}
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
          >
            {CADENCES.map((c) => (
              <option key={c.days} value={c.days}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-xs">
            Angle label{" "}
            <span className="font-normal text-muted-foreground">
              (optional — name the commitment)
            </span>
          </Label>
          <Input
            value={angle}
            onChange={(e) => setAngle(e.target.value)}
            placeholder="e.g. Memorial gifts series — June"
          />
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            <Label className="text-xs">Filter by thread:</Label>
            <select
              value={filterThread}
              onChange={(e) => setFilterThread(e.target.value)}
              className="h-8 px-2 rounded-md border border-input bg-background text-sm"
            >
              <option value="all">All threads</option>
              {threadOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={selectAll}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            {selected.size === filtered.length && filtered.length > 0
              ? "Clear"
              : "Select all"}
          </button>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No unscheduled articles match that filter.
          </p>
        ) : (
          <div className="border rounded-md max-h-96 overflow-y-auto">
            {filtered.map((article) => (
              <label
                key={article.id}
                className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-muted/40 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.has(article.id)}
                  onChange={() => toggle(article.id)}
                  className="rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Volume tier badge removed in 2.10 cleanup — see scheduled-list.tsx. */}
                    <span className="text-sm font-medium truncate">
                      {article.title}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground truncate">
                    {article.target_query}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase tracking-wide capitalize shrink-0"
                >
                  {STATUS_LABEL[article.status] ?? article.status}
                </Badge>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <span className="text-xs text-muted-foreground tabular-nums">
          {selected.size} selected · last publish:{" "}
          {selected.size > 0
            ? new Date(
                new Date(startDate).getTime() +
                  (selected.size - 1) * cadenceDays * 86400000,
              ).toLocaleDateString()
            : "—"}
        </span>
        <Button
          onClick={handleCommit}
          disabled={pending || selected.size === 0}
          className="bg-zinc-950 hover:bg-zinc-800 gap-2"
        >
          {pending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Committing…
            </>
          ) : (
            <>Commit {selected.size > 0 ? `${selected.size} articles` : ""}</>
          )}
        </Button>
      </div>
    </Card>
  );
}
