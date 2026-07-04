// @ts-nocheck
/**
 * CH4.1 EXERCISE STUB — PLAYWRIGHT AGENTS: PLANNER + GENERATOR
 *
 * This is the Chapter 4.1 workshop exercise file. The method bodies have been
 * removed — you implement them live during the workshop.
 *
 * For the full reference implementation:
 *   git checkout solutions
 * and see SOLUTIONS.md.
 *
 * Mirrors Playwright's built-in Planner and Generator agents.
 *
 *   • Planner   — explores the running app, produces a Markdown test plan (specs/)
 *   • Generator — transforms plans into runnable Playwright test files (tests/)
 *
 * The LLM calls run against a local Ollama server (DeepSeek-R1) — no API key.
 *
 * Run: npx ts-node examples/ch4.1-playwright-agents/planner.ts
 *   (requires a local Ollama server with deepseek-r1:8b — see setup/local-llm-setup.md)
 */
import { chromium, type Page } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'
import { complete } from '../shared/ollama'

// ── Types ─────────────────────────────────────────────────────────────────────

interface PageSnapshot {
  route: string
  title: string
  ariaTree: string
}

export interface PlannerResult {
  planPath: string
  markdown: string
  snapshots: PageSnapshot[]
}

export interface GeneratorResult {
  testPath: string
  code: string
  selectorWarnings: string[]
}

// ── Planner ───────────────────────────────────────────────────────────────────

export class TestPlannerAgent {
  /**
   * Explore the app at baseUrl, produce a Markdown test plan, and save it.
   */
  async plan(baseUrl: string, routes: string[], planName: string): Promise<PlannerResult> {
    throw new Error('TODO: implement in Chapter 4.1')
  }

  // ── Exploration ──────────────────────────────────────────────────────────

  private async exploreRoutes(baseUrl: string, routes: string[]): Promise<PageSnapshot[]> {
    throw new Error('TODO: implement in Chapter 4.1')
  }

  private async seedLogin(page: Page, baseUrl: string): Promise<void> {
    throw new Error('TODO: implement in Chapter 4.1')
  }

  // ── LLM: plan generation ─────────────────────────────────────────────────

  private async generatePlan(planName: string, snapshots: PageSnapshot[]): Promise<string> {
    throw new Error('TODO: implement in Chapter 4.1')
  }

  // ── Persistence ──────────────────────────────────────────────────────────

  private writePlan(planName: string, markdown: string): string {
    throw new Error('TODO: implement in Chapter 4.1')
  }
}

// ── Generator ─────────────────────────────────────────────────────────────────

export class TestGeneratorAgent {
  /**
   * Read a plan from specs/<name>.md, emit Playwright test code, write to tests/generated/.
   */
  async generate(planName: string): Promise<GeneratorResult> {
    throw new Error('TODO: implement in Chapter 4.1')
  }

  // ── LLM: code generation ─────────────────────────────────────────────────

  private async generateCode(planName: string, plan: string): Promise<string> {
    throw new Error('TODO: implement in Chapter 4.1')
  }

  // ── Selector lint ────────────────────────────────────────────────────────

  /**
   * Flag CSS selectors the LLM may have invented instead of using ARIA.
   * These aren't guaranteed broken, but are worth reviewing before committing.
   */
  private lintSelectors(code: string): string[] {
    throw new Error('TODO: implement in Chapter 4.1')
  }

  // ── Persistence ──────────────────────────────────────────────────────────

  private writeTest(planName: string, code: string): string {
    throw new Error('TODO: implement in Chapter 4.1')
  }
}

// ── CLI entrypoint ────────────────────────────────────────────────────────────

void (async () => {
  const planner = new TestPlannerAgent()
  const generator = new TestGeneratorAgent()

  console.log('\n── Phase 1: Planner — exploring app ───────────────────────\n')
  const { planPath, markdown } = await planner.plan(
    'http://localhost:5173',
    ['/login', '/dashboard', '/products'],
    'web-detective',
  )
  console.log(`\nPlan (${markdown.split('\n').length} lines) → ${planPath}`)

  console.log('\n── Phase 2: Generator — emitting test code ─────────────────\n')
  const { testPath, selectorWarnings } = await generator.generate('web-detective')

  if (selectorWarnings.length > 0) {
    console.warn('\n  [lint] Selector warnings (review before running):')
    selectorWarnings.forEach(w => console.warn(`    ! ${w}`))
  }

  console.log(`\nTests → ${testPath}`)
  console.log('\nNext: run the generated tests:')
  console.log('  npx playwright test tests/generated/web-detective.spec.ts --ui')
})()

/**
 * WORKSHOP TASKS (Chapter 4.1 hands-on):
 *
 * Task A — Run the full Planner → Generator pipeline against the live app:
 *   npm run dev &   # start the web-detective app
 *   npx ts-node examples/ch4.1-playwright-agents/planner.ts
 *   Inspect specs/web-detective.md — does the plan match what you'd write by hand?
 *
 * Task B — Use Playwright's built-in agents (VS Code / Claude Code):
 *   npx playwright init-agents --loop=claude
 *   This generates .github/ agent definitions for use in Claude Code or VS Code
 *   Copilot Agent mode. Prompt the agent: "Generate a plan for the login flow."
 *
 * Task C — Compare generated vs hand-written tests:
 *   Open tests/generated/web-detective.spec.ts alongside tests/auth.spec.ts.
 *   Where does the LLM prefer ARIA? Where does it fall back to CSS?
 *
 * Task D — Chain with the Healer from ch4:
 *   Break a selector in Login.tsx (rename a CSS class), run the generated test,
 *   then feed the failing key to SelfHealingAgent from ch4 to auto-repair it.
 */
