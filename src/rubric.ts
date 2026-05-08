export const searchResultsRubric = (query: string) => `
You are evaluating an e-commerce search-results page for the query: "${query}".

Mark the page as PASS only if all of the following hold:
1. At least 70% of the visible products are clearly relevant to the query.
2. Each result has an image, a title, and a price.
3. The first result is not visibly broken (no missing image, no overlapping CTA, no obvious layout glitch).
4. A facet/filter panel is present and includes at least one filter relevant to the query.
5. No empty-state text is shown when results are present.

Return FAIL when at least one rule is broken in a user-visible way.
Return WARN when the page works but quality is borderline (e.g. relevance is 60-70%, or one result has a minor visual issue).

Be concrete in your "issues" list. Quote visible text or describe positions ("third result from the left").
Keep "rationale" under 600 characters.
`.trim()
