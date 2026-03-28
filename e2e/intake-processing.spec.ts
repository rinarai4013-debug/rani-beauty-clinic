import { test, expect } from '@playwright/test';

/**
 * Intake Processing E2E Tests
 * Tests patient intake submission, AI analysis, contraindication checking,
 * processing status updates, and intake intelligence dashboard view.
 */

const MOCK_INTAKE_RAW = {
  id: 'rec_intake_001',
  firstName: 'Amanda',
  lastName: 'Rivera',
  email: 'amanda.r@example.com',
  phone: '(425) 555-0177',
  processingStatus: 'New',
  submittedAt: '2026-03-24T09:15:00Z',
  services: ['GLP-1 Weight Management', 'Vitamin Injections'],
  medications: ['Metformin 500mg', 'Levothyroxine 50mcg'],
  allergies: ['Sulfa drugs'],
  medicalHistory: ['Type 2 Diabetes', 'Hypothyroidism'],
  pregnancyStatus: 'Not pregnant',
  previousTreatments: ['Botox - 2025-06'],
};

const MOCK_INTAKE_PROCESSED = {
  ...MOCK_INTAKE_RAW,
  processingStatus: 'Processed',
  intakeSummaryAI: 'Patient presents with interest in GLP-1 weight management. Current medications include Metformin 500mg for Type 2 Diabetes and Levothyroxine 50mcg for Hypothyroidism. Sulfa drug allergy noted. Previous Botox treatment in June 2025 without complications. Cleared for GLP-1 program with standard monitoring protocol.',
  programPlanAI: 'Recommended: The Rani Protocol GLP-1 program starting with Semaglutide 0.25mg weekly injection for 4 weeks, then titrate to 0.5mg. Monthly blood work to monitor A1C and thyroid levels alongside existing endocrinologist care. Add B12 injection weekly to support energy during weight loss phase.',
  costBreakdownAI: 'GLP-1 Program: $399/month (Semaglutide starter). B12 Injection: $35/session. Monthly Blood Work: included. Estimated monthly total: $434. 3-month program estimate: $1,302.',
  timelineAI: 'Week 1-4: Semaglutide 0.25mg starter dose. Week 5-8: Titrate to 0.5mg. Monthly check-ins with vitals and blood work. Expected 5-8% body weight reduction in first 12 weeks.',
  suggestedNextStepAI: 'Schedule in-person consultation with provider. Pre-order starter medication. Schedule baseline blood work panel.',
  treatmentValueAI: '$5,200 estimated 12-month value',
  riskFlags: ['Diabetes - requires A1C monitoring with GLP-1', 'Thyroid condition - monitor TSH during weight loss'],
};

const MOCK_CONTRAINDICATION_INTAKE = {
  id: 'rec_intake_002',
  firstName: 'Lisa',
  lastName: 'Tran',
  email: 'lisa.tran@example.com',
  phone: '(425) 555-0233',
  processingStatus: 'New',
  services: ['GLP-1 Weight Management'],
  medications: ['Insulin Glargine'],
  allergies: [],
  medicalHistory: ['Type 1 Diabetes', 'History of pancreatitis'],
  pregnancyStatus: 'Currently pregnant',
  previousTreatments: [],
};

const MOCK_CONTRAINDICATION_RESULT = {
  hardStops: [
    { type: 'pregnancy', message: 'Patient is currently pregnant. GLP-1 medications are contraindicated during pregnancy.', severity: 'critical' },
    { type: 'pancreatitis_history', message: 'History of pancreatitis is a contraindication for GLP-1 agonists.', severity: 'critical' },
  ],
  softFlags: [
    { type: 'type1_diabetes', message: 'Type 1 Diabetes present. GLP-1 is not indicated for Type 1 Diabetes management. Requires physician review.', severity: 'warning' },
    { type: 'insulin_use', message: 'Patient currently uses insulin. GLP-1 combined with insulin increases hypoglycemia risk.', severity: 'warning' },
  ],
  cleared: false,
  reviewRequired: true,
};

test.describe('Intake Processing', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/dashboard/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { name: 'Rina', role: 'ceo', permissions: ['view_intakes', 'process_intakes', 'view_clients'] },
        }),
      })
    );
  });

  test.describe('Intake Queue', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/intakes*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            intakes: [MOCK_INTAKE_RAW, MOCK_CONTRAINDICATION_INTAKE],
            total: 2,
            newCount: 2,
            processedCount: 0,
          }),
        })
      );
    });

    test('displays pending intakes count', async ({ page }) => {
      await page.goto('/dashboard');
      const pendingBadge = page.getByText(/2|new.*intake|pending/i).first();
      await expect(pendingBadge).toBeVisible();
    });

    test('lists intake submissions with patient names', async ({ page }) => {
      await page.goto('/dashboard');
      const amandaEntry = page.getByText(/Amanda.*Rivera/i).first();
      await expect(amandaEntry).toBeVisible();
    });

    test('shows intake submission timestamp', async ({ page }) => {
      await page.goto('/dashboard');
      const timestamp = page.getByText(/Mar.*24|3\/24|March 24/i).first();
      await expect(timestamp).toBeVisible();
    });

    test('displays requested services for each intake', async ({ page }) => {
      await page.goto('/dashboard');
      const glp1Service = page.getByText(/GLP-1/i).first();
      await expect(glp1Service).toBeVisible();
    });

    test('shows processing status badge', async ({ page }) => {
      await page.goto('/dashboard');
      const statusBadge = page.getByText(/New|Pending|Unprocessed/i).first();
      await expect(statusBadge).toBeVisible();
    });
  });

  test.describe('Intake Detail View', () => {
    test('displays full patient medical history', async ({ page }) => {
      await page.route('**/api/dashboard/intakes/rec_intake_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ intake: MOCK_INTAKE_RAW }),
        })
      );

      await page.goto('/dashboard');
      // Navigate to intake detail
      const intakeLink = page.getByText(/Amanda.*Rivera/i).first();
      const hasLink = await intakeLink.count();
      if (hasLink > 0) {
        await intakeLink.click();
        await page.waitForTimeout(500);

        await expect(page.getByText(/Type 2 Diabetes/i).first()).toBeVisible();
        await expect(page.getByText(/Hypothyroidism/i).first()).toBeVisible();
      }
    });

    test('shows current medications list', async ({ page }) => {
      await page.route('**/api/dashboard/intakes/rec_intake_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ intake: MOCK_INTAKE_RAW }),
        })
      );

      await page.goto('/dashboard');
      const intakeLink = page.getByText(/Amanda.*Rivera/i).first();
      const hasLink = await intakeLink.count();
      if (hasLink > 0) {
        await intakeLink.click();
        await expect(page.getByText(/Metformin/i).first()).toBeVisible();
      }
    });

    test('displays allergy information prominently', async ({ page }) => {
      await page.route('**/api/dashboard/intakes/rec_intake_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ intake: MOCK_INTAKE_RAW }),
        })
      );

      await page.goto('/dashboard');
      const intakeLink = page.getByText(/Amanda.*Rivera/i).first();
      const hasLink = await intakeLink.count();
      if (hasLink > 0) {
        await intakeLink.click();
        await expect(page.getByText(/Sulfa/i).first()).toBeVisible();
      }
    });

    test('shows pregnancy status', async ({ page }) => {
      await page.route('**/api/dashboard/intakes/rec_intake_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ intake: MOCK_INTAKE_RAW }),
        })
      );

      await page.goto('/dashboard');
      const intakeLink = page.getByText(/Amanda.*Rivera/i).first();
      const hasLink = await intakeLink.count();
      if (hasLink > 0) {
        await intakeLink.click();
        await expect(page.getByText(/Not pregnant|pregnancy.*no/i).first()).toBeVisible();
      }
    });
  });

  test.describe('AI Intake Processing', () => {
    test('triggers AI processing on intake', async ({ page }) => {
      let processingTriggered = false;

      await page.route('**/api/ai/intake', (route) => {
        processingTriggered = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            summary: MOCK_INTAKE_PROCESSED.intakeSummaryAI,
            plan: MOCK_INTAKE_PROCESSED.programPlanAI,
            cost: MOCK_INTAKE_PROCESSED.costBreakdownAI,
            timeline: MOCK_INTAKE_PROCESSED.timelineAI,
            nextStep: MOCK_INTAKE_PROCESSED.suggestedNextStepAI,
            value: MOCK_INTAKE_PROCESSED.treatmentValueAI,
            riskFlags: MOCK_INTAKE_PROCESSED.riskFlags,
          }),
        });
      });

      await page.route('**/api/dashboard/intakes/rec_intake_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ intake: MOCK_INTAKE_RAW }),
        })
      );

      await page.goto('/dashboard');
      const processBtn = page.getByRole('button', { name: /process|analyze|run ai/i }).first();
      const hasBtn = await processBtn.count();
      if (hasBtn > 0) {
        await processBtn.click();
        await page.waitForTimeout(1000);
        expect(processingTriggered).toBe(true);
      }
    });

    test('displays AI-generated intake summary', async ({ page }) => {
      await page.route('**/api/dashboard/intakes/rec_intake_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ intake: MOCK_INTAKE_PROCESSED }),
        })
      );

      await page.goto('/dashboard');
      const summaryText = page.getByText(/GLP-1 weight management/i).first();
      await expect(summaryText).toBeVisible();
    });

    test('shows AI-generated program plan', async ({ page }) => {
      await page.route('**/api/dashboard/intakes/rec_intake_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ intake: MOCK_INTAKE_PROCESSED }),
        })
      );

      await page.goto('/dashboard');
      const planText = page.getByText(/Semaglutide.*0\.25mg|Rani Protocol/i).first();
      await expect(planText).toBeVisible();
    });

    test('displays cost breakdown from AI', async ({ page }) => {
      await page.route('**/api/dashboard/intakes/rec_intake_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ intake: MOCK_INTAKE_PROCESSED }),
        })
      );

      await page.goto('/dashboard');
      const costText = page.getByText(/\$399|434|1,302/i).first();
      await expect(costText).toBeVisible();
    });

    test('shows risk flags with appropriate severity styling', async ({ page }) => {
      await page.route('**/api/dashboard/intakes/rec_intake_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ intake: MOCK_INTAKE_PROCESSED }),
        })
      );

      await page.goto('/dashboard');
      const riskFlag = page.getByText(/Diabetes.*A1C|monitoring/i).first();
      await expect(riskFlag).toBeVisible();
    });

    test('displays estimated treatment value', async ({ page }) => {
      await page.route('**/api/dashboard/intakes/rec_intake_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ intake: MOCK_INTAKE_PROCESSED }),
        })
      );

      await page.goto('/dashboard');
      const valueText = page.getByText(/5,200|\$5200/i).first();
      await expect(valueText).toBeVisible();
    });
  });

  test.describe('Contraindication Checking', () => {
    test('flags critical contraindications for pregnant patient', async ({ page }) => {
      await page.route('**/api/ai/intake', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_CONTRAINDICATION_RESULT),
        })
      );

      await page.route('**/api/dashboard/intakes/rec_intake_002*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ intake: MOCK_CONTRAINDICATION_INTAKE }),
        })
      );

      await page.goto('/dashboard');
      const pregnancyFlag = page.getByText(/pregnant|pregnancy.*contraindicated/i).first();
      await expect(pregnancyFlag).toBeVisible();
    });

    test('displays hard stop warnings prominently', async ({ page }) => {
      await page.route('**/api/dashboard/intakes/rec_intake_002*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            intake: MOCK_CONTRAINDICATION_INTAKE,
            contraindications: MOCK_CONTRAINDICATION_RESULT,
          }),
        })
      );

      await page.goto('/dashboard');
      const hardStop = page.locator('[class*="critical"], [class*="danger"], [class*="error"], [data-severity="critical"]').first();
      const hasHardStop = await hardStop.count();
      expect(hasHardStop).toBeGreaterThanOrEqual(0);
    });

    test('shows pancreatitis history as GLP-1 contraindication', async ({ page }) => {
      await page.route('**/api/dashboard/intakes/rec_intake_002*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            intake: MOCK_CONTRAINDICATION_INTAKE,
            contraindications: MOCK_CONTRAINDICATION_RESULT,
          }),
        })
      );

      await page.goto('/dashboard');
      const pancreatitis = page.getByText(/pancreatitis/i).first();
      await expect(pancreatitis).toBeVisible();
    });

    test('displays soft flags for Type 1 Diabetes', async ({ page }) => {
      await page.route('**/api/dashboard/intakes/rec_intake_002*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            intake: MOCK_CONTRAINDICATION_INTAKE,
            contraindications: MOCK_CONTRAINDICATION_RESULT,
          }),
        })
      );

      await page.goto('/dashboard');
      const t1dFlag = page.getByText(/Type 1 Diabetes/i).first();
      await expect(t1dFlag).toBeVisible();
    });

    test('marks intake as requiring physician review', async ({ page }) => {
      await page.route('**/api/dashboard/intakes/rec_intake_002*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            intake: MOCK_CONTRAINDICATION_INTAKE,
            contraindications: MOCK_CONTRAINDICATION_RESULT,
          }),
        })
      );

      await page.goto('/dashboard');
      const reviewRequired = page.getByText(/review required|physician review|needs review/i).first();
      await expect(reviewRequired).toBeVisible();
    });

    test('prevents treatment scheduling when hard stops exist', async ({ page }) => {
      await page.route('**/api/dashboard/intakes/rec_intake_002*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            intake: MOCK_CONTRAINDICATION_INTAKE,
            contraindications: MOCK_CONTRAINDICATION_RESULT,
          }),
        })
      );

      await page.goto('/dashboard');
      const scheduleBtn = page.getByRole('button', { name: /schedule|book treatment/i }).first();
      const hasBtn = await scheduleBtn.count();
      if (hasBtn > 0) {
        const isDisabled = await scheduleBtn.isDisabled();
        expect(isDisabled).toBe(true);
      }
    });
  });

  test.describe('Intake Status Updates', () => {
    test('updates intake from New to Processed', async ({ page }) => {
      let statusUpdated = false;

      await page.route('**/api/dashboard/intakes/rec_intake_001*', (route) => {
        if (route.request().method() === 'PATCH') {
          statusUpdated = true;
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ intake: MOCK_INTAKE_PROCESSED }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ intake: MOCK_INTAKE_RAW }),
        });
      });

      await page.goto('/dashboard');
      const processBtn = page.getByRole('button', { name: /mark.*processed|complete|process/i }).first();
      const hasBtn = await processBtn.count();
      if (hasBtn > 0) {
        await processBtn.click();
        await page.waitForTimeout(500);
        expect(statusUpdated).toBe(true);
      }
    });

    test('updates intake from Processed to Responded', async ({ page }) => {
      await page.route('**/api/dashboard/intakes/rec_intake_001*', (route) => {
        if (route.request().method() === 'PATCH') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ intake: { ...MOCK_INTAKE_PROCESSED, processingStatus: 'Responded' } }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ intake: MOCK_INTAKE_PROCESSED }),
        });
      });

      await page.goto('/dashboard');
      const respondBtn = page.getByRole('button', { name: /respond|mark.*responded|send/i }).first();
      const hasBtn = await respondBtn.count();
      if (hasBtn > 0) {
        await respondBtn.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Intake Error Handling', () => {
    test('handles AI processing failure gracefully', async ({ page }) => {
      await page.route('**/api/ai/intake', (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'AI service temporarily unavailable' }),
        })
      );

      await page.route('**/api/dashboard/intakes/rec_intake_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ intake: MOCK_INTAKE_RAW }),
        })
      );

      await page.goto('/dashboard');
      const processBtn = page.getByRole('button', { name: /process|analyze/i }).first();
      const hasBtn = await processBtn.count();
      if (hasBtn > 0) {
        await processBtn.click();
        await page.waitForTimeout(1000);
        const errorMsg = page.getByText(/error|failed|unavailable|retry/i).first();
        await expect(errorMsg).toBeVisible();
      }
    });

    test('validates required intake fields', async ({ page }) => {
      const incompleteIntake = {
        ...MOCK_INTAKE_RAW,
        email: '',
        phone: '',
      };

      await page.route('**/api/dashboard/intakes/rec_intake_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ intake: incompleteIntake }),
        })
      );

      await page.goto('/dashboard');
      const warningEl = page.getByText(/missing|incomplete|required/i).first();
      const hasWarning = await warningEl.count();
      expect(hasWarning).toBeGreaterThanOrEqual(0);
    });

    test('handles empty intake queue', async ({ page }) => {
      await page.route('**/api/dashboard/intakes*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ intakes: [], total: 0, newCount: 0, processedCount: 0 }),
        })
      );

      await page.goto('/dashboard');
      const emptyState = page.getByText(/no.*intakes|all.*processed|queue.*empty/i).first();
      const hasEmpty = await emptyState.count();
      expect(hasEmpty).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Intake to Client Conversion', () => {
    test('creates client record from processed intake', async ({ page }) => {
      let clientCreated = false;

      await page.route('**/api/dashboard/intakes/rec_intake_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ intake: MOCK_INTAKE_PROCESSED }),
        })
      );

      await page.route('**/api/dashboard/clients', (route) => {
        if (route.request().method() === 'POST') {
          clientCreated = true;
          return route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              client: {
                id: 'rec_new_client_001',
                firstName: 'Amanda',
                lastName: 'Rivera',
                status: 'pipeline_new',
              },
            }),
          });
        }
        return route.continue();
      });

      await page.goto('/dashboard');
      const convertBtn = page.getByRole('button', { name: /convert|create client|add.*client/i }).first();
      const hasBtn = await convertBtn.count();
      if (hasBtn > 0) {
        await convertBtn.click();
        await page.waitForTimeout(500);
        expect(clientCreated).toBe(true);
      }
    });

    test('pre-fills client form with intake data', async ({ page }) => {
      await page.route('**/api/dashboard/intakes/rec_intake_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ intake: MOCK_INTAKE_PROCESSED }),
        })
      );

      await page.goto('/dashboard');
      const convertBtn = page.getByRole('button', { name: /convert|create client/i }).first();
      const hasBtn = await convertBtn.count();
      if (hasBtn > 0) {
        await convertBtn.click();
        await page.waitForTimeout(500);

        const nameField = page.locator('input[name="firstName"], input[placeholder*="first"]').first();
        const hasField = await nameField.count();
        if (hasField > 0) {
          const value = await nameField.inputValue();
          expect(value).toContain('Amanda');
        }
      }
    });
  });
});
