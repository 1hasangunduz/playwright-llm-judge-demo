// src/fixtures.ts (continued)
import { expect as baseExpect } from '@playwright/test'

export const expect = baseExpect.extend({
  async toBeJudgedRelevant(page: Page, query: string) {
    const ctx = await captureJudgeContext(page)
    const verdict = await judge(searchResultsRubric(query), ctx)
    return {
      pass: verdict.verdict === 'pass',
      message: () =>
        `Judge verdict: ${verdict.verdict} (score ${verdict.score.toFixed(2)})\n` +
        `Issues:\n - ${verdict.issues.join('\n - ')}\n\n${verdict.rationale}`,
      name: 'toBeJudgedRelevant',
      expected: 'pass',
      actual: verdict.verdict,
    }
  },
})
