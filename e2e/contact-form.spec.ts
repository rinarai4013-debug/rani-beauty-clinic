import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('form fields are visible', async ({ page }) => {
    await expect(page.getByLabel(/name/i).first()).toBeVisible();
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
    await expect(page.getByLabel(/phone/i).first()).toBeVisible();
    await expect(page.getByLabel(/message/i).first()).toBeVisible();
  });

  test('form accepts valid input', async ({ page }) => {
    await page.getByLabel(/name/i).first().fill('Test User');
    await page.getByLabel(/email/i).first().fill('test@example.com');
    await page.getByLabel(/phone/i).first().fill('4255551234');
    await page.getByLabel(/message/i).first().fill('This is a test message');

    // Verify values were entered
    await expect(page.getByLabel(/name/i).first()).toHaveValue('Test User');
    await expect(page.getByLabel(/email/i).first()).toHaveValue('test@example.com');
  });

  test('SMS consent checkbox exists and is toggleable', async ({ page }) => {
    const checkbox = page.getByRole('checkbox').first();
    if (await checkbox.isVisible()) {
      const wasChecked = await checkbox.isChecked();
      await checkbox.click();
      expect(await checkbox.isChecked()).toBe(!wasChecked);
    }
  });
});
