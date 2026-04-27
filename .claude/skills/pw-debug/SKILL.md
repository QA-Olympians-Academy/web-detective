---
name: pw-debug
description: Debug a failing Playwright test by running it in headed mode with a trace, then diagnosing the failure.
argument-hint: "<test-file-or-grep-pattern>"
allowed-tools: Bash(npx playwright *)
---

Debug a Playwright test. Target: `$ARGUMENTS`

## Steps

1. **Identify the target** from `$ARGUMENTS`:
   - File path → pass directly to `--project=chromium`
   - Test title substring → use `--grep`
   - If empty, ask the user which test to debug before proceeding.

2. **Run in headed mode with full trace**:
   ```
   npx playwright test $ARGUMENTS --project=chromium --headed --trace=on --reporter=list
   ```

3. **Analyse the failure output**:
   - Quote the exact error message and failing assertion.
   - Identify which locator, URL, or value assertion failed.
   - Cross-reference with the relevant page object in `tests/pages/` and the corresponding React component in `src/`.

4. **Diagnose root cause** — pick the most specific category:
   - **Selector drift**: element exists but selector is stale — show the current HTML and propose an updated locator.
   - **Timing issue**: element not yet visible — propose an explicit `waitFor` or a more stable assertion.
   - **Auth issue**: session not established — check `tests/fixtures/index.ts` authenticated fixture.
   - **Data mismatch**: count or text changed — check the relevant page component for data changes.
   - **Route mismatch**: wrong URL — check `src/App.tsx` route definitions.

5. **Propose a concrete fix** — show the exact diff (file path + old/new lines). Do not apply it unless the user confirms.
