/**
 * Playwright config for running the workshop CHAPTER EXAMPLE specs.
 *
 * The main playwright.config.ts uses `testDir: './tests'`, so it does NOT pick
 * up the *.spec.ts files under examples/. This config points testDir at
 * examples/ and runs headed in real Chrome, reusing an already-running dev server.
 *
 * Run:
 *   npm run dev                                            # if not already running
 *   npx playwright test --config=pw-examples.config.ts     # all example specs
 *   npx playwright test examples/ch1-foundations/brittle-test.spec.ts --config=pw-examples.config.ts
 */
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './examples',
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    headless: false,
    channel: 'chrome',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
})
