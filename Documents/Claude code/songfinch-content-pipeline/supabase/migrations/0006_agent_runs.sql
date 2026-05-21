-- v6 — agent_runs table for observability.
--
-- Every agent call (research, draft, QA, score-checklist, etc.) writes
-- one row here capturing what happened: which agent, which article, how
-- long it took, how many tokens, how much it cost, did it fail, what was
-- the error. The /admin/runs dashboard reads this to answer:
--
--   - "Where is my $40 going?"
--   - "Which agent fails most?"
--   - "Is Gemini 503-ing more today than yesterday?"
--   - "How long does a full A→Z pipeline cost in tokens?"
--
-- Before this table: we grep dev logs. After: one query.

set search_path = public;

create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),

  -- Scope of the run. article_id is nullable because some agents work at
  -- the thread level (expand-prompts, expand-keywords) or don't bind to any
  -- entity (monitor batch).
  article_id uuid references articles(id) on delete cascade,
  thread_id uuid references threads(id) on delete cascade,

  -- Agent identifier. Use the same names defined in lib/article-status.ts
  -- AgentKey type so the dashboard can group cleanly. Examples:
  --   research-seo, research-geo, score-checklist, auto-draft, write-draft,
  --   run-qa, build-brief, expand-prompts, expand-keywords, monitor-run.
  agent text not null,

  -- Run status. 'success' means the agent returned a usable result.
  -- 'retried_success' = succeeded after at least one retry. 'failed' =
  -- exhausted retries and bubbled an error. 'cancelled' is reserved for
  -- future use (e.g. user-aborted long-running calls).
  status text not null check (
    status in ('success', 'retried_success', 'failed', 'cancelled')
  ),

  -- Performance metrics.
  duration_ms int,
  input_tokens int,
  output_tokens int,
  -- USD cost estimate. We compute this client-side from token counts +
  -- known model prices because Gemini's API doesn't return cost directly.
  cost_usd numeric(10, 6),

  -- Model identifier. e.g. 'gemini-2.5-flash', 'claude-sonnet-4-5'.
  -- Lets the dashboard split cost by model when we go multi-provider.
  model text,

  -- Failure context. error_message is the human string; error_kind buckets
  -- errors for analysis ('rate_limit', 'overload', 'timeout', 'schema',
  -- 'quota', 'unknown'). retry_count is how many internal retries the
  -- AI SDK did before giving up (or succeeding).
  error_message text,
  error_kind text,
  retry_count int default 0,

  -- Optional metadata blob for agent-specific fields that don't deserve
  -- their own column (prompt_hash for prompt versioning, output_summary
  -- for quick scanning, etc.).
  metadata jsonb,

  ran_at timestamptz not null default now()
);

-- Index for the dashboard's main queries: filter by agent or by date.
create index if not exists agent_runs_agent_ran_at_idx
  on agent_runs (agent, ran_at desc);
create index if not exists agent_runs_ran_at_idx
  on agent_runs (ran_at desc);
create index if not exists agent_runs_article_id_idx
  on agent_runs (article_id) where article_id is not null;
create index if not exists agent_runs_status_idx
  on agent_runs (status) where status != 'success';

-- RLS — deny-all by default. Service role bypasses, matches the pattern
-- used by every other table in this project.
alter table agent_runs enable row level security;
