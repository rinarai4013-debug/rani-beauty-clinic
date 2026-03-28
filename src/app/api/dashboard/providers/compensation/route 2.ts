import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache, TTL } from '@/lib/cache';
import {
  generateCompensationSummary,
  calculatePayrollPeriod,
  analyzePayEquity,
  DEFAULT_COMMISSION_TIERS,
  DEFAULT_PRODUCT_COMMISSION_RATE,
  DEFAULT_MEMBERSHIP_ENROLLMENT_BONUS,
  DEFAULT_PERFORMANCE_BONUSES,
  type CompensationInput,
} from '@/lib/providers/compensation';
import type { CompensationConfig } from '@/types/providers';

const PROVIDER_CONFIGS: Record<string, CompensationConfig> = {
  rina: {
    providerId: 'rina',
    baseSalary: 75000,
    payFrequency: 'biweekly',
    commissionTiers: DEFAULT_COMMISSION_TIERS,
    serviceCommissions: {},
    productCommissionRate: DEFAULT_PRODUCT_COMMISSION_RATE,
    membershipEnrollmentBonus: DEFAULT_MEMBERSHIP_ENROLLMENT_BONUS,
    performanceBonusThresholds: DEFAULT_PERFORMANCE_BONUSES,
  },
  mom: {
    providerId: 'mom',
    baseSalary: 55000,
    payFrequency: 'biweekly',
    commissionTiers: DEFAULT_COMMISSION_TIERS,
    serviceCommissions: {},
    productCommissionRate: DEFAULT_PRODUCT_COMMISSION_RATE,
    membershipEnrollmentBonus: DEFAULT_MEMBERSHIP_ENROLLMENT_BONUS,
    performanceBonusThresholds: DEFAULT_PERFORMANCE_BONUSES,
  },
};

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(session.role, 'view_providers')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('id');

    if (providerId) {
      const cacheKey = `provider-comp-${providerId}`;
      const cached = cache.get(cacheKey);
      if (cached) return NextResponse.json(cached);

      const config = PROVIDER_CONFIGS[providerId];
      if (!config) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });

      const now = new Date();
      const periodStart = new Date(now);
      periodStart.setDate(periodStart.getDate() - 14);

      const input: CompensationInput = {
        config,
        providerName: providerId,
        periodStart: periodStart.toISOString().split('T')[0],
        periodEnd: now.toISOString().split('T')[0],
        serviceRevenue: 15000,
        productSales: 1200,
        membershipEnrollments: 3,
        tips: 450,
        hoursWorked: 80,
        performanceMetrics: { revenue: 15000, rebookRate: 75, reviewRating: 4.7, utilization: 80 },
      };

      const summary = generateCompensationSummary(input);
      cache.set(cacheKey, summary, TTL.SHORT);
      return NextResponse.json(summary);
    }

    // Payroll overview
    const cacheKey = 'provider-payroll-overview';
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    const periods = Object.entries(PROVIDER_CONFIGS).map(([id, config]) => {
      const now = new Date();
      const periodStart = new Date(now);
      periodStart.setDate(periodStart.getDate() - 14);

      return calculatePayrollPeriod({
        config,
        providerName: id,
        periodStart: periodStart.toISOString().split('T')[0],
        periodEnd: now.toISOString().split('T')[0],
        serviceRevenue: id === 'rina' ? 18000 : 12000,
        productSales: id === 'rina' ? 1500 : 800,
        membershipEnrollments: id === 'rina' ? 4 : 2,
        tips: id === 'rina' ? 550 : 350,
        hoursWorked: 80,
        performanceMetrics: { revenue: id === 'rina' ? 18000 : 12000, rebookRate: 78, reviewRating: 4.8, utilization: 82 },
      });
    });

    const result = {
      periods,
      totalGross: periods.reduce((sum, p) => sum + p.grossPay, 0),
      totalNet: periods.reduce((sum, p) => sum + p.netPay, 0),
    };

    cache.set(cacheKey, result, TTL.SHORT);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[Provider Compensation API]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
