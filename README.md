# playwright-llm-judge-demo

Companion repo for the Medium article *"LLM-as-Judge: Testing Dynamic Search UIs with Playwright and GPT-4o."*

A minimal Playwright + OpenAI gpt-4o setup that grades a search-results page against a plain-English rubric and returns a structured verdict.

```
   ┌─────────────┐    ┌──────────────────┐    ┌──────────────┐
   │  Playwright │───▶│  hybrid context  │───▶│  gpt-4o      │
   │  (browser)  │    │  screenshot+ARIA │    │  + rubric    │
   └─────────────┘    └──────────────────┘    └──────┬───────┘
                                                      │
                                                      ▼
                                             ┌─────────────────┐
                                             │ { verdict,      │
                                             │   score,        │
                                             │   issues[],     │
                                             │   rationale }   │
                                             └─────────────────┘
```

## Quickstart

```bash
git clone <this-repo>
cd playwright-llm-judge-demo
npm install
npx playwright install chromium
cp .env.example .env       # then add your OPENAI_API_KEY
npx playwright test
```

Expected output on a healthy page:

```
[judge] tokens prompt=1842 completion=124 total=1966
✓ search results are relevant for "red running shoes size 42" (8.4s)
```

On a bad page you get a graded failure message:

```
✘ search results are relevant for "red running shoes size 42"

  Judge verdict: fail (score 0.34)
  Issues:
   - Top 3 results are predominantly white sneakers, not red.
   - The "Color: Red" filter is available in the sidebar but was not pre-applied.
   - Result 5 has an overlapping "Add to cart" button on the price element.

  7 of the 16 visible products are red, but the ranking surfaces non-red items
  first, which is the opposite of what a query mentioning a color implies.
```

## Two ways to run

| Mode | Command | What it tests |
|---|---|---|
| Live (default) | `npx playwright test` | Hits `amazon.com/s?k=...` |
| Local fixture | `RUN_AGAINST_LOCAL=true npx playwright test` | Hits a checked-in HTML page in `fixtures/search-local.html` |

Use the local fixture if your CI runner is rate-limited, behind a corporate proxy, or you simply want a deterministic offline demo.

## A note on the live target

The live demo points at Amazon's public search page. Amazon's Conditions of Use prohibit automated scraping at scale; this repo is intended for **educational use only**:

- Run a handful of times, not a thousand.
- Do not parallelize across many shards against the live target.
- For real production use, point the test at **your own application**, a staging environment, or a public sandbox like [`saucedemo.com`](https://www.saucedemo.com/).

The local-fixture mode exists so the repo is fully runnable without ever touching Amazon.

## Cost

Each judge call is a single gpt-4o request with one image (1024×768) plus an aria-snapshot. Expect roughly **$0.01–$0.03 per test** depending on page complexity. The repo logs token usage at the end of each run.

## Layout

```
src/
  judge.ts          OpenAI call + structured output
  rubric.ts         the search-results rubric
  schema.ts         zod + JSON Schema for the verdict
  fixtures.ts       Playwright fixture + custom matcher

tests/
  search.spec.ts    the demo test

fixtures/
  search-local.html offline demo target
```

## Extending it

The pattern transfers directly to:

- Recommendation strips ("are these recommendations relevant to my recent activity?")
- Personalized feeds
- Empty / error states ("is this empty-state copy actually helpful?")
- Multi-step funnels (one judge per step)

Drop a new rubric in `src/rubric.ts` and a new test in `tests/`.

## License

MIT.
