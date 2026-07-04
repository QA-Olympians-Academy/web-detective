// @ts-nocheck
/**
 * CH4 EXERCISE FILE — SELF-HEALING AGENT
 *
 * This is a starter stub. Implement the method bodies live during the workshop.
 * Full reference implementation: `git checkout solutions` and see SOLUTIONS.md.
 *
 * Detects when a locator fails at runtime, asks an LLM to rank alternative
 * selectors from the live DOM, validates the best candidate, and persists
 * the healed selector to the LocatorStore.
 *
 * The healing loop:
 *   1. Run action with current selector
 *   2. On failure, snapshot the accessibility tree
 *   3. Ask LLM: "here is the broken selector and the current DOM — suggest replacements"
 *   4. Try each candidate in ranked order
 *   5. Persist the first working candidate to LocatorStore
 */
import { type Page } from 'playwright'
import { LocatorStore } from './locator-store'
import { complete, extractJson } from '../shared/ollama'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HealResult {
  healed: boolean
  originalSelector: string
  newSelector?: string
  candidates: string[]
  reasoning?: string
}

// ── Healer ────────────────────────────────────────────────────────────────────

export class SelfHealingAgent {
  private readonly store: LocatorStore

  constructor(store: LocatorStore) {
    this.store = store
  }

  /**
   * Try to find an element using the stored selector.
   * On failure, trigger the healing loop.
   */
  async findElement(page: Page, key: string): Promise<string> {
    throw new Error('TODO: implement in Chapter 4')
  }

  /**
   * Healing loop: snapshot DOM → ask LLM → validate candidates → persist winner.
   */
  async heal(page: Page, key: string, brokenSelector: string): Promise<HealResult> {
    throw new Error('TODO: implement in Chapter 4')
  }

  // ── LLM integration ──────────────────────────────────────────────────────
  //
  // Prompt the local model with the broken selector + accessibility tree via
  // complete(system, user), then extractJson<string[]>() the ranked candidates.
  private async askLLMForCandidates(
    key: string,
    brokenSelector: string,
    accessibilityTree: string,
  ): Promise<string[]> {
    throw new Error('TODO: implement in Chapter 4')
  }
}

// ── Usage example ─────────────────────────────────────────────────────────────

/**
 * WORKSHOP TASK (Chapter 4 hands-on):
 *
 * 1. Seed the store with web-detective locators:
 *
 *    const store = new LocatorStore('./locator-memory.json')
 *    for (const [key, selector] of WEB_DETECTIVE_LOCATORS) {
 *      store.register(key, selector)
 *    }
 *
 * 2. Break a selector in Login.tsx (rename the CSS class):
 *    Change `className="login-card"` → `className="auth-card"` and rebuild.
 *
 * 3. Run a test that uses the healer:
 *
 *    const healer = new SelfHealingAgent(store)
 *    const selector = await healer.findElement(page, 'login.emailInput')
 *    await page.locator(selector).fill('admin@shop.com')
 *
 * 4. The healer detects the failure, snapshots the DOM, asks the local model
 *    (DeepSeek-R1 via Ollama) for alternatives, validates them, and writes the
 *    winner to locator-memory.json.
 *
 * 5. Run store.printReport() to see the healing history.
 */
