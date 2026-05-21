-- Phase 2 schema — GEO + Monitor architecture.
-- Additive only. The existing articles.serp_analysis / search_volume_estimate
-- columns remain populated until the 2.10 cleanup migration; seo_research is
-- the new write target.

-- Per-article SEO research (was inlined on articles.*)
create table if not exists seo_research (
  article_id uuid primary key references articles(id) on delete cascade,
  serp_top10 jsonb,
  serp_features jsonb,
  search_intent text,
  search_volume_estimate int,
  keyword_difficulty int,
  volume_tier text,
  ranking_strategy text,
  researched_at timestamptz
);

-- Per-article GEO research — citation strategy for LLM answers
create table if not exists geo_research (
  article_id uuid primary key references articles(id) on delete cascade,
  target_prompts jsonb,
  target_llms text[],
  citation_checklist jsonb,
  citation_strategy text,
  competitor_citations jsonb,
  researched_at timestamptz
);

-- Per-thread keyword universe (relocated from threads.keyword_research jsonb)
create table if not exists thread_keyword_universe (
  thread_id uuid primary key references threads(id) on delete cascade,
  keywords jsonb,
  researched_at timestamptz
);

-- Per-thread prompt universe — natural-language LLM prompts inside this thread
create table if not exists thread_prompt_universe (
  thread_id uuid primary key references threads(id) on delete cascade,
  prompts jsonb,
  researched_at timestamptz
);

-- Saved monitor prompts (the "questions we ask LLMs about Songfinch on a cadence")
create table if not exists monitor_prompts (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  active boolean default true,
  cadence_days int default 7,
  last_run_at timestamptz,
  created_at timestamptz default now()
);

-- Monitor run history. llm is a string column so adding 'openai' / 'perplexity'
-- later is a row write, not a migration.
create table if not exists monitor_runs (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid references monitor_prompts(id) on delete cascade,
  ran_at timestamptz default now(),
  llm text not null,
  response_text text,
  brand_mentioned boolean,
  brand_position int,
  framing text,
  competitors_mentioned text[]
);

create index if not exists monitor_runs_prompt_ran_idx
  on monitor_runs (prompt_id, ran_at desc);
create index if not exists monitor_runs_llm_ran_idx
  on monitor_runs (llm, ran_at desc);

-- RLS — same posture as the rest of the schema. Server actions use the service
-- role key which bypasses RLS; the anon key gets nothing.
alter table seo_research enable row level security;
alter table geo_research enable row level security;
alter table thread_keyword_universe enable row level security;
alter table thread_prompt_universe enable row level security;
alter table monitor_prompts enable row level security;
alter table monitor_runs enable row level security;
