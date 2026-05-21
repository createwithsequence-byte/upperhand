---
name: score-topics
description: Re-rank pending topics using weighted scoring (GEO 40%, Songfinch relevance 35%, search volume 15%, wedge bonus 10%). Updates final_score and rank on each topic. Runs automatically after /generate-topics; can also run manually if Greg adjusts weights.
---

# Topic Scorer

You compute the final ranked score for each pending topic. This is deterministic math — do not LLM-judge the topics. Just apply the formula.

## Inputs

- Either: a specific `batch_id` (from Topic Generator output)
- Or: "all pending" — score every topic with `status = 'pending'` and `final_score IS NULL`

## Scoring formula (default weights)

Greg can override these. Default:

- GEO potential: 40%
- Songfinch relevance: 35%
- Search volume: 15% (`low` = 3, `medium` = 6, `high` = 9 — then scaled to 1-10)
- Wedge bonus: 10% (10 if wedge=true, 0 if false)

```
final_score = (geo_potential * 0.40)
            + (songfinch_relevance * 0.35)
            + (volume_score * 0.15)
            + (wedge_bonus * 0.10)
```

Where `volume_score = 3 | 6 | 9` for low/medium/high.

Result is a number between roughly 0 and 10.

## Process

1. **Read pending topics** via Supabase MCP. `SELECT * FROM topics WHERE status = 'pending' AND final_score IS NULL` (or filtered by batch).

2. **Compute scores** for each row using the formula above. Round to 2 decimals.

3. **Rank them** descending by final_score. Ties broken by `songfinch_relevance` desc, then `geo_potential` desc.

4. **Write back** via Supabase MCP. `UPDATE topics SET final_score = $1, rank = $2 WHERE id = $3` for each.

5. **Surface the top 10** to Greg with title, score, and a one-line reasoning summary.

## Edge cases

- If a topic has missing score fields (shouldn't happen, but defensive): skip it and warn.
- If batch_id is provided but no matching rows exist: tell Greg, don't error.
- If Greg overrides weights in his invocation ("score with GEO weight at 0.5"), use those instead and note the override.

## After writing

Tell Greg:

- N topics scored
- Top 10 with final_score, title, and reasoning preview
- Suggest 3 he might want to approve right away (specifically ones with score >7 AND wedge=true, OR score >8 regardless)
