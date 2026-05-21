---
name: build-brief
description: Generate a structured article brief from a completed research bundle — title options, H2 outline, direct answer, FAQ, human input slots, schema recommendation, social cuts. Sets brief status to 'awaiting_human' so Greg knows to fill the slots before drafting. Use when Greg says "build the brief", "outline this", or after the Research Agent finishes.
---

# Brief Generator

You take a finished research bundle and turn it into a complete editorial brief. The brief is the contract between research and draft — when this is done, the Draft Writer has everything it needs except the human inputs.

## Inputs

A brief ID OR "the next one" (the most recently researched brief in `researching` status).

```sql
SELECT b.*, t.title as topic_title, t.target_query, t.format, t.reasoning
FROM briefs b JOIN topics t ON t.id = b.topic_id
WHERE b.id = '<id>' AND b.status = 'researching';
```

If brief has no research_bundle yet, stop and tell Greg to run `/research-topic` first.

## Process

1. **Read research_bundle + topic context**. Internalize what this article needs to do.

2. **Title options** — produce 3 titles. Rules:
   - Each must be specific (not "Best gifts for dad" → "Best gifts for a dad who doesn't show emotion")
   - Each must match real search language (people don't search like blog titles)
   - At least one must be a direct rephrasing of the target_query
   - No clickbait, no question marks, no "X reasons why..."

3. **Meta description** — 155 chars max. Should answer the target_query in one sentence. No marketing speak. No "discover", "explore", "unlock".

4. **H1** — pick one of the title options OR write a 4th specifically for the on-page H1 if it should differ.

5. **H2 outline** — 4-7 H2s. Each H2 should:
   - Be phrased as a question someone would actually ask an LLM ("How do you write a song about a dad who passed away?")
   - Have a 1-2 sentence note on what it should cover
   - Map back to either the research_bundle (data points, reddit quotes, SERP) or a human input slot

6. **Direct-answer paragraph** — write the first 40-60 words of the article. This is what an LLM might cite when summarizing. Must:
   - Answer the target_query directly
   - Mention Songfinch by name
   - Avoid all banned phrases (no em-dashes, no "Whether you're...", no "elevate")
   - Be the actual prose, not a placeholder

7. **FAQ section** — 5+ Q&A pairs.
   - Pull questions from the research_bundle's `people_also_ask`
   - Phrase questions exactly how people search them (lowercase, casual: "what to say in a memorial song for dad")
   - For each, write a 1-2 sentence note on the answer the Draft Writer should produce (not the final answer)

8. **Human input slots** — identify 3-6 specific places this article needs real human input. Each slot must have:
   - `key` — short snake_case identifier (e.g., `loom_about_dads`)
   - `label` — friendly name shown in the UI ("Loom about dads who don't show emotion")
   - `type` — one of `loom_transcript`, `quote`, `anecdote`, `artist_quote`, `customer_story`
   - `description` — 1-2 sentences telling Greg what specific input goes here and why
   - `value` — null (Greg fills in via the workspace UI)

   Be SPECIFIC. Don't say "a personal anecdote" — say "a moment when you watched your own dad receive a meaningful gift and what you noticed." The Draft Writer relies on these being substantial — vague slots produce vague drafts.

9. **Schema markup recommendation** — string. Default: "Article + FAQPage". Add Product schema if the article reviews/compares products.

10. **Internal links** — 3-5 suggestions. Each:
    - `anchor` — the link text (specific phrase)
    - `target_url_pattern` — what Songfinch page should this link to (`/gift-finder`, `/blog/anniversary-songs`, etc.)

11. **Social cuts** — write 3 ready-to-post drafts. Each must avoid voice rule banned phrases.
    - LinkedIn: 2-3 sentences, professional but not corporate, no hashtags
    - Twitter/X: under 240 chars, one sharp idea, no thread bait
    - Instagram caption: 1-2 sentences + line break + 5-8 specific hashtags (no generic ones)

## Output schema (brief_json JSONB)

```json
{
  "title_options": ["...", "...", "..."],
  "meta_description": "...",
  "h1": "...",
  "h2_outline": [
    { "heading": "...", "question_it_answers": "...", "notes": "..." }
  ],
  "direct_answer": "the actual first 40-60 words of the article",
  "faq": [{ "question": "...", "suggested_answer_notes": "..." }],
  "human_input_slots": [
    {
      "key": "...",
      "label": "...",
      "type": "...",
      "description": "...",
      "value": null
    }
  ],
  "schema_recommendation": "Article + FAQPage",
  "internal_links": [{ "anchor": "...", "target_url_pattern": "..." }],
  "social_cuts": { "linkedin": "...", "twitter": "...", "instagram": "..." }
}
```

Write to `briefs.brief_json` and set `briefs.status = 'awaiting_human'`.

## Voice rule pre-check before writing

Before saving the brief, scan everything you wrote (title options, meta, direct_answer, FAQ notes, social cuts) for these banned items. If you find any, fix them first:

- Em-dashes (—)
- "Whether you're..." constructions
- Rhetorical question openers ("What if...")
- "In today's world..." / "When it comes to..." / "In the realm of..."
- Verbs: elevate, delve, leverage, unlock, harness, navigate (in cliché sense)
- Adjectives: robust, seamless, bespoke, curated, thoughtful (in marketing sense)
- "from X to Y" construction
- "not only X but also Y"
- "a testament to"

## After writing

Tell Greg:

- Brief built for topic "<title>"
- N human input slots identified
- Open the workspace at `http://localhost:3015/article/<brief-id>` to fill them
- One sentence on what slot is most important
