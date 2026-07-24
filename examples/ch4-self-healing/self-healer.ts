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
  //
  // Prompt the local model with the broken selector + accessibility tree via
  // complete(system, user), then extractJson<string[]>() the ranked candidates.
  private async askLLMForCandidates(
    key: string,
    brokenSelector: string,
    accessibilityTree: string,
  ): Promise<string[]> {
    const system =  const system = `You are a Playwright selector expert. You are given a broken selector and the
CURRENT ARIA accessibility tree of the page (YAML: each line is "<role> \\"<accessible name>\\"").
The broken selector is OUT OF DATE — the element's attributes have changed. Your job is to
locate the same element in the tree and return 3-5 working Playwright selectors for it.

Rules:
- Derive the selector from the ARIA TREE, not from the broken selector. The accessible name
  almost certainly changed — read the current "<role> \\"<name>\\"" line and use THAT name.
- Prefer role= selectors: role=textbox[name="..."], role=button[name="..."], role=link[name="..."].
- A role= selector accepts ONLY these attributes: name, checked, disabled, expanded,
  include-hidden, level, pressed, selected. NEVER use placeholder, id, type, class, or href
  inside role=[...]. Those are not valid and will throw.
- Never mix CSS and role= in one selector (e.g. "label + role=textbox" is invalid).
- If you fall back to CSS, use a single valid CSS selector (semantic class or attribute),
  never a role= fragment.
- Return ONLY a JSON array of selector strings, no explanation.
- Order from most stable (ARIA role=name) to least stable (CSS).`

    const text = await complete(
      system,
      `Element key: "${key}"
Broken selector: "${brokenSelector}"

Current accessibility tree:
${accessibilityTree}

Return a JSON array of 3-5 alternative Playwright selectors for this element.`,
      { maxTokens: 1024 },
    )

    console.log(`[SelfHealer] LLM returned candidates for "${key}": ${text}"`)

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
