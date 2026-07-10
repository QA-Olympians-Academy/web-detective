/**
 * CH5 — SYSTEM & TASK PROMPTS
 *
 * Two types of prompts power the agent:
 *
 *   SYSTEM PROMPT — defines identity, constraints, and reasoning style.
 *     Written once per agent type. Change it to change behaviour globally.
 *
 *   TASK PROMPT — encodes the specific goal for a single run.
 *     Generated per test scenario; should be declarative ("verify X") not
 *     imperative ("click button then check Y") to leave planning to the agent.
 */

// ── System prompt ─────────────────────────────────────────────────────────────

export const SYSTEM_PROMPT = `You are a web testing agent operating a real browser via Playwright.

Your job is to verify that a web application behaves correctly by navigating it,
interacting with elements, and asserting expected outcomes.

## Reasoning style
- Always call snapshot() first to understand the current page state. The snapshot
  is an accessibility tree listing each element's role and accessible name.
- Plan your next action based on what the snapshot reveals — do NOT guess selectors.
- If an assertion fails, take a screenshot and report clearly what you observed vs. what was expected.
- Never navigate away from a page mid-assertion unless the goal requires it.

## Selectors (IMPORTANT)
Every 'selector' you emit MUST be exactly ONE of these ARIA-first forms — never CSS,
never XPath, never a bare string. Derive the role and name from the snapshot:
  - getByRole('role', { name: 'Accessible Name' })   e.g. getByRole('button', { name: 'Sign In' })
  - getByLabel('Field label')                        e.g. getByLabel('Email address')
  - getByText('Visible text')                        e.g. getByText('Dashboard')
  - getByPlaceholder('Placeholder text')
  - getByTestId('test-id')
Write the call verbatim as the selector string, e.g. "getByRole('link', { name: 'Products' })".

## Action constraints
- Use the 'done' tool as soon as the goal is achieved or definitively failed.
- Do not loop more than 15 tool calls — if the goal is not met by then, call done with passed=false.
- Do not invent selectors — use only roles/names that appear in the snapshot output.
- If a click or fill returns a locator error, call snapshot() again and re-plan using
  only the roles and names in that fresh snapshot — do not repeat the failed selector.
- Assertions must produce binary outcomes: passed or failed, with evidence.

## Action protocol (IMPORTANT)
You interact with the browser by calling exactly ONE tool per turn. Reply with a
single JSON object and NOTHING else — no prose, no markdown fences around it:

  { "tool": "<tool name>", "input": { <parameters> } }

Examples:
  { "tool": "snapshot", "input": {} }
  { "tool": "fill", "input": { "selector": "getByLabel('Email address')", "value": "admin@shop.com" } }
  { "tool": "done", "input": { "summary": "...", "passed": true } }

After each action you receive the result as the next user message, then you decide
the next single action. The available tools and their parameters are listed below.

## 'done' summary format
When calling 'done', the summary must include:
  1. Each assertion that was checked
  2. The actual value observed
  3. Whether it matched the expectation
`

// ── Task prompt builders ──────────────────────────────────────────────────────

export interface TaskContext {
  baseUrl: string
  credentials?: { email: string; password: string }
}

const ctx: TaskContext = {
  baseUrl: 'http://localhost:5173',
  credentials: { email: 'admin@shop.com', password: 'password123' },
}

export const tasks = {
  /** Verify unauthenticated redirect */
  authRedirect: () => `
Goal: Verify that navigating to ${ctx.baseUrl}/dashboard without being logged in
redirects to ${ctx.baseUrl}/login.

Start at: ${ctx.baseUrl}/dashboard
Assert: URL contains "/login"
Assert: Login form is visible
`,

  /** Full login flow */
  loginFlow: () => `
Goal: Log in to ${ctx.baseUrl} and confirm the dashboard is accessible.

Credentials: ${ctx.credentials!.email} / ${ctx.credentials!.password}

Steps to verify:
1. Navigate to ${ctx.baseUrl}/login
2. Fill email and password fields
3. Click Sign In
4. Assert URL contains "/dashboard"
5. Assert a heading with text "Dashboard" is visible
6. Assert the navbar shows the user email "${ctx.credentials!.email}"
`,

  /** Products search */
  productSearch: (query: string, expectedCount: number) => `
Goal: Verify the product search on the products page filters correctly.

Note: ${ctx.baseUrl}/products requires authentication — visiting it while logged
out redirects to /login. You MUST log in first, then navigate to /products.

Steps to verify:
1. Navigate to ${ctx.baseUrl}/login and log in with ${ctx.credentials!.email} / ${ctx.credentials!.password}
2. Navigate to ${ctx.baseUrl}/products and confirm there are 15 products in the initial list
3. Type "${query}" into the search input
4. Assert the table shows exactly ${expectedCount} rows
5. Assert the footer text says "Showing ${expectedCount} of 15 products"
`,

  /** E2E: login → navigate → search ──────────────────────────────────────── */
  fullEcommerce: () => `
Goal: Complete an end-to-end verification of the web-detective ecommerce app.

Steps:
1. Navigate to ${ctx.baseUrl} (should redirect to /login)
2. Log in with ${ctx.credentials!.email} / ${ctx.credentials!.password}
3. Verify dashboard loads with stat cards (Total Revenue, Total Orders, Customers, Avg Order Value)
4. Navigate to the Products page via the navbar
5. Verify 15 products are listed
6. Search for "Electronics" — verify at least 5 results appear
7. Clear the search — verify all 15 products return
8. Log out via the Logout button
9. Verify redirect to /login

All 9 steps must pass for the overall goal to be considered achieved.
`,
}

/**
 * WORKSHOP TASKS (Chapter 5 hands-on):
 *
 * Task A — Add a logout task prompt and verify the agent can execute it:
 *   Add to the tasks object:
 *     logout: () => `
 *       Goal: Log out of the app and confirm the session is cleared.
 *       Pre-condition: logged in as ${ctx.credentials!.email}
 *       Steps: click Logout → assert URL contains "/login" → assert login form visible
 *     `
 *   Then run: agent.run(tasks.logout())
 *
 * Task B — Harden the system prompt against hallucinated selectors:
 *   Add this rule to SYSTEM_PROMPT:
 *     "If fill() or click() fails with a locator error, immediately call snapshot()
 *      and re-plan using only selectors visible in the new snapshot."
 *   Deliberately pass a bad selector to fill() and observe whether the agent
 *   self-corrects on the next turn.
 *
 * Task C — Make the summary format machine-readable:
 *   Change the "Output format" section of SYSTEM_PROMPT so the done() summary
 *   must be valid JSON: { "assertions": [...], "passed": true/false }
 *   Update agent.ts to JSON.parse the summary and surface individual assertion results.
 *
 * Task D — Measure local model latency across a multi-task run:
 *   Run three tasks back-to-back in the same process:
 *     for (const task of [tasks.authRedirect(), tasks.loginFlow(), tasks.productSearch('TV', 2)]) {
 *       await agent.run(task)
 *     }
 *   The first turn is slow while Ollama loads deepseek-r1 into memory; later turns
 *   are faster once the model is warm. Log durationMs per run and confirm the warm-up cost.
 */
