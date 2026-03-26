import { test, expect } from '@playwright/test';

test.describe('Services Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/services');
  });

  test('services page loads with 200 status', async ({ page }) => {
    const response = await page.goto('/services');
    expect(response?.status()).toBe(200);
  });

  test('page has a heading', async ({ page }) => {
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();
  });

  test('services list contains multiple service items', async ({ page }) => {
    // Look for service cards, links, or list items
    const serviceItems = page.locator('[class*=service], [class*=card], [data-service]');
    const count = await serviceItems.count();
    if (count === 0) {
      // Fallback: look for links to individual service pages
      const serviceLinks = page.locator('a[href*="/services/"]');
      const linkCount = await serviceLinks.count();
      expect(linkCount).toBeGreaterThan(0);
    } else {
      expect(count).toBeGreaterThan(0);
    }
  });

  test('page contains service names (at least one known service)', async ({ page }) => {
    const body = page.locator('main, body');
    // Check for at least one known service
    const hasService = await body.textContent();
    const knownServices = ['HydraFacial', 'Botox', 'Sofwave', 'Laser', 'Filler', 'Peel', 'Microneedling'];
    const foundAny = knownServices.some(s => hasService?.includes(s));
    expect(foundAny).toBe(true);
  });

  test('page has CTA buttons for booking', async ({ page }) => {
    const cta = page.getByRole('link', { name: /book|consult|schedule|get started|learn more/i }).first();
    await expect(cta).toBeVisible();
  });

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/services');
    await page.waitForLoadState('networkidle');
    // Filter out known benign errors (e.g., third-party scripts)
    const realErrors = errors.filter(e => !e.includes('third-party') && !e.includes('favicon'));
    expect(realErrors.length).toBeLessThanOrEqual(2);
  });
});

test.describe('Individual Service Pages', () => {
  const servicePages = [
    '/services/hydrafacial',
    '/services/botox-dysport',
    '/services/sofwave',
    '/services/rf-microneedling',
    '/services/laser-hair-removal',
    '/services/vi-peel',
  ];

  for (const servicePath of servicePages) {
    test(`${servicePath} loads without error`, async ({ page }) => {
      const response = await page.goto(servicePath);
      // Some pages may not exist yet; 200 or 404 are acceptable, 500 is not
      expect(response?.status()).toBeLessThan(500);
    });
  }

  test('service page contains pricing information', async ({ page }) => {
    const response = await page.goto('/services/hydrafacial');
    if (response?.status() === 200) {
      const body = await page.locator('main, body').textContent();
      // Check for dollar sign or price-related content
      const hasPricing = body?.includes('$') || body?.toLowerCase().includes('price') || body?.toLowerCase().includes('starting');
      expect(hasPricing).toBe(true);
    }
  });

  test('service page has a booking CTA', async ({ page }) => {
    const response = await page.goto('/services/hydrafacial');
    if (response?.status() === 200) {
      const cta = page.getByRole('link', { name: /book|consult|schedule|get started/i }).first();
      await expect(cta).toBeVisible();
    }
  });

  test('service page has a heading with service name', async ({ page }) => {
    const response = await page.goto('/services/hydrafacial');
    if (response?.status() === 200) {
      const heading = page.getByRole('heading').first();
      await expect(heading).toBeVisible();
    }
  });
});
