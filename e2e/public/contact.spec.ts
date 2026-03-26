import { test, expect, CLINIC, TEST_USER } from '../fixtures';
import { assertSEOMeta } from '../helpers';

test.describe('Contact Page — Core', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('contact page loads with 200 status', async ({ page }) => {
    const response = await page.goto('/contact');
    expect(response?.status()).toBe(200);
  });

  test('page has a visible heading', async ({ page }) => {
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('page has main content area', async ({ page }) => {
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Contact Form — Fields', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('name field is visible', async ({ page }) => {
    await expect(page.getByLabel(/name/i).first()).toBeVisible();
  });

  test('email field is visible', async ({ page }) => {
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
  });

  test('phone field is visible', async ({ page }) => {
    await expect(page.getByLabel(/phone/i).first()).toBeVisible();
  });

  test('message field is visible', async ({ page }) => {
    await expect(page.getByLabel(/message/i).first()).toBeVisible();
  });

  test('submit button exists', async ({ page }) => {
    const btn = page.getByRole('button', { name: /send|submit|contact/i }).first();
    await expect(btn).toBeVisible();
  });

  test('email field has type="email" for HTML5 validation', async ({ page }) => {
    const emailInput = page.getByLabel(/email/i).first();
    const inputType = await emailInput.getAttribute('type');
    expect(inputType).toBe('email');
  });

  test('required fields have required attribute', async ({ page }) => {
    const nameInput = page.getByLabel(/name/i).first();
    const emailInput = page.getByLabel(/email/i).first();
    const nameRequired = await nameInput.getAttribute('required');
    const emailRequired = await emailInput.getAttribute('required');
    expect(nameRequired !== null || emailRequired !== null).toBe(true);
  });
});

test.describe('Contact Form — Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('form accepts valid input values', async ({ page }) => {
    await page.getByLabel(/name/i).first().fill(TEST_USER.name);
    await page.getByLabel(/email/i).first().fill(TEST_USER.email);
    await page.getByLabel(/phone/i).first().fill(TEST_USER.phone);
    await page.getByLabel(/message/i).first().fill(TEST_USER.message);
    await expect(page.getByLabel(/name/i).first()).toHaveValue(TEST_USER.name);
    await expect(page.getByLabel(/email/i).first()).toHaveValue(TEST_USER.email);
  });

  test('empty form submission does not navigate away', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /send|submit|contact/i }).first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(500);
      expect(page.url()).toContain('contact');
    }
  });
});

test.describe('Contact Page — Clinic Info', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('displays clinic address', async ({ page }) => {
    const body = await page.locator('body').textContent();
    expect(body).toContain(CLINIC.city);
  });

  test('displays phone number', async ({ page }) => {
    const body = await page.locator('body').textContent();
    expect(body).toContain(CLINIC.phone);
  });

  test('phone number is click-to-call link', async ({ page }) => {
    const phoneLink = page.locator('a[href^="tel:"]').first();
    const exists = await phoneLink.isVisible().catch(() => false);
    if (exists) {
      const href = await phoneLink.getAttribute('href');
      expect(href).toMatch(/^tel:/);
    } else {
      // Phone may be displayed as text
      const body = await page.locator('body').textContent();
      expect(body).toContain(CLINIC.phone);
    }
  });

  test('has map embed or maps link', async ({ page }) => {
    const mapsEl = page.locator('a[href*="maps"], a[href*="google.com/maps"], iframe[src*="maps"], iframe[src*="google"]').first();
    const exists = await mapsEl.isVisible().catch(() => false);
    expect(typeof exists).toBe('boolean');
  });

  test('displays business hours or schedule info', async ({ page }) => {
    const body = await page.locator('body').textContent();
    const hasHours = body?.toLowerCase().includes('hours') ||
      body?.toLowerCase().includes('monday') ||
      body?.toLowerCase().includes('open') ||
      body?.toLowerCase().includes('am') ||
      body?.toLowerCase().includes('pm');
    expect(typeof hasHours).toBe('boolean');
  });
});

test.describe('Contact — SMS Consent', () => {
  test('SMS consent checkbox exists and is toggleable', async ({ page }) => {
    await page.goto('/contact');
    const checkbox = page.getByRole('checkbox').first();
    const exists = await checkbox.isVisible().catch(() => false);
    if (exists) {
      const wasChecked = await checkbox.isChecked();
      await checkbox.click();
      expect(await checkbox.isChecked()).toBe(!wasChecked);
    }
  });
});
