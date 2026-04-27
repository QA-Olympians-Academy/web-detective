import { type Page, type Locator } from '@playwright/test'

export class LoginPage {
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator

  constructor(private readonly page: Page) {
    this.emailInput   = page.getByLabel('Email address')
    this.passwordInput = page.getByLabel('Password')
    this.submitButton  = page.getByRole('button', { name: 'Sign In' })
    this.errorMessage  = page.locator('.form-error')
  }

  async goto() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  async submitEmpty() {
    await this.submitButton.click()
  }
}
