-- Songfinch Content Pipeline — initial schema
-- Single-user tool. RLS enabled with deny-all default; all access via server actions using service role key.

set search_path = public;

create extension if not exists pgcrypto;

-- Brand graph (singleton row)
create table brand_graph (
  id uuid primary key default gen_random_uuid(),
  emotions jsonb not null default '[]'::jsonb,
  occasions jsonb not null default '[]'::jsonb,
  audiences jsonb not null default '[]'::jsonb,
  recipients jsonb not null default '[]'::jsonb,
  scenarios jsonb not null default '[]'::jsonb,
  differentiators jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Topic queue
create table topics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  target_query text not null,
  format text not null check (format in ('listicle', 'explainer', 'comparison', 'occasion-guide', 'behind-the-song', 'wedge')),
  predicted_search_volume text not null check (predicted_search_volume in ('low', 'medium', 'high')),
  geo_potential int not null check (geo_potential between 1 and 10),
  songfinch_relevance int not null check (songfinch_relevance between 1 and 10),
  wedge boolean not null default false,
  reasoning text not null,
  final_score real,
  rank int,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'in_progress', 'written')),
  generation_batch uuid,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create index topics_status_rank_idx on topics (status, rank desc nulls last);
create index topics_batch_idx on topics (generation_batch);

-- Briefs (research bundle + outline + human inputs)
create table briefs (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  research_bundle jsonb,
  brief_json jsonb,
  human_inputs jsonb not null default '{}'::jsonb,
  status text not null default 'researching' check (status in ('researching', 'awaiting_human', 'ready_to_draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index briefs_topic_idx on briefs (topic_id);
create index briefs_status_idx on briefs (status);

-- Articles (drafts + QA)
create table articles (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references briefs(id) on delete cascade,
  markdown text,
  schema_json jsonb,
  social_cuts jsonb,
  qa_result jsonb,
  status text not null default 'drafting' check (status in ('drafting', 'ready_for_qa', 'ready_for_review', 'exported')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  exported_at timestamptz
);

create index articles_brief_idx on articles (brief_id);
create index articles_status_idx on articles (status);

-- Reference examples (voice calibration for QA agent)
create table reference_examples (
  id uuid primary key default gen_random_uuid(),
  url text,
  title text not null,
  voice_type text not null check (voice_type in ('emulate', 'avoid')),
  excerpt text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index reference_examples_voice_type_idx on reference_examples (voice_type);

-- updated_at triggers
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger brand_graph_updated_at before update on brand_graph
  for each row execute function set_updated_at();
create trigger briefs_updated_at before update on briefs
  for each row execute function set_updated_at();
create trigger articles_updated_at before update on articles
  for each row execute function set_updated_at();

-- Lock everything down. Service role bypasses RLS; anon key gets nothing.
alter table brand_graph enable row level security;
alter table topics enable row level security;
alter table briefs enable row level security;
alter table articles enable row level security;
alter table reference_examples enable row level security;
