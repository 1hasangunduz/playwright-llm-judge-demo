# Gist package — colored, copyable code for Medium

Medium strips CSS syntax-highlighting on paste, but it **natively embeds public GitHub Gists**
as colored, line-numbered, copyable code. This package turns the 6 main TypeScript blocks into gists.

## How to use

1. Make sure the GitHub CLI is authenticated: `gh auth status` (login: `gh auth login`).
2. Run: `./create-gists.sh` — it creates the public gists and prints each URL.
3. In the Medium editor, for each row below: delete the plain code block, then paste the gist URL
   on its **own empty line** and press Enter. Medium auto-embeds it.

## Placement

| # | Article section | Gist file |
|---|---|---|
| 1 | 3.1 Capture hybrid context | `2-capture-context/fixtures.ts` |
| 2 | 3.2 Define the rubric | `3-rubric/rubric.ts` |
| 3 | 3.3 Define the structured output | `4-schema/schema.ts` |
| 4 | 3.4 The judge() function | `5-judge/judge.ts` |
| 5 | 3.5 A custom Playwright matcher | `6-matcher/fixtures.ts` |
| 6 | 3.6 The demo tests | `7-tests/search.spec.ts` |

**Left as plain Medium code blocks (no gist needed):** the intro `toHaveCount` "bad example" teaser
(nobody copies it — it reads inline), the `npm i` install line, the repo-skeleton tree, the
failure-message output, and the final quickstart — short or non-copyable, fine as-is.

> The intro teaser has a gist under `1-intro-assertions/` (URL still in `GIST-URLS.md`) but it is
> **no longer embedded** — left here only so the package regenerates cleanly.

> These gists live only on GitHub, independent of the companion repo. Editing a gist later updates
> the embed everywhere it appears.
