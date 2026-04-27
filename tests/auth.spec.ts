import { test, expect } from '@fixtures'

test.describe('Authentication', () => {
  test('redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })

  test('shows login form with email and password fields', async ({ loginPage }) => {
    await loginPage.goto()
    await expect(loginPage.emailInput).toBeVisible()
    await expect(loginPage.passwordInput).toBeVisible()
    await expect(loginPage.submitButton).toBeVisible()
  })

  test('shows error when submitting empty form', async ({ loginPage }) => {
    await loginPage.goto()
    await loginPage.submitEmpty()
    await expect(loginPage.errorMessage).toContainText('Please enter both email and password.')
  })

  test('shows error on invalid credentials', async ({ loginPage }) => {
    await loginPage.goto()
    await loginPage.login('wrong@example.com', 'wrongpassword')
    await expect(loginPage.errorMessage).toContainText('Invalid email or password.')
  })

  test('logs in with valid credentials and lands on dashboard', async ({ page, loginPage, dashboardPage }) => {
    await loginPage.goto()
    await loginPage.login('admin@shop.com', 'password123')
    await expect(page).toHaveURL('/dashboard')
    await expect(dashboardPage.heading).toBeVisible()
  })

  test('redirects authenticated user away from /login to /dashboard', async ({ page, authenticated: _authenticated }) => {
    await page.goto('/login')
    await expect(page).toHaveURL('/dashboard')
  })

  test('logs out and redirects to /login', async ({ page, authenticated: _authenticated, navbar }) => {
    await navbar.logout()
    await expect(page).toHaveURL('/login')
  })
})
