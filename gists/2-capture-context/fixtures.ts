// src/fixtures.ts
import { Page } from '@playwright/test'
import type { JudgeContext } from './judge' // declared in §3.4 — { url, ariaSnapshot, screenshot }

export async function captureJudgeContext(page: Page): Promise<JudgeContext> {
  return {
    url: page.url(),
    ariaSnapshot: await page.locator('main, body').first().ariaSnapshot(),
    screenshot: (await page.screenshot({ fullPage: false })).toString('base64'),
  }
}
