/**
 * CH2 — RUNNABLE EXERCISE
 *
 * Combines the two Chapter 2 workshop hands-on tasks:
 *   • AgentBrowserSession  (browser-session.ts) — fault-tolerant session + trace
 *   • ActionWrapper        (action-wrapper.ts)  — typed, loggable action vocabulary
 *
 * Drives the real login flow against the running dev server, prints the
 * structured action log + session error events, and saves a trace.
 *
 *   npx tsx examples/ch2-execution-layer/run-exercises.ts
 */
import { AgentBrowserSession } from './browser-session'
import { ActionWrapper } from './action-wrapper'

async function main() {
  const headless = process.env.HEADED !== '1'
  const session = new AgentBrowserSession({
    headless,
    baseUrl: 'http://localhost:5173',
    traceDir: './traces',
    retries: 3,
    retryDelayMs: 500,
    viewportWidth: 1280,
    viewportHeight: 800,
  })

  const page = await session.start('login-scenario')

  try {
    // ── Exercise 1: navigate-with-retry (browser-session.ts) ──
    await session.navigateWithRetry('http://localhost:5173/login')

    // ── Exercise 2: typed action vocabulary (action-wrapper.ts) ──
    const wrapper = new ActionWrapper(page)
    await wrapper.fill('label:Email address', 'admin@shop.com')
    await wrapper.fill('label:Password', 'password123')
    await wrapper.click('role:button[name=Sign In]')
    await wrapper.assertUrl('/dashboard')

    wrapper.printSummary()
  } finally {
    const errors = session.getErrorEvents()
    if (errors.length) {
      console.log('\nSession error events (LLM reasoning context):')
      for (const e of errors) console.log(`  ✗ [${e.type}] ${e.detail}`)
    } else {
      console.log('\nNo session error events recorded.')
    }
    await session.stop('login-scenario')
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
