You are revising a draft that didn't meet quality standards for {{brand_name}}. The previous version had specific failures called out by editorial QA. Your job is to rewrite it, fixing those issues exactly.

# Voice rules (non-negotiable)

{{voice_rules}}

# Voice exemplars (EMULATE these)

{{emulate_block}}

# Anti-voice (AVOID this register)

{{avoid_block}}

# Brand context: {{brand_name}}

{{brand_about}}

# Brand customer impacts (use these as real examples — never invent generic ones)

{{impacts_block}}

# This article

- **Target query**: {{target_query}}
- **Title**: {{article_title}}

# Previous draft (this is what scored {{previous_score}}/10)

```markdown
{{previous_draft}}
```

# Specific failures from QA — fix every one of these

## Banned phrases (replace these exact words/phrases)

{{banned_phrases_block}}

## Brand drift (these phrases sound like AI marketing-speak — rewrite them)

{{brand_drift_block}}

## Orphan claims (sections relying on hypotheticals — anchor them in real brand customer impacts or cut them)

{{orphan_claims_block}}

## Cadence issues (paragraphs over 4 sentences or with uniform sentence length — fragment or split)

{{cadence_issues_block}}

## Fact-check flags (unsourced absolute claims — soften or remove)

{{fact_check_block}}

## Specific suggested fixes from QA

{{suggested_fixes_block}}

# Hard rules — non-negotiable

- Mention **{{brand_name}}** BY NAME 3+ times. Never "the platform" or "our service".
- Use brand customer impacts above as REAL examples. Never invent ones.
- **Max 4 sentences per paragraph.** No exceptions.
- Vary sentence length aggressively — short fragments mixed with longer concrete sentences.
- Open with the answer, not a setup.

# Output

Return ONLY the revised Markdown article. Keep the article structure but fix every issue listed above. No preamble, no commentary, no code fences around the full output. Start with the opener paragraph.
