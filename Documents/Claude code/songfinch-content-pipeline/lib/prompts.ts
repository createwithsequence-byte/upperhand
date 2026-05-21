import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

/**
 * Prompt loader. Reads templates from `prompts/<name>.md` and interpolates
 * Mustache-style `{{var}}` placeholders.
 *
 * Why move prompts out of TypeScript:
 * - Iterate without recompiling (just refresh the page)
 * - Version-controlled diffs that read like prose (no JSX escaping)
 * - Easy A/B: copy `auto-draft.md` to `auto-draft.v2.md`, swap which one
 *   the route loads, compare scores
 * - Prompt hash for observability — every agent_run can record which
 *   prompt version produced its output
 *
 * The loader is intentionally simple:
 * - No conditional logic (no `{{#if}}` etc.) — keeps prompts readable
 * - No nested objects (use flat keys like `brand_name`)
 * - Missing variables become empty strings (lenient)
 * - File reads aren't cached — Next.js dev mode reloads them per request
 *   so prompt edits are instant
 */

// Project root prompts directory. Sibling of /app and /lib.
const PROMPTS_DIR = join(process.cwd(), "prompts");

/** Mustache-style variable substitution. Missing keys → empty string. */
function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

/**
 * Load a prompt by name (without the .md extension) and interpolate vars.
 *
 *   loadPrompt("draft/auto-draft", { brand_name: "Songfinch", ... })
 *
 * Returns the rendered string + a sha256 hash of the RAW template (pre-
 * interpolation) for prompt versioning. The hash lets you tell "did the
 * prompt change between draft v1 and v3" without storing the full text
 * in every agent_run.
 */
export function loadPrompt(
  name: string,
  vars: Record<string, string | number | null | undefined> = {},
): { text: string; hash: string } {
  const path = join(PROMPTS_DIR, `${name}.md`);
  const raw = readFileSync(path, "utf-8");

  // Normalize vars to strings for interpolation.
  const stringVars: Record<string, string> = {};
  for (const [k, v] of Object.entries(vars)) {
    stringVars[k] = v == null ? "" : String(v);
  }

  const text = interpolate(raw, stringVars);

  // Hash the RAW template, not the interpolated text — what we care about
  // is "did the prompt template version change", not "did the inputs change."
  const hash = createHash("sha256").update(raw).digest("hex").slice(0, 12);

  return { text, hash };
}
