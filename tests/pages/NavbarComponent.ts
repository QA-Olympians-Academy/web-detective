import { type Page, type Locator } from '@playwright/test'

export class NavbarComponent {
  readonly brand: Locator
  readonly dashboardLink: Locator
  readonly productsLink: Locator
  readonly logoutButton: Locator
  readonly userEmail: Locator

  constructor(private readonly page: Page) {
    this.brand         = page.getByText('web-detective')
    this.dashboardLink = page.getByRole('link', { name: 'Dashboard' })
    this.productsLink  = page.getByRole('link', { name: 'Products' })
    this.logoutButton  = page.getByRole('button', { name: 'Logout' })
    this.userEmail     = page.locator('.navbar-user')
  }

  async logout() {
    await this.logoutButton.click()
  }

  async navigateTo(name: 'Dashboard' | 'Products') {
    await this.page.getByRole('link', { name }).click()
  }
}
