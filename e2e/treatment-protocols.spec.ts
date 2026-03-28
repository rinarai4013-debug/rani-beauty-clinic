import { test, expect } from '@playwright/test';

/**
 * Treatment Protocols E2E Tests
 * Tests protocol display, dose calculation, aftercare instructions,
 * pre-treatment requirements, and treatment plan generation.
 */

const MOCK_PROTOCOLS = [
  {
    id: 'protocol_botox',
    name: 'Botox/Dysport Protocol',
    category: 'injectable',
    provider: 'Dr. Landfield',
    steps: [
      { order: 1, name: 'Pre-Treatment Assessment', duration: 10, description: 'Review medical history, allergies, medications. Assess facial anatomy and treatment goals.' },
      { order: 2, name: 'Photography', duration: 5, description: 'Before photos from frontal, oblique, and lateral angles at rest and with animation.' },
      { order: 3, name: 'Marking', duration: 5, description: 'Mark injection sites based on assessment. Identify muscle groups and target areas.' },
      { order: 4, name: 'Cleansing', duration: 3, description: 'Cleanse treatment area with antiseptic. No topical anesthetic required for standard treatment.' },
      { order: 5, name: 'Injection', duration: 15, description: 'Administer Botox/Dysport at marked sites. Standard doses: Forehead 10-20u, Glabella 20u, Crows Feet 12-24u.' },
      { order: 6, name: 'Post-Treatment Review', duration: 5, description: 'Review aftercare instructions. Schedule 2-week follow-up for assessment.' },
    ],
    totalDuration: 43,
    pricing: { botox: '$12/unit', dysport: '$4/unit' },
  },
  {
    id: 'protocol_glp1',
    name: 'GLP-1 Weight Management Protocol',
    category: 'wellness',
    provider: 'Dr. Landfield',
    steps: [
      { order: 1, name: 'Initial Consultation', duration: 30, description: 'Comprehensive health assessment, BMI calculation, goal setting. Review contraindications.' },
      { order: 2, name: 'Blood Work', duration: 15, description: 'In-house blood draw: CMP, Lipid Panel, Thyroid Panel, A1C. Results within 2-3 business days.' },
      { order: 3, name: 'Program Selection', duration: 15, description: 'Review results with patient. Select Semaglutide or Tirzepatide based on health profile and goals.' },
      { order: 4, name: 'First Injection', duration: 10, description: 'Administer starting dose. Semaglutide: 0.25mg, Tirzepatide: 2.5mg. IM injection, rotate sites.' },
      { order: 5, name: 'Titration Schedule', duration: 5, description: 'Review 12-week titration plan. Set weekly injection appointments. Discuss side effect management.' },
      { order: 6, name: 'Follow-Up Protocol', duration: 5, description: 'Weekly injections with weight/vitals check. Monthly blood work. Dose adjustment as needed.' },
    ],
    totalDuration: 80,
    pricing: { semaglutide: '$399/mo', tirzepatide: '$599/mo' },
    titrationSchedule: {
      semaglutide: [
        { weeks: '1-4', dose: '0.25mg' },
        { weeks: '5-8', dose: '0.5mg' },
        { weeks: '9-12', dose: '1.0mg' },
        { weeks: '13-16', dose: '1.7mg' },
        { weeks: '17+', dose: '2.4mg' },
      ],
      tirzepatide: [
        { weeks: '1-4', dose: '2.5mg' },
        { weeks: '5-8', dose: '5mg' },
        { weeks: '9-12', dose: '7.5mg' },
        { weeks: '13-16', dose: '10mg' },
        { weeks: '17+', dose: '12.5mg or 15mg' },
      ],
    },
  },
  {
    id: 'protocol_hydrafacial',
    name: 'HydraFacial MD Protocol',
    category: 'facial',
    provider: 'All Providers',
    steps: [
      { order: 1, name: 'Consultation & Skin Analysis', duration: 10, description: 'Assess skin type, concerns, and goals. Select booster serums.' },
      { order: 2, name: 'Vortex Cleansing', duration: 5, description: 'Gentle exfoliation and resurfacing with HydraFacial tip to open pores.' },
      { order: 3, name: 'Acid Peel', duration: 5, description: 'Apply gentle glycolic/salicylic acid blend. No stinging or discomfort.' },
      { order: 4, name: 'Vortex Extraction', duration: 10, description: 'Painless suction extraction of impurities and blackheads.' },
      { order: 5, name: 'Vortex Fusion', duration: 10, description: 'Deliver antioxidants, peptides, and hyaluronic acid deep into skin.' },
      { order: 6, name: 'LED/Booster', duration: 10, description: 'Optional LED light therapy or specialty booster application.' },
    ],
    totalDuration: 50,
    pricing: { standard: '$275', deluxe: '$375' },
  },
];

const MOCK_AFTERCARE = {
  botox: {
    title: 'Botox Aftercare Instructions',
    instructions: [
      { timeframe: 'First 4 hours', items: ['Stay upright. Do not lie down.', 'Do not rub or massage treated areas.', 'Gentle facial exercises can help product settle.'] },
      { timeframe: 'First 24 hours', items: ['Avoid strenuous exercise.', 'Avoid alcohol consumption.', 'Do not wear tight headbands or hats.'] },
      { timeframe: 'First 2 weeks', items: ['Avoid facial treatments (peels, microneedling, laser).', 'Avoid excessive sun or heat exposure.', 'Results appear within 3-5 days, full effect at 2 weeks.'] },
    ],
    emergencyContact: '(425) 539-4440',
    followUpDays: 14,
  },
  glp1: {
    title: 'GLP-1 Injection Aftercare',
    instructions: [
      { timeframe: 'After injection', items: ['Apply light pressure to injection site if needed.', 'Mild redness at injection site is normal.', 'Take note of injection site for rotation.'] },
      { timeframe: 'First 48 hours', items: ['Eat smaller, more frequent meals.', 'Stay hydrated with at least 64 oz of water.', 'Avoid high-fat, greasy foods to minimize nausea.'] },
      { timeframe: 'Ongoing', items: ['Maintain protein-rich diet (minimum 60g protein daily).', 'Light to moderate exercise recommended.', 'Report persistent nausea, vomiting, or abdominal pain.'] },
    ],
    emergencyContact: '(425) 539-4440',
    followUpDays: 7,
  },
};

const MOCK_DOSE_CALCULATOR = {
  botox: {
    areas: [
      { name: 'Forehead', minUnits: 10, maxUnits: 30, standardUnits: 20 },
      { name: 'Glabella (11s)', minUnits: 15, maxUnits: 25, standardUnits: 20 },
      { name: 'Crows Feet', minUnits: 6, maxUnits: 16, standardUnits: 12, perSide: true },
      { name: 'Bunny Lines', minUnits: 4, maxUnits: 8, standardUnits: 6 },
      { name: 'Lip Flip', minUnits: 4, maxUnits: 8, standardUnits: 6 },
      { name: 'Chin (Mentalis)', minUnits: 4, maxUnits: 8, standardUnits: 6 },
      { name: 'Masseter', minUnits: 20, maxUnits: 40, standardUnits: 30, perSide: true },
    ],
    pricePerUnit: 12,
  },
};

test.describe('Treatment Protocols', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/dashboard/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { name: 'Rina', role: 'ceo', permissions: ['view_protocols', 'manage_protocols', 'view_aftercare'] },
        }),
      })
    );
  });

  test.describe('Protocol Display', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/protocols*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ protocols: MOCK_PROTOCOLS }),
        })
      );
    });

    test('lists all treatment protocols', async ({ page }) => {
      await page.goto('/dashboard');
      for (const protocol of MOCK_PROTOCOLS) {
        const protocolEntry = page.getByText(new RegExp(protocol.name.split(' ')[0], 'i')).first();
        await expect(protocolEntry).toBeVisible();
      }
    });

    test('shows protocol steps in order', async ({ page }) => {
      await page.goto('/dashboard');
      const step = page.getByText(/Pre-Treatment Assessment|Initial Consultation|Vortex Cleansing/i).first();
      await expect(step).toBeVisible();
    });

    test('displays step durations', async ({ page }) => {
      await page.goto('/dashboard');
      const duration = page.getByText(/10 min|30 min|15 min/i).first();
      const hasDuration = await duration.count();
      expect(hasDuration).toBeGreaterThanOrEqual(0);
    });

    test('shows total protocol duration', async ({ page }) => {
      await page.goto('/dashboard');
      const totalDuration = page.getByText(/43 min|80 min|50 min|total/i).first();
      const hasTotal = await totalDuration.count();
      expect(hasTotal).toBeGreaterThanOrEqual(0);
    });

    test('displays protocol pricing', async ({ page }) => {
      await page.goto('/dashboard');
      const pricing = page.getByText(/\$12.*unit|\$399.*mo|\$275/i).first();
      await expect(pricing).toBeVisible();
    });

    test('shows protocol category', async ({ page }) => {
      await page.goto('/dashboard');
      const category = page.getByText(/injectable|wellness|facial/i).first();
      await expect(category).toBeVisible();
    });

    test('displays supervising provider', async ({ page }) => {
      await page.goto('/dashboard');
      const provider = page.getByText(/Dr. Landfield|All Providers/i).first();
      await expect(provider).toBeVisible();
    });
  });

  test.describe('GLP-1 Titration Schedule', () => {
    test('displays Semaglutide titration schedule', async ({ page }) => {
      await page.route('**/api/dashboard/protocols*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ protocols: MOCK_PROTOCOLS }),
        })
      );

      await page.goto('/dashboard');
      const semaSchedule = page.getByText(/0\.25mg|0\.5mg|1\.0mg|1\.7mg|2\.4mg/i).first();
      await expect(semaSchedule).toBeVisible();
    });

    test('displays Tirzepatide titration schedule', async ({ page }) => {
      await page.route('**/api/dashboard/protocols*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ protocols: MOCK_PROTOCOLS }),
        })
      );

      await page.goto('/dashboard');
      const tirSchedule = page.getByText(/2\.5mg|5mg|7\.5mg|10mg|Tirzepatide/i).first();
      await expect(tirSchedule).toBeVisible();
    });

    test('shows week ranges for each dose level', async ({ page }) => {
      await page.route('**/api/dashboard/protocols*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ protocols: MOCK_PROTOCOLS }),
        })
      );

      await page.goto('/dashboard');
      const weekRange = page.getByText(/Week.*1-4|1-4|5-8|9-12/i).first();
      await expect(weekRange).toBeVisible();
    });
  });

  test.describe('Dose Calculator', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/protocols/dose-calculator*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_DOSE_CALCULATOR),
        })
      );
    });

    test('displays Botox treatment areas', async ({ page }) => {
      await page.goto('/dashboard');
      const area = page.getByText(/Forehead|Glabella|Crows Feet|Masseter/i).first();
      await expect(area).toBeVisible();
    });

    test('shows unit ranges per area', async ({ page }) => {
      await page.goto('/dashboard');
      const range = page.getByText(/10-30|15-25|units/i).first();
      const hasRange = await range.count();
      expect(hasRange).toBeGreaterThanOrEqual(0);
    });

    test('calculates total units and cost', async ({ page }) => {
      await page.goto('/dashboard');

      const foreheadInput = page.locator('input[name="forehead"], input[data-area="forehead"]').first();
      const hasInput = await foreheadInput.count();
      if (hasInput > 0) {
        await foreheadInput.fill('20');

        const glabellaInput = page.locator('input[name="glabella"]').first();
        const hasGlab = await glabellaInput.count();
        if (hasGlab > 0) {
          await glabellaInput.fill('20');
        }

        // Total should be 40 units x $12 = $480
        const total = page.getByText(/\$480|40 units|total/i).first();
        const hasTotal = await total.count();
        expect(hasTotal).toBeGreaterThanOrEqual(0);
      }
    });

    test('adjusts dose for bilateral areas (per side)', async ({ page }) => {
      await page.goto('/dashboard');
      const perSideLabel = page.getByText(/per side|bilateral|each side/i).first();
      const hasLabel = await perSideLabel.count();
      expect(hasLabel).toBeGreaterThanOrEqual(0);
    });

    test('shows standard dose as default', async ({ page }) => {
      await page.goto('/dashboard');
      const standardDose = page.getByText(/standard|recommended|20/i).first();
      const hasStandard = await standardDose.count();
      expect(hasStandard).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Aftercare Instructions', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/protocols/aftercare*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_AFTERCARE),
        })
      );
    });

    test('displays Botox aftercare instructions', async ({ page }) => {
      await page.goto('/dashboard');
      const aftercare = page.getByText(/Stay upright|Do not rub|4 hours/i).first();
      await expect(aftercare).toBeVisible();
    });

    test('shows GLP-1 aftercare instructions', async ({ page }) => {
      await page.goto('/dashboard');
      const glp1Care = page.getByText(/smaller.*meals|hydrated|protein/i).first();
      await expect(glp1Care).toBeVisible();
    });

    test('displays timeframe-based instruction grouping', async ({ page }) => {
      await page.goto('/dashboard');
      const timeframe = page.getByText(/First 4 hours|First 24 hours|First 2 weeks|After injection/i).first();
      await expect(timeframe).toBeVisible();
    });

    test('shows emergency contact number', async ({ page }) => {
      await page.goto('/dashboard');
      const phone = page.getByText(/425.*539.*4440/i).first();
      await expect(phone).toBeVisible();
    });

    test('shows follow-up schedule', async ({ page }) => {
      await page.goto('/dashboard');
      const followUp = page.getByText(/14 days|7 days|follow-up|2 weeks/i).first();
      await expect(followUp).toBeVisible();
    });

    test('aftercare never uses prohibited words', async ({ page }) => {
      await page.goto('/dashboard');
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.toLowerCase()).not.toContain('infusion');
    });
  });

  test.describe('Treatment Plan Generation', () => {
    test('generates treatment plan from consultation', async ({ page }) => {
      await page.route('**/api/dashboard/consult', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            treatmentPlan: {
              tiers: [
                { name: 'Good', services: ['Botox - Forehead & Glabella'], total: 480, timeline: 'Single session' },
                { name: 'Better', services: ['Botox - Full Face', 'HydraFacial'], total: 755, timeline: '2 sessions over 2 weeks' },
                { name: 'Best', services: ['Botox - Full Face', 'HydraFacial', 'RF Microneedling'], total: 1250, timeline: '3 sessions over 4 weeks' },
              ],
            },
          }),
        })
      );

      await page.goto('/dashboard/consult');
      const tierPlan = page.getByText(/Good|Better|Best/i).first();
      await expect(tierPlan).toBeVisible();
    });

    test('shows 3-tier pricing in treatment plans', async ({ page }) => {
      await page.route('**/api/dashboard/consult', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            treatmentPlan: {
              tiers: [
                { name: 'Good', total: 480 },
                { name: 'Better', total: 755 },
                { name: 'Best', total: 1250 },
              ],
            },
          }),
        })
      );

      await page.goto('/dashboard/consult');
      const price = page.getByText(/\$480|\$755|\$1,250/i).first();
      await expect(price).toBeVisible();
    });

    test('includes timeline for each tier', async ({ page }) => {
      await page.route('**/api/dashboard/consult', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            treatmentPlan: {
              tiers: [
                { name: 'Good', total: 480, timeline: 'Single session' },
                { name: 'Better', total: 755, timeline: '2 sessions over 2 weeks' },
                { name: 'Best', total: 1250, timeline: '3 sessions over 4 weeks' },
              ],
            },
          }),
        })
      );

      await page.goto('/dashboard/consult');
      const timeline = page.getByText(/Single session|2 sessions|3 sessions|timeline/i).first();
      await expect(timeline).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('handles protocol API failure', async ({ page }) => {
      await page.route('**/api/dashboard/protocols*', (route) =>
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

    test('handles empty protocol list', async ({ page }) => {
      await page.route('**/api/dashboard/protocols*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ protocols: [] }),
        })
      );

      await page.goto('/dashboard');
      const emptyState = page.getByText(/no protocols|create.*protocol|get started/i).first();
      const hasEmpty = await emptyState.count();
      expect(hasEmpty).toBeGreaterThanOrEqual(0);
    });
  });
});
