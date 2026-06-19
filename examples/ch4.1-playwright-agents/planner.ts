/**
 * CH4.1 — PLAYWRIGHT AGENTS: PLANNER + GENERATOR
 *
 * Mirrors Playwright's built-in Planner and Generator agents.
 *
 * Playwright ships three built-in AI agents, initialized with:
 *   npx playwright init-agents --loop=claude
 *
 *   • Planner   — explores the running app, produces a Markdown test plan (specs/)
 *   • Generator — transforms plans into runnable Playwright test files (tests/)
 *   • Healer    — executes tests, auto-repairs failures, re-runs until green
 *
 * This file implements Planner and Generator programmatically so you can see
 * the internals and wire them into any pipeline.
 *
 * Planner loop:
 *   1. Launch browser, seed login, navigate each route
 *   2. Capture ariaSnapshot of each page (capped for token budget)
 *   3. Ask Claude to emit a structured Markdown test plan
 *   4. Save plan to specs/<name>.md
 *
 * Generator loop:
 *   1. Read plan from specs/<name>.md
 *   2. Ask Claude to emit runnable Playwright TypeScript test code
 *   3. Lint for potentially hallucinated CSS selectors
 *   4. Write test file to tests/generated/<name>.spec.ts
 *
 * Run: ANTHROPIC_API_KEY=sk-... npx ts-node examples/ch4.1-playwright-agents/planner.ts
 */
import Anthropic from '@anthropic-ai/sdk'
import { chromium, type Page } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'

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
  private readonly client: Anthropic

  constructor(apiKey?: string) {
    this.client = new Anthropic({ apiKey })
  }

  /**
   * Explore the app at baseUrl, produce a Markdown test plan, and save it.
   */
  async plan(baseUrl: string, routes: string[], planName: string): Promise<PlannerResult> {
    const snapshots = await this.exploreRoutes(baseUrl, routes)
    const markdown = await this.generatePlan(planName, snapshots)
    const planPath = this.writePlan(planName, markdown)
    return { planPath, markdown, snapshots }
  }

  // ── Exploration ──────────────────────────────────────────────────────────

  private async exploreRoutes(baseUrl: string, routes: string[]): Promise<PageSnapshot[]> {
    const browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({ baseURL: baseUrl })
    const page = await context.newPage()

    await this.seedLogin(page, baseUrl)

    const snapshots: PageSnapshot[] = []
    for (const route of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(400)

      snapshots.push({
        route,
        title: await page.title(),
        ariaTree: (await page.locator('body').ariaSnapshot()).slice(0, 3000),
      })

      console.log(`  [planner] Snapshotted ${route}`)
    }

    await browser.close()
    return snapshots
  }

  private async seedLogin(page: Page, baseUrl: string): Promise<void> {
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' })
    await page.getByLabel(/email address/i).fill('admin@shop.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/dashboard')
  }

  // ── LLM: plan generation ─────────────────────────────────────────────────

  private async generatePlan(planName: string, snapshots: PageSnapshot[]): Promise<string> {
    const snapshotBlock = snapshots
      .map(s => `### ${s.route} — ${s.title}\n\`\`\`\n${s.ariaTree}\n\`\`\``)
      .join('\n\n')

    const response = await this.client.messages.create({
      model: process.env.WORKSHOP_MODEL ?? 'claude-haiku-4-5',
      max_tokens: 2048,
      system: `You are a Playwright test planning agent. Given accessibility snapshots of a
web application, produce a structured Markdown test plan.

Format each test case as:
## <Feature Area>
### <Test Name>
- **Steps**: numbered action steps
- **Expected**: what should be true after each step
- **Selectors hint**: ARIA locators observed in the snapshot

Cover happy paths, edge cases, and key user journeys. Be concise but precise —
this plan feeds directly into a code generator that must produce runnable tests.`,
      messages: [
        {
          role: 'user',
          content: `App: ${planName}
Generate a Playwright test plan covering all pages below.

${snapshotBlock}`,
        },
      ],
    })

    return response.content[0].type === 'text' ? response.content[0].text : ''
  }

  // ── Persistence ──────────────────────────────────────────────────────────

  private writePlan(planName: string, markdown: string): string {
    const dir = path.resolve('./specs')
    fs.mkdirSync(dir, { recursive: true })
    const planPath = path.join(dir, `${planName}.md`)
    fs.writeFileSync(planPath, markdown, 'utf-8')
    console.log(`  [planner] Saved plan → ${planPath}`)
    return planPath
  }
}

// ── Generator ─────────────────────────────────────────────────────────────────

export class TestGeneratorAgent {
  private readonly client: Anthropic

  constructor(apiKey?: string) {
    this.client = new Anthropic({ apiKey })
  }

  /**
   * Read a plan from specs/<name>.md, emit Playwright test code, write to tests/generated/.
   */
  async generate(planName: string): Promise<GeneratorResult> {
    const planPath = path.resolve(`./specs/${planName}.md`)
    if (!fs.existsSync(planPath)) throw new Error(`Plan not found: ${planPath}`)

    const plan = fs.readFileSync(planPath, 'utf-8')
    const code = await this.generateCode(planName, plan)
    const selectorWarnings = this.lintSelectors(code)
    const testPath = this.writeTest(planName, code)

    return { testPath, code, selectorWarnings }
  }

  // ── LLM: code generation ─────────────────────────────────────────────────

  private async generateCode(planName: string, plan: string): Promise<string> {
    const response = await this.client.messages.create({
      model: process.env.WORKSHOP_MODEL ?? 'claude-haiku-4-5',
      max_tokens: 4096,
      system: `You are a Playwright test code generator. Convert a Markdown test plan into
runnable TypeScript Playwright tests.

Rules:
- Import from '@playwright/test' (not a custom fixtures path)
- Use ARIA locators: getByRole, getByLabel, getByText, getByPlaceholder
- Group tests with test.describe matching the plan's ## headings
- Each ### test case becomes one test() block
- Add await page.waitForLoadState('domcontentloaded') after navigation
- Use baseURL 'http://localhost:5173' in the config or page.goto calls
- Return ONLY the TypeScript code, no markdown fences, no explanation`,
      messages: [
        {
          role: 'user',
          content: `Convert this test plan for "${planName}" into Playwright TypeScript tests:\n\n${plan}`,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const fenced = text.match(/```(?:typescript|ts)?\n([\s\S]*?)```/)
    return fenced ? fenced[1].trim() : text.trim()
  }

  // ── Selector lint ────────────────────────────────────────────────────────

  /**
   * Flag CSS selectors the LLM may have invented instead of using ARIA.
   * These aren't guaranteed broken, but are worth reviewing before committing.
   */
  private lintSelectors(code: string): string[] {
    const cssPattern = /\.locator\(['"]([.#][^'"]+)['"]\)/g
    const warnings: string[] = []
    let match: RegExpExecArray | null

    while ((match = cssPattern.exec(code)) !== null) {
      warnings.push(`CSS selector (consider ARIA alternative): ${match[1]}`)
    }

    return warnings
  }

  // ── Persistence ──────────────────────────────────────────────────────────

  private writeTest(planName: string, code: string): string {
    const dir = path.resolve('./tests/generated')
    fs.mkdirSync(dir, { recursive: true })
    const testPath = path.join(dir, `${planName}.spec.ts`)
    fs.writeFileSync(testPath, code, 'utf-8')
    console.log(`  [generator] Saved test → ${testPath}`)
    return testPath
  }
}

// ── CLI entrypoint ────────────────────────────────────────────────────────────

void (async () => {
  const planner = new TestPlannerAgent(process.env.ANTHROPIC_API_KEY)
  const generator = new TestGeneratorAgent(process.env.ANTHROPIC_API_KEY)

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
 *   ANTHROPIC_API_KEY=sk-... npx ts-node examples/ch4.1-playwright-agents/planner.ts
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