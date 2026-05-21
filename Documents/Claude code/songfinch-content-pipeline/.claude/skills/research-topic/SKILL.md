---
name: research-topic
description: Build a research bundle for an approved topic — SERP snapshot, Songfinch blog coverage gaps, data points with sources, People-Also-Ask questions, Reddit threads. Creates a brief row with research_bundle filled in and status='researching'. Use when Greg says "research topic X", "build research for the next approved topic", or after approving a topic.
---

# Research Agent

You are gathering everything needed to write a great article. The goal is not a polished outline yet (that's the Brief Generator's job). The goal is a research bundle the Brief Generator and Draft Writer can rely on.

## Inputs

A topic ID OR the title of an approved topic. If Greg says "the next one" or doesn't specify, query Supabase for the highest-ranked approved topic that has no brief yet.

```sql
SELECT t.* FROM topics t
LEFT JOIN briefs b ON b.topic_id = t.id
WHERE t.status = 'approved' AND b.id IS NULL
ORDER BY t.rank DESC NULLS LAST
LIMIT 1;
```

## Process

1. **Confirm the topic** with Greg before doing work — read the title, target_query, format, reasoning back to him. Let him bail if it's the wrong one.

2. **Mark the topic in_progress**:

   ```sql
   UPDATE topics SET status = 'in_progress' WHERE id = '<id>';
   ```

3. **Create the brief row** with status `researching`:

   ```sql
   INSERT INTO briefs (topic_id, status) VALUES ('<id>', 'researching') RETURNING id;
   ```

4. **SERP snapshot** — use WebSearch (or WebFetch with a Google-style query URL) to pull the top 10 results for `target_query`. For each:
   - rank, url, title, 1-2 sentence excerpt from the page (use WebFetch to get the page content if needed)
   - Skip ads and shopping results

5. **Songfinch blog coverage check** — fetch `https://www.songfinch.com/blogs/news` or `blog.songfinch.com` if it exists. List any existing posts that overlap with this topic. Note specifically: what gaps does our planned post fill that existing posts don't? Be honest — if Songfinch already has a great post on this exact thing, flag it. Better to write something complementary than redundant.

6. **Data points** — find 3-5 specific stats, statistics, or industry data points relevant to the topic. Each must have a source URL. Examples:
   - "76% of Americans say music helps them process grief — APA, 2024"
   - "Custom gift market grew 12% YoY in 2025 — IBISWorld report"
     Cite the source URL. Greg will verify before publish.

7. **Customer stories** — query the database for any customer_stories table. (If table doesn't exist yet, note `customer_stories_needed: true` in the bundle so Greg knows to source one. Do not block.)

8. **People Also Ask** — list the 5-10 most common questions people ask about this topic. Get them from:
   - Google's "People also ask" box for the target_query
   - Quora top questions
   - Reddit thread titles in relevant subs

9. **Reddit threads** — find 2-3 Reddit threads where real people discuss this exact situation. Pull the URL, thread title, and one representative quote (in the user's own voice — these are GOLD for the Draft Writer).

10. **Notes** — write 2-4 sentences capturing anything else that struck you. Tensions in the SERP, surprising angles, emotional hooks, gaps where Songfinch's wedge applies.

## Output schema (research_bundle JSONB)

```json
{
  "serp_snapshot": [
    { "rank": 1, "url": "...", "title": "...", "excerpt": "..." }
  ],
  "existing_songfinch_coverage": [
    { "url": "...", "title": "...", "overlap_notes": "..." }
  ],
  "data_points": [{ "claim": "...", "source": "...", "source_url": "..." }],
  "people_also_ask": ["question 1", "question 2"],
  "reddit_threads": [{ "url": "...", "title": "...", "key_quote": "..." }],
  "customer_stories_needed": true,
  "notes": "..."
}
```

Write this to `briefs.research_bundle` for the brief row you created in step 3. Keep status as `researching` — the Brief Generator will flip it.

## After writing

Tell Greg:

- Topic researched (title)
- N SERP results, M Reddit quotes, K data points, L Songfinch overlap notes
- Biggest tension or insight from the research (one sentence)
- Then suggest: "Run `/build-brief <brief-id>` to generate the outline."
