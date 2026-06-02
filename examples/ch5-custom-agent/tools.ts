/**
 * CH5 — TOOL REGISTRY
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

export const AGENT_TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: 'navigate',
    description: 'Navigate the browser to a URL or path.',
    input_schema: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: 'Absolute URL or relative path (e.g. /login)' },
      },
      required: ['url'],
    },
  },
  {
    name: 'click',
    description: 'Click an element. Prefer ARIA-based selectors.',
    input_schema: {
      type: 'object' as const,
      properties: {
        selector: { type: 'string', description: 'Playwright selector' },
        description: { type: 'string', description: 'Human-readable description of what you are clicking' },
      },
      required: ['selector', 'description'],
    },
  },
  {
    name: 'fill',
    description: 'Type text into an input field.',
    input_schema: {
      type: 'object' as const,
      properties: {
        selector: { type: 'string', description: 'Playwright selector for the input' },
        value: { type: 'string', description: 'Text to type' },
      },
      required: ['selector', 'value'],
    },
  },
  {
    name: 'assert_url',
    description: 'Verify the current URL contains the expected string.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contains: { type: 'string', description: 'String the URL must contain' },
      },
      required: ['contains'],
    },
  },
  {
    name: 'assert_visible',
    description: 'Verify an element is visible on the page.',
    input_schema: {
      type: 'object' as const,
      properties: {
        selector: { type: 'string', description: 'Playwright selector' },
        description: { type: 'string', description: 'What you expect to see' },
      },
      required: ['selector', 'description'],
    },
  },
  {
    name: 'assert_text',
    description: 'Verify an element contains the expected text.',
    input_schema: {
      type: 'object' as const,
      properties: {
        selector: { type: 'string', description: 'Playwright selector' },
        expected: { type: 'string', description: 'Text the element must contain' },
      },
      required: ['selector', 'expected'],
    },
  },
  {
    name: 'snapshot',
    description: 'Capture the accessibility tree of the current page. Use this to understand page structure before acting.',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'screenshot',
    description: 'Take a screenshot. Use when you need visual confirmation of page state.',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'done',
    description: 'Signal that the goal has been achieved. Provide a summary of what was verified.',
    input_schema: {
      type: 'object' as const,
      properties: {
        summary: { type: 'string', description: 'What was accomplished and what assertions passed' },
        passed: { type: 'boolean', description: 'Did all assertions pass?' },
      },
      required: ['summary', 'passed'],
    },
  },
]

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
