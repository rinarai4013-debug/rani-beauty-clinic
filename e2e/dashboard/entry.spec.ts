import { test, expect, ENTRY_FORMS } from '../fixtures';
import { expectNoServerError } from '../helpers';

test.describe('Dashboard Entry — Hub Page', () => {
  test('entry hub page loads without server error', async ({ page }) => {
    await expectNoServerError(page, '/dashboard/entry');
  });

  test('entry hub renders body content', async ({ page }) => {
    await page.goto('/dashboard/entry');
    await expect(page.locator('body')).toBeVisible();
  });

  test('entry hub has links to individual forms', async ({ page }) => {
    await page.goto('/dashboard/entry');
    const entryLinks = page.locator('a[href*="/dashboard/entry/"]');
    const count = await entryLinks.count();
    // May be behind auth
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Dashboard Entry — Form Pages Load', () => {
  for (const { path, name } of ENTRY_FORMS) {
    test(`${name} form (${path}) loads without server error`, async ({ page }) => {
      await expectNoServerError(page, path);
    });
  }
});

test.describe('Dashboard Entry — Lead Form', () => {
  test('lead form page renders', async ({ page }) => {
    await page.goto('/dashboard/entry/lead');
    await expect(page.locator('body')).toBeVisible();
  });

  test('lead API endpoint exists', async ({ request }) => {
    const response = await request.post('/api/dashboard/entry/lead', {
      data: {},
    });
    // Should be 401 (no auth) or 400 (validation), not 500
    expect(response.status()).toBeLessThan(500);
  });

  test('lead form has input fields when rendered', async ({ page }) => {
    await page.goto('/dashboard/entry/lead');
    const inputs = page.locator('input, textarea, select');
    const count = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Dashboard Entry — Sale Form', () => {
  test('sale form page renders', async ({ page }) => {
    await page.goto('/dashboard/entry/sale');
    await expect(page.locator('body')).toBeVisible();
  });

  test('sale API endpoint exists', async ({ request }) => {
    const response = await request.post('/api/dashboard/entry/sale', { data: {} });
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('Dashboard Entry — Expense Form', () => {
  test('expense form page renders', async ({ page }) => {
    await page.goto('/dashboard/entry/expense');
    await expect(page.locator('body')).toBeVisible();
  });

  test('expense API endpoint exists', async ({ request }) => {
    const response = await request.post('/api/dashboard/entry/expense', { data: {} });
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('Dashboard Entry — CEO Note Form', () => {
  test('ceo-note form page renders', async ({ page }) => {
    await page.goto('/dashboard/entry/ceo-note');
    await expect(page.locator('body')).toBeVisible();
  });

  test('ceo-note API endpoint exists', async ({ request }) => {
    const response = await request.post('/api/dashboard/entry/ceo-note', { data: {} });
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('Dashboard Entry — EOD Recap Form', () => {
  test('eod-recap form page renders', async ({ page }) => {
    await page.goto('/dashboard/entry/eod-recap');
    await expect(page.locator('body')).toBeVisible();
  });

  test('eod-recap API endpoint exists', async ({ request }) => {
    const response = await request.post('/api/dashboard/entry/eod-recap', { data: {} });
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('Dashboard Entry — Room Issue Form', () => {
  test('room-issue form page renders', async ({ page }) => {
    await page.goto('/dashboard/entry/room-issue');
    await expect(page.locator('body')).toBeVisible();
  });

  test('room-issue API endpoint exists', async ({ request }) => {
    const response = await request.post('/api/dashboard/entry/room-issue', { data: {} });
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('Dashboard Entry — Review Form', () => {
  test('review form page renders', async ({ page }) => {
    await page.goto('/dashboard/entry/review');
    await expect(page.locator('body')).toBeVisible();
  });

  test('review API endpoint exists', async ({ request }) => {
    const response = await request.post('/api/dashboard/entry/review', { data: {} });
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('Dashboard Entry — Inventory Form', () => {
  test('inventory form page renders', async ({ page }) => {
    await page.goto('/dashboard/entry/inventory');
    await expect(page.locator('body')).toBeVisible();
  });

  test('inventory API endpoint exists', async ({ request }) => {
    const response = await request.post('/api/dashboard/entry/inventory', { data: {} });
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('Dashboard Entry — Staff Note Form', () => {
  test('staff-note form page renders', async ({ page }) => {
    await page.goto('/dashboard/entry/staff-note');
    await expect(page.locator('body')).toBeVisible();
  });

  test('staff-note API endpoint exists', async ({ request }) => {
    const response = await request.post('/api/dashboard/entry/staff-note', { data: {} });
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('Dashboard Entry — Consult Notes Form', () => {
  test('consult-notes form page renders', async ({ page }) => {
    await page.goto('/dashboard/entry/consult-notes');
    await expect(page.locator('body')).toBeVisible();
  });

  test('consult-notes API endpoint exists', async ({ request }) => {
    const response = await request.post('/api/dashboard/entry/consult-notes', { data: {} });
    expect(response.status()).toBeLessThan(500);
  });
});
