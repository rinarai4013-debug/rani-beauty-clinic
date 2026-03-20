import { test, expect } from '@playwright/test';

test.describe('Site Navigation', () => {
  test('Services page loads', async ({ page }) => {
    const response = await page.goto('/services');
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/services/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('About page loads', async ({ page }) => {
    const response = await page.goto('/about');
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/about/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('Contact page loads', async ({ page }) => {
    const response = await page.goto('/contact');
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/contact/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('nav links have correct hrefs', async ({ page }) => {
    await page.goto('/');
    // Verify links exist with correct destinations without clicking
    await expect(page.locator('a[href="/services"]').first()).toBeVisible();
    await expect(page.locator('a[href="/about"]').first()).toBeVisible();
    await expect(page.locator('a[href="/contact"]').first()).toBeVisible();
  });

  test('logo links to homepage', async ({ page }) => {
    await page.goto('/about');
    const logoLink = page.locator('a[href="/"]').first();
    await expect(logoLink).toBeVisible();
    const href = await logoLink.getAttribute('href');
    expect(href).toBe('/');
  });
});
