-- v3 — SEO research + scheduling
-- Additive only. Does not drop any v2 tables or columns.

set search_path = public;

-- Per-thread keyword expansion (related keywords + volume estimates + difficulty)
alter table threads
  add column if not exists keyword_research jsonb;

-- Per-article SEO data
alter table articles
  add column if not exists search_volume_estimate int,
  add column if not exists keyword_difficulty int check (keyword_difficulty between 0 and 100),
  add column if not exists volume_tier text check (volume_tier in ('high', 'medium', 'low')),
  add column if not exists serp_analysis jsonb,
  add column if not exists ranking_strategy text,
  add column if not exists scheduled_for date,
  add column if not exists committed_angle text,
  add column if not exists seo_researched_at timestamptz;

create index if not exists articles_scheduled_for_idx
  on articles (scheduled_for) where scheduled_for is not null;

create index if not exists articles_volume_tier_idx
  on articles (volume_tier) where volume_tier is not null;

create index if not exists articles_committed_angle_idx
  on articles (committed_angle) where committed_angle is not null;
