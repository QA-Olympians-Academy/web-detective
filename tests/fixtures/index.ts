import { test as base, expect } from '@playwright/test'
import { LoginPage } from '@pages/LoginPage'
import { DashboardPage } from '@pages/DashboardPage'
import { ProductsPage } from '@pages/ProductsPage'
import { NavbarComponent } from '@pages/NavbarComponent'

const DEMO_EMAIL    = 'admin@shop.com'
const DEMO_PASSWORD = 'password123'

interface AppFixtures {
  loginPage: LoginPage
  dashboardPage: DashboardPage
  productsPage: ProductsPage
  navbar: NavbarComponent
  /** Navigates to /login and completes the login flow before the test body runs. */
  authenticated: void
}

export const test = base.extend<AppFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page))
  },

  productsPage: async ({ page }, use) => {
    await use(new ProductsPage(page))
  },

  navbar: async ({ page }, use) => {
    await use(new NavbarComponent(page))
  },

  authenticated: async ({ page }, use) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(DEMO_EMAIL, DEMO_PASSWORD)
    await page.waitForURL('/dashboard')
    await use()
  },
})

export { expect }
