import Link from "next/link";
import { fetchAllArticles, fetchThreads } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { SetupNotice } from "../_components/setup-notice";
import { ScheduleForm } from "./_components/schedule-form";
import { ScheduledList } from "./_components/scheduled-list";
import type { Article } from "@/lib/types";

export default async function SchedulePage() {
  const [articlesRes, threadsRes] = await Promise.all([
    fetchAllArticles(),
    fetchThreads("approved"),
  ]);

  if (!articlesRes.configured) return <SetupNotice />;

  const articles = articlesRes.data;
  const threads = threadsRes.data;

  const scheduled = articles.filter((a) => a.scheduled_for);
  const unscheduled = articles.filter(
    (a) => !a.scheduled_for && a.status !== "idea" && a.status !== "exported",
  );

  // Group scheduled by month (YYYY-MM)
  const byMonth = new Map<string, Article[]>();
  for (const a of scheduled) {
    if (!a.scheduled_for) continue;
    const key = a.scheduled_for.slice(0, 7);
    const list = byMonth.get(key) ?? [];
    list.push(a);
    byMonth.set(key, list);
  }
  const months = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b));

  // For the thread-context label on each scheduled-list row.
  const threadTitlesById = Object.fromEntries(
    threads.map((t) => [t.id, t.title]),
  );

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Schedule</h1>
        <p className="text-muted-foreground max-w-xl">
          Commit to an angle by picking articles, setting a start date, and
          choosing a cadence. The schedule is what turns a queue into a
          publishing rhythm.
        </p>
      </div>

      <ScheduleForm
        unscheduled={unscheduled}
        threadOptions={threads.map((t) => ({ id: t.id, title: t.title }))}
      />

      {scheduled.length > 0 && (
        <div className="space-y-6">
          <h2 className="font-semibold tracking-tight">On the calendar</h2>
          {months.map(([month, list]) => (
            <ScheduledList
              key={month}
              month={month}
              articles={list}
              threadTitlesById={threadTitlesById}
            />
          ))}
        </div>
      )}

      {unscheduled.length === 0 && scheduled.length === 0 && (
        <Card className="p-16 text-center">
          <p className="text-muted-foreground">No articles to schedule yet.</p>
          <p className="text-xs text-muted-foreground mt-3">
            Approve some article ideas first.{" "}
            <Link href="/threads" className="underline">
              Threads →
            </Link>
          </p>
        </Card>
      )}
    </div>
  );
}
