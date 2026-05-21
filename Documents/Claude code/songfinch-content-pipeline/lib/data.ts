import "server-only";
import { getSupabase } from "./supabase";
import type {
  Article,
  ArticleStatus,
  Brand,
  ReferenceExample,
  Thread,
  ThreadStatus,
} from "./types";

const emptyBrand: Brand = {
  id: "",
  name: "Songfinch",
  about: "",
  personas: [],
  customer_impact: [],
  updated_at: new Date(0).toISOString(),
};

export type DataFetchResult<T> = {
  data: T;
  configured: boolean;
  error: string | null;
};

function detectConfigured(message: string): boolean {
  return !message.includes("missing NEXT_PUBLIC_SUPABASE_URL");
}

export async function fetchBrand(): Promise<DataFetchResult<Brand>> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("brand")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("[fetchBrand]", error);
      return { data: emptyBrand, configured: true, error: error.message };
    }
    return {
      data: (data as Brand) ?? emptyBrand,
      configured: true,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return {
      data: emptyBrand,
      configured: detectConfigured(message),
      error: message,
    };
  }
}

export async function fetchThreads(
  status?: ThreadStatus,
): Promise<DataFetchResult<Thread[]>> {
  try {
    const supabase = getSupabase();
    let query = supabase
      .from("threads")
      .select("*")
      .order("rank", { ascending: true, nullsFirst: false });
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) {
      console.error("[fetchThreads]", error);
      return { data: [], configured: true, error: error.message };
    }
    return { data: (data as Thread[]) ?? [], configured: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return { data: [], configured: detectConfigured(message), error: message };
  }
}

export async function fetchThread(
  id: string,
): Promise<DataFetchResult<Thread | null>> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("threads")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      console.error("[fetchThread]", error);
      return { data: null, configured: true, error: error.message };
    }
    return {
      data: (data as Thread) ?? null,
      configured: true,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return {
      data: null,
      configured: detectConfigured(message),
      error: message,
    };
  }
}

export async function fetchArticlesForThread(
  threadId: string,
): Promise<DataFetchResult<Article[]>> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("thread_id", threadId)
      .order("rank", { ascending: true, nullsFirst: false });
    if (error) {
      console.error("[fetchArticlesForThread]", error);
      return { data: [], configured: true, error: error.message };
    }
    return { data: (data as Article[]) ?? [], configured: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return { data: [], configured: detectConfigured(message), error: message };
  }
}

/**
 * Returns the set of article IDs that have a seo_research row, scoped to a
 * given thread. Used by the threads page to compute "needs SEO research"
 * counts without joining articles to seo_research in the main query.
 */
export async function fetchSeoResearchedArticleIds(
  articleIds: string[],
): Promise<Set<string>> {
  if (articleIds.length === 0) return new Set();
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("seo_research")
      .select("article_id")
      .in("article_id", articleIds);
    if (error) {
      console.warn("[fetchSeoResearchedArticleIds]", error);
      return new Set();
    }
    return new Set((data ?? []).map((r) => r.article_id as string));
  } catch (err) {
    console.warn("[fetchSeoResearchedArticleIds] threw", err);
    return new Set();
  }
}

export async function fetchAllArticles(
  status?: ArticleStatus,
): Promise<DataFetchResult<Article[]>> {
  try {
    const supabase = getSupabase();
    let query = supabase
      .from("articles")
      .select("*")
      .order("updated_at", { ascending: false });
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) {
      console.error("[fetchAllArticles]", error);
      return { data: [], configured: true, error: error.message };
    }
    return { data: (data as Article[]) ?? [], configured: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return { data: [], configured: detectConfigured(message), error: message };
  }
}

export async function fetchArticle(id: string): Promise<
  DataFetchResult<{
    article: Article;
    thread: Thread;
    seo: SeoResearchRow | null;
    geo: GeoResearchRow | null;
  } | null>
> {
  try {
    const supabase = getSupabase();
    const { data: article, error: articleErr } = await supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (articleErr) {
      console.error("[fetchArticle:article]", articleErr);
      return { data: null, configured: true, error: articleErr.message };
    }
    if (!article) return { data: null, configured: true, error: null };

    const [threadRes, seoRes, geoRes] = await Promise.all([
      supabase
        .from("threads")
        .select("*")
        .eq("id", article.thread_id)
        .maybeSingle(),
      supabase
        .from("seo_research")
        .select("*")
        .eq("article_id", id)
        .maybeSingle(),
      supabase
        .from("geo_research")
        .select("*")
        .eq("article_id", id)
        .maybeSingle(),
    ]);

    if (threadRes.error) {
      console.error("[fetchArticle:thread]", threadRes.error);
      return { data: null, configured: true, error: threadRes.error.message };
    }
    if (seoRes.error) console.warn("[fetchArticle:seo]", seoRes.error);
    if (geoRes.error) console.warn("[fetchArticle:geo]", geoRes.error);

    return {
      data: {
        article: article as Article,
        thread: threadRes.data as Thread,
        seo: (seoRes.data as SeoResearchRow) ?? null,
        geo: (geoRes.data as GeoResearchRow) ?? null,
      },
      configured: true,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return {
      data: null,
      configured: detectConfigured(message),
      error: message,
    };
  }
}

// ---------- GEO / SEO research ----------

export type PromptUniverseRow = {
  prompt: string;
  intent: "transactional" | "informational" | "comparative" | "navigational";
  frequency_estimate: "high" | "medium" | "low";
  citation_difficulty: number;
};

export type ThreadPromptUniverse = {
  thread_id: string;
  prompts: PromptUniverseRow[];
  researched_at: string;
};

export type SeoResearchRow = {
  article_id: string;
  serp_top10: unknown;
  serp_features: unknown;
  search_intent: string | null;
  search_volume_estimate: number | null;
  keyword_difficulty: number | null;
  volume_tier: "high" | "medium" | "low" | null;
  ranking_strategy: string | null;
  researched_at: string | null;
};

export type GeoResearchRow = {
  article_id: string;
  target_prompts: Array<{
    prompt: string;
    weight: "primary" | "secondary";
  }> | null;
  target_llms: string[] | null;
  citation_checklist: {
    named_entities: { score: number; note: string };
    structured_claims: { score: number; note: string };
    anecdotal_specificity: { score: number; note: string };
    schema_markup: { score: number; note: string };
    brand_name_density: { score: number; note: string };
  } | null;
  citation_strategy: string | null;
  competitor_citations: Array<{
    brand: string;
    cited_for: string;
    llms: string[];
    why: string;
  }> | null;
  researched_at: string | null;
};

export async function fetchThreadPromptUniverse(
  threadId: string,
): Promise<DataFetchResult<ThreadPromptUniverse | null>> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("thread_prompt_universe")
      .select("*")
      .eq("thread_id", threadId)
      .maybeSingle();
    if (error) {
      console.error("[fetchThreadPromptUniverse]", error);
      return { data: null, configured: true, error: error.message };
    }
    return {
      data: (data as ThreadPromptUniverse) ?? null,
      configured: true,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return {
      data: null,
      configured: detectConfigured(message),
      error: message,
    };
  }
}

export async function fetchGeoResearch(
  articleId: string,
): Promise<DataFetchResult<GeoResearchRow | null>> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("geo_research")
      .select("*")
      .eq("article_id", articleId)
      .maybeSingle();
    if (error) {
      console.error("[fetchGeoResearch]", error);
      return { data: null, configured: true, error: error.message };
    }
    return {
      data: (data as GeoResearchRow) ?? null,
      configured: true,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return {
      data: null,
      configured: detectConfigured(message),
      error: message,
    };
  }
}

// ---------- Monitor ----------

export type MonitorPrompt = {
  id: string;
  prompt: string;
  active: boolean;
  cadence_days: number;
  last_run_at: string | null;
  created_at: string;
};

export type MonitorRun = {
  id: string;
  prompt_id: string | null;
  ran_at: string;
  llm: string;
  response_text: string | null;
  brand_mentioned: boolean | null;
  brand_position: number | null;
  framing: "recommended" | "mentioned" | "compared" | "negative" | null;
  competitors_mentioned: string[] | null;
};

export async function fetchMonitorPrompts(): Promise<
  DataFetchResult<MonitorPrompt[]>
> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("monitor_prompts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[fetchMonitorPrompts]", error);
      return { data: [], configured: true, error: error.message };
    }
    return {
      data: (data as MonitorPrompt[]) ?? [],
      configured: true,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return { data: [], configured: detectConfigured(message), error: message };
  }
}

export async function fetchMonitorRuns(
  limit = 50,
): Promise<DataFetchResult<MonitorRun[]>> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("monitor_runs")
      .select("*")
      .order("ran_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("[fetchMonitorRuns]", error);
      return { data: [], configured: true, error: error.message };
    }
    return {
      data: (data as MonitorRun[]) ?? [],
      configured: true,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return { data: [], configured: detectConfigured(message), error: message };
  }
}

// ---------- Today Board buckets ----------

export type TodayCard = {
  id: string;
  title: string;
  threadId: string;
  threadTitle: string;
  isWedge: boolean;
  status: ArticleStatus;
  scheduledFor: string | null;
  // QA-driven buckets per the assembly-line UX:
  //   ready    = score ≥ 8 → ship it
  //   polish   = score 6-8 → light edits, suggested fixes available
  //   redraft  = score < 6 → re-run with stricter prompt
  //   working  = system is mid-pipeline (drafting / researching)
  //   no_draft = approved but never drafted (orphan articles)
  bucket: "ready" | "polish" | "redraft" | "working" | "no_draft";
  qaScore: number | null;
  qaPassed: boolean | null;
  bannedCount: number;
  cadenceCount: number;
};

export type TodayBoard = {
  ready: TodayCard[];
  polish: TodayCard[];
  redraft: TodayCard[];
  working: TodayCard[];
  noDraft: TodayCard[];
  totals: {
    ready: number;
    polish: number;
    redraft: number;
    working: number;
    noDraft: number;
  };
};

/**
 * Builds the Today Board — QA-outcome buckets.
 *
 * The assembly-line workflow: user picks threads → system runs everything
 * (research + draft + QA) → articles land here bucketed by QA score so the
 * user acts on OUTCOMES, not process.
 *
 * Buckets:
 *   ready    = QA score ≥ 8 → review and ship
 *   polish   = QA score 6-8 → suggested fixes available, light editing
 *   redraft  = QA score < 6 → not worth saving, re-run with stricter prompt
 *   working  = system is mid-pipeline (status: drafting or researching)
 *   no_draft = approved but never put through the assembly line
 *
 * Hidden from the board:
 *   - status `idea` (still in thread ideation; surface on /threads/[id])
 *   - status `exported` (done; surface elsewhere if needed)
 *   - articles with scheduled_for set (surface on /schedule)
 */
export async function fetchTodayBoard(): Promise<DataFetchResult<TodayBoard>> {
  const empty: TodayBoard = {
    ready: [],
    polish: [],
    redraft: [],
    working: [],
    noDraft: [],
    totals: { ready: 0, polish: 0, redraft: 0, working: 0, noDraft: 0 },
  };
  try {
    const supabase = getSupabase();

    const [articlesRes, threadsRes] = await Promise.all([
      supabase
        .from("articles")
        .select("*")
        .not("status", "in", "(idea,exported)")
        .is("scheduled_for", null)
        .order("updated_at", { ascending: false }),
      supabase.from("threads").select("id, title, wedge"),
    ]);

    if (articlesRes.error) {
      console.error("[fetchTodayBoard]", articlesRes.error);
      return {
        data: empty,
        configured: true,
        error: articlesRes.error.message,
      };
    }

    const articles = (articlesRes.data as Article[]) ?? [];
    const threads = new Map(
      (
        (threadsRes.data ?? []) as Array<{
          id: string;
          title: string;
          wedge: boolean;
        }>
      ).map((t) => [t.id, t]),
    );

    const board: TodayBoard = {
      ready: [],
      polish: [],
      redraft: [],
      working: [],
      noDraft: [],
      totals: { ready: 0, polish: 0, redraft: 0, working: 0, noDraft: 0 },
    };

    for (const a of articles) {
      const thread = threads.get(a.thread_id);
      const qa = a.qa_result;
      const card: TodayCard = {
        id: a.id,
        title: a.title,
        threadId: a.thread_id,
        threadTitle: thread?.title ?? "—",
        isWedge: thread?.wedge ?? false,
        status: a.status,
        scheduledFor: a.scheduled_for,
        bucket: "no_draft",
        qaScore: qa?.score ?? null,
        qaPassed: qa?.passed ?? null,
        bannedCount: qa?.banned_phrase_hits?.length ?? 0,
        cadenceCount: qa?.cadence_issues?.length ?? 0,
      };

      if (a.status === "drafting" || a.status === "researching") {
        card.bucket = "working";
        board.working.push(card);
        continue;
      }

      if (!qa || qa.score == null) {
        card.bucket = "no_draft";
        board.noDraft.push(card);
        continue;
      }

      if (qa.score >= 8) {
        card.bucket = "ready";
        board.ready.push(card);
      } else if (qa.score >= 6) {
        card.bucket = "polish";
        board.polish.push(card);
      } else {
        card.bucket = "redraft";
        board.redraft.push(card);
      }
    }

    board.totals = {
      ready: board.ready.length,
      polish: board.polish.length,
      redraft: board.redraft.length,
      working: board.working.length,
      noDraft: board.noDraft.length,
    };

    return { data: board, configured: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return {
      data: empty,
      configured: detectConfigured(message),
      error: message,
    };
  }
}

// ---------- Agent runs (observability) ----------

export type AgentRunRow = {
  id: string;
  article_id: string | null;
  thread_id: string | null;
  agent: string;
  status: "success" | "retried_success" | "failed" | "cancelled";
  duration_ms: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_usd: number | null;
  model: string | null;
  error_message: string | null;
  error_kind: string | null;
  retry_count: number | null;
  metadata: Record<string, unknown> | null;
  ran_at: string;
};

export type AgentRunsSummary = {
  totalRuns: number;
  totalCostUsd: number;
  avgDurationMs: number;
  byAgent: Array<{
    agent: string;
    runs: number;
    successes: number;
    failures: number;
    totalCostUsd: number;
    avgDurationMs: number;
  }>;
  byErrorKind: Array<{ errorKind: string; count: number }>;
  recentFailures: AgentRunRow[];
};

export async function fetchAgentRuns(
  limit = 200,
): Promise<DataFetchResult<AgentRunRow[]>> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("agent_runs")
      .select("*")
      .order("ran_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("[fetchAgentRuns]", error);
      return { data: [], configured: true, error: error.message };
    }
    return {
      data: (data as AgentRunRow[]) ?? [],
      configured: true,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return { data: [], configured: detectConfigured(message), error: message };
  }
}

export function summarizeAgentRuns(rows: AgentRunRow[]): AgentRunsSummary {
  const byAgentMap = new Map<
    string,
    {
      runs: number;
      successes: number;
      failures: number;
      totalCostUsd: number;
      totalDurationMs: number;
    }
  >();
  const errorKindMap = new Map<string, number>();
  let totalCost = 0;
  let totalDuration = 0;
  let durationSamples = 0;

  for (const row of rows) {
    if (row.cost_usd) totalCost += row.cost_usd;
    if (row.duration_ms != null) {
      totalDuration += row.duration_ms;
      durationSamples++;
    }

    const ag = byAgentMap.get(row.agent) ?? {
      runs: 0,
      successes: 0,
      failures: 0,
      totalCostUsd: 0,
      totalDurationMs: 0,
    };
    ag.runs++;
    if (row.status === "success" || row.status === "retried_success")
      ag.successes++;
    if (row.status === "failed") ag.failures++;
    if (row.cost_usd) ag.totalCostUsd += row.cost_usd;
    if (row.duration_ms != null) ag.totalDurationMs += row.duration_ms;
    byAgentMap.set(row.agent, ag);

    if (row.status === "failed" && row.error_kind) {
      errorKindMap.set(
        row.error_kind,
        (errorKindMap.get(row.error_kind) ?? 0) + 1,
      );
    }
  }

  return {
    totalRuns: rows.length,
    totalCostUsd: totalCost,
    avgDurationMs: durationSamples > 0 ? totalDuration / durationSamples : 0,
    byAgent: Array.from(byAgentMap.entries())
      .map(([agent, v]) => ({
        agent,
        runs: v.runs,
        successes: v.successes,
        failures: v.failures,
        totalCostUsd: v.totalCostUsd,
        avgDurationMs: v.runs > 0 ? v.totalDurationMs / v.runs : 0,
      }))
      .sort((a, b) => b.runs - a.runs),
    byErrorKind: Array.from(errorKindMap.entries())
      .map(([errorKind, count]) => ({ errorKind, count }))
      .sort((a, b) => b.count - a.count),
    recentFailures: rows.filter((r) => r.status === "failed").slice(0, 5),
  };
}

export async function fetchReferenceExamples(): Promise<
  DataFetchResult<ReferenceExample[]>
> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("reference_examples")
      .select("*")
      .order("voice_type");
    if (error) {
      console.error("[fetchReferenceExamples]", error);
      return { data: [], configured: true, error: error.message };
    }
    return {
      data: (data as ReferenceExample[]) ?? [],
      configured: true,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return { data: [], configured: detectConfigured(message), error: message };
  }
}
