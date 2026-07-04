---
name: pw-plan
description: Generate a Playwright test plan and runnable test code from live app exploration using the ch4.1 Planner + Generator agents.
argument-hint: "[plan-name or feature area]"
allowed-tools: Bash(npm *) Bash(npx *) Read Write
---

Generate a Playwright test plan and test code. Target: `$ARGUMENTS`

## Steps

1. **Determine plan name** from `$ARGUMENTS`:
   - Empty → use `web-detective` as the plan name and cover all routes
   - A feature keyword (e.g. `login`, `products`) → use it as the plan name and limit exploration to that route
   - A quoted string → use as-is for the plan name

2. **Check the dev server** is running on `http://localhost:5173`:
   ```
   npx wait-on http://localhost:5173 --timeout 5000 || (npm run dev & npx wait-on http://localhost:5173 --timeout 30000)
   ```

3. **Run the Planner** to explore the app and produce a Markdown plan
   (requires a local Ollama server with `deepseek-r1:8b` — see `setup/local-llm-setup.md`):
   ```
   npx ts-node -e "
     const { TestPlannerAgent } = require('./examples/ch4.1-playwright-agents/planner')
     void new TestPlannerAgent()
       .plan('http://localhost:5173', ['/login', '/dashboard', '/products'], '$PLAN_NAME')
       .then(r => console.log('Plan saved:', r.planPath))
   "
   ```
   After it completes, **read and show `specs/<plan-name>.md`** to the user.

4. **Confirm with the user** before generating code:
   - Ask: "Does this plan look right? I'll generate the test code next."
   - If the user wants changes, edit `specs/<plan-name>.md` directly before proceeding.

5. **Run the Generator** to emit runnable TypeScript tests:
   ```
   npx ts-node -e "
     const { TestGeneratorAgent } = require('./examples/ch4.1-playwright-agents/planner')
     void new TestGeneratorAgent(process.env.ANTHROPIC_API_KEY)
       .generate('$PLAN_NAME')
       .then(r => {
         console.log('Tests saved:', r.testPath)
         if (r.selectorWarnings.length) console.warn('Selector warnings:', r.selectorWarnings.join(', '))
       })
   "
   ```

6. **Report** back:
   - Path to the generated spec file (`tests/generated/<plan-name>.spec.ts`)
   - Any selector warnings (CSS selectors that should be ARIA equivalents)
   - Suggest next steps:
     - Run the tests: `/pw-run tests/generated/<plan-name>.spec.ts`
     - If tests fail: use `examples/ch4.1-playwright-agents/healer.ts` or `/pw-self-heal` to repair them

Never modify files in `tests/` (the hand-written suite) — generated tests go to `tests/generated/` only.
