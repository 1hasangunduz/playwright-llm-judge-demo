import * as path from 'path'
import { test, expect } from '../src/fixtures'

const QUERY = 'red running shoes size 42'

const liveUrl = `https://www.amazon.com/s?k=${encodeURIComponent(QUERY)}`
const localUrl = `file://${path.resolve(__dirname, '../fixtures/search-local.html')}`

const targetUrl = process.env.RUN_AGAINST_LOCAL === 'true' ? localUrl : liveUrl

test(`search results are relevant for "${QUERY}"`, async ({ page }) => {
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' })
  // Best-effort wait for results; ignore if network never goes idle.
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})

  await expect(page).toBeJudgedRelevant(QUERY)
})
