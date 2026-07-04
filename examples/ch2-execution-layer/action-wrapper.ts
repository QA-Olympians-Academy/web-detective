// @ts-nocheck
/**
 * CH2 — ACTION WRAPPER  (WORKSHOP EXERCISE STUB)
 *
 * This is the Chapter 2 exercise file. The method bodies are intentionally
 * left unimplemented — you will fill them in live during the workshop.
 *
 * Goal: wrap Playwright's Page into a typed, loggable action vocabulary that
 * an LLM can call without knowing anything about Playwright internals.
 *
 * For the full reference implementation:
 *   git checkout solutions
 * and read SOLUTIONS.md.
 */
import { type Page, type Locator } from '@playwright/test'

// ── Result types ──────────────────────────────────────────────────────────────

export interface ActionResult {
  ok: boolean
  action: string
  target?: string
  value?: string
  error?: string
  durationMs: number
  timestamp: string
}

export interface PageSnapshot {
  url: string
  title: string
  accessibilityTree: string   // text representation for LLM reasoning
  screenshot?: Buffer
}

// ── Logger (pluggable) ────────────────────────────────────────────────────────

export interface ActionLogger {
  log(result: ActionResult): void
}

const consoleLogger: ActionLogger = {
  log(result) {
    // TODO: implement in Chapter 2
    throw new Error('TODO: implement in Chapter 2')
  },
}

// ── Action Wrapper ────────────────────────────────────────────────────────────

export class ActionWrapper {
  private log: ActionResult[] = []

  constructor(
    private readonly page: Page,
    private readonly logger: ActionLogger = consoleLogger,
  ) {}

  // ── Navigation ──────────────────────────────────────────────────────────────

  async navigate(url: string): Promise<ActionResult> {
    throw new Error('TODO: implement in Chapter 2')
  }

  // ── Interaction ─────────────────────────────────────────────────────────────

  async click(selector: string): Promise<ActionResult> {
    throw new Error('TODO: implement in Chapter 2')
  }

  async fill(selector: string, value: string): Promise<ActionResult> {
    throw new Error('TODO: implement in Chapter 2')
  }

  async select(selector: string, value: string): Promise<ActionResult> {
    throw new Error('TODO: implement in Chapter 2')
  }

  // ── Assertions ──────────────────────────────────────────────────────────────

  async assertVisible(selector: string): Promise<ActionResult> {
    throw new Error('TODO: implement in Chapter 2')
  }

  async assertText(selector: string, expected: string): Promise<ActionResult> {
    throw new Error('TODO: implement in Chapter 2')
  }

  async assertUrl(pattern: string): Promise<ActionResult> {
    throw new Error('TODO: implement in Chapter 2')
  }

  // ── Observation ─────────────────────────────────────────────────────────────

  async snapshot(): Promise<PageSnapshot> {
    throw new Error('TODO: implement in Chapter 2')
  }

  async screenshot(): Promise<Buffer> {
    throw new Error('TODO: implement in Chapter 2')
  }

  // ── Audit log ────────────────────────────────────────────────────────────────

  getLog(): ActionResult[] {
    throw new Error('TODO: implement in Chapter 2')
  }

  printSummary(): void {
    throw new Error('TODO: implement in Chapter 2')
  }

  // ── Internals ────────────────────────────────────────────────────────────────

  private resolve(selector: string): Locator {
    throw new Error('TODO: implement in Chapter 2')
  }

  private async run(
    action: string,
    target: string,
    fn: () => Promise<void>,
    value?: string,
  ): Promise<ActionResult> {
    throw new Error('TODO: implement in Chapter 2')
  }
}

// ── Usage example (workshop hands-on) ────────────────────────────────────────

/**
 * WORKSHOP TASK (Chapter 2 hands-on):
 *
 * Run this function inside a Playwright test to see structured action logs:
 *
 *   const wrapper = new ActionWrapper(page)
 *   await wrapper.navigate('http://localhost:5173/login')
 *   await wrapper.fill('label:Email address', 'admin@shop.com')
 *   await wrapper.fill('label:Password', 'password123')
 *   await wrapper.click('role:button[name=Sign In]')
 *   await wrapper.assertUrl('/dashboard')
 *   wrapper.printSummary()
 *
 * The getLog() output is what you feed to an LLM when asking it to
 * diagnose a failure or plan the next step.
 */
