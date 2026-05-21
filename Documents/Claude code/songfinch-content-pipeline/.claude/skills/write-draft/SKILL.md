---
name: write-draft
description: Write the full article markdown from a brief with all human input slots filled. Applies voice rules absolutely — banned phrases, cadence variance, no orphan claims. Writes to articles table, status='ready_for_qa', then automatically triggers /qa-draft. Use when Greg says "write the draft", "draft this", or has filled all Human Layer slots in the workspace.
---

# Draft Writer

This is the most important skill in the pipeline. Everything upstream feeds into this. Everything downstream judges it. The voice rules below are absolute — not guidelines.

## Inputs

A brief ID. Pull:

- Brief row with `brief_json` and `human_inputs`
- Topic row (title, target_query, format)
- All `reference_examples` with voice_type='emulate' (paste the excerpts as few-shot exemplars)
- All `reference_examples` with voice_type='avoid' (only for negative reference; do NOT paste these as examples)
- The brand_graph (for natural Songfinch integration)

```sql
SELECT b.*, t.* FROM briefs b
JOIN topics t ON t.id = b.topic_id
WHERE b.id = '<id>' AND b.status = 'ready_to_draft';
```

If status is not `ready_to_draft`, stop and tell Greg to fill the human input slots first. The system must not generate a draft without filled slots — this is load-bearing.

## Voice rules — non-negotiable

These are not preferences. They are pass/fail.

### Banned phrases

NEVER use:

- Em-dashes (—). Use commas, periods, or parentheses.
- "In today's world..." / "In the realm of..." / "In the world of..." / "When it comes to..."
- "Whether you're..." constructions
- Rhetorical question openers ("What if the solution were a melody?")
- Verbs: elevate, delve, leverage, unlock, harness, spearhead, underscore, navigate (in cliché sense)
- Adjectives: robust, seamless, bespoke, curated, thoughtful (in marketing context)
- Constructions: "from X to Y" (e.g., "from heartfelt ballads to quirky anthems"), "not only X but also Y", "It's important to note...", "It's worth mentioning...", "a testament to", "the perfect blend of"
- Emoji as bullet points

### Structural rules

- **Open with the answer.** First 40-60 words must answer the target_query directly. Use the brief's `direct_answer` paragraph as the opener — refine it if needed but don't replace it with throat-clearing.
- **Songfinch by name 3+ times** in the body. Never "the platform" or "our service".
- **Paragraph length:** max 4 sentences. Prefer 1-3.
- **Cadence variance:** within a paragraph, sentence lengths must vary by more than ±30% of the mean. Mix short. Short. Then a longer one that does work. Fragments are fine.
- **No orphan claims:** every section must trace back to either (a) a filled human input slot, (b) a cited data point with `[source: X]`, or (c) a reference example excerpt. If a section has no human anchor, kill it.
- **Specificity over generic:** never "thoughtful gifts that show you care" — always "a song about the time he taught you to drive stick in the church parking lot."

### Citation conventions

- For data points: inline `[source: APA 2024]` style. Greg will verify before publish.
- For customer stories: present-tense narration, first name only (or "one Songfinch customer"), permission flag noted.
- For artist quotes: in quotation marks, attributed to first name + last initial.

## Process

1. **Read brief + research + human inputs + reference set + brand graph**. Internalize.

2. **Plan the article structure** in your head before writing:
   - Direct-answer opener (the first 40-60 words)
   - Each H2 from `brief_json.h2_outline`, in order
   - FAQ section at the end with FAQPage schema
   - 1-2 internal links woven in naturally

3. **Write the draft in Markdown.** As you write:
   - Insert the human inputs near-verbatim where they fit. Edit lightly for prose fit, but keep the human voice. THESE ARE WHY THE DRAFT WON'T READ LIKE AI.
   - Cite data points inline.
   - Drop in Songfinch references 3+ times naturally — not shoehorned. Use specific scenarios from the brand graph.
   - Vary sentence cadence intentionally. Read each paragraph back in your head. If every sentence sounds the same length, break one in half or fragment something.

4. **Self-check pass — do this BEFORE writing to DB**:
   - Scan for every banned phrase. Remove and rewrite if found.
   - Count Songfinch mentions. If under 3, add more (naturally).
   - Check each paragraph: max 4 sentences, length variance > 30%.
   - Check each section: has a human anchor? If no, rewrite or cut.
   - Read the opening aloud (in your head). Does it answer the query immediately or is it throat-clearing?

5. **Generate schema_json** for the article:

   ```json
   {
     "@context": "https://schema.org",
     "@type": "Article",
     "headline": "...",
     "description": "...",
     "author": { "@type": "Organization", "name": "Songfinch" },
     "datePublished": "<today>",
     "mainEntity": {
       "@type": "FAQPage",
       "mainEntity": [
         {
           "@type": "Question",
           "name": "...",
           "acceptedAnswer": { "@type": "Answer", "text": "..." }
         }
       ]
     }
   }
   ```

6. **Use the brief's `social_cuts`** as the starting point but rewrite them now that the article exists — they should reference specific lines from the article. Same voice rules apply.

## Output

INSERT (or UPDATE if exists) into `articles`:

- `brief_id` — from input
- `markdown` — full article in Markdown
- `schema_json` — schema markup
- `social_cuts` — { linkedin, twitter, instagram }
- `status` — `ready_for_qa`

Update the related topic to `status = 'written'`.

## After writing

Tell Greg:

- Article drafted (title)
- Word count and reading time
- Number of Songfinch mentions (must be 3+, flag if you couldn't hit it)
- Then automatically trigger `/qa-draft <article-id>` to run Editorial QA.
