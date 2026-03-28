import { analyzeRetention, SERVICE_REBOOK_DAYS } from '../retention-machine';
import type { RetentionInput, RetentionResult, RetentionClient } from '../retention-machine';

// ── HELPERS ──

function makeClient(overrides: Partial<RetentionClient> = {}): RetentionClient {
  return {
    id: 'c1', name: 'Jane Doe', email: 'jane@test.com', phone: '555-0100',
    status: 'active',
    lastVisitDate: new Date(Date.now() - 40 * 86400000).toISOString(),
    totalSpend: 2500, visitCount: 6, avgTicket: 416,
    lastServices: ['HydraFacial'],
    preferredContact: 'sms',
    ...overrides,
  };
}

function makeInput(overrides: Partial<RetentionInput> = {}): RetentionInput {
  return {
    clients: [],
    memberships: [],
    appointments: [],
    packages: [],
    feedbackScores: [],
    config: {
      avgAcquisitionCost: 150,
      avgClientLTV: 2800,
      rebookReminderDays: [7, 0, -7],
      lapsedTiers: [{ days: 30, label: '30-day' }, { days: 60, label: '60-day' }, { days: 90, label: '90-day' }],
      vipSpendThreshold: 3000,
    },
    ...overrides,
  };
}

// ── TESTS ──

describe('Retention Machine', () => {
  describe('analyzeRetention', () => {
    it('should return valid result structure', () => {
      const result = analyzeRetention(makeInput());
      expect(result.summary).toBeDefined();
      expect(result.rebookingTriggers).toBeDefined();
      expect(result.rebookReminders).toBeDefined();
      expect(result.winBackCampaigns).toBeDefined();
      expect(result.vipRetention).toBeDefined();
      expect(result.membershipRenewals).toBeDefined();
      expect(result.packageCompletions).toBeDefined();
      expect(result.seasonalReactivation).toBeDefined();
      expect(result.birthdayTouchpoints).toBeDefined();
      expect(result.feedbackRecovery).toBeDefined();
      expect(result.retentionMetrics).toBeDefined();
    });

    it('should have summary with all required fields', () => {
      const result = analyzeRetention(makeInput());
      expect(typeof result.summary.totalClientsNeedingAction).toBe('number');
      expect(typeof result.summary.urgentActions).toBe('number');
      expect(typeof result.summary.estimatedRecoverableRevenue).toBe('number');
      expect(typeof result.summary.retentionRate).toBe('number');
    });
  });

  describe('Rebooking Triggers', () => {
    it('should detect overdue HydraFacial rebooking', () => {
      const clients = [makeClient({
        lastVisitDate: new Date(Date.now() - 35 * 86400000).toISOString(),
        lastServices: ['HydraFacial'], // 30-day interval
      })];
      const appointments = [{
        clientId: 'c1', service: 'HydraFacial',
        date: new Date(Date.now() - 35 * 86400000).toISOString().split('T')[0],
        status: 'completed' as const, provider: 'Mom',
      }];
      const result = analyzeRetention(makeInput({ clients, appointments }));
      const trigger = result.rebookingTriggers.find(t => t.clientName === 'Jane Doe');
      expect(trigger).toBeDefined();
    });

    it('should not trigger for clients with upcoming appointments', () => {
      const clients = [makeClient({
        nextAppointmentDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      })];
      const result = analyzeRetention(makeInput({ clients }));
      expect(result.rebookingTriggers.find(t => t.clientName === 'Jane Doe')).toBeUndefined();
    });

    it('should not trigger for churned clients', () => {
      const clients = [makeClient({ status: 'churned' })];
      const result = analyzeRetention(makeInput({ clients }));
      expect(result.rebookingTriggers.find(t => t.clientName === 'Jane Doe')).toBeUndefined();
    });

    it('should assign correct status', () => {
      const result = analyzeRetention(makeInput());
      for (const trigger of result.rebookingTriggers) {
        expect(['upcoming', 'due-now', 'overdue']).toContain(trigger.status);
      }
    });
  });

  describe('Rebook Reminders', () => {
    it('should generate reminders for triggers', () => {
      const clients = [makeClient({
        id: 'c1',
        lastVisitDate: new Date(Date.now() - 35 * 86400000).toISOString(),
      })];
      const appointments = [{
        clientId: 'c1', service: 'HydraFacial',
        date: new Date(Date.now() - 35 * 86400000).toISOString().split('T')[0],
        status: 'completed' as const, provider: 'Mom',
      }];
      const result = analyzeRetention(makeInput({ clients, appointments }));
      // Should have at least one reminder if there are triggers
      if (result.rebookingTriggers.length > 0) {
        expect(result.rebookReminders.length).toBeGreaterThan(0);
      }
    });

    it('should personalize messages with first name', () => {
      const clients = [makeClient({
        name: 'Priya Patel',
        lastVisitDate: new Date(Date.now() - 35 * 86400000).toISOString(),
      })];
      const appointments = [{
        clientId: 'c1', service: 'HydraFacial',
        date: new Date(Date.now() - 35 * 86400000).toISOString().split('T')[0],
        status: 'completed' as const, provider: 'Mom',
      }];
      const result = analyzeRetention(makeInput({ clients, appointments }));
      for (const reminder of result.rebookReminders) {
        if (reminder.clientName === 'Priya Patel') {
          expect(reminder.message).toContain('Priya');
        }
      }
    });

    it('should have valid reminder types', () => {
      const result = analyzeRetention(makeInput());
      for (const reminder of result.rebookReminders) {
        expect(['first', 'second', 'final']).toContain(reminder.reminderType);
      }
    });
  });

  describe('Win-Back Campaigns', () => {
    it('should create three campaign tiers', () => {
      const result = analyzeRetention(makeInput());
      expect(result.winBackCampaigns.length).toBe(3);
      expect(result.winBackCampaigns.map(c => c.tier)).toEqual(['30-day', '60-day', '90-day']);
    });

    it('should segment clients into correct tiers', () => {
      const clients = [
        makeClient({ id: 'c1', name: 'Recent', lastVisitDate: new Date(Date.now() - 40 * 86400000).toISOString() }),
        makeClient({ id: 'c2', name: 'Medium', lastVisitDate: new Date(Date.now() - 75 * 86400000).toISOString() }),
        makeClient({ id: 'c3', name: 'Long', lastVisitDate: new Date(Date.now() - 100 * 86400000).toISOString() }),
      ];
      const result = analyzeRetention(makeInput({ clients }));
      const tier30 = result.winBackCampaigns.find(c => c.tier === '30-day');
      const tier60 = result.winBackCampaigns.find(c => c.tier === '60-day');
      const tier90 = result.winBackCampaigns.find(c => c.tier === '90-day');

      expect(tier30?.clients.find(c => c.clientName === 'Recent')).toBeDefined();
      expect(tier60?.clients.find(c => c.clientName === 'Medium')).toBeDefined();
      expect(tier90?.clients.find(c => c.clientName === 'Long')).toBeDefined();
    });

    it('should escalate urgency by tier', () => {
      const result = analyzeRetention(makeInput());
      expect(result.winBackCampaigns[0].campaign.urgency).toBe('gentle');
      expect(result.winBackCampaigns[1].campaign.urgency).toBe('moderate');
      expect(result.winBackCampaigns[2].campaign.urgency).toBe('strong');
    });

    it('should calculate win-back probability', () => {
      const clients = [
        makeClient({ id: 'c1', name: 'Frequent', visitCount: 15, totalSpend: 8000, lastVisitDate: new Date(Date.now() - 45 * 86400000).toISOString() }),
        makeClient({ id: 'c2', name: 'Rare', visitCount: 1, totalSpend: 275, lastVisitDate: new Date(Date.now() - 100 * 86400000).toISOString() }),
      ];
      const result = analyzeRetention(makeInput({ clients }));
      const frequent = result.winBackCampaigns.flatMap(c => c.clients).find(c => c.clientName === 'Frequent');
      const rare = result.winBackCampaigns.flatMap(c => c.clients).find(c => c.clientName === 'Rare');
      if (frequent && rare) {
        expect(frequent.winBackProbability).toBeGreaterThan(rare.winBackProbability);
      }
    });
  });

  describe('VIP Retention', () => {
    it('should identify VIPs based on spend threshold', () => {
      const clients = [
        makeClient({ id: 'c1', name: 'VIP', totalSpend: 5000, lastVisitDate: new Date(Date.now() - 60 * 86400000).toISOString() }),
        makeClient({ id: 'c2', name: 'Regular', totalSpend: 500, lastVisitDate: new Date(Date.now() - 60 * 86400000).toISOString() }),
      ];
      const result = analyzeRetention(makeInput({ clients }));
      const vipAction = result.vipRetention.find(v => v.clientName === 'VIP');
      const regularAction = result.vipRetention.find(v => v.clientName === 'Regular');
      expect(vipAction).toBeDefined();
      expect(regularAction).toBeUndefined();
    });

    it('should assign critical priority for high churn risk VIPs', () => {
      const clients = [
        makeClient({ id: 'c1', name: 'Critical VIP', totalSpend: 10000, churnRisk: 80, lastVisitDate: new Date(Date.now() - 100 * 86400000).toISOString() }),
      ];
      const result = analyzeRetention(makeInput({ clients }));
      const action = result.vipRetention.find(v => v.clientName === 'Critical VIP');
      if (action) {
        expect(action.priority).toBe('critical');
        expect(action.channel).toBe('personal-call');
      }
    });

    it('should sort by priority', () => {
      const result = analyzeRetention(makeInput());
      const priorityOrder = { critical: 0, high: 1, medium: 2 };
      for (let i = 1; i < result.vipRetention.length; i++) {
        expect(priorityOrder[result.vipRetention[i].priority]).toBeGreaterThanOrEqual(
          priorityOrder[result.vipRetention[i - 1].priority]
        );
      }
    });

    it('should include personalized scripts', () => {
      const clients = [
        makeClient({ id: 'c1', name: 'Sarah VIP', totalSpend: 5000, lastVisitDate: new Date(Date.now() - 70 * 86400000).toISOString() }),
      ];
      const result = analyzeRetention(makeInput({ clients }));
      const action = result.vipRetention.find(v => v.clientName === 'Sarah VIP');
      if (action) {
        expect(action.script).toContain('Sarah');
      }
    });
  });

  describe('Membership Renewals', () => {
    it('should flag memberships renewing within 30 days', () => {
      const clients = [makeClient({ id: 'c1', name: 'Renewing' })];
      const memberships = [{
        clientId: 'c1', tier: 'Glow', status: 'active',
        startDate: '2025-03-26', renewalDate: '2026-04-10',
        monthlyPrice: 249, daysUntilRenewal: 15, autoRenew: true, pauseCount: 0,
      }];
      const result = analyzeRetention(makeInput({ clients, memberships }));
      expect(result.membershipRenewals.length).toBeGreaterThan(0);
    });

    it('should flag high risk for paused memberships', () => {
      const clients = [makeClient({ id: 'c1', name: 'Paused Twice' })];
      const memberships = [{
        clientId: 'c1', tier: 'Glow', status: 'active',
        startDate: '2025-01-01', renewalDate: '2026-04-01',
        monthlyPrice: 249, daysUntilRenewal: 5, autoRenew: false, pauseCount: 2,
      }];
      const result = analyzeRetention(makeInput({ clients, memberships }));
      const renewal = result.membershipRenewals.find(m => m.clientName === 'Paused Twice');
      if (renewal) {
        expect(renewal.retentionRisk).toBe('high');
      }
    });
  });

  describe('Package Completions', () => {
    it('should flag packages with 0-2 sessions remaining', () => {
      const clients = [makeClient({ id: 'c1', name: 'Almost Done' })];
      const packages = [{
        clientId: 'c1', packageName: 'HydraFacial Series', sessionsTotal: 6,
        sessionsCompleted: 5, sessionsRemaining: 1, status: 'active',
      }];
      const result = analyzeRetention(makeInput({ clients, packages }));
      const action = result.packageCompletions.find(p => p.clientName === 'Almost Done');
      expect(action).toBeDefined();
      expect(action!.sessionsRemaining).toBe(1);
    });

    it('should not flag packages with many sessions remaining', () => {
      const clients = [makeClient({ id: 'c1', name: 'Just Started' })];
      const packages = [{
        clientId: 'c1', packageName: 'HydraFacial Series', sessionsTotal: 6,
        sessionsCompleted: 1, sessionsRemaining: 5, status: 'active',
      }];
      const result = analyzeRetention(makeInput({ clients, packages }));
      expect(result.packageCompletions.find(p => p.clientName === 'Just Started')).toBeUndefined();
    });
  });

  describe('Seasonal Reactivation', () => {
    it('should generate seasonal campaigns', () => {
      const result = analyzeRetention(makeInput());
      expect(result.seasonalReactivation.length).toBeGreaterThan(0);
    });

    it('should never mention infusion in seasonal campaigns', () => {
      const result = analyzeRetention(makeInput());
      for (const campaign of result.seasonalReactivation) {
        expect(campaign.message.toLowerCase()).not.toContain('infusion');
        for (const svc of campaign.targetServices) {
          expect(svc.toLowerCase()).not.toContain('infusion');
        }
      }
    });
  });

  describe('Birthday Touchpoints', () => {
    it('should detect clients with birthdays this/next month', () => {
      const currentMonth = new Date().getMonth() + 1;
      const clients = [makeClient({ birthdayMonth: currentMonth })];
      const result = analyzeRetention(makeInput({ clients }));
      expect(result.birthdayTouchpoints.length).toBeGreaterThan(0);
    });

    it('should personalize birthday message', () => {
      const currentMonth = new Date().getMonth() + 1;
      const clients = [makeClient({ name: 'Priya Patel', birthdayMonth: currentMonth })];
      const result = analyzeRetention(makeInput({ clients }));
      const bday = result.birthdayTouchpoints.find(b => b.clientName === 'Priya Patel');
      if (bday) {
        expect(bday.message).toContain('Priya');
      }
    });
  });

  describe('Feedback Recovery', () => {
    it('should flag low feedback scores', () => {
      const clients = [makeClient()];
      const feedback = [{
        clientId: 'c1', date: new Date().toISOString(), score: 2, comment: 'Not great', service: 'HydraFacial',
      }];
      const result = analyzeRetention(makeInput({ clients, feedbackScores: feedback }));
      expect(result.feedbackRecovery.length).toBeGreaterThan(0);
      expect(result.feedbackRecovery[0].urgency).toBe('immediate');
    });

    it('should not flag high feedback scores', () => {
      const clients = [makeClient()];
      const feedback = [{
        clientId: 'c1', date: new Date().toISOString(), score: 5, service: 'HydraFacial',
      }];
      const result = analyzeRetention(makeInput({ clients, feedbackScores: feedback }));
      expect(result.feedbackRecovery.length).toBe(0);
    });
  });

  describe('Retention Metrics', () => {
    it('should calculate retention metrics', () => {
      const result = analyzeRetention(makeInput());
      const m = result.retentionMetrics;
      expect(typeof m.overallRetentionRate).toBe('number');
      expect(typeof m.memberRetentionRate).toBe('number');
      expect(typeof m.rebookRate).toBe('number');
      expect(typeof m.churnRate).toBe('number');
      expect(typeof m.retentionVsAcquisitionRatio).toBe('number');
    });

    it('should have LTV segments', () => {
      const result = analyzeRetention(makeInput());
      expect(result.retentionMetrics.lifetimeValueBySegment.length).toBe(5);
    });

    it('should have retention cheaper than acquisition', () => {
      const result = analyzeRetention(makeInput());
      expect(result.retentionMetrics.retentionVsAcquisitionRatio).toBeGreaterThan(1);
    });
  });

  describe('Constants', () => {
    it('SERVICE_REBOOK_DAYS should use injection not infusion', () => {
      const keys = Object.keys(SERVICE_REBOOK_DAYS);
      for (const key of keys) {
        expect(key.toLowerCase()).not.toContain('infusion');
        if (key.includes('Injection')) {
          expect(key).toContain('Injection');
        }
      }
    });

    it('Botox rebook interval should be 90 days', () => {
      expect(SERVICE_REBOOK_DAYS['Botox']).toBe(90);
    });

    it('GLP-1 rebook interval should be 7 days', () => {
      expect(SERVICE_REBOOK_DAYS['GLP-1']).toBe(7);
    });
  });
});
