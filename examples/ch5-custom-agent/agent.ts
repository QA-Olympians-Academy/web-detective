/**
 * CH5 — CUSTOM WEB TESTING AGENT
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
    const start = Date.now()
    this.steps = []

    const browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({ baseURL: 'http://localhost:5173' })
    this.page = await context.newPage()

    try {
      const result = await this.loop(goal)
      return { ...result, durationMs: Date.now() - start, steps: this.steps }
    } finally {
      await browser.close()
    }
  }

  // ── Reasoning loop ────────────────────────────────────────────────────────

  private async loop(goal: string): Promise<Omit<AgentRun, 'durationMs' | 'steps'>> {
    const messages: Anthropic.Messages.MessageParam[] = [
      { role: 'user', content: goal },
    ]

    for (let turn = 0; turn < 15; turn++) {
      // Cache the growing conversation tail so each turn reads the prior turns
      // (snapshots, tool results) from cache at ~0.1x instead of full price.
      this.cacheConversation(messages)

      const response = await this.client.messages.create({
        // Tier is configurable: cheap by default for the workshop, override per run.
        model: process.env.WORKSHOP_MODEL ?? 'claude-haiku-4-5',
        max_tokens: 1024,
        // Cache the system prompt + tools — identical on every turn in a run.
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        tools: AGENT_TOOLS,
        messages,
      })

      // Visibility: read climbs each turn once caching is working; fresh stays small.
      const u = response.usage
      console.log(
        `  tokens — fresh:${u.input_tokens} write:${u.cache_creation_input_tokens ?? 0} read:${u.cache_read_input_tokens ?? 0} out:${u.output_tokens}`,
      )

      // Append assistant response to conversation
      messages.push({ role: 'assistant', content: response.content })

      if (response.stop_reason === 'end_turn') {
        return { goal, passed: false, summary: 'Agent stopped without calling done()', toolCalls: turn }
      }

      // Execute all tool calls in this response
      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = []

      for (const block of response.content) {
        if (block.type !== 'tool_use') continue

        const tool = block.name as ToolName
        const input = block.input as Record<string, unknown>

        if (tool === 'done') {
          const summary = input.summary as string
          const passed = input.passed as boolean
          return { goal, passed, summary, toolCalls: turn + 1 }
        }

        const result = await this.execute(tool, input)
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: result,
        })
      }

      // Feed tool results back for next turn
      if (toolResults.length > 0) {
        messages.push({ role: 'user', content: toolResults })
      }
    }

    return { goal, passed: false, summary: 'Reached max tool call limit (15)', toolCalls: 15 }
  }

  // ── Prompt caching ──────────────────────────────────────────────────────────

  /**
   * Mark the last content block of the most recent turn with cache_control so the
   * next request reads the whole conversation prefix from cache. Clearing the prior
   * marker first keeps us within the 4-breakpoint limit as the conversation grows.
   */
  private cacheConversation(messages: Anthropic.Messages.MessageParam[]): void {
    for (const msg of messages) {
      if (typeof msg.content === 'string') continue
      for (const block of msg.content as Array<{ cache_control?: unknown }>) {
        delete block.cache_control
      }
    }
    const last = messages[messages.length - 1]
    if (!last || typeof last.content === 'string' || last.content.length === 0) return
    const tail = last.content[last.content.length - 1] as { cache_control?: { type: 'ephemeral' } }
    tail.cache_control = { type: 'ephemeral' }
  }

  // ── Tool executor ─────────────────────────────────────────────────────────

  private async execute(tool: ToolName, input: Record<string, unknown>): Promise<string> {
    const p = this.page!
    let result = ''
    let ok = true

    try {
      switch (tool) {
        case 'navigate': {
          await p.goto(input.url as string, { waitUntil: 'domcontentloaded' })
          result = `Navigated to ${p.url()}`
          break
        }
        case 'click': {
          await p.locator(input.selector as string).click({ timeout: 5000 })
          result = `Clicked: ${input.description}`
          break
        }
        case 'fill': {
          await p.locator(input.selector as string).fill(input.value as string)
          result = `Filled with: ${input.value}`
          break
        }
        case 'assert_url': {
          const url = p.url()
          const matches = url.includes(input.contains as string)
          result = matches
            ? `✓ URL "${url}" contains "${input.contains}"`
            : `✗ URL "${url}" does NOT contain "${input.contains}"`
          ok = matches
          break
        }
        case 'assert_visible': {
          const visible = await p.locator(input.selector as string).isVisible({ timeout: 5000 })
          result = visible
            ? `✓ "${input.description}" is visible`
            : `✗ "${input.description}" is NOT visible`
          ok = visible
          break
        }
        case 'assert_text': {
          const text = await p.locator(input.selector as string).innerText({ timeout: 5000 })
          const matches = text.includes(input.expected as string)
          result = matches
            ? `✓ Element contains "${input.expected}"`
            : `✗ Element text is "${text}", expected to contain "${input.expected}"`
          ok = matches
          break
        }
        case 'snapshot': {
          result = (await p.locator('body').ariaSnapshot()).slice(0, 3000)
          break
        }
        case 'screenshot': {
          await p.screenshot({ path: `./traces/screenshot-${Date.now()}.png` })
          result = 'Screenshot saved to ./traces/'
          break
        }
        default:
          result = `Unknown tool: ${tool}`
          ok = false
      }
    } catch (err) {
      result = `Error: ${err instanceof Error ? err.message : String(err)}`
      ok = false
    }

    this.steps.push({ tool, input, result, ok })
    console.log(`  ${ok ? '✓' : '✗'} [${tool}] ${result.slice(0, 100)}`)
    return result
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
