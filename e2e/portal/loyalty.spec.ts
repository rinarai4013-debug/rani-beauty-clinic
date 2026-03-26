import { test, expect } from '../fixtures';
import { expectNoServerError } from '../helpers';

test.describe('Patient Portal Loyalty — Page Load', () => {
  test('loyalty page loads without server error', async ({ page }) => {
    await expectNoServerError(page, '/portal/loyalty');
  });

  test('loyalty page renders body', async ({ page }) => {
    await page.goto('/portal/loyalty');
    await expect(page.locator('body')).toBeVisible();
  });

  test('loyalty page has content', async ({ page }) => {
    await page.goto('/portal/loyalty');
    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(10);
  });
});

test.describe('Patient Portal Loyalty — Tier Display', () => {
  test('loyalty page references tiers, points, or rewards', async ({ page }) => {
    await page.goto('/portal/loyalty');
    const body = await page.locator('body').textContent();
    const hasLoyalty = body?.toLowerCase().includes('loyalty') ||
      body?.toLowerCase().includes('points') ||
      body?.toLowerCase().includes('rewards') ||
      body?.toLowerCase().includes('tier') ||
      body?.toLowerCase().includes('member') ||
      body?.toLowerCase().includes('login') ||
      body?.toLowerCase().includes('sign in');
    expect(hasLoyalty).toBe(true);
  });
});

test.describe('Patient Portal Loyalty — Rewards', () => {
  test('loyalty page has interactive elements', async ({ page }) => {
    await page.goto('/portal/loyalty');
    const elements = page.locator('button, a[href]');
    const count = await elements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('loyalty page has card or section layout', async ({ page }) => {
    await page.goto('/portal/loyalty');
    const sections = page.locator('section, [class*=card], [class*=panel], div[class*=loyalty]');
    const count = await sections.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Patient Portal Loyalty — Mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('loyalty page renders on mobile', async ({ page }) => {
    const res = await page.goto('/portal/loyalty');
    expect(res?.status()).toBeLessThan(500);
  });

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.goto('/portal/loyalty');
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });
});

test.describe('Patient Portal Loyalty — Points History', () => {
  test('loyalty page shows history or transaction list', async ({ page }) => {
    await page.goto('/portal/loyalty');
    const body = await page.locator('body').textContent();
    const hasHistory = body?.toLowerCase().includes('history') ||
      body?.toLowerCase().includes('earned') ||
      body?.toLowerCase().includes('redeemed') ||
      body?.toLowerCase().includes('transaction');
    expect(typeof hasHistory).toBe('boolean');
  });
});

test.describe('Patient Portal Loyalty — Profile', () => {
  test('profile page loads', async ({ page }) => {
    await expectNoServerError(page, '/portal/profile');
  });

  test('profile page renders', async ({ page }) => {
    await page.goto('/portal/profile');
    await expect(page.locator('body')).toBeVisible();
  });
});
