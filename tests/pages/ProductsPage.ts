import { type Page, type Locator } from '@playwright/test'

type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock'

export class ProductsPage {
  readonly heading: Locator
  readonly searchInput: Locator
  readonly tableRows: Locator
  readonly footerText: Locator
  readonly emptyState: Locator

  constructor(private readonly page: Page) {
    this.heading    = page.getByRole('heading', { name: 'Products', exact: true })
    this.searchInput = page.getByPlaceholder('Search by name, category or SKU…')
    this.tableRows  = page.locator('tbody tr')
    this.footerText = page.locator('.table-footer')
    this.emptyState = page.getByText('No products match your search.')
  }

  async goto() {
    await this.page.goto('/products')
  }

  async search(query: string) {
    await this.searchInput.fill(query)
  }

  async clearSearch() {
    await this.searchInput.clear()
  }

  badge(status: StockStatus): Locator {
    return this.page.locator(`.badge.${status}`).first()
  }
}
