// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  calculateMRR,
  calculateARR,
  projectARR,
  calculateMRRGrowth,
  calculateChurnRates,
  calculateMRRChurn,
  calculateLTV,
  calculateLTVByTier,
  calculateNetRevenueRetention,
  calculateExpansionRevenue,
  calculateContractionRevenue,
  buildMRRMovement,
  calculateTierDistribution,
  calculateBillingCycleDistribution,
  calculateTierChangeRates,
  buildCohortAnalysis,
  analyzeSeasonalPatterns,
  calculateRevenuePerMember,
  calculateRevenuePerMemberByTier,
  calculateAverageDuration,
  calculateAverageDurationByTier,
  buildMRRHistory,
  buildAnalyticsDashboard,
  type MemberRecord,
  type RevenueEvent,
} from '../analytics';

// ── Test Helpers ─────────────────────────────────────────────────────────

function makeMember(overrides: Partial<MemberRecord> = {}): MemberRecord {
  return {
    memberId: 'mem_test',
    clientId: 'c_test',
    clientName: 'Test',
    tier: 'glow',
    billingCycle: 'monthly',
    status: 'active',
    monthlyRate: 249,
    joinDate: '2025-10-01',
    additionalRevenue: 0,
    ...overrides,
  };
}

function makeEvent(overrides: Partial<RevenueEvent> = {}): RevenueEvent {
  return {
    memberId: 'mem_test',
    type: 'new',
    amount: 249,
    date: '2026-03-01',
    tier: 'glow',
    ...overrides,
  };
}

// ── MRR ──────────────────────────────────────────────────────────────────

describe('calculateMRR', () => {
  it('sums monthly rates of active members', () => {
    const members = [
      makeMember({ monthlyRate: 149, status: 'active' }),
      makeMember({ monthlyRate: 249, status: 'active' }),
      makeMember({ monthlyRate: 449, status: 'active' }),
    ];
    expect(calculateMRR(members)).toBe(847);
  });

  it('includes past_due members', () => {
    const members = [
      makeMember({ monthlyRate: 249, status: 'active' }),
      makeMember({ monthlyRate: 149, status: 'past_due' }),
    ];
    expect(calculateMRR(members)).toBe(398);
  });

  it('excludes paused and cancelled', () => {
    const members = [
      makeMember({ monthlyRate: 249, status: 'active' }),
      makeMember({ monthlyRate: 449, status: 'paused' }),
      makeMember({ monthlyRate: 149, status: 'cancelled' }),
    ];
    expect(calculateMRR(members)).toBe(249);
  });

  it('returns 0 for empty array', () => {
    expect(calculateMRR([])).toBe(0);
  });
});

describe('calculateARR', () => {
  it('multiplies MRR by 12', () => {
    expect(calculateARR(1000)).toBe(12000);
  });

  it('handles zero', () => {
    expect(calculateARR(0)).toBe(0);
  });
});

describe('projectARR', () => {
  it('projects growth', () => {
    const projected = projectARR(10000, 5, 12);
    expect(projected).toBeGreaterThan(10000 * 12);
  });

  it('handles zero growth', () => {
    expect(projectARR(10000, 0, 12)).toBe(120000);
  });

  it('handles negative growth', () => {
    expect(projectARR(10000, -5, 12)).toBeLessThan(120000);
  });
});

describe('calculateMRRGrowth', () => {
  it('calculates positive growth', () => {
    expect(calculateMRRGrowth(11000, 10000)).toBe(10);
  });

  it('calculates negative growth', () => {
    expect(calculateMRRGrowth(9000, 10000)).toBe(-10);
  });

  it('handles zero previous', () => {
    expect(calculateMRRGrowth(1000, 0)).toBe(100);
  });

  it('returns 0 for zero to zero', () => {
    expect(calculateMRRGrowth(0, 0)).toBe(0);
  });
});

// ── Churn ────────────────────────────────────────────────────────────────

describe('calculateChurnRates', () => {
  it('calculates total churn rate', () => {
    const result = calculateChurnRates(100, 3, 2, 1);
    expect(result.total).toBe(5); // (3+2)/100 * 100
    expect(result.voluntary).toBe(3);
    expect(result.involuntary).toBe(2);
  });

  it('calculates net churn after reactivations', () => {
    const result = calculateChurnRates(100, 3, 2, 1);
    expect(result.netChurn).toBe(4); // (5-1)/100 * 100
  });

  it('handles zero starting members', () => {
    const result = calculateChurnRates(0, 0, 0, 0);
    expect(result.total).toBe(0);
  });

  it('net churn is not negative', () => {
    const result = calculateChurnRates(100, 1, 0, 5);
    expect(result.netChurn).toBeGreaterThanOrEqual(0);
  });
});

describe('calculateMRRChurn', () => {
  it('calculates MRR churn percentage', () => {
    expect(calculateMRRChurn(500, 10000)).toBe(5);
  });

  it('handles zero starting MRR', () => {
    expect(calculateMRRChurn(0, 0)).toBe(0);
  });
});

// ── LTV ──────────────────────────────────────────────────────────────────

describe('calculateLTV', () => {
  it('calculates LTV from ARPU and churn', () => {
    // $249/mo, 5% monthly churn → $249/0.05 = $4,980
    expect(calculateLTV(249, 5)).toBe(4980);
  });

  it('caps LTV when churn is zero', () => {
    const ltv = calculateLTV(249, 0);
    expect(ltv).toBe(249 * 120); // 10 year cap
  });

  it('higher churn = lower LTV', () => {
    const lowChurn = calculateLTV(249, 2);
    const highChurn = calculateLTV(249, 10);
    expect(lowChurn).toBeGreaterThan(highChurn);
  });
});

describe('calculateLTVByTier', () => {
  it('returns LTV for each tier', () => {
    const members = [
      makeMember({ tier: 'halo', monthlyRate: 149 }),
      makeMember({ tier: 'glow', monthlyRate: 249 }),
      makeMember({ tier: 'elite', monthlyRate: 449 }),
    ];
    const result = calculateLTVByTier(members, []);
    expect(result.halo).toBeGreaterThan(0);
    expect(result.glow).toBeGreaterThan(0);
    expect(result.elite).toBeGreaterThan(0);
    expect(result.elite).toBeGreaterThan(result.halo);
  });
});

// ── Revenue Retention ────────────────────────────────────────────────────

describe('calculateNetRevenueRetention', () => {
  it('NRR > 100% with expansion', () => {
    const nrr = calculateNetRevenueRetention(10000, 2000, 500, 800);
    expect(nrr).toBeGreaterThan(100);
  });

  it('NRR < 100% with high churn', () => {
    const nrr = calculateNetRevenueRetention(10000, 100, 200, 2000);
    expect(nrr).toBeLessThan(100);
  });

  it('NRR = 100% when balanced', () => {
    const nrr = calculateNetRevenueRetention(10000, 0, 0, 0);
    expect(nrr).toBe(100);
  });
});

describe('calculateExpansionRevenue', () => {
  it('sums upgrade and add-on events', () => {
    const events = [
      makeEvent({ type: 'upgrade', amount: 100 }),
      makeEvent({ type: 'add_on', amount: 50 }),
      makeEvent({ type: 'new', amount: 249 }), // Should not count
    ];
    expect(calculateExpansionRevenue(events)).toBe(150);
  });
});

describe('calculateContractionRevenue', () => {
  it('sums downgrade events', () => {
    const events = [
      makeEvent({ type: 'downgrade', amount: -100 }),
      makeEvent({ type: 'downgrade', amount: -50 }),
    ];
    expect(calculateContractionRevenue(events)).toBe(150);
  });
});

// ── MRR Movement ─────────────────────────────────────────────────────────

describe('buildMRRMovement', () => {
  it('calculates ending MRR correctly', () => {
    const events: RevenueEvent[] = [
      makeEvent({ type: 'new', amount: 249, date: '2026-03-05' }),
      makeEvent({ type: 'upgrade', amount: 100, date: '2026-03-10' }),
      makeEvent({ type: 'churn', amount: -149, date: '2026-03-15' }),
    ];
    const movement = buildMRRMovement('2026-03', 8000, events);
    expect(movement.startingMRR).toBe(8000);
    expect(movement.newMRR).toBe(249);
    expect(movement.expansionMRR).toBe(100);
    expect(movement.churnedMRR).toBe(149);
    expect(movement.endingMRR).toBe(8000 + 249 + 100 - 149);
  });

  it('ignores events from other months', () => {
    const events: RevenueEvent[] = [
      makeEvent({ type: 'new', amount: 249, date: '2026-02-05' }),
    ];
    const movement = buildMRRMovement('2026-03', 8000, events);
    expect(movement.newMRR).toBe(0);
  });
});

// ── Distribution ─────────────────────────────────────────────────────────

describe('calculateTierDistribution', () => {
  it('counts members by tier', () => {
    const members = [
      makeMember({ tier: 'halo' }),
      makeMember({ tier: 'halo' }),
      makeMember({ tier: 'glow' }),
      makeMember({ tier: 'elite' }),
      makeMember({ tier: 'glow', status: 'cancelled' }), // Excluded
    ];
    const dist = calculateTierDistribution(members);
    expect(dist.halo).toBe(2);
    expect(dist.glow).toBe(1);
    expect(dist.elite).toBe(1);
  });
});

describe('calculateBillingCycleDistribution', () => {
  it('counts by billing cycle', () => {
    const members = [
      makeMember({ billingCycle: 'monthly' }),
      makeMember({ billingCycle: 'monthly' }),
      makeMember({ billingCycle: 'annual' }),
    ];
    const dist = calculateBillingCycleDistribution(members);
    expect(dist.monthly).toBe(2);
    expect(dist.annual).toBe(1);
  });
});

// ── Tier Change Rates ────────────────────────────────────────────────────

describe('calculateTierChangeRates', () => {
  it('calculates upgrade and downgrade rates', () => {
    const events = [
      makeEvent({ type: 'upgrade' }),
      makeEvent({ type: 'upgrade' }),
      makeEvent({ type: 'downgrade' }),
    ];
    const result = calculateTierChangeRates(events, 100);
    expect(result.upgradeRate).toBe(2);
    expect(result.downgradeRate).toBe(1);
  });

  it('returns 0 with no events', () => {
    const result = calculateTierChangeRates([], 50);
    expect(result.upgradeRate).toBe(0);
    expect(result.downgradeRate).toBe(0);
  });
});

// ── Cohort Analysis ──────────────────────────────────────────────────────

describe('buildCohortAnalysis', () => {
  it('groups members by join month', () => {
    const members = [
      makeMember({ joinDate: '2025-10-01' }),
      makeMember({ joinDate: '2025-10-15' }),
      makeMember({ joinDate: '2025-11-01' }),
    ];
    const cohorts = buildCohortAnalysis(members);
    expect(cohorts.length).toBeGreaterThanOrEqual(2);
    const oct = cohorts.find(c => c.cohort === '2025-10');
    expect(oct?.startingMembers).toBe(2);
  });

  it('returns empty for no members', () => {
    expect(buildCohortAnalysis([])).toHaveLength(0);
  });

  it('retention percentages are 0-100', () => {
    const members = [
      makeMember({ joinDate: '2025-06-01' }),
      makeMember({ joinDate: '2025-06-15', cancelledAt: '2025-09-01' }),
    ];
    const cohorts = buildCohortAnalysis(members);
    for (const cohort of cohorts) {
      for (const rate of cohort.retentionByMonth) {
        expect(rate).toBeGreaterThanOrEqual(0);
        expect(rate).toBeLessThanOrEqual(100);
      }
    }
  });
});

// ── Seasonal Patterns ────────────────────────────────────────────────────

describe('analyzeSeasonalPatterns', () => {
  it('returns 12 months', () => {
    const patterns = analyzeSeasonalPatterns([]);
    expect(patterns).toHaveLength(12);
  });

  it('counts enrollments by join month', () => {
    const members = [
      makeMember({ joinDate: '2025-03-15T12:00:00' }),
      makeMember({ joinDate: '2025-03-20T12:00:00' }),
      makeMember({ joinDate: '2025-07-15T12:00:00' }),
    ];
    const patterns = analyzeSeasonalPatterns(members);
    const totalEnrollments = patterns.reduce((s, p) => s + p.enrollments, 0);
    expect(totalEnrollments).toBe(3);
    // At least one month has 2 enrollments
    const maxInAMonth = Math.max(...patterns.map(p => p.enrollments));
    expect(maxInAMonth).toBe(2);
  });

  it('assigns trend categories', () => {
    const patterns = analyzeSeasonalPatterns([makeMember()]);
    for (const p of patterns) {
      expect(['strong', 'moderate', 'weak']).toContain(p.trend);
    }
  });
});

// ── Revenue Per Member ───────────────────────────────────────────────────

describe('calculateRevenuePerMember', () => {
  it('divides MRR by member count', () => {
    expect(calculateRevenuePerMember(10000, 50)).toBe(200);
  });

  it('returns 0 for no members', () => {
    expect(calculateRevenuePerMember(10000, 0)).toBe(0);
  });
});

describe('calculateRevenuePerMemberByTier', () => {
  it('calculates ARPM per tier', () => {
    const members = [
      makeMember({ tier: 'halo', monthlyRate: 149, additionalRevenue: 60 }),
      makeMember({ tier: 'elite', monthlyRate: 449, additionalRevenue: 240 }),
    ];
    const result = calculateRevenuePerMemberByTier(members);
    expect(result.halo).toBeGreaterThan(149);
    expect(result.elite).toBeGreaterThan(449);
  });
});

// ── Duration ─────────────────────────────────────────────────────────────

describe('calculateAverageDuration', () => {
  it('calculates average in months', () => {
    const members = [
      makeMember({ joinDate: new Date(Date.now() - 180 * 86400000).toISOString() }),
      makeMember({ joinDate: new Date(Date.now() - 60 * 86400000).toISOString() }),
    ];
    const avg = calculateAverageDuration(members);
    expect(avg).toBeGreaterThan(0);
  });

  it('returns 0 for empty', () => {
    expect(calculateAverageDuration([])).toBe(0);
  });

  it('uses cancel date for cancelled members', () => {
    const members = [
      makeMember({
        joinDate: '2025-01-01',
        cancelledAt: '2025-04-01',
        status: 'cancelled',
      }),
    ];
    const avg = calculateAverageDuration(members);
    expect(avg).toBeCloseTo(3, 0);
  });
});

// ── MRR History ──────────────────────────────────────────────────────────

describe('buildMRRHistory', () => {
  it('returns requested number of months', () => {
    const members = [makeMember()];
    const history = buildMRRHistory(members, 6);
    expect(history).toHaveLength(6);
  });

  it('each entry has month, mrr, members', () => {
    const history = buildMRRHistory([makeMember()], 3);
    for (const entry of history) {
      expect(entry).toHaveProperty('month');
      expect(entry).toHaveProperty('mrr');
      expect(entry).toHaveProperty('members');
    }
  });

  it('months are in chronological order', () => {
    const history = buildMRRHistory([makeMember()], 6);
    for (let i = 1; i < history.length; i++) {
      expect(history[i].month.localeCompare(history[i - 1].month)).toBeGreaterThan(0);
    }
  });
});

// ── Full Dashboard ───────────────────────────────────────────────────────

describe('buildAnalyticsDashboard', () => {
  it('returns complete dashboard structure', () => {
    const members = [
      makeMember({ tier: 'halo', monthlyRate: 149 }),
      makeMember({ tier: 'glow', monthlyRate: 249 }),
      makeMember({ tier: 'elite', monthlyRate: 449 }),
    ];
    const events = [
      makeEvent({ type: 'new', amount: 249 }),
    ];
    const dashboard = buildAnalyticsDashboard({ members, events, previousMonthMRR: 800 });

    expect(dashboard.mrr).toBeGreaterThan(0);
    expect(dashboard.arr).toBe(dashboard.mrr * 12);
    expect(dashboard.activeMembers).toBe(3);
    expect(dashboard.tierDistribution.halo).toBe(1);
    expect(dashboard.tierDistribution.glow).toBe(1);
    expect(dashboard.tierDistribution.elite).toBe(1);
    expect(dashboard.cohorts).toBeDefined();
    expect(dashboard.seasonalPatterns).toHaveLength(12);
    expect(dashboard.mrrHistory.length).toBeGreaterThan(0);
    expect(dashboard.ltvByTier).toBeDefined();
    expect(dashboard.churnRate).toBeDefined();
  });

  it('MRR growth is calculated', () => {
    const members = [makeMember({ monthlyRate: 249 })];
    const dashboard = buildAnalyticsDashboard({ members, events: [], previousMonthMRR: 200 });
    expect(dashboard.mrrGrowth).toBeGreaterThan(0);
  });

  it('handles empty data gracefully', () => {
    const dashboard = buildAnalyticsDashboard({ members: [], events: [], previousMonthMRR: 0 });
    expect(dashboard.mrr).toBe(0);
    expect(dashboard.activeMembers).toBe(0);
    expect(dashboard.averageLTV).toBe(0);
  });
});
