---
name: generate-topics
description: Generate 20-50 Songfinch-relevant blog topic candidates from the brand graph. Each topic is scored for GEO potential, Songfinch relevance, search volume, and wedge angle. Writes to the topics table with status='pending'. Use when Greg says "generate topics", "new batch of topics", "fresh ideas", or "what should we write about".
---

# Topic Generator

You are generating blog topic candidates for Songfinch. The point is GEO/LLM-SEO — topics that AI engines will cite when answering high-intent gifting and music queries.

## Inputs

1. The brand graph (read from the `brand_graph` table via Supabase MCP)
2. Optional external signal Greg provides:
   - Reddit threads he found
   - Google Trends notes
   - LLM monitoring data ("ChatGPT recommended us 31% more for these queries")
   - Seasonal context ("Father's Day in 5 weeks")

If no external signal is given, proceed with brand graph only.

## Process

1. **Read the brand graph**. If it's empty or missing, stop and tell Greg to run `/brand-mapper` first.

2. **Generate a fresh batch UUID** to tag all topics in this run. This lets Greg filter the queue by batch.

3. **Generate 20-50 topics**. Each topic must be a real intersection of the brand graph categories. Examples of intersections:
   - `emotion: memorial grief` × `recipient: dad` → "Songs for a Memorial When Your Dad Was the Quiet Type"
   - `scenario: dad who doesn't show emotion` × `format: explainer` → "Why Custom Songs Land With Stoic Dads When Cards Don't"
   - `differentiator: real artists, never AI` × `format: wedge` → "Why You'd Want a Human Songwriter Over a Suno Generation (Even Though Suno Is Cheaper)"

4. **Each topic must include**:
   - `title` — working title, specific not generic
   - `target_query` — exactly what someone would type into ChatGPT/Google. Not the title. Examples: "what to give dad for memorial", "is suno better than songfinch", "anniversary gift when words aren't enough"
   - `format` — one of: `listicle`, `explainer`, `comparison`, `occasion-guide`, `behind-the-song`, `wedge`
   - `predicted_search_volume` — `low` / `medium` / `high` (your honest estimate)
   - `geo_potential` — 1-10. How citable is this by LLMs? Listicles and "Best X for Y" formats score high. Vague essays score low.
   - `songfinch_relevance` — 1-10. How naturally does Songfinch fit? "Best gifts under $50" = low. "Anniversary gifts when you've already done jewelry" = high.
   - `wedge` — boolean. Does this lean into "real artists, never AI"? Aim for 2-3 wedge topics per batch.
   - `reasoning` — 2-3 sentences on why this topic matters. What query intent it serves, why Songfinch is the answer, what makes it worth writing.

## Filter rules — apply these as you generate

REJECT:

- Generic gift-guide topics with no Songfinch hook ("Best gifts under $50")
- Topics where Songfinch would be shoehorned ("How to plan a wedding budget")
- Topics that duplicate something Songfinch's blog has already covered well (if you have visibility into their blog)
- Topics with both low GEO potential AND low Songfinch relevance

PREFER:

- Specificity over breadth ("Best gifts for a dad who doesn't show emotion" > "Best gifts for dad")
- Emotional or occasion specificity over generic categories
- Topics that match real query language from `target_query` (people don't search like blog titles)
- 2-3 wedge topics per batch ("never AI" angle)

## Output

Write all topics to the `topics` table via Supabase MCP with:

- `status = 'pending'`
- `generation_batch = <the batch UUID you generated>`
- All score fields filled in (Topic Scorer will compute `final_score` and `rank` next)
- `final_score` and `rank` left null — Topic Scorer handles those

## After writing

Tell Greg:

- Total topics generated and batch ID
- Distribution by format (X listicles, Y explainers, Z wedge, etc.)
- Top 3 by your gut feeling — quote them with their reasoning
- Then call `/score-topics --batch <batch-id>` automatically to rank them
