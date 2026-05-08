import { defineConfig, devices } from '@playwright/test'
import * as dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: 0,
  reporter: [['list']],
  use: {
    headless: true,
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
