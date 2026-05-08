import '@playwright/test'

declare module '@playwright/test' {
  interface Matchers<R> {
    toBeJudgedRelevant(query: string): Promise<R>
  }
}
