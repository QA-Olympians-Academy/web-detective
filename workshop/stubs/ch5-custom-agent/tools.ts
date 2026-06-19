// @ts-nocheck
/**
 * CH5 — TOOL REGISTRY (WORKSHOP STUB)
 *
 * This is the Chapter 5 exercise file. Define the tool registry live during
 * the workshop. The full reference implementation is available via:
 *   git checkout solutions
 * and is documented in SOLUTIONS.md.
 *
 * An agent's tools are the only way it interacts with the world.
 * Keeping them small and well-typed prevents the LLM from hallucinating
 * actions that don't exist.
 *
 * Each tool maps to an Anthropic tool_use block with a JSON schema.
 * The agent calls these; the executor (agent.ts) runs them against the browser.
 */
import Anthropic from '@anthropic-ai/sdk'

export type ToolName =
  | 'navigate'
  | 'click'
  | 'fill'
  | 'assert_url'
  | 'assert_visible'
  | 'assert_text'
  | 'snapshot'
  | 'screenshot'
  | 'done'

// ── Tool definitions (passed to Claude as tools array) ────────────────────────

// TODO: define one entry per ToolName above, each with name, description,
//       and a JSON input_schema. Implement in Chapter 5.
export const AGENT_TOOLS: Anthropic.Messages.Tool[] = []

/**
 * WORKSHOP TASKS (Chapter 5 hands-on):
 *
 * Task A — Add a get_text tool that reads element content for use in later assertions:
 *   Add a new entry to AGENT_TOOLS with name 'get_text', input_schema: { selector, description }.
 *   Add 'get_text' to ToolName, then add a case in agent.ts's execute() that calls
 *   p.locator(selector).innerText() and returns the string.
 *   Run the fullEcommerce task — observe whether the agent uses it to read stat card values.
 *
 * Task B — Add a wait_for_visible tool to replace arbitrary sleeps:
 *   Add 'wait_for_visible' with inputs { selector, timeout_ms }.
 *   Wire it to p.locator(selector).waitFor({ state: 'visible', timeout: timeout_ms }).
 *   Add the rule "never use screenshot() to wait for elements — use wait_for_visible"
 *   to SYSTEM_PROMPT and observe whether the agent adopts it.
 *
 * Task C — Extend assert_text with a negation flag:
 *   Add an optional not: boolean property to the assert_text input_schema.
 *   Update the execute() case: when not is true, the assertion passes only if the
 *   text is absent. Write a task that asserts "Invalid credentials" does NOT appear
 *   after a successful login.
 *
 * Task D — Measure tool call frequency across runs:
 *   In agent.ts, after the loop ends, log a breakdown of which tools were called
 *   and how many times: steps.reduce((acc, s) => { acc[s.tool] = (acc[s.tool] ?? 0) + 1 }, {})
 *   Run fullEcommerce twice. Does the agent always call snapshot() the same number of times?
 */
