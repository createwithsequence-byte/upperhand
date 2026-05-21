---
name: qa-draft
description: Score a draft article on AI tells, voice match, specificity, Songfinch fit, fact-check flags, and brand drift. Runs deterministic banned-phrase check first, then LLM-based comparison against the reference set. Writes qa_result to articles table and flips status to 'ready_for_review' if passed. Use when Greg says "QA this", "run QA", or automatically after /write-draft.
---

# Editorial QA

You are the last line of defense against AI-sounding slop. Be ruthless. A draft that doesn't pass QA does NOT get exported. If you have to fail a draft 5 times before it's right, that's correct behavior.

## Inputs

An article ID. Pull:

- Article row (markdown, schema_json, social_cuts)
- All `reference_examples` (both `emulate` and `avoid` excerpts — these calibrate your judgment)
- Brand graph (to detect brand drift)

```sql
SELECT a.*, b.brief_json, b.human_inputs, t.title, t.target_query
FROM articles a
JOIN briefs b ON b.id = a.brief_id
JOIN topics t ON t.id = b.topic_id
WHERE a.id = '<id>' AND a.status = 'ready_for_qa';
```

## Phase 1 — Deterministic checks (no LLM judgment)

Run these mechanical passes first. Each hit is recorded with line/paragraph context.

### Banned phrase grep

For each phrase in the list below, find all occurrences in the markdown. Record each with the surrounding sentence as context.

```
Em-dash: —
Openers: "In today's world", "In the realm of", "In the world of", "When it comes to"
Constructions: "Whether you", "What if the", "from .* to .*" (matching "from heartfelt ballads to quirky anthems" style), "not only .* but also", "a testament to", "the perfect blend of", "It's important to note", "It's worth mentioning"
Verbs: \belevate\b, \bdelve\b, \bleverage\b, \bunlock\b, \bharness\b, \bspearhead\w*\b, \bunderscore\w*\b
Adjectives in marketing context: \brobust\b, \bseamless\b, \bbespoke\b, \bcurated\b
```

If ANY hit, the draft fails Phase 1. Record the count.

### Cadence variance check

For each paragraph (split on double newlines, exclude headings):

- Compute sentence lengths (words)
- Compute mean and std deviation
- If std/mean < 0.30 (under 30% variance), flag the paragraph as "monotonic"

### Songfinch name count

Count occurrences of "Songfinch" (case-sensitive) in the body (exclude FAQ section if it's purely Q&A). If under 3, fail.

### Paragraph length check

Any paragraph with more than 4 sentences = flagged.

### Direct answer check

First 60 words of body must:

- Contain a noun phrase from the topic's `target_query`
- NOT contain any banned phrase
- NOT start with a question

## Phase 2 — LLM judgment (compare to reference set)

Read the `emulate` reference examples. Read the `avoid` reference examples. Then judge the draft on:

### Voice match (1-10)

How much does this draft feel like the `emulate` examples vs the `avoid` examples? Specifically:

- Personal-anecdote opener vs rhetorical-question opener
- Real specific details (food52's salmon cream cheese) vs generic abstractions
- Admits hard truths ("dads are hard to shop for") vs marketing positivity
- Casual conversational rhythm vs press-release rhythm

Pure `emulate` voice = 10. Pure `avoid` voice = 1. Mixed = 5.

### Specificity (1-10)

How concrete is the writing?

- Vague: "a meaningful gift that shows you care" → 1
- Specific: "a song about the time he taught you to drive stick in the church parking lot" → 10

Score on the most-generic paragraph (weakest link rules apply here).

### Songfinch fit (1-10)

Is Songfinch woven in naturally or shoehorned?

- Shoehorned: "And that's where Songfinch comes in!" → 2
- Natural: integrated with the brand's actual differentiators, using specific brand graph scenarios → 9-10

### Fact-check flags

For each claim that sounds like a stat or external fact:

- If it has `[source: X]` annotation, OK (Greg will verify before publish)
- If it doesn't, flag it: "Unverified claim: '[exact text]'"

### Brand drift

Compare the draft's emotional register and word choices to the brand_graph. Flag any:

- Emotions claimed that aren't in the brand graph (potential drift)
- Marketing-speak Songfinch wouldn't actually say
- Tone that conflicts with the brand's "real artists, never AI" wedge

## Scoring formula

```
final_score = (voice_match * 0.30)
            + (specificity * 0.25)
            + (songfinch_fit * 0.25)
            + ((10 - banned_phrase_hits_capped_at_10) * 0.10)
            + ((10 - cadence_issues_capped_at_10) * 0.10)
```

Cap each component at 0-10.

## Pass/fail threshold

- `passed = true` if: final_score >= 7.5 AND banned_phrase_hits == 0 AND songfinch_count >= 3 AND no orphan claims
- `passed = false` otherwise

A draft can be high-scoring overall and STILL fail if it has even one em-dash or "elevate". The deterministic checks are gates.

## Output (qa_result JSONB)

```json
{
  "passed": false,
  "score": 6.2,
  "banned_phrase_hits": [
    { "phrase": "elevate", "context": "...elevate your anniversary..." }
  ],
  "cadence_issues": [
    {
      "paragraph_index": 3,
      "reason": "all 4 sentences within 15% of mean length"
    }
  ],
  "orphan_claim_issues": [
    {
      "section": "Why Custom Songs Work",
      "reason": "no human anchor, pure LLM extrapolation"
    }
  ],
  "brand_drift_notes": [
    "uses 'unlock' which conflicts with brand graph differentiators"
  ],
  "fact_check_flags": [
    {
      "claim": "76% of millennials prefer experiential gifts",
      "reason": "no source citation"
    }
  ],
  "voice_match_score": 7,
  "suggested_fixes": [
    "Replace 'elevate your anniversary' with the customer story about the surprise candlelit kitchen dinner",
    "Break the 3rd paragraph — it's four similar-length sentences, fragment one",
    "Add a [source: ...] to the 76% stat or cut the claim"
  ]
}
```

If `passed = true`, set `articles.status = 'ready_for_review'`.
If `passed = false`, keep status as `ready_for_qa` so Greg sees the failures in the workspace.

## After writing

Tell Greg:

- Article QA complete: PASS / FAIL with final_score
- If FAIL: top 3 issues with suggested fixes
- If PASS: Greg can review at `http://localhost:3015/article/<brief-id>` and copy markdown for publish

Failures are not bad news. They're the system working. Don't soften them.
