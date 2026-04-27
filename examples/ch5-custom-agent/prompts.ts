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
- Always call snapshot() first to understand the current page state.
- Plan your next action based on what the snapshot reveals — do NOT guess selectors.
- Prefer ARIA-based selectors: getByRole, getByLabel, getByText, getByPlaceholder.
- If an assertion fails, take a screenshot and report clearly what you observed vs. what was expected.
- Never navigate away from a page mid-assertion unless the goal requires it.

## Action constraints
- Use the 'done' tool as soon as the goal is achieved or definitively failed.
- Do not loop more than 15 tool calls — if the goal is not met by then, call done(passed: false).
- Do not invent selectors — use only what appears in the snapshot output.
- Assertions must produce binary outcomes: passed or failed, with evidence.

## Output format
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

Pre-condition: Logged in as ${ctx.credentials!.email}
Start at: ${ctx.baseUrl}/products

Steps to verify:
1. Confirm there are 15 products in the initial list
2. Type "${query}" into the search input
3. Assert the table shows exactly ${expectedCount} rows
4. Assert the footer text says "Showing ${expectedCount} of 15 products"
`,

  /** E2E: login → navigate → search ────────────────────────────────────────── */
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
