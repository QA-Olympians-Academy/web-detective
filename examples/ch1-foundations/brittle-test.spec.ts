/**
 * CH1 — BRITTLE TEST (anti-pattern reference)
 *
 * This is what we're trying to escape. Every comment marks a failure mode
 * that an agentic system can detect, categorise, and fix automatically.
 */
import { test, expect } from '@playwright/test'

test.describe('Login flow — brittle version', () => {

  test('logs in and reaches dashboard', async ({ page }) => {
    await page.goto('http://localhost:5173/login')

    // ❌ Arbitrary wait — masks timing issues instead of fixing them.
    //    Any network slowdown causes a false failure; any speed-up wastes time.
    await page.waitForTimeout(2000)

    // ❌ Structural CSS path — breaks the moment a designer renames a class
    //    or reorders DOM nodes. The selector carries zero semantic meaning.
    await page.click('.login-card > form > div:nth-child(1) > input')
    await page.type('.login-card > form > div:nth-child(1) > input', 'admin@shop.com')

    await page.click('.login-card > form > div:nth-child(2) > input')
    await page.type('.login-card > form > div:nth-child(2) > input', 'password123')

    // ❌ Clicking by position — any new button in the form breaks this.
    await page.click('.login-card > form > button:nth-child(1)')

    // ❌ Hardcoded sleep instead of waiting for the actual state change.
    await page.waitForTimeout(1500)

    // ❌ Asserting on a CSS class that could change without the behaviour changing.
    const heading = await page.$('.page-header > h2')
    const text = await heading?.textContent()
    expect(text).toBe('Dashboard')
  })

  test('shows error on bad credentials', async ({ page }) => {
    await page.goto('http://localhost:5173/login')
    await page.waitForTimeout(1000)

    // ❌ Inline selectors duplicated across every test — a single rename
    //    requires touching every file that uses this page.
    await page.fill('.login-card input[type="email"]', 'bad@user.com')
    await page.fill('.login-card input[type="password"]', 'wrong')
    await page.click('.btn-login')

    await page.waitForTimeout(500)

    // ❌ Checking the DOM node directly instead of a user-visible assertion.
    const error = await page.$eval('.form-error', el => el.textContent)
    expect(error).toContain('Invalid')
  })
})

/**
 * WORKSHOP TASK (Chapter 1 hands-on):
 *
 * 1. Run this file:  npx playwright test examples/ch1-foundations/brittle-test.spec.ts
 * 2. Note the passing tests. Now rename `.login-card` to `.auth-card` in Login.tsx
 *    and re-run — watch them fail for the wrong reason.
 * 3. Map each ❌ comment to a node in your agentic task graph (see task-graph.ts).
 * 4. Then look at tests/auth.spec.ts to see the resilient version.
 */
