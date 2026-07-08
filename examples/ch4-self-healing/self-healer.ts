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
    const domText = (await page.locator('body').ariaSnapshot()).slice(0, 4000) // cap for token budget

    const candidates = await this.askLLMForCandidates(key, brokenSelector, domText)

    console.log('Candidates are: ', candidates)
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
current accessibility tree of a web page, return 3-5 alternative selector STRINGS
that would locate the same element.

These strings are passed directly to page.locator(selector), so they MUST be
CSS or Playwright text-engine selectors — NOT getBy* method calls.

Rules:
- ALLOWED: CSS attribute/id/class selectors, e.g.
    input[type="email"]
    input[name="email"]
    input[placeholder="Email address"]
    input[aria-label="Email address"]
    #email
- The text engine (text="..." or :has-text("...")) is ONLY for non-input elements
  such as buttons and links. NEVER use it to target a form field: text matches the
  visible <label>, not the <input>, so fill() will fail.
- For inputs/textareas/selects, ALWAYS use an attribute selector on the field itself
  (type, name, id, placeholder, aria-label). Include the element tag, e.g. input[...].
- FORBIDDEN: getByRole(...), getByLabel(...), getByText(...), getByPlaceholder(...),
  XPath, and brittle structural paths like div > div:nth-child(3) > input
- Return ONLY a JSON array of selector strings, no explanation
- Order from most stable to least stable`

    console.log(
      `[SelfHealer] Asking LLM for alternatives for "${key}" (broken selector: "${brokenSelector}")... "${system}"`,
    )
    const text = await complete(
      system,
      `Element key: "${key}"
Broken selector: "${brokenSelector}"

Current accessibility tree:
${accessibilityTree}

Return a JSON array of 3-5 alternative Playwright selectors for this element.`,
      { maxTokens: 2048 },
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
