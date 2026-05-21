# Songfinch Content Pipeline

Single-user GEO/LLM-SEO content tool for Songfinch. Greg is the only user. Drafts articles that read like real humans wrote them — never publishes automatically.

## Architecture A — Claude Code as runtime

The "agents" in the spec are NOT background services. They are skills you invoke from a Claude Code session. The Next.js app is a thin Supabase-backed dashboard for queue state, topic approval, Human Layer slot input, and draft review.

**Marginal LLM cost: $0** (routed through Max subscription via CC, not the Anthropic API).

### How work flows

1. **CC session** triggers a skill (`/brand-mapper`, `/generate-topics`, `/build-brief`, `/write-draft`, `/qa-draft`, etc.)
2. Skill reads/writes Supabase via the service role key
3. **Dashboard** at `localhost:3000` shows the resulting state and provides UI for the human-in-the-loop steps (approve topic, fill Human Layer slots, mark exported)

All Supabase access is server-side. The anon key is never shipped to the browser. RLS is enabled with no policies — service role bypasses, everything else is denied.

## Stack

- **Next.js 14** App Router, TypeScript, Tailwind, shadcn/ui (slate)
- **Supabase** Postgres + auth (auth only as a "not public" gate; no per-user logic)
- **Local-only** — no Vercel deployment. `npm run dev`.
- **Server Actions** for all mutations (no client-side Supabase)
- **No LangChain. No LlamaIndex. No agent framework.** Agents are Markdown skill files. The orchestration is you, in a CC session.

## Voice rules — non-negotiable

The whole point of this tool is to produce un-AI writing. Voice rules live in `reference/voice-rules.md` and are enforced by:

1. **Banned phrase pre-check** (deterministic regex pass before LLM eval)
2. **Reference Set few-shot** (real paragraphs pasted into Draft Writer prompt)
3. **QA agent** (cadence variance, no-orphan-claim rule, brand drift)
4. **Greg-in-the-loop** (Human Layer slots, final review)

If the QA agent fails a draft 5 times, that is correct behavior. Do not relax the rules.

## File layout

```
.claude/skills/        Agent skills — Brand Mapper, Topic Gen, etc.
app/                   Next.js App Router pages + Server Actions
  /                    Topic Queue (homepage)
  /brand               Brand Graph editor
  /article/[id]        Article Workspace (split-screen)
components/ui/         shadcn primitives
lib/
  supabase.ts          Server-only Supabase client (service role)
  types.ts             Generated DB types
reference/
  emulate/             Voice-emulate examples (food52, etc.)
  avoid/               Voice-avoid examples (yourmelody, custompersonalizedsongs, etc.)
  voice-rules.md       Banned phrases, cadence rules, "no orphan claim" rule
supabase/migrations/   SQL migrations
```

## Conventions

- Server Actions return `{ ok: true, data }` or `{ ok: false, error: string }`
- Server logs prefixed with module: `console.error('[topic-queue] ...')`
- Skills write to Supabase using service role. Never call Supabase from a client component.
- Never auto-publish. The export action is always "copy to clipboard" or "download as markdown."
- Articles in the `exported` state are read-only.

## Build order (per the spec)

1. Foundation (this) — Next.js + Supabase + shadcn + schema
2. Brand Mapper skill + `/brand` view
3. Topic Generator + Scorer skills + Topic Queue view
4. Topic Queue UI polish (sort, filter, expand)
5. Research Agent skill
6. Brief Generator skill
7. Article Workspace UI (Human Layer slots)
8. Draft Writer skill
9. Editorial QA skill
10. Export flow (copy to clipboard, mark exported)

After step 4, the tool is usable for topic discovery alone — ship at every step.
