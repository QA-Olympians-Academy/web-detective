/**
 * CH4.1 — PLAYWRIGHT AGENTS: HEALER
 *
 * Mirrors Playwright's built-in Healer agent: when generated tests fail, the
 * healer replays each failing test, inspects the current UI, rewrites the
 * broken test block, and re-runs the suite — repeating until green or giving up.
 *
 * How this differs from the selector-level healer in CH4:
 *   CH4 Healer    — fixes one broken locator string, persists to LocatorStore
 *   CH4.1 Healer  — rewrites an entire test() block in the source file,
 *                   then re-runs the suite to verify the patch
 *
 * Healer loop (up to MAX_ROUNDS):
 *   1. Run the test file, capture Playwright JSON output
 *   2. Parse each failing test name + error message
 *   3. Extract the failing test() block from source
 *   4. Ask Claude to rewrite that block given the error and a fresh ariaSnapshot
 *   5. Apply the patch in-place and proceed to the next round
 *
 * Run: ANTHROPIC_API_KEY=sk-... npx ts-node examples/ch4.1-playwright-agents/healer.ts
 */
import Anthropic from '@anthropic-ai/sdk'
import { chromium } from 'playwright'
import { spawnSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TestFailure {
  file: string
  testName: string
  error: string
  snippet: string
}

export interface HealRound {
  round: number
  failures: TestFailure[]
  patched: string[]
  allPassed: boolean
}

// ── Internal Playwright JSON reporter shape ───────────────────────────────────

interface PWSpec {
  title: string
  file: string
  tests: Array<{
    results: Array<{ status: string; error?: { message: string } }>
  }>
}

interface PWReport {
  suites: Array<{ specs: PWSpec[] }>
}

// ── Healer ────────────────────────────────────────────────────────────────────

const MAX_ROUNDS = 3

export class TestHealerAgent {
  private readonly client: Anthropic

  constructor(apiKey?: string) {
    this.client = new Anthropic({ apiKey })
  }

  /**
   * Run the test file, repair failures, repeat until green or MAX_ROUNDS exceeded.
   */
  async heal(testFile: string, baseUrl: string): Promise<HealRound[]> {
    const rounds: HealRound[] = []

    for (let round = 1; round <= MAX_ROUNDS; round++) {
      console.log(`\n── Heal round ${round}/${MAX_ROUNDS} ─────────────────────────────────`)

      const { passed, failures } = this.runTests(testFile)

      if (passed) {
        rounds.push({ round, failures: [], patched: [], allPassed: true })
        console.log('  ✓ All tests passing')
        break
      }

      console.log(`  ✗ ${failures.length} test(s) failing`)
      const patched: string[] = []

      for (const failure of failures) {
        const snapshot = await this.liveSnapshot(baseUrl, failure.file)
        const fixed = await this.repairTest(failure, snapshot)

        if (fixed) {
          this.applyPatch(failure.file, failure.snippet, fixed)
          patched.push(failure.testName)
          console.log(`  ✓ Patched: ${failure.testName}`)
        } else {
          console.warn(`  ✗ Could not patch: ${failure.testName}`)
        }
      }

      rounds.push({ round, failures, patched, allPassed: false })
      if (patched.length === 0) break  // no progress — bail out
    }

    return rounds
  }

  // ── Test runner ──────────────────────────────────────────────────────────

  private runTests(testFile: string): { passed: boolean; failures: TestFailure[] } {
    const result = spawnSync(
      'npx',
      ['playwright', 'test', testFile, '--reporter=json'],
      { encoding: 'utf-8', stdio: 'pipe' },
    )

    if (result.status === 0) return { passed: true, failures: [] }
    return { passed: false, failures: this.parseFailures(result.stdout) }
  }

  private parseFailures(jsonOutput: string): TestFailure[] {
    let report: PWReport
    try {
      report = JSON.parse(jsonOutput) as PWReport
    } catch {
      return []
    }

    const failures: TestFailure[] = []
    for (const suite of report.suites ?? []) {
      for (const spec of suite.specs ?? []) {
        const isFailed = spec.tests.some(t =>
          t.results.some(r => r.status === 'failed'),
        )
        if (!isFailed) continue

        const error =
          spec.tests
            .flatMap(t => t.results)
            .find(r => r.error)
            ?.error?.message ?? ''

        failures.push({
          file: spec.file,
          testName: spec.title,
          error,
          snippet: this.extractTestBlock(spec.file, spec.title),
        })
      }
    }
    return failures
  }

  // ── Source manipulation ───────────────────────────────────────────────────

  private extractTestBlock(filePath: string, testName: string): string {
    if (!fs.existsSync(filePath)) return ''
    const source = fs.readFileSync(filePath, 'utf-8')
    const escaped = testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(
      `test\\((['"\`])${escaped}\\1[\\s\\S]*?\\n\\}\\)`,
      'm',
    )
    return source.match(pattern)?.[0] ?? ''
  }

  private applyPatch(filePath: string, original: string, fixed: string): void {
    if (!original || !fs.existsSync(filePath)) return
    const source = fs.readFileSync(filePath, 'utf-8')
    fs.writeFileSync(filePath, source.replace(original, fixed), 'utf-8')
  }

  // ── Live DOM snapshot at the point of failure ─────────────────────────────

  private async liveSnapshot(baseUrl: string, _filePath: string): Promise<string> {
    const browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({ baseURL: baseUrl })
    const page = await context.newPage()

    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
    const snapshot = (await page.locator('body').ariaSnapshot()).slice(0, 3000)

    await browser.close()
    return snapshot
  }

  // ── LLM: test repair ─────────────────────────────────────────────────────

  private async repairTest(failure: TestFailure, liveSnapshot: string): Promise<string | null> {
    if (!failure.snippet) return null

    const response = await this.client.messages.create({
      model: process.env.WORKSHOP_MODEL ?? 'claude-haiku-4-5',
      max_tokens: 1024,
      system: `You are a Playwright test healer. You receive a failing test() block, its
error message, and the current accessibility tree of the page.

Rewrite the test to fix the failure.

Rules:
- Prefer ARIA locators: getByRole, getByLabel, getByText, getByPlaceholder
- Replace broken CSS selectors with stable ARIA equivalents from the snapshot
- Add waitForLoadState() or waitForSelector() if the error suggests a timing issue
- Return ONLY the fixed test() block — same outer structure, no markdown fences
- Keep the original test name string unchanged`,
      messages: [
        {
          role: 'user',
          content: `Failing test:
\`\`\`typescript
${failure.snippet}
\`\`\`

Error:
${failure.error}

Current page accessibility tree:
${liveSnapshot}

Return the fixed test() block.`,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const fenced = text.match(/```(?:typescript|ts)?\n([\s\S]*?)```/)
    const block = (fenced ? fenced[1].trim() : text.trim())
    return block.startsWith('test(') ? block : null
  }
}

// ── CLI entrypoint ────────────────────────────────────────────────────────────

void (async () => {
  const healer = new TestHealerAgent(process.env.ANTHROPIC_API_KEY)

  const testFile = path.resolve('./tests/generated/web-detective.spec.ts')
  if (!fs.existsSync(testFile)) {
    console.error(`No generated test found at ${testFile}`)
    console.error('Run planner.ts first to generate the test file.')
    process.exit(1)
  }

  console.log('\n── Healer — repairing generated tests ─────────────────────\n')
  const rounds = await healer.heal(testFile, 'http://localhost:5173')

  console.log('\n── Summary ─────────────────────────────────────────────────')
  for (const r of rounds) {
    const status = r.allPassed ? 'all green ✓' : `${r.patched.length}/${r.failures.length} patched`
    console.log(`  Round ${r.round}: ${status}`)
  }

  const finalPassed = rounds.at(-1)?.allPassed ?? false
  console.log(`\nFinal status: ${finalPassed ? 'PASSED ✓' : 'FAILED ✗'}`)
})()

/**
 * WORKSHOP TASKS (Chapter 4.1 hands-on):
 *
 * Pre-requisite: run planner.ts first to generate tests/generated/web-detective.spec.ts.
 *
 * Task A — Introduce a deliberate failure, watch the healer fix it:
 *   Open tests/generated/web-detective.spec.ts.
 *   Change one getByRole() call to a broken selector like page.locator('.gone').
 *   Run this file — observe the healer extract the block, ask Claude, and patch it.
 *
 * Task B — Compare the two healing strategies:
 *   CH4 healer targets broken selector strings stored in LocatorStore.
 *   CH4.1 healer rewrites whole test() blocks in generated test source files.
 *   When would each strategy be appropriate?
 *
 * Task C — Use Playwright's built-in Healer agent:
 *   npx playwright init-agents --loop=claude
 *   Then in Claude Code: "Heal the failing tests in tests/generated/"
 *   Compare its patches to what this programmatic healer produces.
 *
 * Task D — Guard against infinite loops:
 *   What happens if Claude's patch introduces a new failure?
 *   Add a check that rejects patches that re-introduce the same error message.
 */