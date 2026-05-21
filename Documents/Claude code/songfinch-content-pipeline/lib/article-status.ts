/**
 * Single source of truth for article lifecycle state.
 *
 * Before this file existed, status transitions were duplicated across:
 * - app/actions.ts (setArticleStatus + saveArticleHumanInputs)
 * - app/api/agents/draft/build-brief/route.ts
 * - app/api/agents/draft/auto-draft/route.ts
 * - app/api/agents/draft/run-qa/route.ts
 * - app/api/agents/draft/run-qa-stream/route.ts
 * - app/api/agents/draft/write-stream/route.ts
 * - app/article/[id]/workspace.tsx (primaryAction switch)
 *
 * Now: every status mutation goes through `transitionArticle()` and every
 * UI decision (which button to show, which agents are allowed) reads from
 * `STATUS_CONFIG`. Adding a new status or transition is one edit, not seven.
 */

import type { ArticleStatus } from "./types";

// ---- Agent identifiers -------------------------------------------------------
//
// Every interactive agent the UI can fire. The label is what we show in toast
// notifications and run indicators. Keep names stable — they get logged into
// agent_runs for observability.

export type AgentKey =
  | "build-brief"
  | "write-draft"
  | "auto-draft"
  | "run-qa"
  | "research-seo"
  | "research-geo"
  | "score-checklist";

// ---- Status config -----------------------------------------------------------

export type StatusConfig = {
  /** Short human-readable label for badges. */
  label: string;
  /** Which statuses you can move to FROM this one. Used to validate transitions. */
  canTransitionTo: ArticleStatus[];
  /**
   * The "next step" button shown in the workspace header. Null means no
   * primary action — usually because the article is in a passive state
   * (exported = done) or waiting on the user (awaiting_human = fill slots).
   */
  primary:
    | {
        kind: "transition"; // server action, no LLM
        toStatus: ArticleStatus;
        label: string;
      }
    | {
        kind: "agent"; // fires an agent route
        agent: AgentKey;
        label: string;
        /** When true the call streams; the UI renders a streaming spinner. */
        streaming?: boolean;
      }
    | {
        kind: "export"; // client action — copy to clipboard, mark exported
        label: string;
      }
    | null;
  /**
   * Which agents the secondary action area can invoke. SEO and GEO research
   * are allowed at almost every status (you can refresh research any time),
   * but auto-draft is only allowed before a draft exists.
   */
  allowedAgents: AgentKey[];
  /** Article body is read-only at this status. */
  readonly?: boolean;
};

const COMMON_RESEARCH_AGENTS: AgentKey[] = [
  "research-seo",
  "research-geo",
  "score-checklist",
];

export const STATUS_CONFIG: Record<ArticleStatus, StatusConfig> = {
  idea: {
    label: "Idea",
    canTransitionTo: ["approved"],
    primary: {
      kind: "transition",
      toStatus: "approved",
      label: "Approve article",
    },
    // Research is allowed even before approval — you can scope out the SERP
    // before committing to write.
    allowedAgents: ["research-seo", "research-geo"],
  },

  approved: {
    label: "Approved",
    canTransitionTo: ["idea", "researching", "ready_to_draft", "drafting"],
    // From approved, you can either go the formal "build a brief, fill slots,
    // write a draft" route OR jump straight to auto-draft. The UI shows
    // "Build brief" by default but auto-draft is in allowedAgents.
    primary: {
      kind: "agent",
      agent: "build-brief",
      label: "Build brief",
    },
    allowedAgents: ["build-brief", "auto-draft", ...COMMON_RESEARCH_AGENTS],
  },

  researching: {
    label: "Researching",
    canTransitionTo: ["approved", "awaiting_human", "ready_to_draft"],
    // No primary action — the research agent is the one mutating status.
    // UI shows a "researching" indicator until it finishes.
    primary: null,
    allowedAgents: COMMON_RESEARCH_AGENTS,
  },

  awaiting_human: {
    label: "Awaiting human",
    canTransitionTo: ["approved", "ready_to_draft"],
    // Primary action is "fill the slots" which is a UI activity (Human Layer
    // panel), not an agent call. Status auto-flips to ready_to_draft when
    // saveArticleHumanInputs detects all slots are filled.
    primary: null,
    allowedAgents: COMMON_RESEARCH_AGENTS,
  },

  ready_to_draft: {
    label: "Ready to draft",
    canTransitionTo: ["approved", "drafting"],
    primary: {
      kind: "agent",
      agent: "write-draft",
      label: "Write draft",
      streaming: true,
    },
    allowedAgents: ["write-draft", "auto-draft", ...COMMON_RESEARCH_AGENTS],
  },

  drafting: {
    label: "Drafting",
    canTransitionTo: ["ready_to_draft", "ready_for_qa"],
    // The draft is mid-stream. If the user reloads while streaming they see
    // "Resume draft" — same agent, the UI just labels it differently.
    primary: {
      kind: "agent",
      agent: "write-draft",
      label: "Resume draft",
      streaming: true,
    },
    allowedAgents: ["write-draft", ...COMMON_RESEARCH_AGENTS],
  },

  ready_for_qa: {
    label: "Ready for QA",
    canTransitionTo: ["ready_to_draft", "ready_for_review"],
    primary: {
      kind: "agent",
      agent: "run-qa",
      label: "Run QA",
      streaming: true,
    },
    allowedAgents: ["run-qa", "write-draft", ...COMMON_RESEARCH_AGENTS],
  },

  ready_for_review: {
    label: "Ready for review",
    canTransitionTo: ["ready_for_qa", "exported"],
    primary: {
      kind: "export",
      label: "Mark exported",
    },
    allowedAgents: ["run-qa", ...COMMON_RESEARCH_AGENTS],
  },

  exported: {
    label: "Exported",
    canTransitionTo: [], // terminal — no further transitions allowed
    primary: null,
    allowedAgents: [], // nothing can re-run on an exported article
    readonly: true,
  },
};

// ---- Helper functions --------------------------------------------------------

/**
 * Validates a proposed status transition. Returns null if allowed, or an
 * error string explaining why not.
 *
 * Use this in actions.ts and route handlers BEFORE writing to the DB:
 *
 *   const err = validateTransition(article.status, "exported");
 *   if (err) return { ok: false, error: err };
 *
 * Prevents bugs like "approving an already-exported article" or "running
 * auto-draft on an article that's mid-draft."
 */
export function validateTransition(
  from: ArticleStatus,
  to: ArticleStatus,
): string | null {
  if (from === to) return null; // idempotent no-op, allowed
  const config = STATUS_CONFIG[from];
  if (!config) return `Unknown source status: ${from}`;
  if (!config.canTransitionTo.includes(to)) {
    return `Cannot transition ${from} → ${to}. Allowed: ${config.canTransitionTo.join(", ") || "none (terminal state)"}`;
  }
  return null;
}

/**
 * Returns true if the given agent is allowed for an article in this status.
 * The workspace uses this to disable secondary action buttons; route handlers
 * use it to reject premature calls.
 */
export function isAgentAllowed(
  status: ArticleStatus,
  agent: AgentKey,
): boolean {
  return STATUS_CONFIG[status].allowedAgents.includes(agent);
}

/**
 * Returns the primary action configuration for the current status. The
 * workspace header renders this directly — null means no primary button is
 * shown.
 */
export function primaryActionFor(
  status: ArticleStatus,
): StatusConfig["primary"] {
  return STATUS_CONFIG[status].primary;
}

/** Returns true if the article is in a terminal/read-only state. */
export function isReadonly(status: ArticleStatus): boolean {
  return STATUS_CONFIG[status].readonly === true;
}

/**
 * Convenience map of all status labels for badge rendering. Keeps the workspace
 * from importing STATUS_CONFIG just to label one badge.
 */
export const STATUS_LABEL: Record<ArticleStatus, string> = Object.fromEntries(
  Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.label]),
) as Record<ArticleStatus, string>;
