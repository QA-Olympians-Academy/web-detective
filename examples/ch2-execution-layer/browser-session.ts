/**
 * CH2 — FAULT-TOLERANT BROWSER SESSION
 *
 * An autonomous agent may run for minutes, cross many pages, and encounter
 * transient failures. This session factory adds:
 *
 *   • Automatic retry with exponential back-off on navigation failures
 *   • Session state isolation (each agent run gets a clean context)
 *   • Structured logging of every browser event for LLM reasoning
 *   • Graceful teardown that saves a trace even on crash
 */
/// <reference types="node" />
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'
import * as path from 'path'
import * as fs from 'fs'

// ── Config ────────────────────────────────────────────────────────────────────

export interface SessionConfig {
  headless: boolean
  baseUrl: string
  traceDir: string
  retries: number
  retryDelayMs: number
  viewportWidth: number
  viewportHeight: number
}

const defaultConfig: SessionConfig = {
  headless: true,
  baseUrl: 'http://localhost:5173',
  traceDir: './traces',
  retries: 3,
  retryDelayMs: 500,
  viewportWidth: 1280,
  viewportHeight: 800,
}

// ── Session ───────────────────────────────────────────────────────────────────

export class AgentBrowserSession {
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private _page: Page | null = null
  private readonly events: SessionEvent[] = []

  constructor(private readonly config: SessionConfig = defaultConfig) {}

  get page(): Page {
    if (!this._page) throw new Error('Session not started — call session.start() first')
    return this._page
  }

  async start(sessionId = `session-${Date.now()}`): Promise<Page> {
    this.browser = await chromium.launch({ headless: this.config.headless })

    this.context = await this.browser.newContext({
      baseURL: this.config.baseUrl,
      viewport: {
        width: this.config.viewportWidth,
        height: this.config.viewportHeight,
      },
      recordVideo: { dir: path.join(this.config.traceDir, 'videos') },
    })

    // Capture all console messages and network failures for agent reasoning
    this._page = await this.context.newPage()

    this._page.on('console', msg => {
      if (msg.type() === 'error') this.record('console_error', msg.text())
    })

    this._page.on('pageerror', err => {
      this.record('page_error', err.message)
    })

    this._page.on('requestfailed', req => {
      this.record('request_failed', `${req.method()} ${req.url()}`)
    })

    // Start Playwright trace for post-mortem debugging
    await this.context.tracing.start({ screenshots: true, snapshots: true })

    this.record('session_started', sessionId)
    return this._page
  }

  async stop(label = 'run'): Promise<void> {
    if (!this.context || !this.browser) return

    const traceFile = path.join(this.config.traceDir, `${label}-${Date.now()}.zip`)
    fs.mkdirSync(path.dirname(traceFile), { recursive: true })

    await this.context.tracing.stop({ path: traceFile })
    this.record('trace_saved', traceFile)

    await this.context.close()
    await this.browser.close()

    console.log(`\nTrace saved → ${traceFile}`)
    console.log(`Open with: npx playwright show-trace ${traceFile}\n`)
  }

  // ── Resilient navigation ──────────────────────────────────────────────────

  async navigateWithRetry(url: string): Promise<void> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10_000 })
        this.record('navigate_ok', url)
        return
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        this.record('navigate_retry', `attempt ${attempt}: ${lastError.message}`)
        await this.sleep(this.config.retryDelayMs * attempt)
      }
    }

    this.record('navigate_failed', lastError?.message ?? 'unknown')
    throw lastError
  }

  // ── Event log (for LLM reasoning) ────────────────────────────────────────

  getEvents(): SessionEvent[] {
    return [...this.events]
  }

  getErrorEvents(): SessionEvent[] {
    return this.events.filter(e => e.type.includes('error') || e.type.includes('failed'))
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private record(type: string, detail: string): void {
    const event: SessionEvent = { type, detail, ts: new Date().toISOString() }
    this.events.push(event)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export interface SessionEvent {
  type: string
  detail: string
  ts: string
}

// ── Usage example ─────────────────────────────────────────────────────────────

/**
 * WORKSHOP TASK (Chapter 2 hands-on):
 *
 *   const session = new AgentBrowserSession({ headless: false, baseUrl: 'http://localhost:5173', ... })
 *   const page = await session.start('login-scenario')
 *
 *   const wrapper = new ActionWrapper(page)    // from action-wrapper.ts
 *   await wrapper.navigate('/login')
 *   // ... run actions ...
 *
 *   // On failure: session.getErrorEvents() gives the LLM context to reason about
 *   await session.stop('login-scenario')
 *   // → opens: npx playwright show-trace traces/login-scenario-<ts>.zip
 */
