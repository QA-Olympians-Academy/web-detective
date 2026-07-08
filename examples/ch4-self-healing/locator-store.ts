// @ts-nocheck
/**
 * CH4 EXERCISE FILE — LOCATOR STORE (persistent locator memory)
 *
 * This is a starter stub. Implement the method bodies live during the workshop.
 * Full reference implementation: `git checkout solutions` and see SOLUTIONS.md.
 *
 * Records the current best selector for each logical element.
 * When a selector breaks, the healer proposes a replacement and writes it here.
 * Over time this file becomes a living map of the app's selector evolution.
 */
import * as fs from 'fs'
import * as path from 'path'

export interface LocatorEntry {
  key: string // logical name, e.g. "login.emailInput"
  selector: string // current best selector
  fallbacks: string[] // ranked alternatives, newest first
  healCount: number // how many times this locator has been auto-healed
  lastVerified: string // ISO timestamp of last successful use
  lastHealed?: string // ISO timestamp of last heal event
}

export class LocatorStore {
  private entries: Map<string, LocatorEntry>
  private readonly filePath: string

  constructor(filePath = './locator-memory.json') {
    this.filePath = path.resolve(filePath)
    this.entries = this.load()
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  get(key: string): LocatorEntry | undefined {
    return this.entries.get(key)
  }

  getSelector(key: string): string | undefined {
    return this.entries.get(key)?.selector
  }

  all(): LocatorEntry[] {
    return [...this.entries.values()]
  }

  // ── Write ─────────────────────────────────────────────────────────────────

  register(key: string, selector: string): void {
    if (!this.entries.has(key)) {
      this.entries.set(key, {
        key,
        selector,
        fallbacks: [],
        healCount: 0,
        lastVerified: new Date().toISOString(),
      })
      this.save()
    }
  }

  markVerified(key: string): void {
    const entry = this.entries.get(key)
    if (entry) {
      entry.lastVerified = new Date().toISOString()
      this.save()
    }
  }

  heal(key: string, newSelector: string): void {
    const entry = this.entries.get(key)
    if (entry) {
      entry.fallbacks.unshift(entry.selector)
      entry.selector = newSelector
      entry.healCount++
      entry.lastHealed = new Date().toISOString()
      this.save()
    }
  }

  // ── Persistence ───────────────────────────────────────────────────────────

  private load(): Map<string, LocatorEntry> {
    if (!fs.existsSync(this.filePath)) return new Map()
    try {
      const raw = JSON.parse(fs.readFileSync(this.filePath, 'utf-8')) as LocatorEntry[]
      return new Map(raw.map((e) => [e.key, e]))
    } catch {
      return new Map()
    }
  }

  private save(): void {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true })
    fs.writeFileSync(this.filePath, JSON.stringify([...this.entries.values()], null, 2), 'utf-8')
  }

  // ── Report ────────────────────────────────────────────────────────────────

  printReport(): void {
    console.log('\n── Locator Memory Report ──────────────────────────────')
    for (const entry of this.entries.values()) {
      const healed = entry.healCount > 0 ? ` (healed ${entry.healCount}x)` : ''
      console.log(`  ${entry.key}${healed}`)
      console.log(`    current   : ${entry.selector}`)
      if (entry.fallbacks.length > 0) {
        console.log(`    fallbacks : ${entry.fallbacks.join(', ')}`)
      }
    }
    console.log('────────────────────────────────────────────────────────\n')
  }
}

// ── Seed data — web-detective app locators ────────────────────────────────────

export const WEB_DETECTIVE_LOCATORS: Array<[string, string]> = [
  // ── Login (/login) ──
  ['login.emailInput', 'input#email'],
  ['login.passwordInput', 'input#password'],
  ['login.submitButton', 'getByRole("button", { name: "Sign In" })'],
  ['login.brandHeading', 'getByRole("heading", { name: "ShopAdmin" })'],

  // ── Nav (all authed pages) ──
  ['nav.dashboardLink', 'getByRole("link", { name: "Dashboard" })'],
  ['nav.productsLink', 'getByRole("link", { name: "Products" })'],
  ['nav.logoutButton', 'getByRole("button", { name: "Logout" })'],

  // ── Dashboard (/dashboard) ──
  ['dashboard.heading', 'getByRole("heading", { name: "Dashboard" })'],
  ['dashboard.monthlySalesCard', 'getByRole("heading", { name: "Monthly Sales" })'],
  ['dashboard.revenueTrendCard', 'getByRole("heading", { name: "Revenue Trend" })'],

  // ── Products (/products) ──
  ['products.heading', 'getByRole("heading", { name: "Products" })'],
  ['products.searchInput', 'getByPlaceholder("Search by name, category or SKU…")'],
  ['products.countHeading', 'getByRole("heading", { name: /All Products \\(\\d+\\)/ })'],

  // ── Products table column headers (/products, after login) ──
  ['products.header.sku', 'getByRole("columnheader", { name: "SKU" })'],
  ['products.header.name', 'getByRole("columnheader", { name: "Product Name" })'],
  ['products.header.category', 'getByRole("columnheader", { name: "Category" })'],
  ['products.header.price', 'getByRole("columnheader", { name: "Price" })'],
  ['products.header.stock', 'getByRole("columnheader", { name: "Stock" })'],
  ['products.header.status', 'getByRole("columnheader", { name: "Status" })'],
]

/**
 * WORKSHOP TASKS (Chapter 4 hands-on):
 *
 * Task A — Seed the store and inspect the initial state:
 *   const store = new LocatorStore('./locator-memory.json')
 *   for (const [key, selector] of WEB_DETECTIVE_LOCATORS) store.register(key, selector)
 *   store.printReport()
 *   Every entry should show healCount 0. Re-running register() for the same key
 *   is a no-op — confirm the report stays identical on a second run.
 *
 * Task B — Add two new locators you discover from the live page:
 *   Start the app, open http://localhost:5173/products, run:
 *     const tree = await page.locator('body').ariaSnapshot()
 *   Find two elements not yet in WEB_DETECTIVE_LOCATORS (e.g. a column header
 *   or a pagination control) and add them to the seed array above.
 *
 * Task C — Simulate a heal and observe the state change:
 *   store.heal('login.submitButton', 'button[type="submit"]')
 *   store.printReport()
 *   Confirm: selector is updated, the old value appears in fallbacks, healCount is 1.
 *   Call store.heal() again with a third selector — verify fallbacks has two entries.
 *
 * Task D — Export the store as a diff-friendly flat format:
 *   Add a method toCsv(): string that returns one line per entry:
 *     key,selector,healCount,lastVerified
 *   Use it to generate a snapshot you can commit and diff in version control.
 */
