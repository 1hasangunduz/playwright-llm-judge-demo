# LLM-as-Judge: Testing Dynamic Search UIs with Playwright and GPT-4o

*Why `expect(results).toHaveCount(20)` is lying to you, and what to do about it.*

---

## It's 3 AM and the test is green

You wake up to a Slack ping. A staff engineer has shipped a search-ranker change at midnight. The CI dashboard is a wall of green. Every Playwright test passed. Yet a screenshot in the bug channel shows the search page returning *"red running shoes"* results that are mostly white sneakers, sorted by some forgotten popularity score.

Your tests are not lying. They are answering the wrong question.

```ts
await expect(page.getByRole('listitem')).toHaveCount(20)   // green
await expect(page.getByText(/relevance/i)).toBeVisible()   // green
await expect(page).toHaveScreenshot('search.png')          // green-ish, you marked it as updateSnapshots last week
```

Dynamic UIs break our assertion vocabulary in three ways:

1. **Hard assertions can't see relevance.** A list of 20 items is not the same as a list of 20 *good* items.
2. **Visual diff churns daily.** Search results legitimately change. Pixel diffs become a baseline-update treadmill.
3. **Snapshots rotate.** Personalization, A/B tests, inventory shifts — your "stable" snapshot is a lie within a week.

What if a test could *read* the page the way a thoughtful PM does, return a graded verdict, and explain itself? That is the LLM-as-Judge pattern, and this article shows how to wire one into Playwright with about 200 lines of TypeScript.

A companion repo with a runnable test is linked at the end.

---

## 1. The LLM-as-Judge pattern

The pattern was born in model evaluation. In tools like the LMSYS Chatbot Arena, a strong model grades the answers of weaker models against a rubric — judging which answer is more helpful, factual, or coherent. The technique scales human evaluation work that would otherwise be impossible.

Translate that into UI testing. Instead of asking the model "is answer A better than answer B," we ask it "given this rubric, is the page in front of you doing its job?" The judge is **graded, not absolute**. It returns:

- a `verdict` — `pass`, `fail`, or `warn`
- a numeric `score` from 0 to 1
- an array of `issues` it observed
- a short `rationale` for the human reading the failure

The mental shift matters. A judge is **not an oracle.** It is probabilistic, occasionally wrong, and always opinionated. We use it where deterministic assertions cannot reach:

| Use it for | Don't use it for |
|---|---|
| Dynamic content (search, recommendations, feeds) | Deterministic flows (login → dashboard) |
| Vague acceptance criteria (*"results should be relevant"*) | Performance budgets |
| Copy / UX quality | Pixel-perfect cross-browser checks |
| Heuristic accessibility (alt text quality, scan order) | Strict WCAG compliance — use axe-core |

Trendyol's mobile testing team [recently scaled from 4,869 to 10,400 UI tests in under a year](https://medium.com/trendyol-tech/scaling-mobile-ui-testing-with-ai-02b78bc50a5e) using AI to *generate* tests. The judge pattern is the natural complement on the *verification* side: AI that decides whether the UI it sees is acceptable, not just whether the test it ran did not throw.

---

## 2. The stack

We need three ingredients:

- **Playwright** — captures both a screenshot and an `aria-snapshot` of the rendered page.
- **OpenAI gpt-4o** — accepts vision input and supports structured outputs via JSON Schema.
- **A hybrid input** — we send both the screenshot *and* the aria-snapshot to the model.

Why hybrid? A screenshot alone catches visual regressions but burns tokens and misses semantic intent. An aria-snapshot alone is cheap and deterministic but ignores layout, typography, and broken images. Combined, the two signals reinforce each other: the model resolves visual ambiguity using the semantic tree, and reads the tree against the screenshot's actual rendering.

```bash
npm i -D @playwright/test
npm i openai zod dotenv
```

Repo skeleton:

```
playwright-llm-judge-demo/
├── src/
│   ├── judge.ts          # the OpenAI call
│   ├── rubric.ts         # default search-results rubric
│   ├── schema.ts         # zod + JSON Schema
│   └── fixtures.ts       # captureJudgeContext + custom matcher
└── tests/search.spec.ts  # the demo test
```

---

## 3. Building the judge

### 3.1 Capture hybrid context

A small helper grabs the two artifacts in one call:

```ts
// src/fixtures.ts
import { Page } from '@playwright/test'

export async function captureJudgeContext(page: Page): Promise<JudgeContext> {
  return {
    url: page.url(),
    ariaSnapshot: await page.locator('main, body').first().ariaSnapshot(),
    screenshot: (await page.screenshot({ fullPage: false })).toString('base64'),
  }
}
```

`ariaSnapshot()` returns a YAML-ish tree of accessible roles and names — exactly what a screen reader sees, which is also exactly what we want a judge to reason about.

### 3.2 Define the rubric

The rubric is the test's intent in plain English. Keep it short and concrete:

```ts
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
```

### 3.3 Define the structured output

Structured outputs are non-negotiable. Free-form judge replies will derail your CI:

```ts
// src/schema.ts
import { z } from 'zod'

export const Verdict = z.object({
  verdict: z.enum(['pass', 'fail', 'warn']),
  score: z.number().min(0).max(1),
  issues: z.array(z.string()).max(10),
  rationale: z.string().max(800),
})
export type Verdict = z.infer<typeof Verdict>
```

We pass the equivalent JSON Schema to OpenAI so the model is forced into shape.

### 3.4 The `judge()` function

```ts
// src/judge.ts
import OpenAI from 'openai'
import { Verdict } from './schema'

const client = new OpenAI()

export async function judge(rubric: string, ctx: JudgeContext): Promise<Verdict> {
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0,
    seed: 42,
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'verdict', schema: VerdictJsonSchema, strict: true },
    },
    messages: [
      { role: 'system', content: rubric },
      {
        role: 'user',
        content: [
          { type: 'text', text: `Page URL: ${ctx.url}\n\nAccessibility tree:\n${ctx.ariaSnapshot}` },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${ctx.screenshot}` } },
        ],
      },
    ],
  })
  const raw = JSON.parse(response.choices[0].message.content!)
  return Verdict.parse(raw)   // double-check at the boundary
}
```

`temperature: 0` plus a fixed `seed` gets us as deterministic as the API allows. Zod parses on the way out so a malformed response fails loud.

### 3.5 A custom Playwright matcher

```ts
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
```

### 3.6 The demo test

```ts
// tests/search.spec.ts
import { test, expect } from '../src/fixtures'

test('search results are relevant for "red running shoes size 42"', async ({ page }) => {
  await page.goto('https://www.amazon.com/s?k=red+running+shoes+size+42')
  await page.waitForLoadState('networkidle')
  await expect(page).toBeJudgedRelevant('red running shoes size 42')
})
```

When this passes, the failure message is empty. When it fails, you get something a human can act on:

```
Judge verdict: fail (score 0.34)
Issues:
 - Top 3 results are white sneakers, not red.
 - Color filter exists but query color was not pre-applied.
Rationale: 7 of the 16 visible products are red, but the ranking surfaces non-red items first…
```

That is the report you wanted at 3 AM.

---

## 4. Production realities

A judge in CI is not a science experiment. Four levers keep it honest:

- **Determinism.** `temperature: 0` plus `seed` plus strict JSON Schema is the floor. Wrap the call in a one-shot retry that runs only on schema-parse errors — never on `fail` verdicts. Retrying failures hides regressions.
- **Cost.** A hybrid call against gpt-4o costs roughly **$0.01–$0.03 per test** at full-page screenshot resolution. Cap image dimensions at 1024×768. Sample: run the judge on every PR for the top 20 user journeys, and nightly for the full suite. Most teams do not need a judge on every PR run.
- **CI caching.** Hash `(ariaSnapshot + downscaled screenshot)`. If the hash matches a previous green verdict, skip the call. Page genuinely changed → judge runs. Most search-results pages drift slowly enough that hit rates of 40–60% are realistic.
- **Privacy.** Never ship logged-in user data, real emails, or order IDs to the model. Mask before screenshot capture using Playwright's `page.evaluate()` to hide PII selectors, or run the judge only against guest sessions.

Trendyol's mobile team [reports 96.6% release stability with AI-driven UI testing at 10,400 tests](https://medium.com/trendyol-tech/scaling-mobile-ui-testing-with-ai-02b78bc50a5e). A judge layer composes naturally on top of that scale — generation gets you the test; the judge tells you whether the page under test is actually good.

---

## 5. Limitations and what to build next

A judge is one tool, not a strategy. Three honest caveats:

- It is **not a replacement** for unit tests, integration tests, or accessibility scanners. Use it where heuristics beat hard assertions, not where hard assertions already work.
- The model has **opinions** baked in. gpt-4o has its own theory of "good UX," and it will project that onto your interface. Calibrate the rubric against examples your team agrees on.
- For high-stakes flows, run a **multi-judge consensus** — three calls with different seeds, majority vote. Disagreement is itself a signal worth reviewing.

The horizon is agentic. Trendyol explicitly mentions [experimental agentic approaches for automated change analysis](https://medium.com/trendyol-tech/scaling-mobile-ui-testing-with-ai-02b78bc50a5e) — agents that observe a failure, hypothesize a cause, mutate locators, and re-run. The judge is the eyes of that agent. Get the judge right first; the agent will ride on top of it.

---

## Try it

Companion repo: **[github.com/your-handle/playwright-llm-judge-demo](https://github.com/your-handle/playwright-llm-judge-demo)** — clone, drop your `OPENAI_API_KEY` into `.env`, run `npx playwright test`. A `RUN_AGAINST_LOCAL=true` flag points the test at a checked-in static fixture if you cannot hit Amazon from your CI runner.

What dynamic surface in your product could a judge unblock this quarter?

---

### References

- Trendyol Tech — [Advanced Maestro Testing: Event Validation & AI-Powered Test Generation](https://medium.com/trendyol-tech/advanced-maestro-testing-event-validation-ai-powered-test-generation-0bb86f3ca481)
- Trendyol Tech — [Scaling Mobile UI Testing with AI](https://medium.com/trendyol-tech/scaling-mobile-ui-testing-with-ai-02b78bc50a5e)
- Trendyol Tech — [Test Automation Structure for Single Code Base Projects](https://medium.com/trendyol-tech/test-automation-structure-for-single-code-base-projects-58d8fb1f7250)
- OpenAI — [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
- Playwright — [`ariaSnapshot`](https://playwright.dev/docs/api/class-locator#locator-aria-snapshot)

---

*Hasan Gündüz is a software engineer at Insider. Find him on Medium and LinkedIn.*
