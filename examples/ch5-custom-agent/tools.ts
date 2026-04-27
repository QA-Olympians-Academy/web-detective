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
