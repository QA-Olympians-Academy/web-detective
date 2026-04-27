#!/usr/bin/env bash
# CH2 — PLAYWRIGHT CLI CHEATSHEET
#
# Every command below targets the web-detective app.
# Run from the project root: /Users/.../web-detective

# ── 1. Run the full suite ─────────────────────────────────────────────────────

npx playwright test

# Specific project (browser) only
npx playwright test --project=chromium

# ── 2. Filter by file or test name ───────────────────────────────────────────

npx playwright test tests/auth.spec.ts
npx playwright test --grep "logs in with valid"

# ── 3. Headed mode — watch the browser as tests run ──────────────────────────

npx playwright test --headed --project=chromium

# ── 4. Interactive UI mode — step through tests visually ─────────────────────
#
# Opens a GUI where you can click individual tests, watch the browser,
# use time-travel debugging, and inspect the DOM at any step.

npx playwright test --ui

# ── 5. Debug mode — Playwright Inspector ─────────────────────────────────────
#
# Pauses at every action. Use the inspector to:
#   • Step forward / backward
#   • Try selectors live in the console
#   • Record new actions from this point

PWDEBUG=1 npx playwright test tests/auth.spec.ts --project=chromium

# ── 6. Codegen — record interactions and generate test code ──────────────────
#
# Opens the app in a browser. Every click, fill, and navigation you make
# is recorded and written as Playwright test code on the right panel.
# The generated code respects the project's baseURL from playwright.config.ts.

npx playwright codegen http://localhost:5173

# Save directly to a file
npx playwright codegen http://localhost:5173 --output=tests/recorded-flow.spec.ts

# ── 7. Trace viewer — post-mortem debugging ───────────────────────────────────
#
# After a test run the HTML report includes traces. Open it with:

npx playwright show-report

# Or open a specific trace zip file (e.g. from AgentBrowserSession):
npx playwright show-trace traces/login-scenario-1234567890.zip

# ── 8. Screenshot a page ──────────────────────────────────────────────────────
#
# Useful for capturing current state without writing a test.

npx playwright screenshot --browser=chromium http://localhost:5173/login login.png

# ── 9. Generate a full-page PDF ───────────────────────────────────────────────

npx playwright pdf http://localhost:5173/dashboard dashboard.pdf

# ── 10. Run with trace always on (useful for CI debugging) ────────────────────

npx playwright test --trace=on

# ── WORKSHOP TASKS ────────────────────────────────────────────────────────────
#
# Task A: Run codegen against /login, fill the credentials, and observe
#         which selectors Playwright prefers (ARIA > label > CSS).
#
# Task B: Intentionally break a selector in tests/pages/LoginPage.ts,
#         run with PWDEBUG=1, and use the Inspector to find the real selector.
#
# Task C: Run the full suite with --trace=on, open show-report, click a test,
#         and walk through the timeline step by step.
