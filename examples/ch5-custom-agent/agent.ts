/**
 * CH5 — CUSTOM WEB TESTING AGENT
 *
 * Orchestrates the observe → plan → act → verify → learn loop using:
 *   • DeepSeek-R1 (via Ollama) for planning and reasoning — runs locally, no API key
 *   • Playwright for browser control
 *
 * DeepSeek-R1 has no native tool-calling, so the agent uses a JSON action protocol
 * (see prompts.ts): each turn the model returns one `{ "tool", "input" }` object,
 * which we parse, execute against the browser, and feed the result back.
 *
 * Run:  npx tsx examples/ch5-custom-agent/agent.ts
 *   (requires a local Ollama server with deepseek-r1:8b pulled — see setup/local-llm-setup.md)
 */
import { chromium, type Page, type Locator } from 'playwright'
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

// Max reasoning turns before the loop gives up. Override with WORKSHOP_MAX_TURNS
// (e.g. WORKSHOP_MAX_TURNS=30) for longer scenarios or a slower local model.
const MAX_TURNS = (() => {
  const raw = process.env.WORKSHOP_MAX_TURNS
  if (!raw) return 15
  const n = Number.parseInt(raw, 10)
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`WORKSHOP_MAX_TURNS must be a positive integer, got "${raw}"`)
  }
  return n
})()
const TOOL_NAMES = new Set<string>(AGENT_TOOLS.map((t) => t.name))

/**
 * Turn the model's selector string into a real Playwright Locator.
 *
 * The agent is told to emit ARIA-first locators (getByRole/getByLabel/…), but a
 * local LLM will phrase them inconsistently. Rather than feed the raw string to
 * page.locator() — which only understands CSS and blows up on "getByText(...)"
 * with "Unexpected token while parsing css selector" — we parse the getBy* form
 * the model actually produced and call the matching Page method. Anything we
 * don't recognise falls back to page.locator() so plain CSS still works.
 */
export function resolveLocator(page: Page, raw: string): Locator {
  const s = raw.trim()

  // getByRole('button', { name: 'Sign In', exact: true })
  const role = s.match(/^getByRole\(\s*['"]([^'"]+)['"]\s*(?:,\s*\{([^}]*)\})?\s*\)$/)
  if (role) {
    const opts: { name?: string; exact?: boolean } = {}
    const body = role[2] ?? ''
    const name = body.match(/name\s*:\s*['"]([^'"]*)['"]/)
    if (name) opts.name = name[1]
    if (/exact\s*:\s*true/.test(body)) opts.exact = true
    return page.getByRole(role[1] as Parameters<Page['getByRole']>[0], opts)
  }

  // getByLabel / getByText / getByPlaceholder / getByTestId / getByTitle / getByAltText('...')
  const single = s.match(/^getBy(Label|Text|Placeholder|TestId|Title|AltText)\(\s*['"]([^'"]*)['"].*\)$/)
  if (single) {
    const arg = single[2]
    switch (single[1]) {
      case 'Label':       return page.getByLabel(arg)
      case 'Text':        return page.getByText(arg)
      case 'Placeholder': return page.getByPlaceholder(arg)
      case 'TestId':      return page.getByTestId(arg)
      case 'Title':       return page.getByTitle(arg)
      case 'AltText':     return page.getByAltText(arg)
    }
  }

  // Not a getBy* form — assume a CSS / Playwright selector string.
  return page.locator(s)
}

// ── Agent ─────────────────────────────────────────────────────────────────────

export class WebTestAgent {
  private page: Page | null = null
  private steps: StepLog[] = []

  async run(goal: string): Promise<AgentRun> {
    const start = Date.now()
    this.steps = []

    // Use the installed Google Chrome (channel) to match playwright.config.ts,
    // so no separate bundled-chromium download is needed.
    const browser = await chromium.launch({
      headless: process.env.HEADED !== '1',
      channel: 'chrome',
    })
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
    // System prompt = identity + constraints + the live tool catalog.
    const system = `${SYSTEM_PROMPT}\n\n## Available tools\n${renderToolCatalog()}`

    // The conversation the model sees. System is prepended on every turn.
    const conversation: ChatMessage[] = [{ role: 'user', content: goal }]

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const { text, promptTokens, outputTokens } = await chat(
        [{ role: 'system', content: system }, ...conversation],
        // DeepSeek-R1 reasons before answering — give it room or content comes back empty.
        { maxTokens: 2048 },
      )

      // Visibility: prompt tokens grow as the conversation (snapshots, results) grows.
      console.log(`  tokens — prompt:${promptTokens} out:${outputTokens} (${MODEL})`)

      conversation.push({ role: 'assistant', content: text })

      const action = extractJson<AgentAction>(text)

      if (!action || !action.tool || !TOOL_NAMES.has(action.tool)) {
        // Model didn't emit a valid action — nudge it back to the protocol.
        conversation.push({
          role: 'user',
          content:
            'That was not a valid action. Reply with ONLY a single JSON object: ' +
            '{ "tool": "<one of the listed tools>", "input": { ... } }',
        })
        continue
      }

      const input = action.input ?? {}

      if (action.tool === 'done') {
        return {
          goal,
          passed: input.passed === true,
          summary: String(input.summary ?? ''),
          toolCalls: turn + 1,
        }
      }

      const result = await this.execute(action.tool, input)
      conversation.push({ role: 'user', content: `Result of ${action.tool}:\n${result}` })
    }

    return {
      goal,
      passed: false,
      summary: `Reached max tool call limit (${MAX_TURNS})`,
      toolCalls: MAX_TURNS,
    }
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
          await resolveLocator(p, input.selector as string).click({ timeout: 5000 })
          result = `Clicked: ${input.description}`
          break
        }
        case 'fill': {
          await resolveLocator(p, input.selector as string).fill(input.value as string)
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
          const visible = await resolveLocator(p, input.selector as string).isVisible({ timeout: 5000 })
          result = visible
            ? `✓ "${input.description}" is visible`
            : `✗ "${input.description}" is NOT visible`
          ok = visible
          break
        }
        case 'assert_text': {
          const text = await resolveLocator(p, input.selector as string).innerText({ timeout: 5000 })
          const matches = text.includes(input.expected as string)
          result = matches
            ? `✓ Element contains "${input.expected}"`
            : `✗ Element text is "${text}", expected to contain "${input.expected}"`
          ok = matches
          break
        }
        case 'snapshot': {
          // An ARIA tree (roles + accessible names) maps directly onto the
          // getByRole/getByText/getByLabel locators the agent is asked to emit —
          // far more useful (and compact) than raw innerHTML for planning.
          result = `Current URL: ${p.url()}\n\nAccessibility tree:\n${(await p.locator('body').ariaSnapshot()).slice(0, 3000)}`
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
// Only run the demo when this file is the entry point — Ch7 imports WebTestAgent
// from here, and we don't want that import to kick off a full agent run.

if (process.argv[1]?.endsWith('agent.ts')) {
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
}

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
 *   WORKSHOP_MODEL=qwen2.5-coder:7b npx tsx examples/ch5-custom-agent/agent.ts
 *   Compare how reliably each model sticks to the single-JSON-action protocol.
 */
