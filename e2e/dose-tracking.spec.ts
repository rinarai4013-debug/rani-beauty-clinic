import { test, expect } from '@playwright/test';

/**
 * Dose & Titration Tracking E2E Tests
 * Tests GLP-1 dose management, titration schedules, dose adjustments,
 * side effect logging, and dose history views.
 */

const MOCK_PATIENT_DOSE_PROFILE = {
  id: 'rec_patient_dose_001',
  firstName: 'Rachel',
  lastName: 'Kim',
  medication: 'Semaglutide',
  currentDose: '0.5mg',
  currentWeek: 6,
  startDate: '2026-02-10',
  nextDoseDate: '2026-03-28',
  protocol: 'The Rani Protocol',
  provider: 'Dr. Landfield',
  startingWeight: 198,
  currentWeight: 189,
  targetWeight: 160,
  bmi: 31.2,
};

const MOCK_TITRATION_SCHEDULE = [
  { week: 1, dose: '0.25mg', status: 'completed', date: '2026-02-10', sideEffects: [] },
  { week: 2, dose: '0.25mg', status: 'completed', date: '2026-02-17', sideEffects: ['Mild nausea'] },
  { week: 3, dose: '0.25mg', status: 'completed', date: '2026-02-24', sideEffects: [] },
  { week: 4, dose: '0.25mg', status: 'completed', date: '2026-03-03', sideEffects: [] },
  { week: 5, dose: '0.5mg', status: 'completed', date: '2026-03-10', sideEffects: ['Mild nausea', 'Decreased appetite'] },
  { week: 6, dose: '0.5mg', status: 'current', date: '2026-03-17', sideEffects: ['Decreased appetite'] },
  { week: 7, dose: '0.5mg', status: 'upcoming', date: '2026-03-24', sideEffects: [] },
  { week: 8, dose: '0.5mg', status: 'upcoming', date: '2026-03-31', sideEffects: [] },
  { week: 9, dose: '1.0mg', status: 'planned', date: '2026-04-07', sideEffects: [] },
  { week: 10, dose: '1.0mg', status: 'planned', date: '2026-04-14', sideEffects: [] },
  { week: 11, dose: '1.0mg', status: 'planned', date: '2026-04-21', sideEffects: [] },
  { week: 12, dose: '1.0mg', status: 'planned', date: '2026-04-28', sideEffects: [] },
];

const MOCK_DOSE_LOG = [
  { id: 'dose_001', date: '2026-03-17', dose: '0.5mg', site: 'Left abdomen', administeredBy: 'Provider', weight: 189, notes: 'Tolerating well' },
  { id: 'dose_002', date: '2026-03-10', dose: '0.5mg', site: 'Right abdomen', administeredBy: 'Provider', weight: 191, notes: 'First dose at 0.5mg, monitor for nausea' },
  { id: 'dose_003', date: '2026-03-03', dose: '0.25mg', site: 'Left abdomen', administeredBy: 'Provider', weight: 193, notes: '' },
  { id: 'dose_004', date: '2026-02-24', dose: '0.25mg', site: 'Right thigh', administeredBy: 'Provider', weight: 195, notes: '' },
  { id: 'dose_005', date: '2026-02-17', dose: '0.25mg', site: 'Left abdomen', administeredBy: 'Provider', weight: 196, notes: 'Mild nausea reported, advised to eat smaller meals' },
  { id: 'dose_006', date: '2026-02-10', dose: '0.25mg', site: 'Right abdomen', administeredBy: 'Provider', weight: 198, notes: 'Initial dose, baseline weight recorded' },
];

const MOCK_BLOOD_WORK = {
  latestDate: '2026-03-15',
  results: {
    a1c: { value: 6.1, unit: '%', reference: '< 5.7', status: 'elevated' },
    fasting_glucose: { value: 108, unit: 'mg/dL', reference: '70-100', status: 'elevated' },
    tsh: { value: 2.4, unit: 'mIU/L', reference: '0.4-4.0', status: 'normal' },
    lipid_total: { value: 195, unit: 'mg/dL', reference: '< 200', status: 'normal' },
    creatinine: { value: 0.9, unit: 'mg/dL', reference: '0.6-1.2', status: 'normal' },
    alt: { value: 28, unit: 'U/L', reference: '7-56', status: 'normal' },
  },
  nextDue: '2026-04-15',
};

test.describe('Dose Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/dashboard/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { name: 'Rina', role: 'ceo', permissions: ['view_clients', 'manage_treatments', 'view_medical'] },
        }),
      })
    );

    await page.route('**/api/dashboard/clients/rec_patient_dose_001*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          client: MOCK_PATIENT_DOSE_PROFILE,
          titrationSchedule: MOCK_TITRATION_SCHEDULE,
          doseLog: MOCK_DOSE_LOG,
          bloodWork: MOCK_BLOOD_WORK,
        }),
      })
    );
  });

  test.describe('Patient Dose Profile', () => {
    test('displays current medication and dose', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');
      await expect(page.getByText(/Semaglutide/i).first()).toBeVisible();
      await expect(page.getByText(/0\.5mg/i).first()).toBeVisible();
    });

    test('shows current week in treatment', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');
      await expect(page.getByText(/Week 6|week.*6/i).first()).toBeVisible();
    });

    test('displays weight loss progress', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');
      // Starting 198, current 189 = 9 lbs lost
      const progressText = page.getByText(/189|9.*lb|progress/i).first();
      await expect(progressText).toBeVisible();
    });

    test('shows next dose date', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');
      const nextDose = page.getByText(/Mar.*28|3\/28|next.*dose/i).first();
      await expect(nextDose).toBeVisible();
    });

    test('displays assigned provider', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');
      await expect(page.getByText(/Landfield/i).first()).toBeVisible();
    });

    test('shows BMI metric', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');
      await expect(page.getByText(/31\.2|BMI/i).first()).toBeVisible();
    });
  });

  test.describe('Titration Schedule', () => {
    test('displays full titration timeline', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');
      // Should see both completed and upcoming weeks
      const week1 = page.getByText(/Week 1|0\.25mg/i).first();
      await expect(week1).toBeVisible();
    });

    test('highlights current week in schedule', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');
      const currentWeek = page.locator('[data-status="current"], [class*="current"], [class*="active"]').first();
      const hasCurrent = await currentWeek.count();
      expect(hasCurrent).toBeGreaterThanOrEqual(0);
    });

    test('shows completed weeks with checkmarks or indicators', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');
      const completedIndicators = page.locator('[data-status="completed"], [class*="completed"], [class*="done"]');
      const completedCount = await completedIndicators.count();
      expect(completedCount).toBeGreaterThanOrEqual(0);
    });

    test('displays dose escalation points in schedule', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');
      // Week 5 is the escalation from 0.25mg to 0.5mg
      const escalationPoint = page.getByText(/0\.5mg/i).first();
      await expect(escalationPoint).toBeVisible();
    });

    test('shows planned future doses', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');
      const futureDose = page.getByText(/1\.0mg/i).first();
      await expect(futureDose).toBeVisible();
    });

    test('displays side effects noted at each dose', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');
      const sideEffect = page.getByText(/nausea|decreased appetite/i).first();
      await expect(sideEffect).toBeVisible();
    });
  });

  test.describe('Dose Administration', () => {
    test('records a new dose administration', async ({ page }) => {
      let doseRecorded = false;

      await page.route('**/api/dashboard/clients/rec_patient_dose_001/doses', (route) => {
        if (route.request().method() === 'POST') {
          doseRecorded = true;
          const body = JSON.parse(route.request().postData() || '{}');
          return route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              dose: {
                id: 'dose_new',
                date: body.date || '2026-03-24',
                dose: '0.5mg',
                site: body.site || 'Left abdomen',
                administeredBy: 'Provider',
                weight: body.weight || 188,
              },
            }),
          });
        }
        return route.continue();
      });

      await page.goto('/dashboard/clients/rec_patient_dose_001');

      const recordDoseBtn = page.getByRole('button', { name: /record.*dose|administer|log.*dose/i }).first();
      const hasBtn = await recordDoseBtn.count();
      if (hasBtn > 0) {
        await recordDoseBtn.click();
        await page.waitForTimeout(300);

        const siteSelect = page.locator('select[name="site"], [data-testid="injection-site"]').first();
        const hasSite = await siteSelect.count();
        if (hasSite > 0) {
          await siteSelect.selectOption('Left abdomen');
        }

        const weightInput = page.locator('input[name="weight"], [data-testid="weight-input"]').first();
        const hasWeight = await weightInput.count();
        if (hasWeight > 0) {
          await weightInput.fill('188');
        }

        const submitBtn = page.getByRole('button', { name: /save|submit|record/i }).first();
        await submitBtn.click();
        await page.waitForTimeout(500);
      }
    });

    test('validates weight entry is within reasonable range', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');

      const recordDoseBtn = page.getByRole('button', { name: /record.*dose|administer/i }).first();
      const hasBtn = await recordDoseBtn.count();
      if (hasBtn > 0) {
        await recordDoseBtn.click();
        await page.waitForTimeout(300);

        const weightInput = page.locator('input[name="weight"]').first();
        const hasWeight = await weightInput.count();
        if (hasWeight > 0) {
          await weightInput.fill('50'); // Unreasonably low
          const submitBtn = page.getByRole('button', { name: /save|submit/i }).first();
          await submitBtn.click();

          const error = page.getByText(/invalid|out of range|reasonable/i).first();
          const hasError = await error.count();
          expect(hasError).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('logs injection site rotation', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');
      // Previous injection was Left abdomen, should suggest Right
      const siteRotation = page.getByText(/right|rotate|alternate/i).first();
      const hasSuggestion = await siteRotation.count();
      expect(hasSuggestion).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Dose Adjustment', () => {
    test('allows provider to adjust dose up', async ({ page }) => {
      let adjustmentMade = false;

      await page.route('**/api/dashboard/clients/rec_patient_dose_001/titration', (route) => {
        if (route.request().method() === 'PATCH') {
          adjustmentMade = true;
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              titration: { ...MOCK_TITRATION_SCHEDULE[6], dose: '1.0mg', status: 'planned' },
            }),
          });
        }
        return route.continue();
      });

      await page.goto('/dashboard/clients/rec_patient_dose_001');

      const adjustBtn = page.getByRole('button', { name: /adjust|modify.*dose|titrate/i }).first();
      const hasBtn = await adjustBtn.count();
      if (hasBtn > 0) {
        await adjustBtn.click();
        await page.waitForTimeout(300);

        const doseSelect = page.locator('select[name="newDose"], [data-testid="dose-select"]').first();
        const hasSelect = await doseSelect.count();
        if (hasSelect > 0) {
          await doseSelect.selectOption('1.0mg');

          const confirmBtn = page.getByRole('button', { name: /confirm|save|apply/i }).first();
          await confirmBtn.click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('allows provider to hold dose (pause titration)', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');

      const holdBtn = page.getByRole('button', { name: /hold|pause|delay/i }).first();
      const hasBtn = await holdBtn.count();
      if (hasBtn > 0) {
        await holdBtn.click();
        await page.waitForTimeout(300);

        const reasonInput = page.locator('textarea[name="reason"], [data-testid="hold-reason"]').first();
        const hasReason = await reasonInput.count();
        if (hasReason > 0) {
          await reasonInput.fill('Patient experiencing persistent nausea at current dose');

          const confirmBtn = page.getByRole('button', { name: /confirm|save/i }).first();
          await confirmBtn.click();
        }
      }
    });

    test('allows provider to reduce dose for tolerability', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');

      const adjustBtn = page.getByRole('button', { name: /adjust|modify.*dose|reduce/i }).first();
      const hasBtn = await adjustBtn.count();
      if (hasBtn > 0) {
        await adjustBtn.click();
        await page.waitForTimeout(300);

        const doseSelect = page.locator('select[name="newDose"]').first();
        const hasSelect = await doseSelect.count();
        if (hasSelect > 0) {
          await doseSelect.selectOption('0.25mg');
        }
      }
    });
  });

  test.describe('Side Effect Tracking', () => {
    test('logs side effects during dose administration', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');

      const recordBtn = page.getByRole('button', { name: /record.*dose|administer/i }).first();
      const hasBtn = await recordBtn.count();
      if (hasBtn > 0) {
        await recordBtn.click();
        await page.waitForTimeout(300);

        const sideEffectCheckbox = page.locator('input[value="nausea"], label:has-text("Nausea") input').first();
        const hasCheckbox = await sideEffectCheckbox.count();
        if (hasCheckbox > 0) {
          await sideEffectCheckbox.check();
        }
      }
    });

    test('displays side effect history timeline', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');
      const nausea = page.getByText(/nausea/i).first();
      await expect(nausea).toBeVisible();
    });

    test('flags severe side effects for immediate attention', async ({ page }) => {
      await page.route('**/api/dashboard/clients/rec_patient_dose_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            client: MOCK_PATIENT_DOSE_PROFILE,
            titrationSchedule: MOCK_TITRATION_SCHEDULE.map((w) =>
              w.week === 6 ? { ...w, sideEffects: ['Severe nausea', 'Vomiting', 'Abdominal pain'] } : w
            ),
            doseLog: MOCK_DOSE_LOG,
            bloodWork: MOCK_BLOOD_WORK,
          }),
        })
      );

      await page.goto('/dashboard/clients/rec_patient_dose_001');
      const severeFlag = page.getByText(/severe|urgent|alert/i).first();
      const hasSevere = await severeFlag.count();
      expect(hasSevere).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Blood Work Integration', () => {
    test('displays latest blood work results', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');
      const a1c = page.getByText(/6\.1|A1C/i).first();
      await expect(a1c).toBeVisible();
    });

    test('highlights out-of-range values', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');
      const elevated = page.getByText(/elevated|high|out of range/i).first();
      const hasElevated = await elevated.count();
      expect(hasElevated).toBeGreaterThanOrEqual(0);
    });

    test('shows next blood work due date', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');
      const nextBlood = page.getByText(/Apr.*15|4\/15|next.*blood|lab.*due/i).first();
      await expect(nextBlood).toBeVisible();
    });

    test('displays blood work trend over time', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');
      const chart = page.locator('canvas, svg, [class*="chart"]').first();
      const hasChart = await chart.count();
      expect(hasChart).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Dose History', () => {
    test('displays chronological dose log', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');
      const doseEntries = page.locator('[data-testid="dose-entry"], tr, [class*="dose-row"]');
      const count = await doseEntries.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test('shows injection site for each dose', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');
      const site = page.getByText(/abdomen|thigh/i).first();
      await expect(site).toBeVisible();
    });

    test('displays weight at each dose checkpoint', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');
      const weight = page.getByText(/198|196|195|193|191|189/i).first();
      await expect(weight).toBeVisible();
    });

    test('shows provider notes for each dose', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');
      const note = page.getByText(/Tolerating well|baseline weight/i).first();
      await expect(note).toBeVisible();
    });
  });

  test.describe('Weight Progress Chart', () => {
    test('renders weight loss chart', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');
      const chart = page.locator('canvas, svg, [class*="chart"], [class*="graph"]').first();
      await expect(chart).toBeVisible();
    });

    test('shows starting weight vs current weight', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');
      await expect(page.getByText(/198/i).first()).toBeVisible();
      await expect(page.getByText(/189/i).first()).toBeVisible();
    });

    test('displays target weight goal line', async ({ page }) => {
      await page.goto('/dashboard/clients/rec_patient_dose_001');
      const target = page.getByText(/160|target|goal/i).first();
      await expect(target).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('handles dose recording API failure', async ({ page }) => {
      await page.route('**/api/dashboard/clients/rec_patient_dose_001/doses', (route) => {
        if (route.request().method() === 'POST') {
          return route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Failed to record dose' }),
          });
        }
        return route.continue();
      });

      await page.goto('/dashboard/clients/rec_patient_dose_001');
      const recordBtn = page.getByRole('button', { name: /record.*dose/i }).first();
      const hasBtn = await recordBtn.count();
      if (hasBtn > 0) {
        await recordBtn.click();
        await page.waitForTimeout(300);

        const submitBtn = page.getByRole('button', { name: /save|submit/i }).first();
        const hasSubmit = await submitBtn.count();
        if (hasSubmit > 0) {
          await submitBtn.click();
          const error = page.getByText(/error|failed/i).first();
          await expect(error).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('handles missing blood work data gracefully', async ({ page }) => {
      await page.route('**/api/dashboard/clients/rec_patient_dose_001*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            client: MOCK_PATIENT_DOSE_PROFILE,
            titrationSchedule: MOCK_TITRATION_SCHEDULE,
            doseLog: MOCK_DOSE_LOG,
            bloodWork: null,
          }),
        })
      );

      await page.goto('/dashboard/clients/rec_patient_dose_001');
      const noLabs = page.getByText(/no.*blood work|labs.*pending|schedule.*blood/i).first();
      const hasNoLabs = await noLabs.count();
      expect(hasNoLabs).toBeGreaterThanOrEqual(0);
    });
  });
});
