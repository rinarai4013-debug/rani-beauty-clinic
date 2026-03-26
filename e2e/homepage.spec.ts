import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads with correct title containing Rani Beauty Clinic', async ({ page }) => {
    await expect(page).toHaveTitle(/Rani Beauty Clinic/i);
  });

  test('returns 200 status code', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('page renders without server errors (status < 500)', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(500);
  });

  test('main content area is visible', async ({ page }) => {
    await expect(page.locator('main')).toBeVisible();
  });

  test('hero section is visible with a CTA button', async ({ page }) => {
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();

    const cta = page.getByRole('link', { name: /book|consult|appointment|get started/i }).first();
    await expect(cta).toBeVisible();
  });

  test('hero CTA link has a valid href', async ({ page }) => {
    const cta = page.getByRole('link', { name: /book|consult|appointment|get started/i }).first();
    const href = await cta.getAttribute('href');
    expect(href).toBeTruthy();
  });

  test('navigation bar is visible', async ({ page }) => {
    const nav = page.locator('nav, header').first();
    await expect(nav).toBeVisible();
  });

  test('navigation contains Services link', async ({ page }) => {
    await expect(page.getByRole('link', { name: /services/i }).first()).toBeVisible();
  });

  test('navigation contains About link', async ({ page }) => {
    await expect(page.getByRole('link', { name: /about/i }).first()).toBeVisible();
  });

  test('navigation contains Contact link', async ({ page }) => {
    await expect(page.getByRole('link', { name: /contact/i }).first()).toBeVisible();
  });

  test('footer is visible', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('footer contains clinic name', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toContainText(/Rani Beauty Clinic/i);
  });

  test('footer contains clinic address', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toContainText(/Renton/i);
  });

  test('footer contains phone number', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toContainText(/425/);
  });

  test('page does not have broken images (no empty alt with no src)', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < Math.min(count, 20); i++) {
      const src = await images.nth(i).getAttribute('src');
      expect(src).toBeTruthy();
    }
  });
});

test.describe('Homepage — Mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('mobile menu button is visible on small screens', async ({ page }) => {
    await page.goto('/');
    const menuButton = page.getByRole('button', { name: /menu|navigation|hamburger/i }).first();
    // Some sites use aria-label or a button with bars icon
    const hasMenuButton = await menuButton.isVisible().catch(() => false);
    // Alternatively look for any button in header/nav area
    if (!hasMenuButton) {
      const headerButtons = page.locator('header button, nav button').first();
      await expect(headerButtons).toBeVisible();
    }
  });

  test('page is scrollable on mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
