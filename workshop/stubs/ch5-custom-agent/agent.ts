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
 *   • Claude (via Anthropic SDK) for planning and reasoning
 *   • Playwright for browser control
 *   • Prompt caching to keep multi-step runs fast and cost-efficient
 *
 * Run:  ANTHROPIC_API_KEY=sk-... npx ts-node examples/ch5-custom-agent/agent.ts
 */
import Anthropic from '@anthropic-ai/sdk'
import { chromium, type Page } from 'playwright'
import { AGENT_TOOLS, type ToolName } from './tools'
import { SYSTEM_PROMPT, tasks } from './prompts'

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

// ── Agent ─────────────────────────────────────────────────────────────────────

export class WebTestAgent {
  private readonly client: Anthropic
  private page: Page | null = null
  private steps: StepLog[] = []

  constructor(apiKey?: string) {
    this.client = new Anthropic({ apiKey })
  }

  async run(goal: string): Promise<AgentRun> {
    throw new Error('TODO: implement in Chapter 5')
  }

  // ── Reasoning loop ────────────────────────────────────────────────────────

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
  const agent = new WebTestAgent(process.env.ANTHROPIC_API_KEY)

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
 * Task C — Swap the model to claude-opus-4-7 via OpenRouter:
 *   Change the Anthropic base_url to https://openrouter.ai/api/v1
 *   and set the model to "anthropic/claude-opus-4-7".
 */
