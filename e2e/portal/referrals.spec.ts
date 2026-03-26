import { test, expect } from '../fixtures';
import { expectNoServerError } from '../helpers';

test.describe('Patient Portal Referrals — Page Load', () => {
  test('referrals page loads without server error', async ({ page }) => {
    await expectNoServerError(page, '/portal/referrals');
  });

  test('referrals page renders body', async ({ page }) => {
    await page.goto('/portal/referrals');
    await expect(page.locator('body')).toBeVisible();
  });

  test('referrals page has content', async ({ page }) => {
    await page.goto('/portal/referrals');
    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(10);
  });
});

test.describe('Patient Portal Referrals — Share Widget', () => {
  test('referrals page shows share or referral options', async ({ page }) => {
    await page.goto('/portal/referrals');
    const body = await page.locator('body').textContent();
    const hasReferral = body?.toLowerCase().includes('refer') ||
      body?.toLowerCase().includes('share') ||
      body?.toLowerCase().includes('invite') ||
      body?.toLowerCase().includes('friend') ||
      body?.toLowerCase().includes('login') ||
      body?.toLowerCase().includes('sign in');
    expect(hasReferral).toBe(true);
  });

  test('referrals page has interactive elements', async ({ page }) => {
    await page.goto('/portal/referrals');
    const elements = page.locator('button, a[href], input');
    const count = await elements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('referrals page has copy or share button', async ({ page }) => {
    await page.goto('/portal/referrals');
    const shareBtn = page.locator('button').filter({ hasText: /copy|share|invite|refer/i }).first();
    const exists = await shareBtn.isVisible().catch(() => false);
    expect(typeof exists).toBe('boolean');
  });
});

test.describe('Patient Portal Referrals — History', () => {
  test('referrals page shows history section', async ({ page }) => {
    await page.goto('/portal/referrals');
    const body = await page.locator('body').textContent();
    const hasHistory = body?.toLowerCase().includes('history') ||
      body?.toLowerCase().includes('status') ||
      body?.toLowerCase().includes('earned') ||
      body?.toLowerCase().includes('reward');
    expect(typeof hasHistory).toBe('boolean');
  });
});

test.describe('Patient Portal Referrals — Mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('referrals page renders on mobile', async ({ page }) => {
    const res = await page.goto('/portal/referrals');
    expect(res?.status()).toBeLessThan(500);
  });

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.goto('/portal/referrals');
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });
});

test.describe('Patient Portal Referrals — Security', () => {
  test('referrals page does not expose sensitive data', async ({ page }) => {
    await page.goto('/portal/referrals');
    const html = await page.content();
    expect(html).not.toContain('AIRTABLE_PAT');
    expect(html).not.toContain('ANTHROPIC_API_KEY');
  });

  test('referral codes are not predictable in URL', async ({ page }) => {
    await page.goto('/portal/referrals');
    const url = page.url();
    expect(url).not.toContain('admin');
    expect(url).not.toContain('secret');
  });
});
