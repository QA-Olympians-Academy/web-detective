---
name: pw-self-heal
description: Detect broken Playwright locators in the project's page objects, propose LLM-ranked replacements, and update the locator store.
argument-hint: "[page-object-file-or-key]"
allowed-tools: Bash(npx playwright *) Bash(npx tsx *) Read
---

Detect and heal broken locators. Target: `$ARGUMENTS`

> **Scope note**: this skill heals *selector strings* inside page objects and the LocatorStore (CH4).
> If the target is a *generated test file* in `tests/generated/`, use `examples/ch4.1-playwright-agents/healer.ts` instead — it rewrites entire `test()` blocks rather than individual selectors.

## Steps

1. **Identify scope** from `$ARGUMENTS`:
   - Empty → scan all files in `tests/pages/` and `examples/ch4-self-healing/locator-store.ts`
   - File name (e.g. `LoginPage`) → check only that page object
   - Locator key (e.g. `login.emailInput`) → heal only that entry

2. **Start the dev server** if not already running:
   ```
   npm run dev &
   npx wait-on http://localhost:5173 --timeout 15000
   ```

3. **Run a selector probe** — for each `readonly` locator in the target page object(s), try to find it on its natural page using Playwright:
   ```
   npx playwright test --grep "renders" --reporter=list
   ```
   A locator is "broken" if the element is not found within 3 seconds.

4. **For each broken locator**:
   - Take a snapshot of the page where the element should appear
   - Show the broken selector and the current accessibility tree
   - Propose 3–5 replacement selectors ranked by stability:
     1. ARIA role + name (`getByRole`)
     2. Label text (`getByLabel`)
     3. Placeholder or visible text (`getByPlaceholder`, `getByText`)
     4. Semantic CSS class (not structural)
   - Ask the user to confirm the best replacement before writing

5. **On confirmation**, update the relevant page object file and the locator store:
   - Edit the `readonly` property in `tests/pages/<PageObject>.ts`
   - Call `store.heal(key, newSelector)` in `examples/ch4-self-healing/locator-store.ts`

6. **Verify** the heal worked by re-running the affected tests:
   ```
   npx playwright test --reporter=list
   ```

7. Report: N locators checked, M broken, K healed. For any that could not be healed, explain why and what manual action is needed.
