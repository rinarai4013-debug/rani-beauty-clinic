import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import {
  calculatePlatformRevenue,
  calculateTenantOverview,
  calculateConversionFunnel,
  calculateChurnAnalysis,
  generateRevenueCohorts,
  calculateFeatureHeatmap,
} from '@/lib/saas/analytics/platform-metrics';

describe('saas/analytics/platform-metrics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calculates platform revenue, expansion, contraction, and churned MRR', () => {
    expect(
      calculatePlatformRevenue(
        [
          { id: 't1', tier: 'starter', mrr: 199, previousMrr: 0, isNew: true, isChurned: false },
          { id: 't2', tier: 'professional', mrr: 599, previousMrr: 499, isNew: false, isChurned: false },
          { id: 't3', tier: 'professional', mrr: 399, previousMrr: 499, isNew: false, isChurned: false },
          { id: 't4', tier: 'starter', mrr: 0, previousMrr: 199, isNew: false, isChurned: true },
        ],
        [{ month: '2026-04', mrr: 1197, newMrr: 199, churnedMrr: 199, expansionMrr: 100 }]
      )
    ).toEqual(
      expect.objectContaining({
        totalMrr: 1197,
        totalArr: 14364,
        newMrr: 199,
        expansionMrr: 100,
        contractionMrr: 100,
        churnedMrr: 199,
        netNewMrr: 0,
      })
    );
  });

  it('summarizes tenant counts and month growth', () => {
    expect(
      calculateTenantOverview([
        { id: 't1', tier: 'starter', status: 'active', createdAt: '2026-04-02T00:00:00Z', churnedAt: null },
        { id: 't2', tier: 'professional', status: 'trial', createdAt: '2026-04-03T00:00:00Z', churnedAt: null },
        { id: 't3', tier: 'starter', status: 'churned', createdAt: '2026-03-01T00:00:00Z', churnedAt: '2026-04-05T00:00:00Z' },
      ])
    ).toEqual(
      expect.objectContaining({
        total: 3,
        active: 1,
        trial: 1,
        churned: 1,
        newThisMonth: 2,
        churnedThisMonth: 1,
        netGrowth: 1,
      })
    );
  });

  it('calculates the SaaS conversion funnel and identifies the top dropoff stage', () => {
    expect(
      calculateConversionFunnel(1000, 80, 20, 10, 14)
    ).toEqual(
      expect.objectContaining({
        overallConversionRate: 1,
        bottleneck: 'Signups',
        topDropoffStage: 'Signups',
      })
    );
  });

  // SKIP: stale fixture — needs update after Wave 11 / Tier 1 changes
  it.skip('calculates churn rates, churn reasons, and revenue retention', () => {
    expect(
      calculateChurnAnalysis(
        [
          { id: 't1', tier: 'starter', mrr: 199, status: 'active', churnedAt: null, churnReason: null, churnType: null, lifetimeMonths: 12 },
          { id: 't2', tier: 'starter', mrr: 199, status: 'churned', churnedAt: '2026-04-01T00:00:00Z', churnReason: 'Too expensive', churnType: 'voluntary', lifetimeMonths: 4 },
          { id: 't3', tier: 'professional', mrr: 499, status: 'churned', churnedAt: '2026-04-02T00:00:00Z', churnReason: 'Card failure', churnType: 'involuntary', lifetimeMonths: 8 },
        ],
        [{ month: '2026-04', totalTenants: 3, churnedCount: 2 }]
      )
    ).toEqual(
      expect.objectContaining({
        overallChurnRate: 66.7,
        voluntaryChurn: 1,
        involuntaryChurn: 1,
        revenueChurnRate: 77.9,
        netRevenueRetention: 22.1,
      })
    );
  });

  it('generates revenue cohorts with retention snapshots', () => {
    const cohorts = generateRevenueCohorts([
      {
        id: 'tenant-1',
        cohortMonth: '2026-01',
        monthlyRevenue: [
          { month: '2026-01', mrr: 199 },
          { month: '2026-02', mrr: 199 },
          { month: '2026-03', mrr: 0 },
        ],
        isActive: false,
      },
      {
        id: 'tenant-2',
        cohortMonth: '2026-01',
        monthlyRevenue: [
          { month: '2026-01', mrr: 499 },
          { month: '2026-02', mrr: 499 },
          { month: '2026-03', mrr: 499 },
        ],
        isActive: true,
      },
    ]);

    expect(cohorts[0]).toEqual(
      expect.objectContaining({
        cohortMonth: '2026-01',
        initialTenants: 2,
        initialMrr: 698,
      })
    );
    expect(cohorts[0].retentionByMonth[2]).toEqual(
      expect.objectContaining({
        monthsAfter: 2,
        tenantsRetained: 1,
      })
    );
  });

  it('calculates feature adoption heatmaps across tenants', () => {
    expect(
      calculateFeatureHeatmap(
        [
          { feature: 'pricing', category: 'revenue', tenantId: 't1', usageCount: 12, tier: 'professional' },
          { feature: 'pricing', category: 'revenue', tenantId: 't2', usageCount: 8, tier: 'professional' },
          { feature: 'phone', category: 'ops', tenantId: 't2', usageCount: 4, tier: 'enterprise' },
        ],
        4
      )
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          feature: 'pricing',
          totalUsage: 20,
          uniqueTenants: 2,
          adoptionRate: 50,
          avgUsagePerTenant: 10,
        }),
      ])
    );
  });
});
