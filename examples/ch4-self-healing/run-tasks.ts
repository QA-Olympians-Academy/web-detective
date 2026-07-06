/**
 * CH4 — WORKSHOP TASKS RUNNER (A, C, D)
 *
 * Exercises the LocatorStore workshop tasks without an LLM:
 *   Task A — seed + inspect initial state; confirm re-register is a no-op
 *   Task C — simulate heals; confirm fallbacks + healCount evolve
 *   Task D — export the store as diff-friendly CSV
 *
 *   npx tsx examples/ch4-self-healing/run-tasks.ts
 *
 * (Task B — the two new /products locators — is baked into WEB_DETECTIVE_LOCATORS.)
 */
import { LocatorStore, WEB_DETECTIVE_LOCATORS } from './locator-store'

const STORE_PATH = './examples/ch4-self-healing/locator-memory.json'

// ── Task A ──────────────────────────────────────────────────────────────────
console.log('\n=== Task A — seed the store and inspect initial state ===')
const store = new LocatorStore(STORE_PATH)
for (const [key, selector] of WEB_DETECTIVE_LOCATORS) store.register(key, selector)
store.printReport()

const before = JSON.stringify(store.all())
for (const [key, selector] of WEB_DETECTIVE_LOCATORS) store.register(key, selector) // re-run
const after = JSON.stringify(store.all())
console.log(`Re-register is a no-op: ${before === after ? 'YES ✓' : 'NO ✗'}`)
console.log(`Total entries: ${store.all().length} (includes 2 Task B locators)`)

// ── Task C ──────────────────────────────────────────────────────────────────
console.log('\n=== Task C — simulate heals and observe state change ===')
store.heal('login.submitButton', 'button[type="submit"]')
store.heal('login.submitButton', 'getByRole("button", { name: "Sign In" })')
const submit = store.get('login.submitButton')!
console.log(`healCount = ${submit.healCount} (expect 2)`)
console.log(`fallbacks = ${submit.fallbacks.length} entries (expect 2): ${submit.fallbacks.join(' | ')}`)
store.printReport()

// ── Task D ──────────────────────────────────────────────────────────────────
console.log('=== Task D — diff-friendly CSV export ===')
console.log(store.toCsv())
