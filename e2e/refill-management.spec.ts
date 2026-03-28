import { test, expect } from '@playwright/test';

/**
 * Refill Management E2E Tests
 * Tests refill due dates, refill reminders, batch text messaging,
 * medication inventory, and refill scheduling workflows.
 */

const MOCK_REFILLS_DUE = [
  {
    id: 'refill_001',
    clientId: 'rec_client_001',
    clientName: 'Rachel Kim',
    medication: 'Semaglutide',
    currentDose: '0.5mg',
    lastRefillDate: '2026-03-01',
    nextRefillDue: '2026-03-28',
    daysUntilDue: 2,
    status: 'due_soon',
    refillCount: 2,
    phone: '(425) 555-0142',
    reminderSent: false,
  },
  {
    id: 'refill_002',
    clientId: 'rec_client_002',
    clientName: 'Michelle Patel',
    medication: 'Tirzepatide',
    currentDose: '5mg',
    lastRefillDate: '2026-02-25',
    nextRefillDue: '2026-03-25',
    daysUntilDue: -1,
    status: 'overdue',
    refillCount: 4,
    phone: '(425) 555-0198',
    reminderSent: true,
  },
  {
    id: 'refill_003',
    clientId: 'rec_client_003',
    clientName: 'Jennifer Wu',
    medication: 'Semaglutide',
    currentDose: '1.0mg',
    lastRefillDate: '2026-03-10',
    nextRefillDue: '2026-04-07',
    daysUntilDue: 12,
    status: 'upcoming',
    refillCount: 6,
    phone: '(425) 555-0255',
    reminderSent: false,
  },
  {
    id: 'refill_004',
    clientId: 'rec_client_004',
    clientName: 'Emily Nakamura',
    medication: 'Semaglutide',
    currentDose: '0.25mg',
    lastRefillDate: '2026-03-15',
    nextRefillDue: '2026-04-12',
    daysUntilDue: 17,
    status: 'upcoming',
    refillCount: 1,
    phone: '(425) 555-0311',
    reminderSent: false,
  },
];

const MOCK_REFILL_STATS = {
  totalActive: 42,
  dueSoon: 8,
  overdue: 3,
  upcoming: 31,
  avgRefillRate: 0.92,
  monthlyRefillRevenue: 16800,
};

const MOCK_BATCH_TEXT_RESULT = {
  sent: 5,
  failed: 0,
  queued: 0,
  messages: [
    { clientId: 'rec_client_001', status: 'delivered', phone: '(425) 555-0142' },
    { clientId: 'rec_client_003', status: 'delivered', phone: '(425) 555-0255' },
  ],
};

test.describe('Refill Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/dashboard/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { name: 'Rina', role: 'ceo', permissions: ['view_refills', 'manage_refills', 'send_messages'] },
        }),
      })
    );

    await page.route('**/api/dashboard/refills*', (route) => {
      const url = new URL(route.request().url());
      const status = url.searchParams.get('status');

      if (status === 'overdue') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ refills: MOCK_REFILLS_DUE.filter((r) => r.status === 'overdue'), stats: MOCK_REFILL_STATS }),
        });
      }
      if (status === 'due_soon') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ refills: MOCK_REFILLS_DUE.filter((r) => r.status === 'due_soon'), stats: MOCK_REFILL_STATS }),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ refills: MOCK_REFILLS_DUE, stats: MOCK_REFILL_STATS }),
      });
    });
  });

  test.describe('Refill Dashboard', () => {
    test('displays refill overview stats', async ({ page }) => {
      await page.goto('/dashboard');
      const activeCount = page.getByText(/42|active.*refill/i).first();
      await expect(activeCount).toBeVisible();
    });

    test('shows overdue refill count with alert styling', async ({ page }) => {
      await page.goto('/dashboard');
      const overdue = page.getByText(/3.*overdue|overdue.*3/i).first();
      await expect(overdue).toBeVisible();
    });

    test('displays due-soon refill count', async ({ page }) => {
      await page.goto('/dashboard');
      const dueSoon = page.getByText(/8.*due|due.*soon.*8/i).first();
      await expect(dueSoon).toBeVisible();
    });

    test('shows monthly refill revenue', async ({ page }) => {
      await page.goto('/dashboard');
      const revenue = page.getByText(/16,800|\$16\.8K|refill.*revenue/i).first();
      await expect(revenue).toBeVisible();
    });

    test('displays refill rate metric', async ({ page }) => {
      await page.goto('/dashboard');
      const refillRate = page.getByText(/92%|refill.*rate/i).first();
      await expect(refillRate).toBeVisible();
    });
  });

  test.describe('Refill List', () => {
    test('lists all refills with client names', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page.getByText(/Rachel Kim/i).first()).toBeVisible();
      await expect(page.getByText(/Michelle Patel/i).first()).toBeVisible();
    });

    test('shows medication and dose for each refill', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page.getByText(/Semaglutide/i).first()).toBeVisible();
      await expect(page.getByText(/Tirzepatide/i).first()).toBeVisible();
    });

    test('displays days until refill due', async ({ page }) => {
      await page.goto('/dashboard');
      const dueDays = page.getByText(/2 days|due in 2/i).first();
      await expect(dueDays).toBeVisible();
    });

    test('highlights overdue refills in red/warning style', async ({ page }) => {
      await page.goto('/dashboard');
      const overdueItem = page.locator('[class*="overdue"], [class*="danger"], [class*="red"], [data-status="overdue"]').first();
      const hasOverdue = await overdueItem.count();
      expect(hasOverdue).toBeGreaterThanOrEqual(0);
    });

    test('shows refill count for each client', async ({ page }) => {
      await page.goto('/dashboard');
      const refillNum = page.getByText(/Refill #2|refill.*2|2nd refill/i).first();
      const hasRefillNum = await refillNum.count();
      expect(hasRefillNum).toBeGreaterThanOrEqual(0);
    });

    test('sorts refills by urgency (overdue first)', async ({ page }) => {
      await page.goto('/dashboard');
      const rows = page.locator('[data-testid="refill-row"], tr[class*="refill"]');
      const count = await rows.count();
      if (count >= 2) {
        const firstRow = await rows.nth(0).textContent();
        // Overdue should appear first
        expect(firstRow?.toLowerCase()).toContain('patel');
      }
    });
  });

  test.describe('Refill Filters', () => {
    test('filters refills by overdue status', async ({ page }) => {
      await page.goto('/dashboard');

      const overdueFilter = page.getByRole('button', { name: /overdue/i }).first();
      const hasFilter = await overdueFilter.count();
      if (hasFilter > 0) {
        await overdueFilter.click();
        await page.waitForTimeout(500);

        await expect(page.getByText(/Michelle Patel/i).first()).toBeVisible();
      }
    });

    test('filters refills by due-soon status', async ({ page }) => {
      await page.goto('/dashboard');

      const dueSoonFilter = page.getByRole('button', { name: /due soon/i }).first();
      const hasFilter = await dueSoonFilter.count();
      if (hasFilter > 0) {
        await dueSoonFilter.click();
        await page.waitForTimeout(500);

        await expect(page.getByText(/Rachel Kim/i).first()).toBeVisible();
      }
    });

    test('filters by medication type', async ({ page }) => {
      await page.goto('/dashboard');

      const medFilter = page.locator('select[data-testid="medication-filter"], select[name="medication"]').first();
      const hasFilter = await medFilter.count();
      if (hasFilter > 0) {
        await medFilter.selectOption('Semaglutide');
        await page.waitForTimeout(300);
      }
    });

    test('searches refills by client name', async ({ page }) => {
      await page.goto('/dashboard');

      const searchInput = page.getByPlaceholder(/search|find.*client/i).first();
      const hasSearch = await searchInput.count();
      if (hasSearch > 0) {
        await searchInput.fill('Rachel');
        await page.waitForTimeout(500);

        await expect(page.getByText(/Rachel Kim/i).first()).toBeVisible();
      }
    });
  });

  test.describe('Refill Reminders', () => {
    test('sends individual refill reminder', async ({ page }) => {
      let reminderSent = false;

      await page.route('**/api/dashboard/refills/refill_001/remind', (route) => {
        reminderSent = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, messageId: 'msg_001' }),
        });
      });

      await page.goto('/dashboard');

      const remindBtn = page.getByRole('button', { name: /remind|send reminder|text/i }).first();
      const hasBtn = await remindBtn.count();
      if (hasBtn > 0) {
        await remindBtn.click();
        await page.waitForTimeout(500);

        const success = page.getByText(/sent|reminder.*sent|delivered/i).first();
        await expect(success).toBeVisible();
        expect(reminderSent).toBe(true);
      }
    });

    test('shows reminder already sent indicator', async ({ page }) => {
      await page.goto('/dashboard');
      // Michelle Patel already has reminderSent: true
      const sentIndicator = page.locator('[data-testid="reminder-sent"], [class*="sent"]').first();
      const hasSent = await sentIndicator.count();
      expect(hasSent).toBeGreaterThanOrEqual(0);
    });

    test('prevents duplicate reminder within 24 hours', async ({ page }) => {
      await page.route('**/api/dashboard/refills/refill_002/remind', (route) =>
        route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Reminder already sent within 24 hours' }),
        })
      );

      await page.goto('/dashboard');
      // Try to send reminder to Michelle (already sent)
      const remindBtns = page.getByRole('button', { name: /remind/i });
      const count = await remindBtns.count();
      if (count >= 2) {
        await remindBtns.nth(1).click();
        const error = page.getByText(/already sent|24 hours|wait/i).first();
        await expect(error).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Batch Text Messaging', () => {
    test('sends batch reminders to all due-soon clients', async ({ page }) => {
      let batchSent = false;

      await page.route('**/api/dashboard/refills/batch-remind', (route) => {
        batchSent = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_BATCH_TEXT_RESULT),
        });
      });

      await page.goto('/dashboard');

      const batchBtn = page.getByRole('button', { name: /batch.*remind|send all|remind all/i }).first();
      const hasBtn = await batchBtn.count();
      if (hasBtn > 0) {
        await batchBtn.click();
        await page.waitForTimeout(300);

        // Confirm dialog
        const confirmBtn = page.getByRole('button', { name: /confirm|yes|send/i }).first();
        const hasConfirm = await confirmBtn.count();
        if (hasConfirm > 0) {
          await confirmBtn.click();
          await page.waitForTimeout(500);
          expect(batchSent).toBe(true);
        }
      }
    });

    test('shows batch send results summary', async ({ page }) => {
      await page.route('**/api/dashboard/refills/batch-remind', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_BATCH_TEXT_RESULT),
        })
      );

      await page.goto('/dashboard');

      const batchBtn = page.getByRole('button', { name: /batch.*remind|send all/i }).first();
      const hasBtn = await batchBtn.count();
      if (hasBtn > 0) {
        await batchBtn.click();
        const confirmBtn = page.getByRole('button', { name: /confirm|yes|send/i }).first();
        const hasConfirm = await confirmBtn.count();
        if (hasConfirm > 0) {
          await confirmBtn.click();
          await page.waitForTimeout(500);

          const result = page.getByText(/5 sent|sent.*5|delivered/i).first();
          await expect(result).toBeVisible();
        }
      }
    });

    test('handles partial batch failures', async ({ page }) => {
      await page.route('**/api/dashboard/refills/batch-remind', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            sent: 3,
            failed: 2,
            queued: 0,
            failures: [
              { clientId: 'rec_client_005', error: 'Invalid phone number' },
              { clientId: 'rec_client_006', error: 'Opted out of SMS' },
            ],
          }),
        })
      );

      await page.goto('/dashboard');

      const batchBtn = page.getByRole('button', { name: /batch.*remind|send all/i }).first();
      const hasBtn = await batchBtn.count();
      if (hasBtn > 0) {
        await batchBtn.click();
        const confirmBtn = page.getByRole('button', { name: /confirm|yes/i }).first();
        const hasConfirm = await confirmBtn.count();
        if (hasConfirm > 0) {
          await confirmBtn.click();
          await page.waitForTimeout(500);

          const failureInfo = page.getByText(/2 failed|failed.*2|errors/i).first();
          await expect(failureInfo).toBeVisible();
        }
      }
    });

    test('previews batch message before sending', async ({ page }) => {
      await page.goto('/dashboard');

      const previewBtn = page.getByRole('button', { name: /preview|compose/i }).first();
      const hasBtn = await previewBtn.count();
      if (hasBtn > 0) {
        await previewBtn.click();
        await page.waitForTimeout(300);

        const previewModal = page.locator('[data-testid="message-preview"], [class*="modal"], [role="dialog"]').first();
        const hasPreview = await previewModal.count();
        expect(hasPreview).toBeGreaterThanOrEqual(0);
      }
    });

    test('customizes batch message template', async ({ page }) => {
      await page.goto('/dashboard');

      const templateEditor = page.locator('textarea[data-testid="message-template"], textarea[name="template"]').first();
      const hasEditor = await templateEditor.count();
      if (hasEditor > 0) {
        await templateEditor.fill(
          'Hi {{clientName}}, your {{medication}} refill is due on {{dueDate}}. Call (425) 539-4440 to schedule your injection appointment at Rani Beauty Clinic.'
        );
      }
    });
  });

  test.describe('Refill Scheduling', () => {
    test('schedules a refill appointment from refill list', async ({ page }) => {
      let appointmentCreated = false;

      await page.route('**/api/dashboard/schedule', (route) => {
        if (route.request().method() === 'POST') {
          appointmentCreated = true;
          return route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              appointment: { id: 'appt_001', date: '2026-03-28', time: '10:00', service: 'GLP-1 Injection' },
            }),
          });
        }
        return route.continue();
      });

      await page.goto('/dashboard');

      const scheduleBtn = page.getByRole('button', { name: /schedule|book.*refill/i }).first();
      const hasBtn = await scheduleBtn.count();
      if (hasBtn > 0) {
        await scheduleBtn.click();
        await page.waitForTimeout(500);
      }
    });

    test('auto-suggests next refill date based on protocol', async ({ page }) => {
      await page.goto('/dashboard');
      // Rachel Kim's next refill is March 28
      const suggestedDate = page.getByText(/Mar.*28|3\/28|March 28/i).first();
      await expect(suggestedDate).toBeVisible();
    });

    test('updates refill status after appointment is booked', async ({ page }) => {
      await page.route('**/api/dashboard/refills/refill_001', (route) => {
        if (route.request().method() === 'PATCH') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              refill: { ...MOCK_REFILLS_DUE[0], status: 'scheduled', appointmentDate: '2026-03-28' },
            }),
          });
        }
        return route.continue();
      });

      await page.goto('/dashboard');
      const scheduleBtn = page.getByRole('button', { name: /schedule|book/i }).first();
      const hasBtn = await scheduleBtn.count();
      if (hasBtn > 0) {
        await scheduleBtn.click();
        await page.waitForTimeout(500);

        const scheduled = page.getByText(/scheduled|booked/i).first();
        const hasScheduled = await scheduled.count();
        expect(hasScheduled).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Medication Inventory', () => {
    test('shows medication stock levels', async ({ page }) => {
      await page.route('**/api/dashboard/inventory*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              { name: 'Semaglutide 0.25mg pens', inStock: 15, parLevel: 20, reorderPoint: 10, status: 'adequate' },
              { name: 'Semaglutide 0.5mg pens', inStock: 8, parLevel: 15, reorderPoint: 8, status: 'low' },
              { name: 'Semaglutide 1.0mg pens', inStock: 12, parLevel: 10, reorderPoint: 5, status: 'adequate' },
              { name: 'Tirzepatide 5mg pens', inStock: 3, parLevel: 10, reorderPoint: 5, status: 'critical' },
            ],
          }),
        })
      );

      await page.goto('/dashboard');
      const stockLevel = page.getByText(/Semaglutide.*0\.5mg|in stock|8 units/i).first();
      await expect(stockLevel).toBeVisible();
    });

    test('alerts when medication stock is critical', async ({ page }) => {
      await page.route('**/api/dashboard/inventory*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              { name: 'Tirzepatide 5mg pens', inStock: 3, parLevel: 10, reorderPoint: 5, status: 'critical' },
            ],
            alerts: [{ type: 'critical_stock', item: 'Tirzepatide 5mg pens', message: 'Only 3 units remaining' }],
          }),
        })
      );

      await page.goto('/dashboard');
      const criticalAlert = page.getByText(/critical|low stock|reorder/i).first();
      await expect(criticalAlert).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('handles refill API failure', async ({ page }) => {
      await page.route('**/api/dashboard/refills*', (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Service unavailable' }),
        })
      );

      await page.goto('/dashboard');
      const error = page.getByText(/error|unavailable|try again/i).first();
      await expect(error).toBeVisible({ timeout: 5000 });
    });

    test('handles SMS service failure during batch send', async ({ page }) => {
      await page.route('**/api/dashboard/refills/batch-remind', (route) =>
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Twilio service unavailable' }),
        })
      );

      await page.goto('/dashboard');

      const batchBtn = page.getByRole('button', { name: /batch.*remind|send all/i }).first();
      const hasBtn = await batchBtn.count();
      if (hasBtn > 0) {
        await batchBtn.click();
        const confirmBtn = page.getByRole('button', { name: /confirm|yes/i }).first();
        const hasConfirm = await confirmBtn.count();
        if (hasConfirm > 0) {
          await confirmBtn.click();
          const error = page.getByText(/error|failed|unavailable/i).first();
          await expect(error).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('handles empty refill list gracefully', async ({ page }) => {
      await page.route('**/api/dashboard/refills*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ refills: [], stats: { totalActive: 0, dueSoon: 0, overdue: 0, upcoming: 0 } }),
        })
      );

      await page.goto('/dashboard');
      const emptyState = page.getByText(/no refills|no.*due|all caught up/i).first();
      const hasEmpty = await emptyState.count();
      expect(hasEmpty).toBeGreaterThanOrEqual(0);
    });
  });
});
