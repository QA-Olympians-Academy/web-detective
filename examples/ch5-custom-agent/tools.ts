/**
 * CH5 — TOOL REGISTRY
 *
 * An agent's tools are the only way it interacts with the world.
 * Keeping them small and well-typed prevents the LLM from hallucinating
 * actions that don't exist.
 *
 * DeepSeek-R1 (via Ollama) doesn't support native tool-calling, so instead of
 * emitting provider-specific tool schemas we describe each tool in plain text and
 * ask the model to reply with a single JSON action:
 *
 *   { "tool": "<name>", "input": { ...params } }
 *
 * The executor (agent.ts) parses that JSON and runs the matching action.
 */

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

/** A single parameter the model must supply for a tool. */
interface ToolParam {
  name: string
  description: string
  required: boolean
}

export interface ToolSpec {
  name: ToolName
  description: string
  params: ToolParam[]
}

// ── Tool definitions (rendered into the system prompt as JSON actions) ─────────

export const AGENT_TOOLS: ToolSpec[] = [
  {
    name: 'navigate',
    description: 'Navigate the browser to a URL or path.',
    params: [
      { name: 'url', description: 'Absolute URL or relative path (e.g. /login)', required: true },
    ],
  },
  {
    name: 'click',
    description: 'Click an element. Prefer ARIA-based selectors.',
    params: [
      { name: 'selector', description: 'Playwright selector', required: true },
      { name: 'description', description: 'Human-readable description of what you are clicking', required: true },
    ],
  },
  {
    name: 'fill',
    description: 'Type text into an input field.',
    params: [
      { name: 'selector', description: 'Playwright selector for the input', required: true },
      { name: 'value', description: 'Text to type', required: true },
    ],
  },
  {
    name: 'assert_url',
    description: 'Verify the current URL contains the expected string.',
    params: [
      { name: 'contains', description: 'String the URL must contain', required: true },
    ],
  },
  {
    name: 'assert_visible',
    description: 'Verify an element is visible on the page.',
    params: [
      { name: 'selector', description: 'Playwright selector', required: true },
      { name: 'description', description: 'What you expect to see', required: true },
    ],
  },
  {
    name: 'assert_text',
    description: 'Verify an element contains the expected text.',
    params: [
      { name: 'selector', description: 'Playwright selector', required: true },
      { name: 'expected', description: 'Text the element must contain', required: true },
    ],
  },
  {
    name: 'snapshot',
    description: 'Capture the accessibility tree of the current page. Use this to understand page structure before acting.',
    params: [],
  },
  {
    name: 'screenshot',
    description: 'Take a screenshot. Use when you need visual confirmation of page state.',
    params: [],
  },
  {
    name: 'done',
    description: 'Signal that the goal has been achieved or definitively failed. Provide a summary of what was verified.',
    params: [
      { name: 'summary', description: 'What was accomplished and what assertions passed', required: true },
      { name: 'passed', description: 'Boolean — did all assertions pass?', required: true },
    ],
  },
]

/**
 * Render the tool registry as a human-readable catalog for the system prompt.
 * DeepSeek reads this to know which actions exist and what parameters each needs.
 */
export function renderToolCatalog(): string {
  return AGENT_TOOLS.map(tool => {
    const params = tool.params.length
      ? tool.params
          .map(p => `      - ${p.name}${p.required ? '' : ' (optional)'}: ${p.description}`)
          .join('\n')
      : '      (no parameters)'
    return `- ${tool.name}: ${tool.description}\n    params:\n${params}`
  }).join('\n')
}

/**
 * WORKSHOP TASKS (Chapter 5 hands-on):
 *
 * Task A — Add a get_text tool that reads element content for use in later assertions:
 *   Add a new entry to AGENT_TOOLS with name 'get_text' and params [selector, description].
 *   Add 'get_text' to ToolName, then add a case in agent.ts's execute() that calls
 *   p.locator(selector).innerText() and returns the string.
 *   Run the fullEcommerce task — observe whether the agent uses it to read stat card values.
 *
 * Task B — Add a wait_for_visible tool to replace arbitrary sleeps:
 *   Add 'wait_for_visible' with params [selector, timeout_ms].
 *   Wire it to p.locator(selector).waitFor({ state: 'visible', timeout: timeout_ms }).
 *   Add the rule "never use screenshot() to wait for elements — use wait_for_visible"
 *   to SYSTEM_PROMPT and observe whether the agent adopts it.
 *
 * Task C — Extend assert_text with a negation flag:
 *   Add an optional 'not' param to the assert_text spec.
 *   Update the execute() case: when not is true, the assertion passes only if the
 *   text is absent. Write a task that asserts "Invalid credentials" does NOT appear
 *   after a successful login.
 *
 * Task D — Measure tool call frequency across runs:
 *   In agent.ts, after the loop ends, log a breakdown of which tools were called
 *   and how many times: steps.reduce((acc, s) => { acc[s.tool] = (acc[s.tool] ?? 0) + 1 }, {})
 *   Run fullEcommerce twice. Does the agent always call snapshot() the same number of times?
 */
