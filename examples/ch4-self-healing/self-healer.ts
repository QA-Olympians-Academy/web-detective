/**
 * CH4 — SELF-HEALING AGENT
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
    const entry = this.store.get(key)
    const selector = entry?.selector

    if (!selector) throw new Error(`No selector registered for key "${key}"`)

    const visible = await page
      .locator(selector)
      .isVisible()
      .catch(() => false)
    if (visible) {
      this.store.markVerified(key)
      return selector
    }

    console.warn(`[SelfHealer] Selector failed for "${key}": ${selector}`)
    const result = await this.heal(page, key, selector)

    if (!result.healed || !result.newSelector) {
      throw new Error(
        `Failed to heal selector for "${key}". Tried: ${result.candidates.join(', ')}`,
      )
    }

    return result.newSelector
  }

  /**
   * Healing loop: snapshot DOM → ask LLM → validate candidates → persist winner.
   */
  async heal(page: Page, key: string, brokenSelector: string): Promise<HealResult> {
    const domText = (await page.locator('body').innerHTML()).slice(0, 4000) // cap for token budget

    const candidates = await this.askLLMForCandidates(key, brokenSelector, domText)

    for (const candidate of candidates) {
      const found = await page
        .locator(candidate)
        .isVisible()
        .catch(() => false)
      if (found) {
        this.store.heal(key, candidate)
        return {
          healed: true,
          originalSelector: brokenSelector,
          newSelector: candidate,
          candidates,
        }
      }
    }

    return { healed: false, originalSelector: brokenSelector, candidates }
  }

  // ── LLM integration ──────────────────────────────────────────────────────

  private async askLLMForCandidates(
    key: string,
    brokenSelector: string,
    accessibilityTree: string,
  ): Promise<string[]> {
    const system = `You are a Playwright selector expert. Given a broken selector and the
current accessibility tree of a web page, return 3-5 alternative selectors
that would locate the same element.

The selectors MUST be strings accepted by page.locator(). That means:
- Playwright engine syntax for ARIA, e.g. role=textbox[name="Email address"], role=button[name="Sign In"]
- text engine, e.g. text="Email address"
- semantic CSS: #id, input[type="email"], .semantic-class (NEVER structural nth-child paths)
Do NOT return fluent API calls like getByRole(...) or getByLabel(...) — page.locator() cannot parse those.

Return ONLY a JSON array of selector strings, no explanation.
Order from most stable (role=) to least stable (CSS).`

    const text = await complete(
      system,
      `Element key: "${key}"
Broken selector: "${brokenSelector}"

Current accessibility tree:
${accessibilityTree}

Return a JSON array of 3-5 alternative Playwright selectors for this element.`,
      { maxTokens: 3072 }, // reasoning models (DeepSeek-R1) need headroom beyond <think>…</think>
    )

    return extractJson<string[]>(text) ?? []
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
