// tests/search.spec.ts
import * as path from 'path'
import { test, expect } from '../src/fixtures'

const QUERY = 'red running shoes size 42'
const liveUrl = `https://www.amazon.com/s?k=${encodeURIComponent(QUERY)}`
const goodUrl = `file://${path.resolve(__dirname, '../fixtures/search-good.html')}`
const brokenUrl = `file://${path.resolve(__dirname, '../fixtures/search-broken.html')}`

const runLocal = process.env.RUN_AGAINST_LOCAL === 'true'

test.describe('search results judge', () => {
  test('passes a healthy results page', async ({ page }) => {
    test.skip(!runLocal, 'set RUN_AGAINST_LOCAL=true')
    await page.goto(goodUrl, { waitUntil: 'domcontentloaded' })
    await expect(page).toBeJudgedRelevant(QUERY)
  })

  test('catches a broken results page', async ({ page }) => {
    test.skip(!runLocal, 'set RUN_AGAINST_LOCAL=true')
    await page.goto(brokenUrl, { waitUntil: 'domcontentloaded' })
    await expect(page).not.toBeJudgedRelevant(QUERY)
  })

  test('judges the live target', async ({ page }) => {
    test.skip(runLocal, 'unset RUN_AGAINST_LOCAL to hit the live target')
    await page.goto(liveUrl, { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await expect(page).toBeJudgedRelevant(QUERY)
  })
})
