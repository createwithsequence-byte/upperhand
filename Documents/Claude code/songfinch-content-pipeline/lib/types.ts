// v2 types — waterfall: Brand → Threads → Articles

export type Persona = {
  name: string;
  description: string;
};

export type CustomerImpact = {
  situation: string;
  how_brand_helps: string;
};

export type Brand = {
  id: string;
  name: string;
  about: string;
  personas: Persona[];
  customer_impact: CustomerImpact[];
  updated_at: string;
};

export type ThreadStatus = "pending" | "approved" | "rejected";

export type KeywordRow = {
  keyword: string;
  intent:
    | "informational"
    | "commercial"
    | "transactional"
    | "navigational"
    | "mixed";
  volume_tier: VolumeTier;
  search_volume_estimate: number;
  difficulty: number;
  competitor_type:
    | "brand_owned"
    | "competitor"
    | "publisher"
    | "forum"
    | "marketplace"
    | "blog"
    | "mixed";
  top_competitor: string;
  note: string;
};

export type KeywordResearch = {
  keywords: KeywordRow[];
  cluster_summary: string;
};

export type Thread = {
  id: string;
  brand_id: string;
  title: string;
  angle: string;
  description: string;
  reasoning: string;
  search_intent: string | null;
  seo_potential: number;
  brand_relevance: number;
  wedge: boolean;
  score: number | null;
  rank: number | null;
  status: ThreadStatus;
  generation_batch: string | null;
  keyword_research: KeywordResearch | null;
  created_at: string;
  approved_at: string | null;
};

export type ArticleFormat =
  | "listicle"
  | "explainer"
  | "comparison"
  | "occasion-guide"
  | "behind-the-song"
  | "wedge";

export type ArticleStatus =
  | "idea"
  | "approved"
  | "researching"
  | "awaiting_human"
  | "ready_to_draft"
  | "drafting"
  | "ready_for_qa"
  | "ready_for_review"
  | "exported";

export type HumanInputSlot = {
  key: string;
  label: string;
  type:
    | "loom_transcript"
    | "quote"
    | "anecdote"
    | "artist_quote"
    | "customer_story";
  description: string;
};

export type ResearchBundle = {
  serp_snapshot: Array<{
    rank: number;
    url: string;
    title: string;
    excerpt: string;
  }>;
  existing_brand_coverage: Array<{
    url: string;
    title: string;
    overlap_notes: string;
  }>;
  data_points: Array<{
    claim: string;
    source: string;
    source_url?: string;
  }>;
  people_also_ask: string[];
  reddit_threads: Array<{
    url: string;
    title: string;
    key_quote?: string;
  }>;
  notes: string;
};

export type BriefJson = {
  title_options: string[];
  meta_description: string;
  h1: string;
  h2_outline: Array<{
    heading: string;
    question_it_answers: string;
    notes?: string;
  }>;
  direct_answer: string;
  faq: Array<{ question: string; suggested_answer_notes: string }>;
  human_input_slots: HumanInputSlot[];
  schema_recommendation: string;
  internal_links: Array<{ anchor: string; target_url_pattern: string }>;
  social_cuts: { linkedin: string; twitter: string; instagram: string };
};

export type VolumeTier = "high" | "medium" | "low";

export type SerpAnalysis = {
  top_results: Array<{
    rank: number;
    url: string;
    title: string;
    snippet: string;
    domain_type:
      | "brand_owned"
      | "competitor"
      | "publisher"
      | "forum"
      | "marketplace"
      | "blog"
      | "other";
  }>;
  serp_features: Array<
    | "featured_snippet"
    | "people_also_ask"
    | "knowledge_panel"
    | "video"
    | "images"
    | "shopping"
    | "local_pack"
    | "ai_overview"
    | "none"
  >;
  intent_classification:
    | "informational"
    | "commercial"
    | "transactional"
    | "navigational"
    | "mixed";
};

export type QaResult = {
  passed: boolean;
  score: number;
  banned_phrase_hits: Array<{ phrase: string; context: string }>;
  cadence_issues: Array<{ paragraph_index: number; reason: string }>;
  orphan_claim_issues: Array<{ section: string; reason: string }>;
  brand_drift_notes: string[];
  fact_check_flags: Array<{ claim: string; reason: string }>;
  voice_match_score: number;
  suggested_fixes: string[];
};

export type Article = {
  id: string;
  thread_id: string;
  title: string;
  target_query: string;
  format: ArticleFormat;
  reasoning: string;
  geo_potential: number | null;
  score: number | null;
  rank: number | null;
  status: ArticleStatus;
  research_bundle: ResearchBundle | null;
  brief_json: BriefJson | null;
  human_inputs: Record<string, string>;
  markdown: string | null;
  schema_json: Record<string, unknown> | null;
  social_cuts: BriefJson["social_cuts"] | null;
  qa_result: QaResult | null;
  generation_batch: string | null;
  // Scheduling columns (canonical, on articles table)
  scheduled_for: string | null;
  committed_angle: string | null;
  // Legacy SEO columns dropped in migration 0005 — canonical source is now
  // the seo_research table. See lib/data.ts SeoResearchRow.
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  exported_at: string | null;
};

export type ReferenceExample = {
  id: string;
  url: string | null;
  title: string;
  voice_type: "emulate" | "avoid";
  excerpt: string;
  notes: string | null;
  created_at: string;
};

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };
