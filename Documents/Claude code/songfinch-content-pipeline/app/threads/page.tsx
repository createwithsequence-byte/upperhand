import Link from "next/link";
import { fetchBrand, fetchThreads } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SetupNotice } from "../_components/setup-notice";
import { BrandCard } from "./_components/brand-card";
import { ThreadRow } from "./_components/thread-row";
import type { ThreadStatus } from "@/lib/types";

const STATUSES: ThreadStatus[] = ["pending", "approved", "rejected"];

export default async function ThreadsPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  const status = (
    STATUSES.includes(searchParams?.status as ThreadStatus)
      ? (searchParams!.status as ThreadStatus)
      : "pending"
  ) as ThreadStatus;

  // Fetch ALL threads for the brand-card thread count, plus the filtered set
  // we actually render below.
  const [brandRes, threadsRes, allThreadsRes] = await Promise.all([
    fetchBrand(),
    fetchThreads(status),
    fetchThreads(),
  ]);

  if (!brandRes.configured) return <SetupNotice />;

  const totalThreads = allThreadsRes.data.length;

  return (
    <div className="space-y-8">
      <div className="space-y-2 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Threads</h1>
        <p className="text-muted-foreground text-balance">
          Pick a stored brand below and generate strategic SEO threads from it.
          Approve the ones worth developing. Each approved thread becomes a
          cluster of articles.
        </p>
      </div>

      {/* Stored brands section */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Stored brands
          </h2>
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            + New brand
          </Link>
        </div>
        <BrandCard brand={brandRes.data} threadCount={totalThreads} />
      </section>

      {/* Generated threads section */}
      {totalThreads > 0 && (
        <section className="space-y-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Generated threads
            </h2>
            <div className="flex gap-2 text-sm">
              {STATUSES.map((s) => (
                <Link
                  key={s}
                  href={s === "pending" ? "/threads" : `/threads?status=${s}`}
                  className={`px-3 py-1 rounded-md border transition-colors ${
                    status === s
                      ? "bg-zinc-950 text-white border-zinc-950"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
                  }`}
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>

          {threadsRes.data.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground text-sm">
                No <Badge variant="outline">{status}</Badge> threads.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {threadsRes.data.map((thread) => (
                <ThreadRow key={thread.id} thread={thread} />
              ))}
            </div>
          )}
        </section>
      )}

      {totalThreads === 0 && brandRes.data.id && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No threads generated yet.</p>
          <p className="text-xs text-muted-foreground mt-3">
            Click <strong>Generate threads</strong> in the brand card above to
            ideate strategic SEO angles.
          </p>
        </Card>
      )}
    </div>
  );
}
