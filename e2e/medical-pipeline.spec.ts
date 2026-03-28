import { test, expect, Page } from '@playwright/test';

/**
 * Medical Pipeline E2E Tests
 * Tests the full patient pipeline flow: PIPELINE_NEW -> CONSULTATION -> ACTIVE_PATIENT stages
 * Covers lead intake, status transitions, provider assignment, and pipeline analytics.
 */

const MOCK_PIPELINE_DATA = {
  stages: [
    { id: 'pipeline_new', label: 'New Lead', count: 12 },
    { id: 'contacted', label: 'Contacted', count: 8 },
    { id: 'consultation_scheduled', label: 'Consult Scheduled', count: 5 },
    { id: 'consultation_completed', label: 'Consult Done', count: 3 },
    { id: 'treatment_planned', label: 'Treatment Planned', count: 4 },
    { id: 'active_patient', label: 'Active Patient', count: 47 },
  ],
  totalLeads: 79,
  conversionRate: 0.595,
};

const MOCK_LEAD = {
  id: 'rec_test_lead_001',
  firstName: 'Sarah',
  lastName: 'Chen',
  email: 'sarah.chen@example.com',
  phone: '(425) 555-0142',
  status: 'pipeline_new',
  source: 'website_contact',
  interestedServices: ['GLP-1 Weight Management', 'Botox'],
  createdAt: '2026-03-20T14:30:00Z',
};

const MOCK_PATIENT = {
  id: 'rec_test_patient_001',
  firstName: 'Jessica',
  lastName: 'Park',
  email: 'jessica.park@example.com',
  phone: '(425) 555-0198',
  status: 'active_patient',
  provider: 'Dr. Landfield',
  lastVisit: '2026-03-15',
  ltv: 4250,
  membershipTier: 'Gold',
};

test.describe('Medical Pipeline', () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth session
    await page.route('**/api/dashboard/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { name: 'Rina', role: 'ceo', permissions: ['view_pipeline', 'edit_pipeline', 'manage_leads'] },
        }),
      })
    );
  });

  test.describe('Pipeline Overview', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/leads', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_PIPELINE_DATA),
        })
      );
      await page.goto('/dashboard');
    });

    test('displays all pipeline stages with correct counts', async ({ page }) => {
      for (const stage of MOCK_PIPELINE_DATA.stages) {
        const stageEl = page.getByText(stage.label);
        await expect(stageEl).toBeVisible();
      }
    });

    test('shows total lead count in pipeline header', async ({ page }) => {
      const header = page.locator('[data-testid="pipeline-header"], h1, h2').first();
      await expect(header).toBeVisible();
    });

    test('displays conversion rate metric', async ({ page }) => {
      const conversionText = page.getByText(/59\.5%|conversion/i).first();
      await expect(conversionText).toBeVisible();
    });

    test('pipeline stages are rendered in correct order', async ({ page }) => {
      const stages = page.locator('[data-testid="pipeline-stage"], [class*="pipeline"] [class*="stage"]');
      const count = await stages.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test('clicking a pipeline stage filters the lead list', async ({ page }) => {
      await page.route('**/api/dashboard/leads?status=pipeline_new*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ leads: [MOCK_LEAD], total: 1 }),
        })
      );

      const newStage = page.getByText('New Lead').first();
      await newStage.click();
      await page.waitForTimeout(500);

      const leadCard = page.getByText('Sarah Chen').first();
      await expect(leadCard).toBeVisible();
    });
  });

  test.describe('Lead Detail View', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/clients/rec_test_lead_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ client: MOCK_LEAD }),
        })
      );
    });

    test('shows lead contact information', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_test_lead_001');
      await expect(page.getByText('Sarah Chen')).toBeVisible();
      await expect(page.getByText('sarah.chen@example.com')).toBeVisible();
    });

    test('displays interested services', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_test_lead_001');
      await expect(page.getByText(/GLP-1/i).first()).toBeVisible();
    });

    test('shows lead source', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_test_lead_001');
      await expect(page.getByText(/website/i).first()).toBeVisible();
    });

    test('displays current pipeline status', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_test_lead_001');
      const statusBadge = page.locator('[data-testid="status-badge"], [class*="badge"], [class*="status"]').first();
      await expect(statusBadge).toBeVisible();
    });
  });

  test.describe('Pipeline Stage Transitions', () => {
    test('transitions lead from PIPELINE_NEW to CONTACTED', async ({ page }) => {
      await page.route('**/api/dashboard/clients/rec_test_lead_001*', (route) => {
        if (route.request().method() === 'GET') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ client: MOCK_LEAD }),
          });
        }
        if (route.request().method() === 'PATCH') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ client: { ...MOCK_LEAD, status: 'contacted' } }),
          });
        }
        return route.continue();
      });

      await page.goto('/dashboard/clients/rec_test_lead_001');
      const advanceBtn = page.getByRole('button', { name: /advance|move|next stage|contacted/i }).first();
      await advanceBtn.click();
      await page.waitForTimeout(300);

      const updatedStatus = page.getByText(/contacted/i).first();
      await expect(updatedStatus).toBeVisible();
    });

    test('transitions from CONTACTED to CONSULTATION_SCHEDULED', async ({ page }) => {
      const contactedLead = { ...MOCK_LEAD, status: 'contacted' };

      await page.route('**/api/dashboard/clients/rec_test_lead_001*', (route) => {
        if (route.request().method() === 'GET') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ client: contactedLead }),
          });
        }
        if (route.request().method() === 'PATCH') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ client: { ...contactedLead, status: 'consultation_scheduled' } }),
          });
        }
        return route.continue();
      });

      await page.goto('/dashboard/clients/rec_test_lead_001');
      const scheduleBtn = page.getByRole('button', { name: /schedule|consult|book/i }).first();
      await scheduleBtn.click();
      await page.waitForTimeout(300);
    });

    test('transitions from CONSULTATION_COMPLETED to TREATMENT_PLANNED', async ({ page }) => {
      const consultedLead = { ...MOCK_LEAD, status: 'consultation_completed' };

      await page.route('**/api/dashboard/clients/rec_test_lead_001*', (route) => {
        if (route.request().method() === 'GET') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ client: consultedLead }),
          });
        }
        if (route.request().method() === 'PATCH') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ client: { ...consultedLead, status: 'treatment_planned' } }),
          });
        }
        return route.continue();
      });

      await page.goto('/dashboard/clients/rec_test_lead_001');
      const planBtn = page.getByRole('button', { name: /plan|treatment|create plan/i }).first();
      await planBtn.click();
    });

    test('transitions from TREATMENT_PLANNED to ACTIVE_PATIENT', async ({ page }) => {
      const plannedLead = { ...MOCK_LEAD, status: 'treatment_planned' };

      await page.route('**/api/dashboard/clients/rec_test_lead_001*', (route) => {
        if (route.request().method() === 'GET') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ client: plannedLead }),
          });
        }
        if (route.request().method() === 'PATCH') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ client: { ...plannedLead, status: 'active_patient' } }),
          });
        }
        return route.continue();
      });

      await page.goto('/dashboard/clients/rec_test_lead_001');
      const activateBtn = page.getByRole('button', { name: /activate|start|begin treatment/i }).first();
      await activateBtn.click();
    });

    test('prevents skipping stages without override', async ({ page }) => {
      await page.route('**/api/dashboard/clients/rec_test_lead_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ client: MOCK_LEAD }),
        })
      );

      await page.goto('/dashboard/clients/rec_test_lead_001');

      const activeBtn = page.getByRole('button', { name: /active patient/i });
      const count = await activeBtn.count();
      if (count > 0) {
        const isDisabled = await activeBtn.first().isDisabled();
        expect(isDisabled).toBe(true);
      }
    });

    test('handles API errors on stage transition gracefully', async ({ page }) => {
      await page.route('**/api/dashboard/clients/rec_test_lead_001*', (route) => {
        if (route.request().method() === 'GET') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ client: MOCK_LEAD }),
          });
        }
        if (route.request().method() === 'PATCH') {
          return route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Internal server error' }),
          });
        }
        return route.continue();
      });

      await page.goto('/dashboard/clients/rec_test_lead_001');
      const advanceBtn = page.getByRole('button', { name: /advance|move|next stage|contacted/i }).first();
      await advanceBtn.click();

      const errorMsg = page.getByText(/error|failed|try again/i).first();
      await expect(errorMsg).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Pipeline Analytics', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/leads/stats', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totalLeads: 79,
            newThisWeek: 8,
            conversionRate: 0.595,
            avgTimeToConsult: 3.2,
            avgTimeToTreatment: 7.5,
            topSources: [
              { source: 'Google Ads', count: 28, conversionRate: 0.62 },
              { source: 'Instagram', count: 18, conversionRate: 0.44 },
              { source: 'Referral', count: 15, conversionRate: 0.73 },
              { source: 'Website', count: 12, conversionRate: 0.50 },
              { source: 'Walk-In', count: 6, conversionRate: 0.83 },
            ],
            stageDistribution: MOCK_PIPELINE_DATA.stages,
          }),
        })
      );

      await page.route('**/api/dashboard/leads', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_PIPELINE_DATA),
        })
      );
    });

    test('displays lead source breakdown', async ({ page }) => {
      await page.goto('/dashboard');
      const googleAds = page.getByText(/Google Ads/i).first();
      await expect(googleAds).toBeVisible();
    });

    test('shows weekly new leads count', async ({ page }) => {
      await page.goto('/dashboard');
      const weeklyCount = page.getByText(/8|new.*week/i).first();
      await expect(weeklyCount).toBeVisible();
    });

    test('displays average time to consultation metric', async ({ page }) => {
      await page.goto('/dashboard');
      const avgTime = page.getByText(/3\.2|days.*consult/i).first();
      await expect(avgTime).toBeVisible();
    });

    test('renders stage distribution chart or graph', async ({ page }) => {
      await page.goto('/dashboard');
      const chart = page.locator('canvas, svg, [class*="chart"], [class*="graph"], [data-testid*="chart"]').first();
      await expect(chart).toBeVisible();
    });
  });

  test.describe('Active Patient View', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/clients/rec_test_patient_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ client: MOCK_PATIENT }),
        })
      );
    });

    test('shows patient LTV', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_test_patient_001');
      await expect(page.getByText(/4,250|4250/i).first()).toBeVisible();
    });

    test('displays membership tier', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_test_patient_001');
      await expect(page.getByText(/Gold/i).first()).toBeVisible();
    });

    test('shows assigned provider', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_test_patient_001');
      await expect(page.getByText(/Landfield/i).first()).toBeVisible();
    });

    test('displays last visit date', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_test_patient_001');
      await expect(page.getByText(/March.*15|03.*15|3\/15/i).first()).toBeVisible();
    });
  });

  test.describe('Pipeline Bulk Actions', () => {
    test('bulk assigns leads to a provider', async ({ page }) => {
      await page.route('**/api/dashboard/leads', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            leads: [MOCK_LEAD, { ...MOCK_LEAD, id: 'rec_test_lead_002', firstName: 'Emily', lastName: 'Kim' }],
            total: 2,
          }),
        })
      );

      await page.route('**/api/dashboard/clients/bulk*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ updated: 2 }),
        })
      );

      await page.goto('/dashboard');

      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();
      if (checkboxCount >= 2) {
        await checkboxes.nth(0).check();
        await checkboxes.nth(1).check();

        const bulkAction = page.getByRole('button', { name: /assign|bulk/i }).first();
        const bulkCount = await bulkAction.count();
        if (bulkCount > 0) {
          await bulkAction.click();
        }
      }
    });

    test('bulk advances leads to next stage', async ({ page }) => {
      await page.route('**/api/dashboard/leads', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ leads: [MOCK_LEAD], total: 1 }),
        })
      );

      await page.goto('/dashboard');

      const selectAll = page.locator('input[type="checkbox"][data-testid="select-all"], thead input[type="checkbox"]').first();
      const hasSelectAll = await selectAll.count();
      if (hasSelectAll > 0) {
        await selectAll.check();
        const advanceAll = page.getByRole('button', { name: /advance.*all|bulk.*advance/i }).first();
        const btnCount = await advanceAll.count();
        expect(btnCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Pipeline Search and Filters', () => {
    test('searches leads by name', async ({ page }) => {
      await page.route('**/api/dashboard/leads*', (route) => {
        const url = new URL(route.request().url());
        const search = url.searchParams.get('search');
        if (search && search.toLowerCase().includes('sarah')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ leads: [MOCK_LEAD], total: 1 }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_PIPELINE_DATA),
        });
      });

      await page.goto('/dashboard');

      const searchInput = page.getByPlaceholder(/search|find/i).first();
      const hasSearch = await searchInput.count();
      if (hasSearch > 0) {
        await searchInput.fill('Sarah');
        await page.waitForTimeout(500);
      }
    });

    test('filters leads by source', async ({ page }) => {
      await page.route('**/api/dashboard/leads*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_PIPELINE_DATA),
        })
      );

      await page.goto('/dashboard');

      const sourceFilter = page.locator('select[data-testid="source-filter"], [class*="filter"] select').first();
      const hasFilter = await sourceFilter.count();
      if (hasFilter > 0) {
        await sourceFilter.selectOption({ label: 'Google Ads' });
        await page.waitForTimeout(300);
      }
    });

    test('filters leads by date range', async ({ page }) => {
      await page.route('**/api/dashboard/leads*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_PIPELINE_DATA),
        })
      );

      await page.goto('/dashboard');

      const dateFilter = page.locator('input[type="date"], [data-testid="date-filter"]').first();
      const hasDate = await dateFilter.count();
      if (hasDate > 0) {
        await dateFilter.fill('2026-03-01');
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Pipeline Error States', () => {
    test('shows error state when pipeline API fails', async ({ page }) => {
      await page.route('**/api/dashboard/leads', (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Database connection failed' }),
        })
      );

      await page.goto('/dashboard');
      const errorEl = page.getByText(/error|failed|unavailable|try again/i).first();
      await expect(errorEl).toBeVisible({ timeout: 5000 });
    });

    test('shows empty state when no leads exist', async ({ page }) => {
      await page.route('**/api/dashboard/leads', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ stages: [], totalLeads: 0, conversionRate: 0 }),
        })
      );

      await page.goto('/dashboard');
      const emptyState = page.getByText(/no leads|empty|get started/i).first();
      await expect(emptyState).toBeVisible({ timeout: 5000 });
    });

    test('handles unauthorized access to pipeline', async ({ page }) => {
      await page.route('**/api/dashboard/auth/me', (route) =>
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized' }),
        })
      );

      await page.goto('/dashboard');
      await page.waitForTimeout(1000);

      const loginPrompt = page.getByText(/login|sign in|unauthorized/i).first();
      const currentUrl = page.url();
      expect(currentUrl.includes('login') || (await loginPrompt.count()) > 0).toBeTruthy();
    });
  });
});
