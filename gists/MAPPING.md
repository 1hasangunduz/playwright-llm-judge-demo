# Gist package — colored, copyable code for Medium

Medium strips CSS syntax-highlighting on paste, but it **natively embeds public GitHub Gists**
as colored, line-numbered, copyable code. This package turns the 7 main TypeScript blocks into gists.

## How to use

1. Make sure the GitHub CLI is authenticated: `gh auth status` (login: `gh auth login`).
2. Run: `./create-gists.sh` — it creates all 7 public gists and prints each URL.
3. In the Medium editor, for each row below: delete the plain code block, then paste the gist URL
   on its **own empty line** and press Enter. Medium auto-embeds it.

## Placement

| # | Article section | Gist file |
|---|---|---|
| 1 | Intro — It's 3 AM and the test is green | `1-intro-assertions/assertions.spec.ts` |
| 2 | 3.1 Capture hybrid context | `2-capture-context/fixtures.ts` |
| 3 | 3.2 Define the rubric | `3-rubric/rubric.ts` |
| 4 | 3.3 Define the structured output | `4-schema/schema.ts` |
| 5 | 3.4 The judge() function | `5-judge/judge.ts` |
| 6 | 3.5 A custom Playwright matcher | `6-matcher/fixtures.ts` |
| 7 | 3.6 The demo tests | `7-tests/search.spec.ts` |

**Left as plain Medium code blocks (no gist needed):** the `npm i` install line, the repo-skeleton
tree, the failure-message output, and the final quickstart — short, non-TS, fine as-is.

> These gists live only on GitHub, independent of the companion repo. Editing a gist later updates
> the embed everywhere it appears.
