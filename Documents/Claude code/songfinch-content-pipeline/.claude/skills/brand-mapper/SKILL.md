---
name: brand-mapper
description: Read a set of Songfinch URLs (homepage, about, sample artists, sample blog posts, reviews) and produce a structured brand graph as JSON, then upsert it into the brand_graph table. Use when Greg says "refresh the brand graph", "map the brand", or "rerun the brand mapper". Also use the first time setting up the pipeline.
---

# Brand Mapper

You are producing a brand graph for Songfinch. The brand graph is the foundation every other agent in this pipeline reads from. Get it right.

## Inputs

Either:

- A list of URLs provided by Greg as arguments, OR
- If no URLs given, ask Greg which URLs to use. Sensible default set:
  - `https://songfinch.com`
  - `https://songfinch.com/about`
  - `https://blog.songfinch.com` (or whatever sample blog posts he provides)
  - Sample artist profile pages
  - Customer review pages or screenshots he provides

## Process

1. **Read the existing brand graph** from Supabase if it exists (use the Supabase MCP). Show Greg what's currently there so he can decide whether to merge or replace.

2. **Fetch each URL** using the WebFetch tool. Extract the visible text content. Skip nav and footer boilerplate.

3. **Synthesize the brand graph** into the categories below. Be specific. Vague categories produce vague topics downstream.
   - `emotions` — feelings Songfinch is tied to. Examples: anniversary nostalgia, memorial grief, anniversary gratitude, parent pride, sobriety relief, divorce closure, retirement bittersweetness. Not "love" or "happiness" — those are useless.
   - `occasions` — events Songfinch songs are made for. Examples: weddings, memorials, retirements, sobriety milestones, divorce parties, baby announcements, fiftieth anniversaries, custody-resolution celebrations.
   - `audiences` — who buys. Examples: adult children buying for parents, spouses buying for spouses, brides/grooms, gift-givers stuck on what to buy, music lovers.
   - `recipients` — who receives. Examples: mom, dad, husband, wife, best friend, grandparent, sibling.
   - `scenarios` — specific situations. THIS IS WHERE THE GOLD IS. Examples: "dad who doesn't show emotion", "grandparent with dementia", "anniversary when words feel inadequate", "memorial for someone who didn't get a real funeral", "sobriety milestone the family is afraid to celebrate publicly".
   - `differentiators` — what makes Songfinch different. Examples: real artists, never AI; 7-day delivery; story-based songwriting; over 1000 artist roster; custom from your story not a template.

4. **Validate**: each category should have 8-20 items. If you have fewer than 8, you missed something — re-read the source material. If you have more than 20, you're being too granular.

5. **Show Greg the proposed graph** before writing. He may want to add, remove, or rephrase.

6. **Write to Supabase**. Replace the existing brand_graph row (single-row table) using the Supabase MCP. Set `updated_at = now()`.

## Output format

The brand_graph row is a single row with JSONB array columns. Each column is an array of strings.

```json
{
  "emotions": ["anniversary nostalgia", "memorial grief", ...],
  "occasions": ["wedding ceremony entrance", "first dance", ...],
  "audiences": ["adult children buying for parents", ...],
  "recipients": ["mom", "dad", ...],
  "scenarios": ["dad who doesn't show emotion", ...],
  "differentiators": ["real artists, never AI", "7-day delivery", ...]
}
```

## Voice and specificity rules

These rules also apply to the brand graph itself — vague brand graph = vague topics downstream.

- Use lowercase, no end punctuation
- Specific over generic: "dad who doesn't show emotion" beats "emotional dads"
- No marketing speak: never use "elevate", "curated", "thoughtful", "bespoke"
- Use real customer language where possible (from reviews)

## After writing

Tell Greg:

- How many items were added in each category
- What the biggest gaps were vs. what was already there (if updating)
- 2-3 example topic ideas this graph would unlock (preview of what Topic Generator might produce)
