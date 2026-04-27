import { test, expect } from '@fixtures'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ authenticated: _authenticated }) => {})

  test('renders all four stat cards', async ({ dashboardPage }) => {
    await expect(dashboardPage.statCardByLabel('Total Revenue')).toBeVisible()
    await expect(dashboardPage.statCardByLabel('Total Orders')).toBeVisible()
    await expect(dashboardPage.statCardByLabel('Customers')).toBeVisible()
    await expect(dashboardPage.statCardByLabel('Avg Order Value')).toBeVisible()
  })

  test('stat cards display formatted values', async ({ dashboardPage }) => {
    await expect(dashboardPage.statCard(0)).toContainText('$')
    await expect(dashboardPage.statCard(1)).toContainText(/\d+/)
  })

  test('renders Monthly Sales chart heading', async ({ dashboardPage }) => {
    await expect(dashboardPage.monthlySalesHeading).toBeVisible()
  })

  test('renders Revenue Trend chart heading', async ({ dashboardPage }) => {
    await expect(dashboardPage.revenueTrendHeading).toBeVisible()
  })

  test('charts are rendered in the DOM', async ({ dashboardPage }) => {
    await expect(dashboardPage.chartCards).toHaveCount(2)
    for (const card of await dashboardPage.chartCards.all()) {
      await expect(card.locator('svg').first()).toBeVisible()
    }
  })

  test('navbar shows brand name and nav links', async ({ navbar }) => {
    await expect(navbar.brand).toBeVisible()
    await expect(navbar.dashboardLink).toBeVisible()
    await expect(navbar.productsLink).toBeVisible()
  })

  test('navbar shows logged-in user email', async ({ navbar }) => {
    await expect(navbar.userEmail).toContainText('admin@shop.com')
  })
})
