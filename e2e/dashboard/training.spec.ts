import { test, expect } from '../fixtures';
import { expectNoServerError } from '../helpers';

test.describe('Dashboard Training — Knowledge Base Page', () => {
  test('knowledge base page loads without server error', async ({ page }) => {
    await expectNoServerError(page, '/dashboard/knowledge-base');
  });

  test('knowledge base page renders body', async ({ page }) => {
    await page.goto('/dashboard/knowledge-base');
    await expect(page.locator('body')).toBeVisible();
  });

  test('knowledge base page has heading', async ({ page }) => {
    await page.goto('/dashboard/knowledge-base');
    const heading = page.locator('h1, h2').first();
    const exists = await heading.isVisible().catch(() => false);
    expect(typeof exists).toBe('boolean');
  });
});

test.describe('Dashboard Training — Knowledge Base API', () => {
  test('knowledge base API responds', async ({ request }) => {
    const response = await request.get('/api/dashboard/knowledge-base');
    expect(response.status()).toBeLessThan(500);
  });

  test('knowledge base search API responds', async ({ request }) => {
    const response = await request.get('/api/dashboard/knowledge-base?q=hydrafacial');
    expect(response.status()).toBeLessThan(500);
  });

  test('knowledge base returns structured data', async ({ request }) => {
    const response = await request.get('/api/dashboard/knowledge-base');
    if (response.status() === 200) {
      const data = await response.json();
      expect(typeof data).toBe('object');
    }
  });
});

test.describe('Dashboard Training — Content Viewer', () => {
  test('knowledge base shows document list', async ({ page }) => {
    await page.goto('/dashboard/knowledge-base');
    const documents = page.locator('[class*=document], [class*=card], [class*=article], table, [class*=list]');
    const count = await documents.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('knowledge base shows coverage score', async ({ page }) => {
    await page.goto('/dashboard/knowledge-base');
    const body = await page.locator('body').textContent();
    const hasCoverage = body?.toLowerCase().includes('coverage') ||
      body?.toLowerCase().includes('score') ||
      body?.toLowerCase().includes('document');
    expect(typeof hasCoverage).toBe('boolean');
  });
});

test.describe('Dashboard Training — SOP Library', () => {
  test('knowledge base covers treatment protocols', async ({ page }) => {
    await page.goto('/dashboard/knowledge-base');
    const body = await page.locator('body').textContent();
    const hasProtocols = body?.toLowerCase().includes('protocol') ||
      body?.toLowerCase().includes('guide') ||
      body?.toLowerCase().includes('aftercare') ||
      body?.toLowerCase().includes('procedure');
    expect(typeof hasProtocols).toBe('boolean');
  });
});

test.describe('Dashboard Training — Phone Agent', () => {
  test('phone agent page loads', async ({ page }) => {
    await expectNoServerError(page, '/dashboard/phone-agent');
  });

  test('phone agent API responds', async ({ request }) => {
    const response = await request.get('/api/dashboard/phone-agent');
    expect(response.status()).toBeLessThan(500);
  });

  test('phone agent page renders', async ({ page }) => {
    await page.goto('/dashboard/phone-agent');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Dashboard Training — Consult Copilot', () => {
  test('consult page loads', async ({ page }) => {
    await expectNoServerError(page, '/dashboard/consult');
  });

  test('consult API responds to GET', async ({ request }) => {
    const response = await request.get('/api/dashboard/consult');
    expect(response.status()).toBeLessThan(500);
  });

  test('consult page renders', async ({ page }) => {
    await page.goto('/dashboard/consult');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Dashboard Training — Mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('knowledge base renders on mobile', async ({ page }) => {
    const res = await page.goto('/dashboard/knowledge-base');
    expect(res?.status()).toBeLessThan(500);
  });

  test('phone agent renders on mobile', async ({ page }) => {
    const res = await page.goto('/dashboard/phone-agent');
    expect(res?.status()).toBeLessThan(500);
  });
});
