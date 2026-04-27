---
name: pw-new-test
description: Scaffold a new Playwright spec file for this project, following the existing fixtures/page-object pattern.
argument-hint: "<what-to-test>"
allowed-tools: Read Bash(find *) Bash(npx playwright *)
---

Scaffold a new Playwright spec for: `$ARGUMENTS`

## Project conventions to follow

- **Fixtures**: always import `test` and `expect` from `./fixtures` (not from `@playwright/test`) — file is `tests/fixtures/index.ts`.
- **Authenticated tests**: destructure `authenticated: _authenticated` in `test.beforeEach` to trigger the login fixture.
- **Page objects**: live in `tests/pages/`. Use an existing one if the target page already has one, otherwise create a new one (use `/pw-page-object` for that).
- **Locators**: define them as `readonly` properties in the page object constructor; never inline `page.locator()` calls in spec files.
- **File naming**: `tests/<feature>.spec.ts` in kebab-case.

## Steps

1. **Understand the target** from `$ARGUMENTS`. Read the relevant source files in `src/pages/` to know what elements exist.

2. **Check for an existing page object** in `tests/pages/`. If none exists for the target page, create one first following the pattern in `tests/pages/ProductsPage.ts`.

3. **Write the spec file** at `tests/<feature>.spec.ts`:
   - One `test.describe` block named after the feature.
   - `test.beforeEach` that runs the `authenticated` fixture and navigates to the right page.
   - Cover at minimum: page renders correctly, primary happy-path interaction, one edge/error case.
   - No raw `page.*` calls inside test bodies — delegate to the page object.

4. **Run the new spec** to confirm it passes:
   ```
   npx playwright test tests/<feature>.spec.ts --reporter=list
   ```

5. Report the created files and test results. If any test fails, diagnose and fix before finishing.
