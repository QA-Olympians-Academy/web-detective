---
name: pw-run
description: Run Playwright tests for this project. Pass a file name, test title substring, or leave blank to run the full suite.
argument-hint: "[test-file-or-grep-pattern]"
allowed-tools: Bash(npx playwright *)
---

Run the Playwright test suite. Arguments: `$ARGUMENTS`

## Steps

1. **Determine scope** from `$ARGUMENTS`:
   - Empty → run the full suite: `npx playwright test --reporter=list`
   - Looks like a file path (contains `/` or ends in `.spec.ts`) → run that file: `npx playwright test $ARGUMENTS --reporter=list`
   - Otherwise treat it as a title grep: `npx playwright test --grep "$ARGUMENTS" --reporter=list`

2. **Run the command** and capture output.

3. **Report results**:
   - Print a short summary: total passed / failed / skipped, total duration.
   - For every failing test print: test title, error message, and the relevant source line from the stack trace.
   - If all tests pass, confirm with the count and duration.

4. **On failures**, suggest the most likely fix based on the error type:
   - `locator not found` → selector may have changed; check the relevant page object in `tests/pages/`.
   - `toHaveURL` mismatch → auth flow or route guard may have changed.
   - `toHaveCount` mismatch → data or DOM structure may have changed.

Never modify test files unless the user explicitly asks.
