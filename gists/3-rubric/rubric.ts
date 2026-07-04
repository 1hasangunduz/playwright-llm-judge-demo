// src/rubric.ts
export const searchResultsRubric = (query: string) => `
You are evaluating a search-results page for the query: "${query}".
Mark the page as PASS if all of the following hold; otherwise FAIL or WARN:
1. The visible products are clearly relevant to the query (>= 70% of visible items).
2. Each result has an image, title, and price.
3. The first result is not visibly broken (no missing image, no overlapping CTA).
4. A facet/filter panel is present and includes at least one query-relevant filter.
5. No empty-state text is shown when results exist.
Return FAIL only when at least one rule is broken in a user-visible way.
Return WARN when the page works but quality is borderline.
`
