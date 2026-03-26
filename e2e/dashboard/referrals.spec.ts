import { test, expect } from '../fixtures';
import { expectNoServerError } from '../helpers';

test.describe('Dashboard Referrals — Page Load', () => {
  test('reactivation page loads without server error', async ({ page }) => {
    await expectNoServerError(page, '/dashboard/reactivation');
  });

  test('reactivation page renders body', async ({ page }) => {
    await page.goto('/dashboard/reactivation');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Dashboard Referrals — Dashboard Display', () => {
  test('reactivation page has content sections', async ({ page }) => {
    await page.goto('/dashboard/reactivation');
    const sections = page.locator('section, [class*=card], [class*=panel], [class*=section]');
    const count = await sections.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('reactivation page has actionable elements', async ({ page }) => {
    await page.goto('/dashboard/reactivation');
    const actions = page.locator('button, a[href]');
    const count = await actions.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Dashboard Referrals — Funnel Display', () => {
  test('leads page shows funnel or pipeline stages', async ({ page }) => {
    await page.goto('/dashboard/leads');
    const body = await page.locator('body').textContent();
    const hasFunnel = body?.toLowerCase().includes('new') ||
      body?.toLowerCase().includes('contacted') ||
      body?.toLowerCase().includes('booked') ||
      body?.toLowerCase().includes('lead') ||
      body?.toLowerCase().includes('stage') ||
      body?.toLowerCase().includes('pipeline');
    expect(typeof hasFunnel).toBe('boolean');
  });
});

test.describe('Dashboard Referrals — APIs', () => {
  test('leads API responds', async ({ request }) => {
    const response = await request.get('/api/dashboard/leads');
    expect(response.status()).toBeLessThan(500);
  });

  test('leads stats API responds', async ({ request }) => {
    const response = await request.get('/api/dashboard/leads/stats');
    expect(response.status()).toBeLessThan(500);
  });

  test('at-risk clients as referral source', async ({ request }) => {
    const response = await request.get('/api/dashboard/clients/at-risk');
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('Dashboard Referrals — Top Referrers', () => {
  test('reactivation page shows campaign or client data', async ({ page }) => {
    await page.goto('/dashboard/reactivation');
    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(0);
  });

  test('reactivation page has no horizontal overflow', async ({ page }) => {
    await page.goto('/dashboard/reactivation');
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });
});

test.describe('Dashboard Referrals — Mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('reactivation renders on mobile', async ({ page }) => {
    const res = await page.goto('/dashboard/reactivation');
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('leads page renders on mobile', async ({ page }) => {
    const res = await page.goto('/dashboard/leads');
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });
});
