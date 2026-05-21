-- v7 — article_drafts: versioned draft history.
--
-- Before this table: articles.markdown stored ONE draft. Re-running write
-- or auto-draft overwrites the previous attempt. You can't compare scores
-- across iterations, can't A/B prompts, can't see "v2 fixed the cadence
-- issue but v1 had a better opener."
--
-- After: every draft run writes a new row here, version-numbered per
-- article. The articles.markdown / schema_json / social_cuts columns
-- continue to hold the CURRENT (most recent) draft for fast reads — the
-- workspace doesn't need to know about versions to render the latest.
-- But the history is queryable for compare views, regression analysis,
-- and re-running QA against older drafts.
--
-- The qa_result column on this table captures the QA verdict at draft
-- time. This lets "show me draft v2's QA" be one query, even if QA has
-- been re-run since.

set search_path = public;

create table if not exists article_drafts (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,

  -- Per-article monotonic version starting at 1. Application code is
  -- responsible for computing the next version (select max(version) + 1).
  -- A unique constraint prevents accidental concurrent overwrites.
  version int not null,

  -- The draft itself.
  markdown text not null,
  schema_json jsonb,
  social_cuts jsonb,

  -- QA at the time this draft was produced. nullable because the auto-QA
  -- step happens AFTER the draft is persisted; we can re-fetch and patch.
  qa_result jsonb,

  -- Which agent produced this draft. 'auto-draft' for Path A
  -- (keyword → draft), 'write-draft' for the brief-based Path B, 'manual'
  -- if Greg pasted in his own.
  agent text not null check (agent in ('auto-draft', 'write-draft', 'manual')),

  -- Hash of the prompt template version used. Set once we move to
  -- markdown prompt files (Item 5). For now: stays null, the column is
  -- here so we don't need another migration later.
  prompt_hash text,

  created_at timestamptz not null default now(),

  unique (article_id, version)
);

create index if not exists article_drafts_article_version_idx
  on article_drafts (article_id, version desc);
create index if not exists article_drafts_created_at_idx
  on article_drafts (created_at desc);

alter table article_drafts enable row level security;
