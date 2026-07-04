#!/usr/bin/env bash
# Creates one PUBLIC GitHub Gist per code block and prints each URL + where it goes.
# Public is required: Medium can only embed public gists. These snippets contain no
# secrets (keys come from env vars), and the companion repo is already public.
#
# Prereq: gh CLI authenticated.  Check: gh auth status   Login: gh auth login
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v gh >/dev/null 2>&1; then
  echo "ERROR: gh CLI not found. Install: https://cli.github.com/"; exit 1
fi
if ! gh auth status >/dev/null 2>&1; then
  echo "ERROR: gh not authenticated. Run: gh auth login"; exit 1
fi

echo "Creating 7 public gists..."; echo

echo "== Intro — It's 3 AM and the test is green =="
url=$(gh gist create --public --desc "LLM-as-Judge: hard assertions cannot see relevance" "1-intro-assertions/assertions.spec.ts")
echo "  gist : $url"
echo "  place: Intro — It's 3 AM and the test is green"
echo
echo "== 3.1 Capture hybrid context =="
url=$(gh gist create --public --desc "LLM-as-Judge: capture hybrid Playwright context (screenshot + aria-snapshot)" "2-capture-context/fixtures.ts")
echo "  gist : $url"
echo "  place: 3.1 Capture hybrid context"
echo
echo "== 3.2 Define the rubric =="
url=$(gh gist create --public --desc "LLM-as-Judge: plain-English search-results rubric" "3-rubric/rubric.ts")
echo "  gist : $url"
echo "  place: 3.2 Define the rubric"
echo
echo "== 3.3 Define the structured output =="
url=$(gh gist create --public --desc "LLM-as-Judge: zod verdict schema" "4-schema/schema.ts")
echo "  gist : $url"
echo "  place: 3.3 Define the structured output"
echo
echo "== 3.4 The judge() function =="
url=$(gh gist create --public --desc "LLM-as-Judge: the Gemini 2.5 judge() function" "5-judge/judge.ts")
echo "  gist : $url"
echo "  place: 3.4 The judge() function"
echo
echo "== 3.5 A custom Playwright matcher =="
url=$(gh gist create --public --desc "LLM-as-Judge: custom Playwright matcher toBeJudgedRelevant" "6-matcher/fixtures.ts")
echo "  gist : $url"
echo "  place: 3.5 A custom Playwright matcher"
echo
echo "== 3.6 The demo tests =="
url=$(gh gist create --public --desc "LLM-as-Judge: the demo Playwright test" "7-tests/search.spec.ts")
echo "  gist : $url"
echo "  place: 3.6 The demo tests"
echo
echo "Done. In Medium, paste each URL on its OWN empty line and press Enter -> it embeds as colored, copyable code."
