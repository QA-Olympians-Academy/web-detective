/**
 * CH4 — SELF-HEALING DEMO (LLM-backed)
 *
 * Demonstrates the full healing loop against the live app:
 *   1. Seed the store, then deliberately register a BROKEN selector.
 *   2. SelfHealingAgent.findElement detects the failure on the live /login page.
 *   3. It snapshots the accessibility tree and asks the local model (Ollama /
 *      DeepSeek-R1) to rank replacement selectors.
 *   4. It validates each candidate and persists the first that works.
 *
 * Prereqs: dev server on :5173 AND Ollama on :11434 with the model pulled.
 *
 * MODEL: use llama3.1 — the default deepseek-r1:8b spends its whole token budget
 * inside <think>…</think> and returns empty output, so the healer gets no candidates.
 *
 *   WORKSHOP_MODEL=llama3.1:latest npx tsx examples/ch4-self-healing/run-healer.ts
 */
import { chromium } from 'playwright'
import { LocatorStore, WEB_DETECTIVE_LOCATORS } from './locator-store'
import { SelfHealingAgent } from './self-healer'
import { checkOllama, MODEL } from '../shared/ollama'

async function main() {
  const health = await checkOllama()
  if (!health.ok) {
    console.error(`Ollama not ready: ${health.error}`)
    process.exit(1)
  }
  console.log(`Using local model: ${MODEL}\n`)

  const store = new LocatorStore('./examples/ch4-self-healing/locator-memory.json')
  for (const [key, selector] of WEB_DETECTIVE_LOCATORS) store.register(key, selector)

  // Deliberately break the email-input selector to trigger healing.
  const KEY = 'login.emailInput'
  const BROKEN = 'input#totally-wrong-email-id'
  store.heal(KEY, BROKEN)             // pretend a previous "heal" left a bad selector
  console.log(`Broke "${KEY}" → "${BROKEN}"\n`)

  const browser = await chromium.launch({ headless: false, channel: 'chrome' })
  const page = await browser.newPage()

  try {
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' })

    const healer = new SelfHealingAgent(store)
    console.log(`Asking ${MODEL} to heal "${KEY}" from the live DOM…\n`)
    const selector = await healer.findElement(page, KEY)

    console.log(`\nHealed selector: ${selector}`)
    await page.locator(selector).fill('admin@shop.com')
    const value = await page.locator(selector).inputValue()
    console.log(`Filled email field, read back: "${value}" ${value === 'admin@shop.com' ? '✓' : '✗'}`)

    store.printReport()
  } finally {
    await browser.close()
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
