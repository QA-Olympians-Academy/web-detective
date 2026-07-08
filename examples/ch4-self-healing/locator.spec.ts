import { test, expect } from '@playwright/test'
import { LocatorStore, WEB_DETECTIVE_LOCATORS } from './locator-store'
import { SelfHealingAgent } from './self-healer'

test.describe('Locator Store', () => {
  test('Run and heal my locators', async ({ page }) => {
    const store = new LocatorStore('./locator-memory.json')
    for (const [key, selector] of WEB_DETECTIVE_LOCATORS) store.register(key, selector)
    const healer = new SelfHealingAgent(store)
    await page.goto('/login')
    await page.getByRole('button', { name: 'Sign In' }).waitFor({ state: 'visible' })
    const selector = await healer.findElement(page, 'login.emailInput')
    await page.locator(selector).fill('admin@shop.com')
    store.printReport()
  })
})
