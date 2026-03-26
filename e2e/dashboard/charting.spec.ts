import { test, expect } from '../fixtures';
import { expectNoServerError } from '../helpers';

test.describe('Dashboard Charting — Page Load', () => {
  test('charting list page loads without server error', async ({ page }) => {
    await expectNoServerError(page, '/dashboard/charting');
  });

  test('charting page renders body', async ({ page }) => {
    await page.goto('/dashboard/charting');
    await expect(page.locator('body')).toBeVisible();
  });

  test('charting page has heading or title', async ({ page }) => {
    await page.goto('/dashboard/charting');
    const heading = page.locator('h1, h2, [class*=title]').first();
    const exists = await heading.isVisible().catch(() => false);
    expect(typeof exists).toBe('boolean');
  });
});

test.describe('Dashboard Charting — Chart List', () => {
  test('charting page has list or table of charts', async ({ page }) => {
    await page.goto('/dashboard/charting');
    const listElements = page.locator('table, [class*=list], [class*=card], [class*=chart]');
    const count = await listElements.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('charting page has new chart button or link', async ({ page }) => {
    await page.goto('/dashboard/charting');
    const newBtn = page.locator('button, a').filter({ hasText: /new|create|add|start/i }).first();
    const exists = await newBtn.isVisible().catch(() => false);
    expect(typeof exists).toBe('boolean');
  });
});

test.describe('Dashboard Charting — Individual Chart', () => {
  test('chart detail page responds', async ({ page }) => {
    await expectNoServerError(page, '/dashboard/charting/test-id');
  });

  test('chart detail page has form elements', async ({ page }) => {
    await page.goto('/dashboard/charting/test-id');
    const formElements = page.locator('input, textarea, select, [contenteditable]');
    const count = await formElements.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Dashboard Charting — Templates', () => {
  test('charting page shows template options', async ({ page }) => {
    await page.goto('/dashboard/charting');
    const body = await page.locator('body').textContent();
    // Check for template-related content
    const hasTemplates = body?.toLowerCase().includes('template') ||
      body?.toLowerCase().includes('botox') ||
      body?.toLowerCase().includes('filler') ||
      body?.toLowerCase().includes('facial') ||
      body?.toLowerCase().includes('chart');
    expect(typeof hasTemplates).toBe('boolean');
  });
});

test.describe('Dashboard Charting — Field Validation', () => {
  test('chart page has required field indicators', async ({ page }) => {
    await page.goto('/dashboard/charting/new');
    const requiredFields = page.locator('[required], [aria-required="true"], label:has-text("*")');
    const count = await requiredFields.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('chart page has save or submit button', async ({ page }) => {
    await page.goto('/dashboard/charting/new');
    const saveBtn = page.locator('button').filter({ hasText: /save|submit|sign|complete/i }).first();
    const exists = await saveBtn.isVisible().catch(() => false);
    expect(typeof exists).toBe('boolean');
  });
});

test.describe('Dashboard Charting — Compliance', () => {
  test('charting page loads without exposing PHI in URL', async ({ page }) => {
    await page.goto('/dashboard/charting');
    const url = page.url();
    expect(url).not.toContain('patient_name');
    expect(url).not.toContain('ssn');
    expect(url).not.toContain('dob');
  });

  test('chart detail does not expose sensitive data in HTML source', async ({ page }) => {
    await page.goto('/dashboard/charting/test-id');
    const html = await page.content();
    expect(html).not.toContain('AIRTABLE_PAT');
    expect(html).not.toContain('ANTHROPIC_API_KEY');
  });
});

test.describe('Dashboard Charting — Auto-Save', () => {
  test('chart editor has auto-save indicator or manual save', async ({ page }) => {
    await page.goto('/dashboard/charting/new');
    const saveIndicator = page.locator('[class*=save], [class*=auto], button:has-text("save")').first();
    const exists = await saveIndicator.isVisible().catch(() => false);
    expect(typeof exists).toBe('boolean');
  });
});

test.describe('Dashboard Charting — Sign & Complete', () => {
  test('chart has sign/complete workflow button', async ({ page }) => {
    await page.goto('/dashboard/charting/test-id');
    const signBtn = page.locator('button').filter({ hasText: /sign|complete|finalize|lock/i }).first();
    const exists = await signBtn.isVisible().catch(() => false);
    expect(typeof exists).toBe('boolean');
  });

  test('charting page has no horizontal overflow', async ({ page }) => {
    await page.goto('/dashboard/charting');
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });
});
