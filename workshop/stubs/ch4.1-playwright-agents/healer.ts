// @ts-nocheck
/**
 * CH4.1 EXERCISE STUB — PLAYWRIGHT AGENTS: HEALER
 *
 * This is the Chapter 4.1 workshop exercise file. The method bodies have been
 * removed — you implement them live during the workshop.
 *
 * For the full reference implementation:
 *   git checkout solutions
 * and see SOLUTIONS.md.
 *
 * Mirrors Playwright's built-in Healer agent: when generated tests fail, the
 * healer replays each failing test, inspects the current UI, rewrites the
 * broken test block, and re-runs the suite — repeating until green or giving up.
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
    throw new Error('TODO: implement in Chapter 4.1')
  }

  // ── Test runner ──────────────────────────────────────────────────────────

  private runTests(testFile: string): { passed: boolean; failures: TestFailure[] } {
    throw new Error('TODO: implement in Chapter 4.1')
  }

  private parseFailures(jsonOutput: string): TestFailure[] {
    throw new Error('TODO: implement in Chapter 4.1')
  }

  // ── Source manipulation ───────────────────────────────────────────────────

  private extractTestBlock(filePath: string, testName: string): string {
    throw new Error('TODO: implement in Chapter 4.1')
  }

  private applyPatch(filePath: string, original: string, fixed: string): void {
    throw new Error('TODO: implement in Chapter 4.1')
  }

  // ── Live DOM snapshot at the point of failure ─────────────────────────────

  private async liveSnapshot(baseUrl: string, _filePath: string): Promise<string> {
    throw new Error('TODO: implement in Chapter 4.1')
  }

  // ── LLM: test repair ─────────────────────────────────────────────────────

  private async repairTest(failure: TestFailure, liveSnapshot: string): Promise<string | null> {
    throw new Error('TODO: implement in Chapter 4.1')
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
