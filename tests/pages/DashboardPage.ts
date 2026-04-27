import { type Page, type Locator } from '@playwright/test'

export class DashboardPage {
  readonly heading: Locator
  readonly statCards: Locator
  readonly chartCards: Locator
  readonly monthlySalesHeading: Locator
  readonly revenueTrendHeading: Locator

  constructor(private readonly page: Page) {
    this.heading              = page.getByRole('heading', { name: 'Dashboard' })
    this.statCards            = page.locator('.stat-card')
    this.chartCards           = page.locator('.chart-card')
    this.monthlySalesHeading  = page.getByRole('heading', { name: 'Monthly Sales' })
    this.revenueTrendHeading  = page.getByRole('heading', { name: 'Revenue Trend' })
  }

  async goto() {
    await this.page.goto('/dashboard')
  }

  statCard(index: number): Locator {
    return this.statCards.nth(index)
  }

  chartCard(index: number): Locator {
    return this.chartCards.nth(index)
  }

  statCardByLabel(label: string): Locator {
    return this.page.locator('.stat-card', { hasText: label })
  }
}
