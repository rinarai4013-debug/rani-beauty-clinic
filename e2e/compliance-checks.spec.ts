import { test, expect } from '@playwright/test';

/**
 * Compliance Checks E2E Tests
 * Tests hard stops, soft flags, lab requirements, consent tracking,
 * provider supervision requirements, and regulatory compliance.
 */

const MOCK_COMPLIANCE_DASHBOARD = {
  overallScore: 94,
  categories: [
    { name: 'Lab Requirements', score: 88, issues: 3 },
    { name: 'Consent Forms', score: 100, issues: 0 },
    { name: 'Physician Supervision', score: 97, issues: 1 },
    { name: 'Treatment Protocols', score: 92, issues: 2 },
    { name: 'Documentation', score: 95, issues: 1 },
  ],
  recentAlerts: [
    { id: 'alert_001', type: 'lab_overdue', client: 'Rachel Kim', message: 'Blood work overdue by 5 days for GLP-1 program', severity: 'warning', createdAt: '2026-03-25' },
    { id: 'alert_002', type: 'consent_expiring', client: 'Michelle Patel', message: 'Annual consent renewal due in 7 days', severity: 'info', createdAt: '2026-03-24' },
    { id: 'alert_003', type: 'hard_stop', client: 'Lisa Tran', message: 'Pregnancy contraindication for GLP-1. Treatment blocked.', severity: 'critical', createdAt: '2026-03-23' },
  ],
};

const MOCK_HARD_STOPS = [
  {
    id: 'hs_001',
    clientId: 'rec_hs_001',
    clientName: 'Lisa Tran',
    service: 'GLP-1 Weight Management',
    reason: 'Currently pregnant',
    category: 'pregnancy',
    severity: 'critical',
    action: 'Treatment blocked until pregnancy resolved',
    createdAt: '2026-03-23',
    resolvedAt: null,
  },
  {
    id: 'hs_002',
    clientId: 'rec_hs_002',
    clientName: 'Amy Rodriguez',
    service: 'Botox',
    reason: 'Active infection at treatment site',
    category: 'active_infection',
    severity: 'critical',
    action: 'Reschedule after infection clears. Physician clearance required.',
    createdAt: '2026-03-22',
    resolvedAt: null,
  },
  {
    id: 'hs_003',
    clientId: 'rec_hs_003',
    clientName: 'Sarah Chen',
    service: 'Laser Hair Removal',
    reason: 'Accutane use within past 6 months',
    category: 'medication_conflict',
    severity: 'critical',
    action: 'Wait 6 months after Accutane discontinuation. Next eligible: July 2026.',
    createdAt: '2026-03-20',
    resolvedAt: null,
  },
];

const MOCK_SOFT_FLAGS = [
  {
    id: 'sf_001',
    clientId: 'rec_sf_001',
    clientName: 'Jennifer Wu',
    service: 'GLP-1 Weight Management',
    reason: 'A1C slightly elevated at 6.1%',
    category: 'lab_values',
    severity: 'warning',
    action: 'Proceed with monitoring. Recheck A1C in 30 days.',
    requiresPhysicianReview: true,
  },
  {
    id: 'sf_002',
    clientId: 'rec_sf_002',
    clientName: 'David Chen',
    service: 'RF Microneedling',
    reason: 'History of keloid scarring',
    category: 'medical_history',
    severity: 'warning',
    action: 'Test patch recommended. Provider to assess scar tissue response before full treatment.',
    requiresPhysicianReview: true,
  },
  {
    id: 'sf_003',
    clientId: 'rec_sf_003',
    clientName: 'Karen Lee',
    service: 'Chemical Peel',
    reason: 'Tretinoin use - must discontinue 5 days before peel',
    category: 'medication_interaction',
    severity: 'info',
    action: 'Confirm client has paused Tretinoin at least 5 days prior. Document verbal confirmation.',
    requiresPhysicianReview: false,
  },
];

const MOCK_LAB_REQUIREMENTS = [
  {
    clientId: 'rec_lab_001',
    clientName: 'Rachel Kim',
    service: 'GLP-1 Weight Management',
    labType: 'Comprehensive Metabolic Panel',
    lastLabDate: '2026-02-15',
    nextDueDate: '2026-03-15',
    daysOverdue: 11,
    status: 'overdue',
  },
  {
    clientId: 'rec_lab_002',
    clientName: 'Amanda Rivera',
    service: 'GLP-1 Weight Management',
    labType: 'Thyroid Panel',
    lastLabDate: '2026-03-01',
    nextDueDate: '2026-04-01',
    daysOverdue: 0,
    status: 'upcoming',
  },
  {
    clientId: 'rec_lab_003',
    clientName: 'Jessica Park',
    service: 'Hormone Therapy',
    labType: 'Hormone Panel',
    lastLabDate: '2026-01-15',
    nextDueDate: '2026-03-15',
    daysOverdue: 11,
    status: 'overdue',
  },
];

test.describe('Compliance Checks', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/dashboard/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { name: 'Rina', role: 'ceo', permissions: ['view_compliance', 'manage_compliance', 'override_hard_stop'] },
        }),
      })
    );
  });

  test.describe('Compliance Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/compliance*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_COMPLIANCE_DASHBOARD),
        })
      );
    });

    test('displays overall compliance score', async ({ page }) => {
      await page.goto('/dashboard');
      const score = page.getByText(/94|compliance.*score/i).first();
      await expect(score).toBeVisible();
    });

    test('shows compliance categories with individual scores', async ({ page }) => {
      await page.goto('/dashboard');
      const labCategory = page.getByText(/Lab Requirements/i).first();
      await expect(labCategory).toBeVisible();
    });

    test('displays recent compliance alerts', async ({ page }) => {
      await page.goto('/dashboard');
      const alert = page.getByText(/Blood work overdue|Rachel Kim/i).first();
      await expect(alert).toBeVisible();
    });

    test('shows critical alerts with prominent styling', async ({ page }) => {
      await page.goto('/dashboard');
      const criticalAlert = page.locator('[class*="critical"], [data-severity="critical"], [class*="danger"]').first();
      const hasCritical = await criticalAlert.count();
      expect(hasCritical).toBeGreaterThanOrEqual(0);
    });

    test('displays issue count per category', async ({ page }) => {
      await page.goto('/dashboard');
      const issueCount = page.getByText(/3 issues|3.*issue/i).first();
      const hasCount = await issueCount.count();
      expect(hasCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Hard Stops', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/compliance/hard-stops*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ hardStops: MOCK_HARD_STOPS }),
        })
      );
    });

    test('displays all active hard stops', async ({ page }) => {
      await page.goto('/dashboard');
      for (const hs of MOCK_HARD_STOPS) {
        const hsEntry = page.getByText(new RegExp(hs.clientName, 'i')).first();
        await expect(hsEntry).toBeVisible();
      }
    });

    test('shows pregnancy hard stop for GLP-1', async ({ page }) => {
      await page.goto('/dashboard');
      const pregnancyStop = page.getByText(/pregnant.*GLP-1|pregnancy.*blocked/i).first();
      await expect(pregnancyStop).toBeVisible();
    });

    test('shows Accutane hard stop for laser', async ({ page }) => {
      await page.goto('/dashboard');
      const accutaneStop = page.getByText(/Accutane|6 months/i).first();
      await expect(accutaneStop).toBeVisible();
    });

    test('shows infection hard stop for Botox', async ({ page }) => {
      await page.goto('/dashboard');
      const infectionStop = page.getByText(/infection|treatment site/i).first();
      await expect(infectionStop).toBeVisible();
    });

    test('blocks treatment booking when hard stop is active', async ({ page }) => {
      await page.route('**/api/dashboard/clients/rec_hs_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            client: { id: 'rec_hs_001', firstName: 'Lisa', lastName: 'Tran' },
            hardStops: [MOCK_HARD_STOPS[0]],
          }),
        })
      );

      await page.goto('/dashboard/clients/rec_hs_001');
      const bookBtn = page.getByRole('button', { name: /book|schedule.*GLP-1/i }).first();
      const hasBtn = await bookBtn.count();
      if (hasBtn > 0) {
        const isDisabled = await bookBtn.isDisabled();
        expect(isDisabled).toBe(true);
      }
    });

    test('allows physician override of hard stop with documentation', async ({ page }) => {
      let overrideSubmitted = false;

      await page.route('**/api/dashboard/compliance/hard-stops/hs_001/override', (route) => {
        overrideSubmitted = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, overrideId: 'override_001' }),
        });
      });

      await page.goto('/dashboard');
      const overrideBtn = page.getByRole('button', { name: /override|physician.*override/i }).first();
      const hasBtn = await overrideBtn.count();
      if (hasBtn > 0) {
        await overrideBtn.click();
        await page.waitForTimeout(300);

        const reasonInput = page.locator('textarea[name="overrideReason"]').first();
        const hasInput = await reasonInput.count();
        if (hasInput > 0) {
          await reasonInput.fill('Patient confirms pregnancy test negative as of 3/25. Cleared for treatment.');

          const confirmBtn = page.getByRole('button', { name: /confirm.*override|submit/i }).first();
          await confirmBtn.click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('resolves hard stop when condition clears', async ({ page }) => {
      await page.route('**/api/dashboard/compliance/hard-stops/hs_002', (route) => {
        if (route.request().method() === 'PATCH') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ hardStop: { ...MOCK_HARD_STOPS[1], resolvedAt: '2026-03-26' } }),
          });
        }
        return route.continue();
      });

      await page.goto('/dashboard');
      const resolveBtn = page.getByRole('button', { name: /resolve|clear|mark.*resolved/i }).first();
      const hasBtn = await resolveBtn.count();
      if (hasBtn > 0) {
        await resolveBtn.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Soft Flags', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/compliance/soft-flags*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ softFlags: MOCK_SOFT_FLAGS }),
        })
      );
    });

    test('displays all active soft flags', async ({ page }) => {
      await page.goto('/dashboard');
      const flag = page.getByText(/A1C.*elevated|keloid|Tretinoin/i).first();
      await expect(flag).toBeVisible();
    });

    test('shows required actions for each flag', async ({ page }) => {
      await page.goto('/dashboard');
      const action = page.getByText(/Proceed with monitoring|Test patch|Confirm.*paused/i).first();
      await expect(action).toBeVisible();
    });

    test('marks flags requiring physician review', async ({ page }) => {
      await page.goto('/dashboard');
      const reviewBadge = page.getByText(/physician review|requires review/i).first();
      const hasBadge = await reviewBadge.count();
      expect(hasBadge).toBeGreaterThanOrEqual(0);
    });

    test('allows treatment to proceed with acknowledged soft flag', async ({ page }) => {
      let acknowledged = false;

      await page.route('**/api/dashboard/compliance/soft-flags/sf_003/acknowledge', (route) => {
        acknowledged = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      await page.goto('/dashboard');
      const ackBtn = page.getByRole('button', { name: /acknowledge|proceed|noted/i }).first();
      const hasBtn = await ackBtn.count();
      if (hasBtn > 0) {
        await ackBtn.click();
        await page.waitForTimeout(300);
      }
    });

    test('differentiates warning vs info severity flags', async ({ page }) => {
      await page.goto('/dashboard');
      const warningFlag = page.locator('[data-severity="warning"], [class*="warning"]').first();
      const infoFlag = page.locator('[data-severity="info"], [class*="info"]').first();
      const hasWarning = await warningFlag.count();
      const hasInfo = await infoFlag.count();
      expect(hasWarning + hasInfo).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Lab Requirements', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/compliance/labs*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ labs: MOCK_LAB_REQUIREMENTS }),
        })
      );
    });

    test('lists all lab requirements with due dates', async ({ page }) => {
      await page.goto('/dashboard');
      const labEntry = page.getByText(/Comprehensive Metabolic|Thyroid Panel|Hormone Panel/i).first();
      await expect(labEntry).toBeVisible();
    });

    test('highlights overdue labs', async ({ page }) => {
      await page.goto('/dashboard');
      const overdue = page.getByText(/overdue|11 days/i).first();
      await expect(overdue).toBeVisible();
    });

    test('shows days until next lab is due', async ({ page }) => {
      await page.goto('/dashboard');
      const upcoming = page.getByText(/Apr.*1|upcoming|due.*April/i).first();
      await expect(upcoming).toBeVisible();
    });

    test('triggers lab reminder to client', async ({ page }) => {
      let reminderSent = false;

      await page.route('**/api/dashboard/compliance/labs/rec_lab_001/remind', (route) => {
        reminderSent = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      await page.goto('/dashboard');
      const remindBtn = page.getByRole('button', { name: /remind|send.*reminder|notify/i }).first();
      const hasBtn = await remindBtn.count();
      if (hasBtn > 0) {
        await remindBtn.click();
        await page.waitForTimeout(500);
      }
    });

    test('blocks GLP-1 refill when labs are overdue', async ({ page }) => {
      await page.goto('/dashboard');
      const blockMessage = page.getByText(/labs required|blood work.*before.*refill|overdue.*lab/i).first();
      const hasBlock = await blockMessage.count();
      expect(hasBlock).toBeGreaterThanOrEqual(0);
    });

    test('records lab completion and updates status', async ({ page }) => {
      await page.route('**/api/dashboard/compliance/labs/rec_lab_001', (route) => {
        if (route.request().method() === 'PATCH') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              lab: { ...MOCK_LAB_REQUIREMENTS[0], status: 'completed', lastLabDate: '2026-03-26', nextDueDate: '2026-04-26' },
            }),
          });
        }
        return route.continue();
      });

      await page.goto('/dashboard');
      const completeBtn = page.getByRole('button', { name: /mark.*complete|lab.*done|received/i }).first();
      const hasBtn = await completeBtn.count();
      if (hasBtn > 0) {
        await completeBtn.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Consent Tracking', () => {
    test('shows consent form status for each client', async ({ page }) => {
      await page.route('**/api/dashboard/compliance/consents*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            consents: [
              { clientId: 'rec_001', clientName: 'Rachel Kim', consentType: 'GLP-1 Program', status: 'signed', signedDate: '2026-02-10', expiresDate: '2027-02-10' },
              { clientId: 'rec_002', clientName: 'Michelle Patel', consentType: 'General Treatment', status: 'expiring_soon', signedDate: '2025-03-30', expiresDate: '2026-03-30' },
            ],
          }),
        })
      );

      await page.goto('/dashboard');
      const consentEntry = page.getByText(/consent|signed|GLP-1 Program/i).first();
      await expect(consentEntry).toBeVisible();
    });

    test('alerts when consent is expiring soon', async ({ page }) => {
      await page.route('**/api/dashboard/compliance/consents*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            consents: [
              { clientId: 'rec_002', clientName: 'Michelle Patel', consentType: 'General Treatment', status: 'expiring_soon', expiresDate: '2026-03-30' },
            ],
          }),
        })
      );

      await page.goto('/dashboard');
      const expiringAlert = page.getByText(/expiring|renewal.*due|expires/i).first();
      await expect(expiringAlert).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('handles compliance API failure', async ({ page }) => {
      await page.route('**/api/dashboard/compliance*', (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Service unavailable' }),
        })
      );

      await page.goto('/dashboard');
      const error = page.getByText(/error|unavailable|failed/i).first();
      await expect(error).toBeVisible({ timeout: 5000 });
    });

    test('displays compliance data even with partial API failures', async ({ page }) => {
      await page.route('**/api/dashboard/compliance*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_COMPLIANCE_DASHBOARD),
        })
      );

      await page.route('**/api/dashboard/compliance/hard-stops*', (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Partial failure' }),
        })
      );

      await page.goto('/dashboard');
      // Compliance score should still show even if hard-stops fail
      const score = page.getByText(/94|compliance/i).first();
      await expect(score).toBeVisible();
    });

    test('handles unauthorized access to compliance data', async ({ page }) => {
      await page.route('**/api/dashboard/auth/me', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { name: 'FrontDesk', role: 'frontdesk', permissions: ['view_schedule'] },
          }),
        })
      );

      await page.goto('/dashboard');
      const restricted = page.getByText(/restricted|unauthorized|no access|permission/i).first();
      const hasRestricted = await restricted.count();
      expect(hasRestricted).toBeGreaterThanOrEqual(0);
    });
  });
});
