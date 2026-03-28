/**
 * SaaS Analytics API
 *
 * GET - Complete SaaS metrics dashboard data
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  calculateMRR,
  calculateARR,
  calculateNRR,
  calculateLTV,
  calculateCAC,
  calculateLTVCACRatio,
  calculatePaybackPeriod,
  calculateLogoChurn,
  calculateRevenueChurn,
  calculateQuickRatio,
  interpretQuickRatio,
} from '@/lib/saas/analytics-dashboard';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const metric = searchParams.get('metric');

  // Mock subscription data - in production: fetch from Stripe/database
  const subscriptions = [
    ...Array(18).fill(null).map(() => ({ plan: 'starter', billingCycle: 'monthly' as const, status: 'active', monthlyPrice: 199, annualPrice: 1990, addOnMRR: 0 })),
    ...Array(24).fill(null).map(() => ({ plan: 'professional', billingCycle: 'monthly' as const, status: 'active', monthlyPrice: 499, annualPrice: 4990, addOnMRR: 20 })),
    ...Array(5).fill(null).map(() => ({ plan: 'enterprise', billingCycle: 'annual' as const, status: 'active', monthlyPrice: 999, annualPrice: 9990, addOnMRR: 0 })),
  ];

  const mrr = calculateMRR(subscriptions);
  const arr = calculateARR(mrr);

  // Monthly metrics
  const startingMRR = 38600;
  const expansionMRR = 1400;
  const contractionMRR = 300;
  const churnMRR = 300;
  const reactivationMRR = 200;
  const newMRR = mrr - startingMRR - expansionMRR + contractionMRR + churnMRR - reactivationMRR;

  const nrr = calculateNRR(startingMRR, expansionMRR, contractionMRR, churnMRR);

  const avgMRR = mrr / 47;
  const avgLifetimeMonths = 14;
  const ltv = calculateLTV(avgMRR, avgLifetimeMonths);
  const totalAcquisitionCost = 11900;
  const newCustomers = 8;
  const cac = calculateCAC(totalAcquisitionCost, newCustomers);
  const ltvCacRatio = calculateLTVCACRatio(ltv, cac);
  const payback = calculatePaybackPeriod(cac, avgMRR);

  const logoChurn = calculateLogoChurn(2, 47);
  const revenueChurn = calculateRevenueChurn(churnMRR, startingMRR);

  const quickRatio = calculateQuickRatio(newMRR, expansionMRR, reactivationMRR, contractionMRR, churnMRR);
  const quickRatioInterpretation = interpretQuickRatio(quickRatio);

  if (metric === 'mrr') {
    return NextResponse.json({ mrr, arr });
  }

  if (metric === 'churn') {
    return NextResponse.json({
      logoChurn,
      revenueChurn,
      customersLost: 2,
      mrrLost: churnMRR,
    });
  }

  // Full metrics
  return NextResponse.json({
    mrr: Math.round(mrr),
    arr,
    nrr,
    customerCount: 47,
    avgRevenuePerCustomer: Math.round(avgMRR),
    ltv,
    cac,
    ltvCacRatio,
    paybackPeriodMonths: payback,
    churn: {
      logoChurnRate: logoChurn,
      revenueChurnRate: revenueChurn,
      customersLost: 2,
      mrrLost: churnMRR,
    },
    expansion: {
      expansionMRR,
      contractionMRR,
      netExpansion: expansionMRR - contractionMRR,
      addOnRevenue: 480,
    },
    quickRatio,
    quickRatioGrade: quickRatioInterpretation.grade,
    funnel: {
      visitors: 12450,
      leads: 847,
      trials: 72,
      paidCustomers: newCustomers,
      overallConversion: 0.38,
    },
    mrrBreakdown: {
      newMRR: Math.round(newMRR),
      expansionMRR,
      contractionMRR,
      churnMRR,
      reactivationMRR,
      netNewMRR: Math.round(mrr - startingMRR),
    },
    calculatedAt: new Date().toISOString(),
  });
}
