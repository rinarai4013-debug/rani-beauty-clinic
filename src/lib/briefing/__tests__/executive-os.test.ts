// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { buildExecutiveBriefing } from '../executive-os';
import type {
  RevenueSnapshot,
  ScheduleSnapshot,
  AlertSnapshot,
  MarketingSnapshot,
  CashFlowSnapshot,
  AIHighlights,
  LoyaltySnapshot,
  ReferralSnapshot,
} from '../types';

const baseRevenue: RevenueSnapshot = {
  total: 4200,
  byProvider: { Rina: 2500, Mom: 1700 },
  byService: { HydraFacial: 1500, Botox: 2700 },
  byCategory: { Facial: 1500, Injectable: 2700 },
  byPaymentMethod: { Card: 4200 },
  transactionCount: 10,
  avgTicket: 420,
  financingTotal: 900,
};

const baseSchedule: ScheduleSnapshot = {
  totalAppointments: 11,
  byProvider: { Rina: 6, Mom: 5 },
  byCategory: { Facial: 4, Injectable: 5, Consult: 2 },
  gaps: [{ provider: 'Rina', startTime: '14:00', duration: 60 }],
  consultCount: 2,
  newClientCount: 3,
};

const baseAlerts: AlertSnapshot = {
  total: 2,
  bySeverity: { critical: 0, warning: 1, info: 1 },
  items: [
    {
      id: 'a1',
      type: 'inventory',
      severity: 'warning',
      message: 'Botox inventory is low',
      actionRecommended: 'Reorder',
      createdDate: '2026-04-09',
    },
  ],
};

const baseMarketing: MarketingSnapshot = {
  newLeads: 4,
  leadsBySource: { Meta: 2, Organic: 2 },
  avgLeadScore: 78,
  reviewCount: 145,
  avgRating: 4.9,
  reviewVelocity: 1.2,
};

const baseCashFlow: CashFlowSnapshot = {
  bankBalance: 28000,
  runway: 75,
  plaidConnected: true,
  monthlyBurnRate: 12000,
};

const baseAIHighlights: AIHighlights = {
  topChurnRiskClient: { name: 'Jane Doe', score: 82, lastVisit: '2026-01-15' },
  highestNoShowRisk: { clientName: 'John Doe', service: 'Botox', time: '10:00', score: 68 },
  revenueAnomaly: { type: 'below_target', message: 'Revenue is trailing target pace today.' },
};

const baseLoyalty: LoyaltySnapshot = {
  totalMembers: 60,
  newMembers: 2,
  churnedMembers: 1,
  membershipMRR: 7200,
  tierBreakdown: { Glow: 30, Elite: 20, Halo: 10 },
  redemptions: 3,
  tierUpgrades: 1,
};

const baseReferrals: ReferralSnapshot = {
  totalActiveCodes: 20,
  newCodes: 3,
  conversions: 2,
  revenueAttributed: 950,
};

describe('buildExecutiveBriefing', () => {
  it('returns watch status when warning-level pressure is present', () => {
    const briefing = buildExecutiveBriefing({
      revenue: baseRevenue,
      schedule: baseSchedule,
      alerts: baseAlerts,
      marketing: baseMarketing,
      cashFlow: baseCashFlow,
      aiHighlights: baseAIHighlights,
      loyalty: baseLoyalty,
      referrals: baseReferrals,
    });

    expect(briefing.status).toBe('watch');
    expect(briefing.topMoves.length).toBeGreaterThan(0);
    expect(briefing.pressurePoints.length).toBeGreaterThan(0);
  });

  it('returns critical status when critical alerts are present', () => {
    const briefing = buildExecutiveBriefing({
      revenue: baseRevenue,
      schedule: baseSchedule,
      alerts: {
        ...baseAlerts,
        bySeverity: { critical: 2, warning: 0, info: 0 },
      },
      marketing: baseMarketing,
      cashFlow: baseCashFlow,
      aiHighlights: baseAIHighlights,
      loyalty: baseLoyalty,
      referrals: baseReferrals,
    });

    expect(briefing.status).toBe('critical');
    expect(briefing.headline).toContain('critical');
  });

  it('returns strong status when no meaningful pressure exists', () => {
    const briefing = buildExecutiveBriefing({
      revenue: baseRevenue,
      schedule: { ...baseSchedule, gaps: [], consultCount: 3 },
      alerts: {
        total: 0,
        bySeverity: { critical: 0, warning: 0, info: 0 },
        items: [],
      },
      marketing: { ...baseMarketing, newLeads: 3, reviewVelocity: 2.1 },
      cashFlow: baseCashFlow,
      aiHighlights: {
        topChurnRiskClient: null,
        highestNoShowRisk: null,
        revenueAnomaly: null,
      },
      loyalty: baseLoyalty,
      referrals: baseReferrals,
    });

    expect(briefing.status).toBe('strong');
    expect(briefing.summary).toContain('position of strength');
  });

  it('includes churn, no-show, and gap moves when those signals exist', () => {
    const briefing = buildExecutiveBriefing({
      revenue: baseRevenue,
      schedule: baseSchedule,
      alerts: baseAlerts,
      marketing: baseMarketing,
      cashFlow: baseCashFlow,
      aiHighlights: baseAIHighlights,
      loyalty: baseLoyalty,
      referrals: baseReferrals,
    });

    const titles = briefing.topMoves.map((move) => move.title);
    expect(titles.some((title) => title.includes('Fill'))).toBe(true);
    expect(titles.some((title) => title.includes('Re-engage'))).toBe(true);
    expect(titles.some((title) => title.includes('Confirm'))).toBe(true);
  });
});
