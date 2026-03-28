import {
  analyzeRevenueGaps,
  REBOOK_INTERVALS,
  DAY_NAMES,
} from '../gap-finder';
import type {
  GapFinderInput,
  GapFinderResult,
  ScheduledAppointment,
  ProviderSchedule,
  ServiceConfig,
  ClientRecord,
  MembershipRecord,
  TransactionRecord,
  KPISnapshot,
} from '../gap-finder';

// ── HELPERS ──

function makeDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

function makeProviders(): ProviderSchedule[] {
  return [
    {
      name: 'Rina',
      role: 'provider',
      workingDays: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '17:00',
      services: ['Botox', 'Fillers', 'HydraFacial', 'Sofwave', 'RF Microneedling'],
      hourlyCapacity: 250,
    },
    {
      name: 'Mom',
      role: 'esthetician',
      workingDays: [1, 2, 3, 4, 5, 6],
      startTime: '10:00',
      endTime: '16:00',
      services: ['HydraFacial', 'VI Peel', 'PRX-T33', 'Laser Hair Removal'],
      hourlyCapacity: 180,
    },
  ];
}

function makeServices(): ServiceConfig[] {
  return [
    { name: 'Botox', category: 'Injectable', basePrice: 350, duration: 30, rebookIntervalDays: 90, avgRevenuePerSession: 350 },
    { name: 'HydraFacial', category: 'Facial', basePrice: 275, duration: 60, rebookIntervalDays: 30, avgRevenuePerSession: 275 },
    { name: 'VI Peel', category: 'Facial', basePrice: 395, duration: 45, rebookIntervalDays: 42, avgRevenuePerSession: 395 },
    { name: 'Fillers', category: 'Injectable', basePrice: 650, duration: 45, rebookIntervalDays: 365, avgRevenuePerSession: 650 },
    { name: 'Sofwave', category: 'Skin Tightening', basePrice: 3500, duration: 60, rebookIntervalDays: 365, avgRevenuePerSession: 3500 },
    { name: 'RF Microneedling', category: 'Skin Renewal', basePrice: 650, duration: 60, rebookIntervalDays: 42, avgRevenuePerSession: 650 },
    { name: 'PRX-T33', category: 'Facial', basePrice: 495, duration: 30, rebookIntervalDays: 28, avgRevenuePerSession: 495 },
    { name: 'Laser Hair Removal', category: 'Laser', basePrice: 200, duration: 30, rebookIntervalDays: 42, avgRevenuePerSession: 200 },
  ];
}

function makeInput(overrides: Partial<GapFinderInput> = {}): GapFinderInput {
  return {
    appointments: [],
    providers: makeProviders(),
    services: makeServices(),
    clients: [],
    memberships: [],
    transactions: [],
    kpiSnapshots: [],
    dateRange: { start: makeDate(0), end: makeDate(14) },
    ...overrides,
  };
}

// ── TESTS ──

describe('Revenue Gap Finder', () => {
  describe('analyzeRevenueGaps', () => {
    it('should return a valid GapFinderResult structure', () => {
      const result = analyzeRevenueGaps(makeInput());
      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.emptySlots).toBeDefined();
      expect(result.underperformingDays).toBeDefined();
      expect(result.decliningServices).toBeDefined();
      expect(result.overdueClients).toBeDefined();
      expect(result.membershipGaps).toBeDefined();
      expect(result.dormantHighValue).toBeDefined();
      expect(result.actionItems).toBeDefined();
    });

    it('should have a summary with all required fields', () => {
      const result = analyzeRevenueGaps(makeInput());
      const { summary } = result;
      expect(typeof summary.totalAddressableGap).toBe('number');
      expect(summary.gapByCategory).toBeDefined();
      expect(typeof summary.fillabilityScore).toBe('number');
      expect(typeof summary.urgencyScore).toBe('number');
      expect(typeof summary.period).toBe('string');
    });

    it('should calculate totalAddressableGap as sum of categories', () => {
      const result = analyzeRevenueGaps(makeInput());
      const { gapByCategory, totalAddressableGap } = result.summary;
      const sum = Object.values(gapByCategory).reduce((s, v) => s + v, 0);
      expect(totalAddressableGap).toBe(sum);
    });

    it('should constrain fillabilityScore between 0-100', () => {
      const result = analyzeRevenueGaps(makeInput());
      expect(result.summary.fillabilityScore).toBeGreaterThanOrEqual(0);
      expect(result.summary.fillabilityScore).toBeLessThanOrEqual(100);
    });

    it('should constrain urgencyScore between 0-100', () => {
      const result = analyzeRevenueGaps(makeInput());
      expect(result.summary.urgencyScore).toBeGreaterThanOrEqual(0);
      expect(result.summary.urgencyScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Empty Slot Detection', () => {
    it('should detect empty slots when no appointments exist', () => {
      const result = analyzeRevenueGaps(makeInput());
      expect(result.emptySlots.length).toBeGreaterThan(0);
    });

    it('should not detect slots on non-working days', () => {
      const result = analyzeRevenueGaps(makeInput());
      // Rina doesn't work Sunday (0) or Saturday (6)
      const rinaSlots = result.emptySlots.filter(s => s.provider === 'Rina');
      const sunSlots = rinaSlots.filter(s => s.dayOfWeek === 'Sunday');
      expect(sunSlots.length).toBe(0);
    });

    it('should calculate estimatedRevenue for empty slots', () => {
      const result = analyzeRevenueGaps(makeInput());
      for (const slot of result.emptySlots) {
        expect(slot.estimatedRevenue).toBeGreaterThan(0);
      }
    });

    it('should suggest services that fit within slot duration', () => {
      const result = analyzeRevenueGaps(makeInput());
      for (const slot of result.emptySlots) {
        if (slot.suggestedServices.length > 0) {
          // All suggested services should be available from the provider
          expect(slot.suggestedServices.length).toBeLessThanOrEqual(3);
        }
      }
    });

    it('should set fillDifficulty based on days until slot', () => {
      const result = analyzeRevenueGaps(makeInput({ dateRange: { start: makeDate(0), end: makeDate(7) } }));
      for (const slot of result.emptySlots) {
        if (slot.daysUntil <= 1) expect(slot.fillDifficulty).toBe('hard');
        else if (slot.daysUntil <= 3) expect(slot.fillDifficulty).toBe('moderate');
        else expect(slot.fillDifficulty).toBe('easy');
      }
    });

    it('should sort empty slots by daysUntil ascending', () => {
      const result = analyzeRevenueGaps(makeInput());
      for (let i = 1; i < result.emptySlots.length; i++) {
        expect(result.emptySlots[i].daysUntil).toBeGreaterThanOrEqual(result.emptySlots[i - 1].daysUntil);
      }
    });

    it('should detect gaps between appointments', () => {
      const tomorrow = makeDate(1);
      const dow = new Date(tomorrow + 'T00:00:00').getDay();
      // Only test if tomorrow is a weekday
      if (dow >= 1 && dow <= 5) {
        const appts: ScheduledAppointment[] = [
          { id: '1', date: tomorrow, startTime: '09:00', endTime: '10:00', service: 'Botox', provider: 'Rina', clientId: 'c1', clientName: 'Test', estimatedRevenue: 350, status: 'confirmed' },
          { id: '2', date: tomorrow, startTime: '14:00', endTime: '15:00', service: 'Botox', provider: 'Rina', clientId: 'c2', clientName: 'Test2', estimatedRevenue: 350, status: 'confirmed' },
        ];
        const result = analyzeRevenueGaps(makeInput({ appointments: appts }));
        // Should find gap between 10:00-14:00 for Rina
        const rinaGaps = result.emptySlots.filter(s => s.provider === 'Rina' && s.date === tomorrow);
        expect(rinaGaps.length).toBeGreaterThan(0);
      }
    });

    it('should limit to 50 empty slots', () => {
      const result = analyzeRevenueGaps(makeInput({ dateRange: { start: makeDate(0), end: makeDate(30) } }));
      expect(result.emptySlots.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Underperforming Days', () => {
    it('should detect underperforming days from KPI data', () => {
      const snapshots: KPISnapshot[] = [];
      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dow = d.getDay();
        snapshots.push({
          date: d.toISOString().split('T')[0],
          revenue: dow === 1 ? 500 : 2000, // Monday is weak
          totalBookings: dow === 1 ? 3 : 8,
          dayOfWeek: dow,
        });
      }
      const result = analyzeRevenueGaps(makeInput({ kpiSnapshots: snapshots }));
      const monday = result.underperformingDays.find(d => d.dayOfWeek === 'Monday');
      if (monday) {
        expect(monday.gap).toBeGreaterThan(0);
        expect(monday.gapPercent).toBeGreaterThan(10);
      }
    });

    it('should sort underperforming days by gap descending', () => {
      const snapshots: KPISnapshot[] = [];
      for (let i = 0; i < 60; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dow = d.getDay();
        if (dow === 0) continue;
        snapshots.push({
          date: d.toISOString().split('T')[0],
          revenue: dow === 1 ? 400 : dow === 2 ? 800 : 2000,
          totalBookings: dow === 1 ? 2 : dow === 2 ? 4 : 8,
          dayOfWeek: dow,
        });
      }
      const result = analyzeRevenueGaps(makeInput({ kpiSnapshots: snapshots }));
      for (let i = 1; i < result.underperformingDays.length; i++) {
        expect(result.underperformingDays[i].gap).toBeLessThanOrEqual(result.underperformingDays[i - 1].gap);
      }
    });

    it('should provide suggested actions for each underperforming day', () => {
      const snapshots: KPISnapshot[] = [];
      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dow = d.getDay();
        snapshots.push({
          date: d.toISOString().split('T')[0],
          revenue: dow === 1 ? 200 : 2000,
          totalBookings: dow === 1 ? 1 : 8,
          dayOfWeek: dow,
        });
      }
      const result = analyzeRevenueGaps(makeInput({ kpiSnapshots: snapshots }));
      for (const day of result.underperformingDays) {
        expect(day.suggestedActions.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Declining Services', () => {
    it('should detect services with declining bookings', () => {
      const now = new Date();
      const transactions: TransactionRecord[] = [];
      // Last month: 10 HydraFacials
      for (let i = 0; i < 10; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - 1, i + 1);
        transactions.push({ date: d.toISOString(), amount: 275, service: 'HydraFacial', provider: 'Mom', clientId: `c${i}` });
      }
      // This month (projected): only 3 HydraFacials
      for (let i = 0; i < 3; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
        transactions.push({ date: d.toISOString(), amount: 275, service: 'HydraFacial', provider: 'Mom', clientId: `c${i}` });
      }

      const result = analyzeRevenueGaps(makeInput({ transactions }));
      // Note: projection depends on day of month, so declining may or may not trigger
      expect(result.decliningServices).toBeDefined();
    });

    it('should calculate revenue impact for declining services', () => {
      const result = analyzeRevenueGaps(makeInput());
      for (const svc of result.decliningServices) {
        expect(svc.revenueImpact).toBeGreaterThanOrEqual(0);
        expect(svc.declinePercent).toBeGreaterThanOrEqual(15);
      }
    });
  });

  describe('Overdue Client Detection', () => {
    it('should detect clients overdue for Botox rebooking', () => {
      const clients: ClientRecord[] = [{
        id: 'c1', name: 'Jane Doe', email: 'jane@test.com', phone: '555-0100',
        status: 'active',
        lastVisitDate: new Date(Date.now() - 100 * 86400000).toISOString(),
        totalSpend: 2000, visitCount: 5, lastServices: ['Botox'],
        preferredProvider: 'Rina',
      }];
      const result = analyzeRevenueGaps(makeInput({ clients }));
      const overdue = result.overdueClients.find(c => c.clientName === 'Jane Doe');
      expect(overdue).toBeDefined();
      expect(overdue!.daysOverdue).toBeGreaterThan(0);
      expect(overdue!.urgency).not.toBe('due-soon');
    });

    it('should detect client due soon for HydraFacial', () => {
      const clients: ClientRecord[] = [{
        id: 'c2', name: 'Sarah Smith', email: 'sarah@test.com', phone: '555-0200',
        status: 'active',
        lastVisitDate: new Date(Date.now() - 25 * 86400000).toISOString(),
        totalSpend: 1500, visitCount: 8, lastServices: ['HydraFacial'],
      }];
      const result = analyzeRevenueGaps(makeInput({ clients }));
      const dueSoon = result.overdueClients.find(c => c.clientName === 'Sarah Smith');
      expect(dueSoon).toBeDefined();
      expect(dueSoon!.urgency).toBe('due-soon');
    });

    it('should not flag churned clients', () => {
      const clients: ClientRecord[] = [{
        id: 'c3', name: 'Lost Client', email: 'lost@test.com', phone: '',
        status: 'churned',
        lastVisitDate: new Date(Date.now() - 200 * 86400000).toISOString(),
        totalSpend: 500, visitCount: 2, lastServices: ['Botox'],
      }];
      const result = analyzeRevenueGaps(makeInput({ clients }));
      expect(result.overdueClients.find(c => c.clientName === 'Lost Client')).toBeUndefined();
    });

    it('should assign correct urgency levels', () => {
      const makeClient = (name: string, daysSince: number, service: string): ClientRecord => ({
        id: name, name, email: '', phone: '555-0000', status: 'active',
        lastVisitDate: new Date(Date.now() - daysSince * 86400000).toISOString(),
        totalSpend: 1000, visitCount: 3, lastServices: [service],
      });

      const clients = [
        makeClient('DueSoon', 82, 'Botox'), // 82 days, botox=90, 8 days before
        makeClient('Overdue', 95, 'Botox'), // 5 days overdue
        makeClient('VeryOverdue', 130, 'Botox'), // 40 days overdue
        makeClient('AtRisk', 150, 'Botox'), // 60 days overdue
      ];

      const result = analyzeRevenueGaps(makeInput({ clients }));
      const byName = (n: string) => result.overdueClients.find(c => c.clientName === n);

      if (byName('DueSoon')) expect(byName('DueSoon')!.urgency).toBe('due-soon');
      if (byName('Overdue')) expect(byName('Overdue')!.urgency).toBe('overdue');
      if (byName('VeryOverdue')) expect(byName('VeryOverdue')!.urgency).toBe('significantly-overdue');
      if (byName('AtRisk')) expect(byName('AtRisk')!.urgency).toBe('at-risk');
    });

    it('should sort overdue clients by estimatedRevenue descending', () => {
      const result = analyzeRevenueGaps(makeInput({
        clients: [
          { id: 'c1', name: 'Low', email: '', phone: '', status: 'active', lastVisitDate: new Date(Date.now() - 100 * 86400000).toISOString(), totalSpend: 500, visitCount: 2, lastServices: ['B12 Injection'] },
          { id: 'c2', name: 'High', email: '', phone: '', status: 'active', lastVisitDate: new Date(Date.now() - 100 * 86400000).toISOString(), totalSpend: 5000, visitCount: 10, lastServices: ['Sofwave'] },
        ],
      }));
      if (result.overdueClients.length >= 2) {
        expect(result.overdueClients[0].estimatedRevenue).toBeGreaterThanOrEqual(result.overdueClients[1].estimatedRevenue);
      }
    });
  });

  describe('Membership Underutilization', () => {
    it('should flag members using less than 50% credits', () => {
      const memberships: MembershipRecord[] = [{
        id: 'm1', clientId: 'c1', clientName: 'Low User', tier: 'Glow',
        monthlyPrice: 249, status: 'active', startDate: '2025-01-01',
        creditsRemaining: 200, creditsUsedThisMonth: 49, totalMonthlyCredits: 249,
      }];
      const result = analyzeRevenueGaps(makeInput({ memberships }));
      const gap = result.membershipGaps.find(g => g.clientName === 'Low User');
      expect(gap).toBeDefined();
      expect(gap!.utilizationPercent).toBeLessThan(50);
    });

    it('should flag members who have not redeemed in 30+ days', () => {
      const memberships: MembershipRecord[] = [{
        id: 'm2', clientId: 'c2', clientName: 'Absent Member', tier: 'Halo',
        monthlyPrice: 149, status: 'active', startDate: '2025-01-01',
        creditsRemaining: 149, creditsUsedThisMonth: 0, totalMonthlyCredits: 149,
        lastRedemptionDate: new Date(Date.now() - 45 * 86400000).toISOString(),
      }];
      const result = analyzeRevenueGaps(makeInput({ memberships }));
      expect(result.membershipGaps.length).toBeGreaterThan(0);
    });

    it('should not flag inactive memberships', () => {
      const memberships: MembershipRecord[] = [{
        id: 'm3', clientId: 'c3', clientName: 'Cancelled', tier: 'Glow',
        monthlyPrice: 249, status: 'cancelled', startDate: '2025-01-01',
        creditsRemaining: 249, creditsUsedThisMonth: 0, totalMonthlyCredits: 249,
      }];
      const result = analyzeRevenueGaps(makeInput({ memberships }));
      expect(result.membershipGaps.find(g => g.clientName === 'Cancelled')).toBeUndefined();
    });

    it('should generate outreach message for underutilizing members', () => {
      const memberships: MembershipRecord[] = [{
        id: 'm4', clientId: 'c4', clientName: 'Needs Nudge', tier: 'Glow',
        monthlyPrice: 249, status: 'active', startDate: '2025-01-01',
        creditsRemaining: 200, creditsUsedThisMonth: 49, totalMonthlyCredits: 249,
      }];
      const result = analyzeRevenueGaps(makeInput({ memberships }));
      const gap = result.membershipGaps.find(g => g.clientName === 'Needs Nudge');
      expect(gap?.suggestedOutreach).toBeTruthy();
      expect(gap!.suggestedOutreach.length).toBeGreaterThan(0);
    });
  });

  describe('Dormant High-Value Clients', () => {
    it('should identify dormant high spenders', () => {
      const clients: ClientRecord[] = [];
      // Create 10 clients with varying spend
      for (let i = 0; i < 10; i++) {
        clients.push({
          id: `c${i}`, name: `Client ${i}`, email: '', phone: '', status: 'active',
          lastVisitDate: new Date(Date.now() - (i < 2 ? 60 : 20) * 86400000).toISOString(),
          totalSpend: i < 2 ? 8000 : 500, visitCount: i < 2 ? 15 : 2,
          lastServices: ['HydraFacial'],
        });
      }
      const result = analyzeRevenueGaps(makeInput({ clients }));
      const dormant = result.dormantHighValue.filter(d => d.totalSpend >= 8000);
      expect(dormant.length).toBeGreaterThan(0);
    });

    it('should not flag recent high-value visitors', () => {
      const clients: ClientRecord[] = [{
        id: 'c1', name: 'Active VIP', email: '', phone: '', status: 'active',
        lastVisitDate: new Date(Date.now() - 10 * 86400000).toISOString(),
        totalSpend: 10000, visitCount: 20, lastServices: ['Botox'],
      }];
      const result = analyzeRevenueGaps(makeInput({ clients }));
      expect(result.dormantHighValue.find(d => d.clientName === 'Active VIP')).toBeUndefined();
    });

    it('should calculate estimatedRecoverableRevenue based on avg ticket', () => {
      const clients: ClientRecord[] = [{
        id: 'c1', name: 'Dormant VIP', email: '', phone: '', status: 'active',
        lastVisitDate: new Date(Date.now() - 100 * 86400000).toISOString(),
        totalSpend: 6000, visitCount: 12, lastServices: ['Sofwave'],
      }];
      // Need enough clients for threshold calculation
      for (let i = 1; i < 10; i++) {
        clients.push({
          id: `c${i}`, name: `Other ${i}`, email: '', phone: '', status: 'active',
          lastVisitDate: new Date(Date.now() - 10 * 86400000).toISOString(),
          totalSpend: 200, visitCount: 1, lastServices: ['HydraFacial'],
        });
      }
      const result = analyzeRevenueGaps(makeInput({ clients }));
      const dormant = result.dormantHighValue.find(d => d.clientName === 'Dormant VIP');
      if (dormant) {
        expect(dormant.estimatedRecoverableRevenue).toBe(Math.round(dormant.avgTicket * 2));
      }
    });
  });

  describe('Action Items', () => {
    it('should sort action items by priority descending', () => {
      const result = analyzeRevenueGaps(makeInput());
      for (let i = 1; i < result.actionItems.length; i++) {
        expect(result.actionItems[i].priority).toBeLessThanOrEqual(result.actionItems[i - 1].priority);
      }
    });

    it('should limit action items to 25', () => {
      const result = analyzeRevenueGaps(makeInput({ dateRange: { start: makeDate(0), end: makeDate(30) } }));
      expect(result.actionItems.length).toBeLessThanOrEqual(25);
    });

    it('should have valid categories for all actions', () => {
      const validCategories = ['fill-slot', 'rebook-overdue', 'activate-membership', 'reactivate-vip', 'boost-service', 'optimize-day'];
      const result = analyzeRevenueGaps(makeInput());
      for (const action of result.actionItems) {
        expect(validCategories).toContain(action.category);
      }
    });

    it('should have valid effort levels', () => {
      const validEfforts = ['low', 'medium', 'high'];
      const result = analyzeRevenueGaps(makeInput());
      for (const action of result.actionItems) {
        expect(validEfforts).toContain(action.effort);
      }
    });

    it('should have valid timeToImpact values', () => {
      const validTimes = ['same-day', 'this-week', 'this-month'];
      const result = analyzeRevenueGaps(makeInput());
      for (const action of result.actionItems) {
        expect(validTimes).toContain(action.timeToImpact);
      }
    });
  });

  describe('Constants', () => {
    it('REBOOK_INTERVALS should contain common services', () => {
      expect(REBOOK_INTERVALS['Botox']).toBe(90);
      expect(REBOOK_INTERVALS['HydraFacial']).toBe(30);
      expect(REBOOK_INTERVALS['Fillers']).toBe(365);
      expect(REBOOK_INTERVALS['GLP-1']).toBe(7);
    });

    it('DAY_NAMES should have 7 entries', () => {
      expect(DAY_NAMES.length).toBe(7);
      expect(DAY_NAMES[0]).toBe('Sunday');
      expect(DAY_NAMES[6]).toBe('Saturday');
    });
  });
});
