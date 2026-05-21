Extract structured GEO research from this analysis. Real brands, real LLMs, real strategy. Do not invent.

# Analysis to structure

{{grounded_text}}

# Sources cited

{{sources_block}}

# Output rules

- target_prompts: exactly ONE primary prompt (the article's main target), 1-4 secondary prompts (related variations the article should also satisfy)
- competitor_citations: brands actually mentioned in the analysis. If the analysis says no brand reliably wins, return an empty array — don't invent.
- citation_strategy: 3-6 sentences with specific tactics that reference the competitors above.

Return as structured output.
