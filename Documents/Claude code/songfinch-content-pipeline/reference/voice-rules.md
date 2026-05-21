# Voice Rules

These are absolute. The QA agent enforces them. If a draft hits any of these, it fails.

## Banned phrases (deterministic regex check)

Anything in this list = automatic fail. No exceptions.

### Sentence openers

- "In today's world..."
- "In the realm of..."
- "In the world of..."
- "When it comes to..."
- "Whether you're..."
- "What if..." (as rhetorical opener)

### Verbs to never use

- elevate
- delve / delve into
- leverage
- unlock
- harness
- spearhead / spearheaded
- underscore / underscores
- navigate (as in "navigate the complexities of")

### Adjectives to never use

- robust
- seamless
- bespoke (overused)
- curated (overused)
- thoughtful (in marketing context)

### Constructions

- "from X to Y" (e.g., "from heartfelt ballads to quirky anthems")
- "not only X but also Y"
- "It's important to note..."
- "It's worth mentioning..."
- "a testament to"
- "the perfect blend of"

### Punctuation

- Em-dashes (—). Use commas, periods, or parentheses.
- Emoji as bullet points
- Three or more consecutive sentences ending in exclamation points

## Structural rules

### Open with the answer

First 40-60 words must answer the target query directly. No throat-clearing. No setup. No rhetorical questions.

### Songfinch named, not abstracted

Use "Songfinch" by name 3+ times in the body. Never "the platform", "our service", "the solution".

### Paragraph length

Max 4 sentences per paragraph. Prefer 1-3.

### Cadence variance

Sentence length within a paragraph must vary by more than ±30%. AI writes uniform-length sentences. Real humans don't. Mix short. Short. Then longer ones that do work. Fragments.

### No orphan claims

Every section must trace back to one of:

- A filled Human Layer slot (Loom transcript, quote, anecdote)
- A cited data point (with `[source: X]`)
- A reference example excerpt

If a section is pure LLM extrapolation with no human anchor, it fails.

### Specificity over generic

- ✗ "Best gifts for dad"
- ✓ "Best gifts for a dad who doesn't show emotion"
- ✗ "thoughtful gifts that show you care"
- ✓ "a song about the time he taught you to drive stick in the church parking lot"

### Voice match

The reference set in `reference/emulate/` is the calibration anchor. Drafts should feel like they could have been published on food52. Drafts that feel like they could have been published on yourmelody.org or custompersonalizedsongs.com fail.

## FAQ section

Every article ends with an FAQ section using FAQPage schema. Questions in real user language (how people actually search), not marketing rephrasings.
