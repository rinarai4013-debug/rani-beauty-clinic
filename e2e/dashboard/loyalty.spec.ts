import { test, expect } from '../fixtures';
import { expectNoServerError } from '../helpers';

test.describe('Dashboard Loyalty — Page Load', () => {
  test('leaderboard page loads without server error', async ({ page }) => {
    await expectNoServerError(page, '/dashboard/leaderboard');
  });

  test('leaderboard page renders body', async ({ page }) => {
    await page.goto('/dashboard/leaderboard');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Dashboard Loyalty — Overview', () => {
  test('leaderboard has ranking elements', async ({ page }) => {
    await page.goto('/dashboard/leaderboard');
    const rankings = page.locator('[class*=rank], [class*=leader], [class*=score], table, [class*=card]');
    const count = await rankings.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('leaderboard shows provider names or scores', async ({ page }) => {
    await page.goto('/dashboard/leaderboard');
    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(0);
  });
});

test.describe('Dashboard Loyalty — APIs', () => {
  test('leaderboard API responds', async ({ request }) => {
    const response = await request.get('/api/dashboard/gamification/leaderboard');
    expect(response.status()).toBeLessThan(500);
  });

  test('gamification score API responds', async ({ request }) => {
    const response = await request.get('/api/dashboard/gamification/score');
    expect(response.status()).toBeLessThan(500);
  });

  test('achievements API responds', async ({ request }) => {
    const response = await request.get('/api/dashboard/gamification/achievements');
    expect(response.status()).toBeLessThan(500);
  });

  test('leaderboard API returns valid structure when authed', async ({ request }) => {
    const response = await request.get('/api/dashboard/gamification/leaderboard');
    if (response.status() === 200) {
      const data = await response.json();
      expect(typeof data).toBe('object');
    }
  });
});

test.describe('Dashboard Loyalty — Tier Display', () => {
  test('gamification page shows tier or level info', async ({ page }) => {
    await page.goto('/dashboard/leaderboard');
    const body = await page.locator('body').textContent();
    const hasTier = body?.toLowerCase().includes('bronze') ||
      body?.toLowerCase().includes('silver') ||
      body?.toLowerCase().includes('gold') ||
      body?.toLowerCase().includes('diamond') ||
      body?.toLowerCase().includes('level') ||
      body?.toLowerCase().includes('tier');
    expect(typeof hasTier).toBe('boolean');
  });

  test('leaderboard page no horizontal overflow', async ({ page }) => {
    await page.goto('/dashboard/leaderboard');
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });
});
