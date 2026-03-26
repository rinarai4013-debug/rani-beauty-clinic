import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateActionItems, renderDailyHtml } from '../daily-ceo-email';
import type {
  DailyBriefingData,
  RevenueSnapshot,
  ScheduleSnapshot,
  AlertSnapshot,
  LoyaltySnapshot,
  ReferralSnapshot,
  MarketingSnapshot,
  CashFlowSnapshot,
  ContentCalendarSnapshot,
  AIHighlights,
  ActionItem,
} from '../types';

// ── Mock data factories ──────────────────────────────────────

function makeRevenue(overrides: Partial<RevenueSnapshot> = {}): RevenueSnapshot {
  return {
    total: 5250,
    byProvider: { Rina: 3200, Mom: 2050 },
    byService: { Sofwave: 2750, HydraFacial: 1100, 'VI Peel': 795, 'B12 Injection': 105, Botox: 500 },
    byCategory: { Laser: 2750, Facial: 1100, Injectable: 500, Wellness: 105, 'Chemical Peel': 795 },
    byPaymentMethod: { 'Credit Card': 4000, Cash: 750, Afterpay: 500 },
    transactionCount: 8,
    avgTicket: 656.25,
    financingTotal: 500,
    ...overrides,
  };
}

function makeSchedule(overrides: Partial<ScheduleSnapshot> = {}): ScheduleSnapshot {
  return {
    totalAppointments: 12,
    byProvider: { Rina: 7, Mom: 5 },
    byCategory: { Laser: 3, Facial: 4, Injectable: 2, Consult: 2, Wellness: 1 },
    gaps: [],
    consultCount: 2,
    newClientCount: 3,
    ...overrides,
  };
}

function makeAlerts(overrides: Partial<AlertSnapshot> = {}): AlertSnapshot {
  return {
    total: 3,
    bySeverity: { critical: 1, warning: 1, info: 1 },
    items: [
      { id: '1', type: 'Reorder', severity: 'critical', message: 'HydraFacial tips below reorder point', actionRecommended: 'Reorder from supplier', createdDate: '2026-03-24' },
      { id: '2', type: 'No-Show', severity: 'warning', message: 'Client Sarah missed appointment', actionRecommended: 'Follow up and reschedule', createdDate: '2026-03-24' },
      { id: '3', type: 'Review', severity: 'info', message: 'New 5-star review received', actionRecommended: 'Respond with thank you', createdDate: '2026-03-24' },
    ],
    ...overrides,
  };
}

function makeLoyalty(overrides: Partial<LoyaltySnapshot> = {}): LoyaltySnapshot {
  return {
    totalMembers: 45,
    newMembers: 3,
    churnedMembers: 1,
    membershipMRR: 4500,
    tierBreakdown: { Gold: 20, Silver: 15, Bronze: 10 },
    redemptions: 5,
    tierUpgrades: 2,
    ...overrides,
  };
}

function makeReferrals(overrides: Partial<ReferralSnapshot> = {}): ReferralSnapshot {
  return {
    totalActiveCodes: 15,
    newCodes: 2,
    conversions: 3,
    revenueAttributed: 1200,
    ...overrides,
  };
}

function makeMarketing(overrides: Partial<MarketingSnapshot> = {}): MarketingSnapshot {
  return {
    newLeads: 8,
    leadsBySource: { Instagram: 3, Google: 3, Referral: 2 },
    avgLeadScore: 72,
    reviewCount: 4,
    avgRating: 4.8,
    reviewVelocity: 0.57,
    ...overrides,
  };
}

function makeCashFlow(overrides: Partial<CashFlowSnapshot> = {}): CashFlowSnapshot {
  return {
    bankBalance: 125000,
    runway: 180,
    plaidConnected: true,
    monthlyBurnRate: 22000,
    ...overrides,
  };
}

function makeAIHighlights(overrides: Partial<AIHighlights> = {}): AIHighlights {
  return {
    topChurnRiskClient: { name: 'Jane D.', score: 82, lastVisit: '2026-01-15' },
    highestNoShowRisk: { clientName: 'Tom K.', service: 'Botox', time: '14:00', score: 68 },
    revenueAnomaly: null,
    ...overrides,
  };
}

function makeDailyData(overrides: Partial<DailyBriefingData> = {}): DailyBriefingData {
  return {
    date: '2026-03-25',
    dayOfWeek: 'Tuesday',
    revenue: makeRevenue(),
    schedule: makeSchedule(),
    alerts: makeAlerts(),
    loyalty: makeLoyalty(),
    referrals: makeReferrals(),
    marketing: makeMarketing(),
    cashFlow: makeCashFlow(),
    contentCalendar: { postsScheduledToday: [] },
    aiHighlights: makeAIHighlights(),
    actionItems: [],
    ...overrides,
  };
}

// ── Tests: generateActionItems ───────────────────────────────

describe('generateActionItems', () => {
  it('should include critical alerts as high priority', () => {
    const items = generateActionItems({
      revenue: makeRevenue(),
      schedule: makeSchedule(),
      alerts: makeAlerts({ bySeverity: { critical: 2, warning: 0, info: 0 }, items: [
        { id: '1', type: 'Test', severity: 'critical', message: 'Critical issue 1', actionRecommended: 'Fix now', createdDate: '' },
        { id: '2', type: 'Test', severity: 'critical', message: 'Critical issue 2', actionRecommended: 'Fix now', createdDate: '' },
      ] }),
      loyalty: makeLoyalty(),
      referrals: makeReferrals(),
      marketing: makeMarketing(),
      cashFlow: makeCashFlow(),
      aiHighlights: makeAIHighlights(),
    });

    const criticalItems = items.filter(i => i.priority === 'high' && i.category === 'Alerts');
    expect(criticalItems).toHaveLength(1);
    expect(criticalItems[0].action).toContain('2 critical alert(s)');
  });

  it('should flag schedule gaps', () => {
    const items = generateActionItems({
      revenue: makeRevenue(),
      schedule: makeSchedule({ gaps: [
        { provider: 'Rina', startTime: '11:00', duration: 60 },
        { provider: 'Mom', startTime: '14:00', duration: 45 },
      ] }),
      alerts: makeAlerts({ bySeverity: { critical: 0, warning: 0, info: 0 }, items: [] }),
      loyalty: makeLoyalty(),
      referrals: makeReferrals(),
      marketing: makeMarketing(),
      cashFlow: makeCashFlow(),
      aiHighlights: makeAIHighlights({ topChurnRiskClient: null }),
    });

    const gapItems = items.filter(i => i.category === 'Schedule' && i.action.includes('gap'));
    expect(gapItems).toHaveLength(1);
    expect(gapItems[0].action).toContain('2 schedule gap(s)');
    expect(gapItems[0].action).toContain('105 min');
  });

  it('should flag high churn risk clients', () => {
    const items = generateActionItems({
      revenue: makeRevenue(),
      schedule: makeSchedule(),
      alerts: makeAlerts({ bySeverity: { critical: 0, warning: 0, info: 0 }, items: [] }),
      loyalty: makeLoyalty(),
      referrals: makeReferrals(),
      marketing: makeMarketing(),
      cashFlow: makeCashFlow(),
      aiHighlights: makeAIHighlights({ topChurnRiskClient: { name: 'Jane', score: 85, lastVisit: '' } }),
    });

    const churnItems = items.filter(i => i.category === 'Retention');
    expect(churnItems).toHaveLength(1);
    expect(churnItems[0].priority).toBe('high');
  });

  it('should not flag low churn risk clients', () => {
    const items = generateActionItems({
      revenue: makeRevenue(),
      schedule: makeSchedule(),
      alerts: makeAlerts({ bySeverity: { critical: 0, warning: 0, info: 0 }, items: [] }),
      loyalty: makeLoyalty(),
      referrals: makeReferrals(),
      marketing: makeMarketing(),
      cashFlow: makeCashFlow(),
      aiHighlights: makeAIHighlights({ topChurnRiskClient: { name: 'Jane', score: 40, lastVisit: '' } }),
    });

    const churnItems = items.filter(i => i.category === 'Retention');
    expect(churnItems).toHaveLength(0);
  });

  it('should flag no-show risk appointments', () => {
    const items = generateActionItems({
      revenue: makeRevenue(),
      schedule: makeSchedule(),
      alerts: makeAlerts({ bySeverity: { critical: 0, warning: 0, info: 0 }, items: [] }),
      loyalty: makeLoyalty(),
      referrals: makeReferrals(),
      marketing: makeMarketing(),
      cashFlow: makeCashFlow(),
      aiHighlights: makeAIHighlights({ highestNoShowRisk: { clientName: 'Tom', service: 'Botox', time: '14:00', score: 75 } }),
    });

    const noShowItems = items.filter(i => i.action.includes('Confirm appointment'));
    expect(noShowItems).toHaveLength(1);
  });

  it('should flag zero revenue day as high priority', () => {
    const items = generateActionItems({
      revenue: makeRevenue({ total: 0 }),
      schedule: makeSchedule(),
      alerts: makeAlerts({ bySeverity: { critical: 0, warning: 0, info: 0 }, items: [] }),
      loyalty: makeLoyalty(),
      referrals: makeReferrals(),
      marketing: makeMarketing(),
      cashFlow: makeCashFlow(),
      aiHighlights: makeAIHighlights({ topChurnRiskClient: null, highestNoShowRisk: null }),
    });

    const revenueItems = items.filter(i => i.category === 'Revenue');
    expect(revenueItems).toHaveLength(1);
    expect(revenueItems[0].priority).toBe('high');
    expect(revenueItems[0].action).toContain('zero-revenue');
  });

  it('should flag new leads for follow-up', () => {
    const items = generateActionItems({
      revenue: makeRevenue(),
      schedule: makeSchedule(),
      alerts: makeAlerts({ bySeverity: { critical: 0, warning: 0, info: 0 }, items: [] }),
      loyalty: makeLoyalty(),
      referrals: makeReferrals(),
      marketing: makeMarketing({ newLeads: 5 }),
      cashFlow: makeCashFlow(),
      aiHighlights: makeAIHighlights({ topChurnRiskClient: null, highestNoShowRisk: null }),
    });

    const leadItems = items.filter(i => i.category === 'Marketing');
    expect(leadItems).toHaveLength(1);
    expect(leadItems[0].action).toContain('5 new lead(s)');
  });

  it('should flag low review ratings', () => {
    const items = generateActionItems({
      revenue: makeRevenue(),
      schedule: makeSchedule(),
      alerts: makeAlerts({ bySeverity: { critical: 0, warning: 0, info: 0 }, items: [] }),
      loyalty: makeLoyalty(),
      referrals: makeReferrals(),
      marketing: makeMarketing({ reviewCount: 3, avgRating: 3.8 }),
      cashFlow: makeCashFlow(),
      aiHighlights: makeAIHighlights({ topChurnRiskClient: null, highestNoShowRisk: null }),
    });

    const reviewItems = items.filter(i => i.category === 'Reputation');
    expect(reviewItems).toHaveLength(1);
  });

  it('should not flag high review ratings', () => {
    const items = generateActionItems({
      revenue: makeRevenue(),
      schedule: makeSchedule(),
      alerts: makeAlerts({ bySeverity: { critical: 0, warning: 0, info: 0 }, items: [] }),
      loyalty: makeLoyalty(),
      referrals: makeReferrals(),
      marketing: makeMarketing({ reviewCount: 3, avgRating: 4.9 }),
      cashFlow: makeCashFlow(),
      aiHighlights: makeAIHighlights({ topChurnRiskClient: null, highestNoShowRisk: null }),
    });

    const reviewItems = items.filter(i => i.category === 'Reputation');
    expect(reviewItems).toHaveLength(0);
  });

  it('should flag churned memberships', () => {
    const items = generateActionItems({
      revenue: makeRevenue(),
      schedule: makeSchedule(),
      alerts: makeAlerts({ bySeverity: { critical: 0, warning: 0, info: 0 }, items: [] }),
      loyalty: makeLoyalty({ churnedMembers: 3 }),
      referrals: makeReferrals(),
      marketing: makeMarketing({ newLeads: 0, reviewCount: 0 }),
      cashFlow: makeCashFlow(),
      aiHighlights: makeAIHighlights({ topChurnRiskClient: null, highestNoShowRisk: null }),
    });

    const loyaltyItems = items.filter(i => i.category === 'Loyalty');
    expect(loyaltyItems).toHaveLength(1);
    expect(loyaltyItems[0].action).toContain('3 churned');
  });

  it('should flag revenue anomalies', () => {
    const items = generateActionItems({
      revenue: makeRevenue(),
      schedule: makeSchedule(),
      alerts: makeAlerts({ bySeverity: { critical: 0, warning: 0, info: 0 }, items: [] }),
      loyalty: makeLoyalty({ churnedMembers: 0 }),
      referrals: makeReferrals(),
      marketing: makeMarketing({ newLeads: 0, reviewCount: 0 }),
      cashFlow: makeCashFlow(),
      aiHighlights: makeAIHighlights({
        topChurnRiskClient: null,
        highestNoShowRisk: null,
        revenueAnomaly: { type: 'spike', message: 'Revenue 50% above rolling average' },
      }),
    });

    const financeItems = items.filter(i => i.category === 'Finance');
    expect(financeItems).toHaveLength(1);
    expect(financeItems[0].action).toContain('spike');
  });

  it('should sort items by priority (high > medium > low)', () => {
    const items = generateActionItems({
      revenue: makeRevenue({ total: 0 }),
      schedule: makeSchedule({ gaps: [{ provider: 'Rina', startTime: '10:00', duration: 60 }], consultCount: 3 }),
      alerts: makeAlerts(),
      loyalty: makeLoyalty(),
      referrals: makeReferrals(),
      marketing: makeMarketing(),
      cashFlow: makeCashFlow(),
      aiHighlights: makeAIHighlights(),
    });

    const priorities = items.map(i => i.priority);
    const highIdx = priorities.indexOf('high');
    const medIdx = priorities.indexOf('medium');
    const lowIdx = priorities.indexOf('low');

    if (highIdx !== -1 && medIdx !== -1) expect(highIdx).toBeLessThan(medIdx);
    if (medIdx !== -1 && lowIdx !== -1) expect(medIdx).toBeLessThan(lowIdx);
  });

  it('should include consult prep as low priority', () => {
    const items = generateActionItems({
      revenue: makeRevenue(),
      schedule: makeSchedule({ consultCount: 4 }),
      alerts: makeAlerts({ bySeverity: { critical: 0, warning: 0, info: 0 }, items: [] }),
      loyalty: makeLoyalty({ churnedMembers: 0 }),
      referrals: makeReferrals(),
      marketing: makeMarketing({ newLeads: 0, reviewCount: 0 }),
      cashFlow: makeCashFlow(),
      aiHighlights: makeAIHighlights({ topChurnRiskClient: null, highestNoShowRisk: null }),
    });

    const salesItems = items.filter(i => i.category === 'Sales');
    expect(salesItems).toHaveLength(1);
    expect(salesItems[0].action).toContain('4 consultation(s)');
  });

  it('should include warning alerts as low priority', () => {
    const items = generateActionItems({
      revenue: makeRevenue(),
      schedule: makeSchedule({ consultCount: 0 }),
      alerts: makeAlerts({ bySeverity: { critical: 0, warning: 3, info: 0 }, items: [] }),
      loyalty: makeLoyalty({ churnedMembers: 0 }),
      referrals: makeReferrals(),
      marketing: makeMarketing({ newLeads: 0, reviewCount: 0 }),
      cashFlow: makeCashFlow(),
      aiHighlights: makeAIHighlights({ topChurnRiskClient: null, highestNoShowRisk: null }),
    });

    const alertItems = items.filter(i => i.category === 'Alerts' && i.priority === 'low');
    expect(alertItems).toHaveLength(1);
    expect(alertItems[0].action).toContain('3 warning');
  });

  it('should return empty array when nothing needs attention', () => {
    const items = generateActionItems({
      revenue: makeRevenue(),
      schedule: makeSchedule({ consultCount: 0 }),
      alerts: makeAlerts({ total: 0, bySeverity: { critical: 0, warning: 0, info: 0 }, items: [] }),
      loyalty: makeLoyalty({ churnedMembers: 0 }),
      referrals: makeReferrals(),
      marketing: makeMarketing({ newLeads: 0, reviewCount: 0 }),
      cashFlow: makeCashFlow(),
      aiHighlights: makeAIHighlights({ topChurnRiskClient: null, highestNoShowRisk: null }),
    });

    expect(items).toHaveLength(0);
  });
});

// ── Tests: renderDailyHtml ───────────────────────────────────

describe('renderDailyHtml', () => {
  it('should return valid HTML', () => {
    const data = makeDailyData();
    const html = renderDailyHtml(data);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
  });

  it('should include greeting', () => {
    const html = renderDailyHtml(makeDailyData());
    expect(html).toContain('Good morning, Rina.');
  });

  it('should include revenue total', () => {
    const html = renderDailyHtml(makeDailyData({ revenue: makeRevenue({ total: 5250 }) }));
    expect(html).toContain('$5,250');
  });

  it('should include appointment count', () => {
    const html = renderDailyHtml(makeDailyData({ schedule: makeSchedule({ totalAppointments: 12 }) }));
    expect(html).toContain('12');
  });

  it('should include provider revenue breakdown', () => {
    const html = renderDailyHtml(makeDailyData());
    expect(html).toContain('Rina');
    expect(html).toContain('Mom');
    expect(html).toContain('$3,200');
  });

  it('should include top services', () => {
    const html = renderDailyHtml(makeDailyData());
    expect(html).toContain('Sofwave');
    expect(html).toContain('HydraFacial');
  });

  it('should include schedule gap warnings', () => {
    const html = renderDailyHtml(makeDailyData({
      schedule: makeSchedule({
        gaps: [{ provider: 'Rina', startTime: '11:00', duration: 60 }],
      }),
    }));
    expect(html).toContain('Schedule Gaps Found');
    expect(html).toContain('60min gap');
  });

  it('should include alert items', () => {
    const html = renderDailyHtml(makeDailyData());
    expect(html).toContain('HydraFacial tips below reorder point');
    expect(html).toContain('CRITICAL');
  });

  it('should include loyalty stats', () => {
    const html = renderDailyHtml(makeDailyData());
    expect(html).toContain('45'); // total members
    expect(html).toContain('$4,500'); // MRR
  });

  it('should include marketing stats', () => {
    const html = renderDailyHtml(makeDailyData());
    expect(html).toContain('8'); // new leads
  });

  it('should include cash flow when plaid connected', () => {
    const html = renderDailyHtml(makeDailyData({
      cashFlow: makeCashFlow({ plaidConnected: true, bankBalance: 125000 }),
    }));
    expect(html).toContain('$125,000');
  });

  it('should omit cash flow when plaid not connected', () => {
    const html = renderDailyHtml(makeDailyData({
      cashFlow: makeCashFlow({ plaidConnected: false, bankBalance: null }),
    }));
    expect(html).not.toContain('Bank Balance');
  });

  it('should include AI churn risk highlight', () => {
    const html = renderDailyHtml(makeDailyData());
    expect(html).toContain('Churn Risk');
    expect(html).toContain('82');
  });

  it('should include AI no-show risk highlight', () => {
    const html = renderDailyHtml(makeDailyData());
    expect(html).toContain('No-Show Risk');
    expect(html).toContain('Botox');
  });

  it('should show "all normal" when no AI highlights', () => {
    const html = renderDailyHtml(makeDailyData({
      aiHighlights: { topChurnRiskClient: null, highestNoShowRisk: null, revenueAnomaly: null },
    }));
    expect(html).toContain('All AI engines report normal');
  });

  it('should include action items', () => {
    const html = renderDailyHtml(makeDailyData({
      actionItems: [
        { priority: 'high', category: 'Test', action: 'Do something important', reason: 'Because it matters' },
      ],
    }));
    expect(html).toContain('Do something important');
    expect(html).toContain('Because it matters');
  });

  it('should include quick links', () => {
    const html = renderDailyHtml(makeDailyData());
    expect(html).toContain('https://ranibeautyclinic.com/dashboard');
    expect(html).toContain('https://app.mangomint.com/876418');
    expect(html).toContain('https://airtable.com/app1SwhSfwe8GKUg4');
  });

  it('should include RANI branding', () => {
    const html = renderDailyHtml(makeDailyData());
    expect(html).toContain('RANI');
    expect(html).toContain('BEAUTY CLINIC');
    expect(html).toContain('#0F1D2C'); // navy
    expect(html).toContain('#C9A96E'); // gold
  });

  it('should include daily CEO briefing title', () => {
    const html = renderDailyHtml(makeDailyData());
    expect(html).toContain('Daily CEO Briefing');
  });

  it('should include section headers', () => {
    const html = renderDailyHtml(makeDailyData());
    expect(html).toContain('Performance Snapshot');
    expect(html).toContain('Revenue Breakdown');
    expect(html).toContain("Today's Schedule");
    expect(html).toContain('Loyalty Program');
    expect(html).toContain('Marketing');
    expect(html).toContain('AI Engine Highlights');
  });

  it('should handle zero transactions gracefully', () => {
    const html = renderDailyHtml(makeDailyData({
      revenue: makeRevenue({ total: 0, transactionCount: 0, byProvider: {}, byService: {} }),
    }));
    expect(html).toContain('$0');
    expect(html).not.toContain('NaN');
  });

  it('should handle empty schedule', () => {
    const html = renderDailyHtml(makeDailyData({
      schedule: makeSchedule({ totalAppointments: 0, byProvider: {}, byCategory: {} }),
    }));
    expect(html).toContain('No appointments scheduled');
  });

  it('should handle empty alerts', () => {
    const html = renderDailyHtml(makeDailyData({
      alerts: makeAlerts({ total: 0, items: [] }),
    }));
    // Should not render the alerts section
    expect(html).not.toContain('Active Alerts');
  });

  it('should include footer with clinic info', () => {
    const html = renderDailyHtml(makeDailyData());
    expect(html).toContain('401 Olympia Ave NE');
    expect(html).toContain('Renton, WA 98056');
    expect(html).toContain('RaniOS Intelligence');
  });

  it('should include consult count in KPIs', () => {
    const html = renderDailyHtml(makeDailyData({
      schedule: makeSchedule({ consultCount: 5 }),
    }));
    expect(html).toContain('5 consults');
  });

  it('should show payment method breakdown', () => {
    const html = renderDailyHtml(makeDailyData());
    // Revenue breakdown section exists
    expect(html).toContain('Revenue Breakdown');
  });

  it('should handle revenue anomaly in AI highlights', () => {
    const html = renderDailyHtml(makeDailyData({
      aiHighlights: makeAIHighlights({
        revenueAnomaly: { type: 'decline', message: 'Revenue 25% below target' },
      }),
    }));
    expect(html).toContain('Revenue Anomaly');
    expect(html).toContain('25% below target');
  });
});
