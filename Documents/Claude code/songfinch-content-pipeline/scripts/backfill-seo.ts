/**
 * Phase 2.2 backfill — copy existing SEO data from articles.* columns into
 * the new seo_research table. Idempotent: re-running is safe because we
 * use upsert.
 *
 * Run once after applying migration 0004_geo_monitor_schema.sql:
 *   npx tsx scripts/backfill-seo.ts
 *
 * The articles.* SEO columns are NOT deleted here — they remain until the
 * cleanup migration in 2.10. This script just creates a parallel row in
 * seo_research for each article that already has SEO data.
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
    process.exit(1);
  }
  const supabase = createClient(url, key);

  console.log("[backfill-seo] fetching articles with SEO data…");

  // Pull all articles that have ANY SEO column populated.
  const { data: articles, error } = await supabase
    .from("articles")
    .select(
      "id, serp_analysis, search_volume_estimate, keyword_difficulty, volume_tier, ranking_strategy, seo_researched_at",
    )
    .or(
      "serp_analysis.not.is.null,search_volume_estimate.not.is.null,ranking_strategy.not.is.null",
    );

  if (error) {
    console.error("[backfill-seo] fetch failed", error);
    process.exit(1);
  }

  if (!articles || articles.length === 0) {
    console.log("[backfill-seo] no articles with SEO data — nothing to copy.");
    return;
  }

  console.log(
    `[backfill-seo] found ${articles.length} articles with SEO data. Upserting into seo_research…`,
  );

  const rows = articles.map((a) => {
    const serp = (a.serp_analysis ?? {}) as {
      top_results?: unknown;
      serp_features?: unknown;
      intent_classification?: string;
    };
    return {
      article_id: a.id,
      // The old serp_analysis JSON had top_results inside it; pull it apart
      // into the new column shape. Fall back to dumping the whole object if
      // structure doesn't match.
      serp_top10: serp.top_results ?? a.serp_analysis ?? null,
      serp_features: serp.serp_features ?? null,
      search_intent: serp.intent_classification ?? null,
      search_volume_estimate: a.search_volume_estimate,
      keyword_difficulty: a.keyword_difficulty,
      volume_tier: a.volume_tier,
      ranking_strategy: a.ranking_strategy,
      researched_at: a.seo_researched_at,
    };
  });

  // Upsert in chunks so a single failure doesn't lose everything.
  const CHUNK = 50;
  let inserted = 0;
  let failed = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error: upsertErr } = await supabase
      .from("seo_research")
      .upsert(chunk, { onConflict: "article_id" });
    if (upsertErr) {
      failed += chunk.length;
      console.error(
        `[backfill-seo] chunk ${i / CHUNK + 1} failed:`,
        upsertErr.message,
      );
    } else {
      inserted += chunk.length;
    }
  }

  console.log(
    `[backfill-seo] done. ${inserted} rows upserted, ${failed} failed, ${articles.length} source articles.`,
  );

  // Verification check — count rows in seo_research and compare.
  const { count } = await supabase
    .from("seo_research")
    .select("article_id", { count: "exact", head: true });
  console.log(
    `[backfill-seo] seo_research now has ${count ?? "?"} total rows.`,
  );
}

main().catch((err) => {
  console.error("[backfill-seo] fatal", err);
  process.exit(1);
});
