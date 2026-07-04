// @ts-nocheck
/**
 * CH5 — SYSTEM & TASK PROMPTS (WORKSHOP STUB)
 *
 * This is the Chapter 5 exercise file. Author the prompts live during the
 * workshop. The full reference implementation is available via:
 *   git checkout solutions
 * and is documented in SOLUTIONS.md.
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

// TODO: write the system prompt — define the agent's identity, reasoning style,
//       action constraints, and output format. Implement in Chapter 5.
export const SYSTEM_PROMPT = 'TODO: write the system prompt'

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
  authRedirect: (): string => 'TODO: write the authRedirect task prompt',

  /** Full login flow */
  loginFlow: (): string => 'TODO: write the loginFlow task prompt',

  /** Products search */
  productSearch: (query: string, expectedCount: number): string =>
    'TODO: write the productSearch task prompt',

  /** E2E: login → navigate → search ──────────────────────────────────────── */
  fullEcommerce: (): string => 'TODO: write the fullEcommerce task prompt',
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
 * Task D — Measure prompt cache hit rate across a multi-task run:
 *   Run three tasks back-to-back in the same process:
 *     for (const task of [tasks.authRedirect(), tasks.loginFlow(), tasks.productSearch('TV', 2)]) {
 *       await agent.run(task)
 *     }
 *   Add console.log of response.usage.cache_read_input_tokens after each turn.
 *   Confirm the system prompt is cached after turn 1.
 */
