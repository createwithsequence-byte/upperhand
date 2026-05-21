-- v5 — Drop legacy SEO columns from articles; ensure scheduling columns exist.
--
-- The 0003 "SEO and scheduling" migration was never applied to the cloud DB
-- (confirmed by direct column inspection on 2026-05-19). That means BOTH
-- the legacy SEO columns and the scheduling columns are missing in cloud
-- right now. Two halves of this migration:
--
-- 1. Make sure the scheduling columns from 0003 exist (the /schedule page
--    depends on them — `scheduled_for`, `committed_angle`). These are still
--    canonical, not legacy.
--
-- 2. Drop the legacy SEO columns that 0003 added (or would have added).
--    The canonical source is now seo_research. Phase 2.x had us writing to
--    both for back-compat — this migration ends that pattern.
--
-- After this runs:
--   - /schedule works (scheduling columns present).
--   - Workspace reads SEO data only from seo_research (no more
--     `seo?.foo ?? article.foo` dual-source fallbacks).
--   - The Article type in lib/types.ts gets pruned to match.
--
-- All operations use `if exists` / `if not exists` so this is idempotent
-- and safe to run on cloud DBs at varying drift states.

set search_path = public;

-- 1a. Scheduling columns (canonical — keep these around).
alter table articles
  add column if not exists scheduled_for date,
  add column if not exists committed_angle text;

create index if not exists articles_scheduled_for_idx
  on articles (scheduled_for) where scheduled_for is not null;

create index if not exists articles_committed_angle_idx
  on articles (committed_angle) where committed_angle is not null;

-- 1b. Thread-level keyword universe storage. Was supposed to land in 0003
-- but that migration never applied on cloud. expand-keywords writes here.
alter table threads
  add column if not exists keyword_research jsonb;

-- 2. Drop legacy SEO columns (canonical source is seo_research from 0004).
alter table articles
  drop column if exists search_volume_estimate,
  drop column if exists keyword_difficulty,
  drop column if exists volume_tier,
  drop column if exists serp_analysis,
  drop column if exists ranking_strategy,
  drop column if exists seo_researched_at;

drop index if exists articles_volume_tier_idx;
