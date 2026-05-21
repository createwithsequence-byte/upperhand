-- v2 — waterfall schema: Brand → Threads → Articles
-- Drops v1 tables (brand_graph, topics, briefs, articles). Keeps reference_examples.
-- The set_updated_at() function already exists from 0001.

set search_path = public;

-- Drop v1 tables
drop table if exists articles cascade;
drop table if exists briefs cascade;
drop table if exists topics cascade;
drop table if exists brand_graph cascade;

-- Brand (single-row, structured)
create table brand (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Songfinch',
  about text not null default '',
  personas jsonb not null default '[]'::jsonb,
  customer_impact jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Threads (SEO clusters/angles generated from the brand)
create table threads (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brand(id) on delete cascade,
  title text not null,
  angle text not null,
  description text not null,
  reasoning text not null,
  search_intent text,
  seo_potential int check (seo_potential between 1 and 10),
  brand_relevance int check (brand_relevance between 1 and 10),
  wedge boolean not null default false,
  score real,
  rank int,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  generation_batch uuid,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create index threads_status_rank_idx on threads (status, rank desc nulls last);
create index threads_brand_idx on threads (brand_id);

-- Articles (one or many per thread; full lifecycle: idea → exported)
create table articles (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references threads(id) on delete cascade,
  title text not null,
  target_query text not null,
  format text not null check (format in ('listicle', 'explainer', 'comparison', 'occasion-guide', 'behind-the-song', 'wedge')),
  reasoning text not null,
  geo_potential int check (geo_potential between 1 and 10),
  score real,
  rank int,
  status text not null default 'idea' check (status in ('idea', 'approved', 'researching', 'awaiting_human', 'ready_to_draft', 'drafting', 'ready_for_qa', 'ready_for_review', 'exported')),
  research_bundle jsonb,
  brief_json jsonb,
  human_inputs jsonb not null default '{}'::jsonb,
  markdown text,
  schema_json jsonb,
  social_cuts jsonb,
  qa_result jsonb,
  generation_batch uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz,
  exported_at timestamptz
);

create index articles_thread_idx on articles (thread_id);
create index articles_status_rank_idx on articles (status, rank desc nulls last);

-- Triggers
create trigger brand_updated_at before update on brand
  for each row execute function set_updated_at();
create trigger articles_updated_at before update on articles
  for each row execute function set_updated_at();

-- Lock down
alter table brand enable row level security;
alter table threads enable row level security;
alter table articles enable row level security;
