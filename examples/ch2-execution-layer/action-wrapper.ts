/**
 * CH2 — ACTION WRAPPER
 *
 * Wraps Playwright's Page into a typed, loggable action vocabulary that an LLM
 * can call without knowing anything about Playwright internals.
 *
 * Key design goals:
 *   • Every action returns a structured ActionResult — no thrown exceptions
 *     that crash the agent loop.
 *   • Every action is logged with enough context to replay or debug it.
 *   • The vocabulary is intentionally small — LLMs do better with fewer tools.
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
    const status = result.ok ? '✓' : '✗'
    console.log(`${status} [${result.action}] ${result.target ?? ''} ${result.value ?? ''} (${result.durationMs}ms)`)
    if (!result.ok) console.error(`  ↳ ${result.error}`)
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
    return this.run('navigate', url, async () => {
      await this.page.goto(url, { waitUntil: 'domcontentloaded' })
    })
  }

  // ── Interaction ─────────────────────────────────────────────────────────────

  async click(selector: string): Promise<ActionResult> {
    return this.run('click', selector, async () => {
      await this.resolve(selector).click()
    })
  }

  async fill(selector: string, value: string): Promise<ActionResult> {
    return this.run('fill', selector, async () => {
      await this.resolve(selector).fill(value)
    }, value)
  }

  async select(selector: string, value: string): Promise<ActionResult> {
    return this.run('select', selector, async () => {
      await this.resolve(selector).selectOption(value)
    }, value)
  }

  // ── Assertions ──────────────────────────────────────────────────────────────

  async assertVisible(selector: string): Promise<ActionResult> {
    return this.run('assert_visible', selector, async () => {
      await this.resolve(selector).waitFor({ state: 'visible', timeout: 5000 })
    })
  }

  async assertText(selector: string, expected: string): Promise<ActionResult> {
    return this.run('assert_text', selector, async () => {
      const text = await this.resolve(selector).innerText()
      if (!text.includes(expected)) {
        throw new Error(`Expected "${expected}" but got "${text}"`)
      }
    }, expected)
  }

  async assertUrl(pattern: string): Promise<ActionResult> {
    return this.run('assert_url', pattern, async () => {
      // The URL can lag behind the action that triggers it — e.g. an async
      // login followed by a client-side redirect. Reading page.url() straight
      // away races the navigation, so wait for it to match (keeping the same
      // substring/"includes" semantics) before asserting.
      try {
        await this.page.waitForURL((url) => url.href.includes(pattern), { timeout: 5000 })
      } catch {
        throw new Error(`Expected URL to include "${pattern}" but got "${this.page.url()}"`)
      }
    })
  }

  // ── Observation ─────────────────────────────────────────────────────────────

  async snapshot(): Promise<PageSnapshot> {
    const [title, accessibilityTree] = await Promise.all([
      this.page.title(),
      this.page.locator('body').ariaSnapshot(),
    ])
    return {
      url: this.page.url(),
      title,
      accessibilityTree,
    }
  }

  async screenshot(): Promise<Buffer> {
    return this.page.screenshot({ type: 'png' })
  }

  // ── Audit log ────────────────────────────────────────────────────────────────

  getLog(): ActionResult[] {
    return [...this.log]
  }

  printSummary(): void {
    const passed = this.log.filter(r => r.ok).length
    const failed = this.log.filter(r => !r.ok).length
    const total = this.log.reduce((s, r) => s + r.durationMs, 0)
    console.log(`\nSummary: ${passed} passed, ${failed} failed — ${total}ms total`)
  }

  // ── Internals ────────────────────────────────────────────────────────────────

  private resolve(selector: string): Locator {
    // Prefer ARIA selectors when the selector looks semantic
    if (selector.startsWith('role:')) {
      const [, roleAndName] = selector.split(':')
      const [role, name] = roleAndName.split('[name=')
      return this.page.getByRole(role as Parameters<Page['getByRole']>[0], {
        name: name?.replace(/"]$/, ''),
      })
    }
    if (selector.startsWith('label:')) {
      return this.page.getByLabel(selector.slice(6))
    }
    if (selector.startsWith('text:')) {
      return this.page.getByText(selector.slice(5))
    }
    if (selector.startsWith('placeholder:')) {
      return this.page.getByPlaceholder(selector.slice(12))
    }
    return this.page.locator(selector)
  }

  private async run(
    action: string,
    target: string,
    fn: () => Promise<void>,
    value?: string,
  ): Promise<ActionResult> {
    const start = Date.now()
    let ok = true
    let error: string | undefined

    try {
      await fn()
    } catch (err) {
      ok = false
      error = err instanceof Error ? err.message : String(err)
    }

    const result: ActionResult = {
      ok,
      action,
      target,
      value,
      error,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    }

    this.log.push(result)
    this.logger.log(result)
    return result
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
