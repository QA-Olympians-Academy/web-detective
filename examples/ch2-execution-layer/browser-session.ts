// @ts-nocheck
/**
 * CH2 — FAULT-TOLERANT BROWSER SESSION  (WORKSHOP EXERCISE STUB)
 *
 * This is the Chapter 2 exercise file. The method bodies are intentionally
 * left unimplemented — you will fill them in live during the workshop.
 *
 * Goal: a session factory that adds automatic retry with back-off, session
 * state isolation, structured event logging for LLM reasoning, and graceful
 * teardown that saves a trace even on crash.
 *
 * For the full reference implementation:
 *   git checkout solutions
 * and read SOLUTIONS.md.
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

// TODO: implement in Chapter 2 — fill in the real default values
const defaultConfig: SessionConfig = {
  headless: true,
  baseUrl: '',
  traceDir: '',
  retries: 0,
  retryDelayMs: 0,
  viewportWidth: 0,
  viewportHeight: 0,
}

// ── Session ───────────────────────────────────────────────────────────────────

export class AgentBrowserSession {
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private _page: Page | null = null
  private readonly events: SessionEvent[] = []

  constructor(private readonly config: SessionConfig = defaultConfig) {}

  get page(): Page {
    throw new Error('TODO: implement in Chapter 2')
  }

  async start(sessionId = `session-${Date.now()}`): Promise<Page> {
    throw new Error('TODO: implement in Chapter 2')
  }

  async stop(label = 'run'): Promise<void> {
    throw new Error('TODO: implement in Chapter 2')
  }

  // ── Resilient navigation ──────────────────────────────────────────────────

  async navigateWithRetry(url: string): Promise<void> {
    throw new Error('TODO: implement in Chapter 2')
  }

  // ── Event log (for LLM reasoning) ────────────────────────────────────────

  getEvents(): SessionEvent[] {
    throw new Error('TODO: implement in Chapter 2')
  }

  getErrorEvents(): SessionEvent[] {
    throw new Error('TODO: implement in Chapter 2')
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private record(type: string, detail: string): void {
    throw new Error('TODO: implement in Chapter 2')
  }

  private sleep(ms: number): Promise<void> {
    throw new Error('TODO: implement in Chapter 2')
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
