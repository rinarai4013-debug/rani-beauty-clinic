import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Rani Beauty Clinic/i);
  });

  test('hero section is visible with CTA', async ({ page }) => {
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();

    const cta = page.getByRole('link', { name: /book|consult|appointment/i }).first();
    await expect(cta).toBeVisible();
  });

  test('navigation links exist', async ({ page }) => {
    await expect(page.getByRole('link', { name: /services/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /about/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /contact/i }).first()).toBeVisible();
  });

  test('footer is visible with clinic info', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(/Rani Beauty Clinic/i);
  });

  test('page renders without server errors', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(500);
    // Verify main content rendered
    await expect(page.locator('main')).toBeVisible();
  });
});
