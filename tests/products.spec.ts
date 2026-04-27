import { test, expect } from '@fixtures'

test.describe('Products', () => {
  test.beforeEach(async ({ authenticated: _authenticated, navbar }) => {
    await navbar.navigateTo('Products')
  })

  test('renders the products page heading', async ({ productsPage }) => {
    await expect(productsPage.heading).toBeVisible()
  })

  test('shows all 15 products by default', async ({ productsPage }) => {
    await expect(productsPage.tableRows).toHaveCount(15)
    await expect(productsPage.footerText).toContainText('Showing 15 of 15 products')
  })

  test('filters products by name', async ({ productsPage }) => {
    await productsPage.search('keyboard')
    await expect(productsPage.tableRows).toHaveCount(1)
    await expect(productsPage.footerText).toContainText('Showing 1 of 15 products')
  })

  test('filters products by category', async ({ productsPage }) => {
    await productsPage.search('Fitness')
    await expect(productsPage.tableRows).toHaveCount(3)
    await expect(productsPage.footerText).toContainText('Showing 3 of 15 products')
  })

  test('filters products by SKU', async ({ productsPage }) => {
    await productsPage.search('ELC-008')
    await expect(productsPage.tableRows).toHaveCount(1)
    await expect(productsPage.footerText).toContainText('Showing 1 of 15 products')
  })

  test('shows empty state when search has no results', async ({ productsPage }) => {
    await productsPage.search('zzznonexistent')
    await expect(productsPage.emptyState).toBeVisible()
    await expect(productsPage.footerText).toContainText('Showing 0 of 15 products')
  })

  test('shows stock status badges', async ({ productsPage }) => {
    await expect(productsPage.badge('in-stock')).toBeVisible()
    await expect(productsPage.badge('low-stock')).toBeVisible()
    await expect(productsPage.badge('out-of-stock')).toBeVisible()
  })

  test('clears search and restores full list', async ({ productsPage }) => {
    await productsPage.search('kitchen')
    await expect(productsPage.footerText).toContainText('Showing 3 of 15 products')
    await productsPage.clearSearch()
    await expect(productsPage.footerText).toContainText('Showing 15 of 15 products')
  })
})
