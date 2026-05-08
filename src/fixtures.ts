import { test as base, expect as baseExpect, Page } from '@playwright/test'
import { judge, JudgeContext } from './judge'
import { searchResultsRubric } from './rubric'

export async function captureJudgeContext(page: Page): Promise<JudgeContext> {
  return {
    url: page.url(),
    ariaSnapshot: await page.locator('main, body').first().ariaSnapshot(),
    screenshot: (await page.screenshot({ fullPage: false })).toString('base64'),
  }
}

export const test = base

export const expect = baseExpect.extend({
  async toBeJudgedRelevant(page: Page, query: string) {
    const ctx = await captureJudgeContext(page)
    const verdict = await judge(searchResultsRubric(query), ctx)

    const message =
      `Judge verdict: ${verdict.verdict} (score ${verdict.score.toFixed(2)})\n` +
      (verdict.issues.length ? `Issues:\n - ${verdict.issues.join('\n - ')}\n\n` : '\n') +
      verdict.rationale

    return {
      pass: verdict.verdict === 'pass',
      message: () => message,
      name: 'toBeJudgedRelevant',
      expected: 'pass',
      actual: verdict.verdict,
    }
  },
})
