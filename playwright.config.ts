import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  // Default suite lives in ./tests. CI jobs that run a spec elsewhere
  // (e.g. the ch1 brittle test in examples/) set PW_TESTDIR to point here.
  testDir: process.env.PW_TESTDIR ?? './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    // CI workflows pre-start the dev server (npm run dev & + wait-on),
    // so always reuse it rather than trying to bind the port a second time.
    reuseExistingServer: true,
  },
})
