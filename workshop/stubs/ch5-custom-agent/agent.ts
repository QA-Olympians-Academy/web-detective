// @ts-nocheck
/**
 * CH5 — CUSTOM WEB TESTING AGENT (WORKSHOP STUB)
 *
 * This is the Chapter 5 exercise file. Implement the method bodies live during
 * the workshop. The full reference implementation is available via:
 *   git checkout solutions
 * and is documented in SOLUTIONS.md.
 *
 * Orchestrates the observe → plan → act → verify → learn loop using:
 *   • DeepSeek-R1 (via Ollama) for planning and reasoning — runs locally, no API key
 *   • Playwright for browser control
 *
 * DeepSeek-R1 has no native tool-calling, so the agent uses a JSON action protocol
 * (see prompts.ts): each turn the model returns one `{ "tool", "input" }` object,
 * which you parse, execute against the browser, and feed the result back.
 *
 * Run:  npx ts-node examples/ch5-custom-agent/agent.ts
 *   (requires a local Ollama server with deepseek-r1:8b — see setup/local-llm-setup.md)
 */
import { chromium, type Page } from 'playwright'
import { AGENT_TOOLS, renderToolCatalog, type ToolName } from './tools'
import { SYSTEM_PROMPT, tasks } from './prompts'
import { chat, extractJson, MODEL, type ChatMessage } from '../shared/ollama'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AgentRun {
  goal: string
  passed: boolean
  summary: string
  toolCalls: number
  durationMs: number
  steps: StepLog[]
}

interface StepLog {
  tool: string
  input: Record<string, unknown>
  result: string
  ok: boolean
}

interface AgentAction {
  tool: ToolName
  input: Record<string, unknown>
}

const MAX_TURNS = 15

// ── Agent ─────────────────────────────────────────────────────────────────────

export class WebTestAgent {
  private page: Page | null = null
  private steps: StepLog[] = []

  async run(goal: string): Promise<AgentRun> {
    throw new Error('TODO: implement in Chapter 5')
  }

  // ── Reasoning loop ────────────────────────────────────────────────────────
  //
  // Build the system prompt (SYSTEM_PROMPT + renderToolCatalog()), keep a growing
  // ChatMessage[] conversation, and each turn: call chat(), extractJson() the action,
  // execute it, and feed the result back as a user message. Stop on the 'done' tool.
  private async loop(goal: string): Promise<Omit<AgentRun, 'durationMs' | 'steps'>> {
    throw new Error('TODO: implement in Chapter 5')
  }

  // ── Tool executor ─────────────────────────────────────────────────────────

  private async execute(tool: ToolName, input: Record<string, unknown>): Promise<string> {
    throw new Error('TODO: implement in Chapter 5')
  }
}

// ── CLI entrypoint ────────────────────────────────────────────────────────────

void (async () => {
  const agent = new WebTestAgent()

  console.log('\n── Running: Full e-commerce verification ──────────────────\n')
  const result = await agent.run(tasks.fullEcommerce())

  console.log('\n── Result ──────────────────────────────────────────────────')
  console.log(`Status  : ${result.passed ? 'PASSED ✓' : 'FAILED ✗'}`)
  console.log(`Steps   : ${result.toolCalls}`)
  console.log(`Duration: ${result.durationMs}ms`)
  console.log(`Summary :\n${result.summary}`)
})()

/**
 * WORKSHOP TASKS (Chapter 5 hands-on):
 *
 * Task A — Run the loginFlow task and observe the reasoning steps:
 *   agent.run(tasks.loginFlow())
 *
 * Task B — Tune the system prompt to fix a hallucinated selector:
 *   Add "When fill() fails, call snapshot() and re-plan" to SYSTEM_PROMPT.
 *
 * Task C — Swap the model without touching agent code:
 *   WORKSHOP_MODEL=qwen2.5-coder:7b npx ts-node examples/ch5-custom-agent/agent.ts
 *   Compare how reliably each model sticks to the single-JSON-action protocol.
 */
