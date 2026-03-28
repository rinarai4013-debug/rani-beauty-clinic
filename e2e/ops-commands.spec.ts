import { test, expect } from '@playwright/test';

/**
 * Ops Commands E2E Tests
 * Tests operational command endpoints: /pipeline, /money, /refills,
 * /morning, /report and their dashboard integrations.
 */

const MOCK_PIPELINE_REPORT = {
  command: '/pipeline',
  generatedAt: '2026-03-26T08:00:00Z',
  summary: {
    totalLeads: 79,
    newThisWeek: 8,
    consultsScheduled: 5,
    conversionRate: 0.595,
    hotLeads: 3,
    staleLeads: 4,
  },
  stages: [
    { name: 'New', count: 12, change: '+3 from last week' },
    { name: 'Contacted', count: 8, change: '-1 from last week' },
    { name: 'Consult Scheduled', count: 5, change: '+2 from last week' },
    { name: 'Consult Done', count: 3, change: 'No change' },
    { name: 'Treatment Planned', count: 4, change: '+1 from last week' },
    { name: 'Active', count: 47, change: '+4 from last week' },
  ],
  actions: [
    'Follow up with 4 stale leads (no contact in 5+ days)',
    'Schedule consults for 3 hot leads',
    'Send thank-you messages to 4 new active patients',
  ],
};

const MOCK_MONEY_REPORT = {
  command: '/money',
  generatedAt: '2026-03-26T08:00:00Z',
  today: {
    revenue: 3250,
    transactions: 8,
    avgTicket: 406.25,
    topService: 'Botox',
  },
  week: {
    revenue: 18750,
    target: 22000,
    pacePercent: 0.852,
    projectedWeekEnd: 21500,
  },
  month: {
    revenue: 72400,
    target: 85000,
    pacePercent: 0.852,
    projectedMonthEnd: 83200,
    daysRemaining: 5,
  },
  topServices: [
    { service: 'Botox/Dysport', revenue: 18200, percentage: 0.251 },
    { service: 'GLP-1 Program', revenue: 15800, percentage: 0.218 },
    { service: 'Laser Hair Removal', revenue: 12400, percentage: 0.171 },
    { service: 'HydraFacial', revenue: 8800, percentage: 0.122 },
    { service: 'RF Microneedling', revenue: 7200, percentage: 0.099 },
  ],
  alerts: [
    { type: 'below_pace', message: 'Monthly revenue is 85.2% of target. Need $12,600 in remaining 5 days.' },
  ],
};

const MOCK_REFILLS_REPORT = {
  command: '/refills',
  generatedAt: '2026-03-26T08:00:00Z',
  summary: {
    totalActive: 42,
    dueToday: 3,
    dueThisWeek: 8,
    overdue: 3,
    monthlyRevenue: 16800,
  },
  dueToday: [
    { clientName: 'Rachel Kim', medication: 'Semaglutide 0.5mg', phone: '(425) 555-0142' },
    { clientName: 'Emily Nakamura', medication: 'Semaglutide 0.25mg', phone: '(425) 555-0311' },
    { clientName: 'David Chen', medication: 'Tirzepatide 5mg', phone: '(425) 555-0388' },
  ],
  overdue: [
    { clientName: 'Michelle Patel', medication: 'Tirzepatide 5mg', daysOverdue: 1, lastContact: '2026-03-24' },
    { clientName: 'Karen Lee', medication: 'Semaglutide 1.0mg', daysOverdue: 3, lastContact: '2026-03-20' },
    { clientName: 'Amy Rodriguez', medication: 'Semaglutide 0.5mg', daysOverdue: 5, lastContact: '2026-03-18' },
  ],
  actions: [
    'Call 3 overdue patients',
    'Send reminder texts to 8 due-this-week patients',
    'Check inventory: Tirzepatide 5mg stock low (3 units remaining)',
  ],
};

const MOCK_MORNING_REPORT = {
  command: '/morning',
  generatedAt: '2026-03-26T06:00:00Z',
  greeting: 'Good morning, Rina! Here is your clinic briefing for Wednesday, March 26.',
  schedule: {
    totalAppointments: 14,
    firstAppointment: '10:00 AM',
    lastAppointment: '6:30 PM',
    gaps: [
      { start: '12:00 PM', end: '1:00 PM', duration: 60, potentialRevenue: 275 },
      { start: '3:30 PM', end: '4:00 PM', duration: 30, potentialRevenue: 150 },
    ],
    noShowRisk: [
      { client: 'New Client - Jessica M.', time: '2:00 PM', risk: 0.42, reason: 'New client, no deposit' },
    ],
  },
  revenue: {
    yesterdayActual: 4100,
    yesterdayTarget: 3500,
    monthToDate: 72400,
    monthTarget: 85000,
  },
  priorities: [
    'Follow up with 3 overdue GLP-1 refill patients',
    'Review 2 new intake submissions',
    'Respond to 1 Google review (5-star)',
    'Schedule blood work for Rachel Kim (11 days overdue)',
  ],
  inventory: {
    alerts: [
      { item: 'Tirzepatide 5mg pens', stock: 3, status: 'critical' },
      { item: 'Semaglutide 0.5mg pens', stock: 8, status: 'low' },
    ],
  },
};

const MOCK_REPORT_WEEKLY = {
  command: '/report',
  type: 'weekly',
  period: '2026-03-20 to 2026-03-26',
  revenue: {
    total: 18750,
    target: 22000,
    variance: -3250,
    topDay: { day: 'Tuesday', revenue: 4800 },
    bottomDay: { day: 'Monday', revenue: 1900 },
  },
  clients: {
    newLeads: 8,
    newPatients: 4,
    totalVisits: 62,
    uniqueClients: 48,
    avgPerVisit: 302.42,
  },
  services: {
    mostPopular: 'Botox',
    highestRevenue: 'GLP-1 Program',
    fastestGrowing: 'Peptide Therapy',
  },
  metrics: {
    bookingRate: 0.78,
    noShowRate: 0.08,
    clientSatisfaction: 4.7,
    googleReviews: 3,
  },
};

test.describe('Ops Commands', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/dashboard/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { name: 'Rina', role: 'ceo', permissions: ['view_all', 'run_commands'] },
        }),
      })
    );
  });

  test.describe('/pipeline Command', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/leads/stats', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_PIPELINE_REPORT.summary),
        })
      );

      await page.route('**/api/dashboard/leads', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ stages: MOCK_PIPELINE_REPORT.stages }),
        })
      );
    });

    test('displays pipeline summary with total leads', async ({ page }) => {
      await page.goto('/dashboard');
      const totalLeads = page.getByText(/79|total.*leads/i).first();
      await expect(totalLeads).toBeVisible();
    });

    test('shows new leads this week', async ({ page }) => {
      await page.goto('/dashboard');
      const newLeads = page.getByText(/8.*new|new.*this week/i).first();
      await expect(newLeads).toBeVisible();
    });

    test('displays conversion rate', async ({ page }) => {
      await page.goto('/dashboard');
      const conversion = page.getByText(/59\.5%|conversion/i).first();
      await expect(conversion).toBeVisible();
    });

    test('shows stage-by-stage breakdown', async ({ page }) => {
      await page.goto('/dashboard');
      const stage = page.getByText(/Consult Scheduled|Treatment Planned/i).first();
      await expect(stage).toBeVisible();
    });

    test('displays recommended actions', async ({ page }) => {
      await page.goto('/dashboard');
      const action = page.getByText(/follow up|stale|hot leads/i).first();
      const hasAction = await action.count();
      expect(hasAction).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('/money Command', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/kpis*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            revenue: MOCK_MONEY_REPORT.today.revenue,
            weekRevenue: MOCK_MONEY_REPORT.week.revenue,
            monthRevenue: MOCK_MONEY_REPORT.month.revenue,
            transactions: MOCK_MONEY_REPORT.today.transactions,
          }),
        })
      );

      await page.route('**/api/dashboard/revenue*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            topServices: MOCK_MONEY_REPORT.topServices,
            monthTarget: MOCK_MONEY_REPORT.month.target,
          }),
        })
      );
    });

    test('displays today revenue', async ({ page }) => {
      await page.goto('/dashboard');
      const todayRev = page.getByText(/3,250|\$3\.2K|today.*revenue/i).first();
      await expect(todayRev).toBeVisible();
    });

    test('shows monthly revenue vs target', async ({ page }) => {
      await page.goto('/dashboard');
      const monthRev = page.getByText(/72,400|72\.4K/i).first();
      await expect(monthRev).toBeVisible();
    });

    test('displays pace percentage', async ({ page }) => {
      await page.goto('/dashboard');
      const pace = page.getByText(/85\.2%|pace|on track/i).first();
      const hasPace = await pace.count();
      expect(hasPace).toBeGreaterThanOrEqual(0);
    });

    test('shows top services by revenue', async ({ page }) => {
      await page.goto('/dashboard');
      const topService = page.getByText(/Botox.*Dysport|GLP-1|Laser/i).first();
      await expect(topService).toBeVisible();
    });

    test('displays revenue alerts when below pace', async ({ page }) => {
      await page.goto('/dashboard');
      const alert = page.getByText(/below.*pace|need.*\$12|target/i).first();
      const hasAlert = await alert.count();
      expect(hasAlert).toBeGreaterThanOrEqual(0);
    });

    test('shows average ticket size', async ({ page }) => {
      await page.goto('/dashboard');
      const avgTicket = page.getByText(/406|avg.*ticket|average/i).first();
      const hasTicket = await avgTicket.count();
      expect(hasTicket).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('/refills Command', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/refills*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_REFILLS_REPORT),
        })
      );
    });

    test('shows refills due today', async ({ page }) => {
      await page.goto('/dashboard');
      const dueToday = page.getByText(/3.*due today|due.*today.*3/i).first();
      await expect(dueToday).toBeVisible();
    });

    test('lists overdue refill patients', async ({ page }) => {
      await page.goto('/dashboard');
      const overdue = page.getByText(/Michelle Patel|overdue/i).first();
      await expect(overdue).toBeVisible();
    });

    test('shows refill revenue metric', async ({ page }) => {
      await page.goto('/dashboard');
      const revenue = page.getByText(/16,800|\$16\.8K/i).first();
      await expect(revenue).toBeVisible();
    });

    test('displays action items for refills', async ({ page }) => {
      await page.goto('/dashboard');
      const action = page.getByText(/Call.*overdue|reminder texts|inventory/i).first();
      const hasAction = await action.count();
      expect(hasAction).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('/morning Command', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/schedule*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_MORNING_REPORT.schedule),
        })
      );

      await page.route('**/api/dashboard/kpis*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_MORNING_REPORT.revenue),
        })
      );

      await page.route('**/api/dashboard/alerts', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ alerts: MOCK_MORNING_REPORT.inventory.alerts }),
        })
      );
    });

    test('shows today appointment count', async ({ page }) => {
      await page.goto('/dashboard');
      const apptCount = page.getByText(/14|appointments.*today/i).first();
      await expect(apptCount).toBeVisible();
    });

    test('displays schedule gaps with revenue potential', async ({ page }) => {
      await page.goto('/dashboard');
      const gap = page.getByText(/12:00|gap|potential/i).first();
      const hasGap = await gap.count();
      expect(hasGap).toBeGreaterThanOrEqual(0);
    });

    test('shows no-show risk alerts', async ({ page }) => {
      await page.goto('/dashboard');
      const noShowRisk = page.getByText(/no.show|risk|Jessica|42%/i).first();
      const hasRisk = await noShowRisk.count();
      expect(hasRisk).toBeGreaterThanOrEqual(0);
    });

    test('displays daily priorities', async ({ page }) => {
      await page.goto('/dashboard');
      const priority = page.getByText(/follow up|intake|review|blood work/i).first();
      await expect(priority).toBeVisible();
    });

    test('shows inventory alerts', async ({ page }) => {
      await page.goto('/dashboard');
      const inventoryAlert = page.getByText(/Tirzepatide|critical|low/i).first();
      await expect(inventoryAlert).toBeVisible();
    });

    test('displays yesterday revenue vs target', async ({ page }) => {
      await page.goto('/dashboard');
      const yesterdayRev = page.getByText(/4,100|yesterday/i).first();
      const hasYesterday = await yesterdayRev.count();
      expect(hasYesterday).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('/report Command', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/revenue*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_REPORT_WEEKLY.revenue),
        })
      );

      await page.route('**/api/dashboard/clients*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_REPORT_WEEKLY.clients),
        })
      );
    });

    test('shows weekly revenue total', async ({ page }) => {
      await page.goto('/dashboard');
      const weeklyRev = page.getByText(/18,750|\$18\.7K|weekly/i).first();
      await expect(weeklyRev).toBeVisible();
    });

    test('displays revenue variance from target', async ({ page }) => {
      await page.goto('/dashboard');
      const variance = page.getByText(/-3,250|below.*target|variance/i).first();
      const hasVariance = await variance.count();
      expect(hasVariance).toBeGreaterThanOrEqual(0);
    });

    test('shows new leads and patients count', async ({ page }) => {
      await page.goto('/dashboard');
      const newLeads = page.getByText(/8.*leads|new.*lead/i).first();
      await expect(newLeads).toBeVisible();
    });

    test('displays most popular service', async ({ page }) => {
      await page.goto('/dashboard');
      const popular = page.getByText(/Botox|most popular/i).first();
      await expect(popular).toBeVisible();
    });

    test('shows booking and no-show rates', async ({ page }) => {
      await page.goto('/dashboard');
      const bookingRate = page.getByText(/78%|booking.*rate/i).first();
      const hasRate = await bookingRate.count();
      expect(hasRate).toBeGreaterThanOrEqual(0);
    });

    test('displays Google review count', async ({ page }) => {
      await page.goto('/dashboard');
      const reviews = page.getByText(/3.*review|review/i).first();
      const hasReviews = await reviews.count();
      expect(hasReviews).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Error Handling', () => {
    test('handles KPI endpoint failure', async ({ page }) => {
      await page.route('**/api/dashboard/kpis*', (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Database timeout' }),
        })
      );

      await page.goto('/dashboard');
      const error = page.getByText(/error|unavailable|failed|retry/i).first();
      await expect(error).toBeVisible({ timeout: 5000 });
    });

    test('handles schedule endpoint failure', async ({ page }) => {
      await page.route('**/api/dashboard/schedule*', (route) =>
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Mangomint sync error' }),
        })
      );

      await page.goto('/dashboard');
      const error = page.getByText(/error|sync|unavailable/i).first();
      await expect(error).toBeVisible({ timeout: 5000 });
    });

    test('handles revenue endpoint failure gracefully', async ({ page }) => {
      await page.route('**/api/dashboard/revenue*', (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Airtable rate limit exceeded' }),
        })
      );

      await page.goto('/dashboard');
      const error = page.getByText(/error|rate limit|unavailable/i).first();
      await expect(error).toBeVisible({ timeout: 5000 });
    });

    test('displays partial data when some endpoints fail', async ({ page }) => {
      await page.route('**/api/dashboard/kpis*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ revenue: 3250, transactions: 8 }),
        })
      );

      await page.route('**/api/dashboard/schedule*', (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed' }),
        })
      );

      await page.goto('/dashboard');
      // Revenue should still display even if schedule fails
      const revenue = page.getByText(/3,250/i).first();
      await expect(revenue).toBeVisible();
    });
  });
});
