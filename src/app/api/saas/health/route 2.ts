/**
 * Customer Health API
 *
 * GET - Health scores, churn risk, feature adoption
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  calculateLoginScore,
  calculateFeatureAdoptionScore,
  calculateSupportScore,
  calculateBillingScore,
  calculateDataActivityScore,
  calculateHealthScore,
  assessChurnRisk,
  type HealthFactors,
} from '@/lib/saas/customer-success-bot';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    // Return all tenants' health overview
    return NextResponse.json({
      summary: {
        excellent: 18,
        good: 15,
        at_risk: 9,
        critical: 5,
        total: 47,
      },
      avgHealthScore: 68,
      nps: 52,
      churnRisk: {
        critical: { count: 5, mrrAtRisk: 4995 },
        high: { count: 4, mrrAtRisk: 2796 },
        medium: { count: 9, mrrAtRisk: 4491 },
        low: { count: 29, mrrAtRisk: 0 },
      },
    });
  }

  // Calculate health for specific tenant
  // In production: fetch real data from Airtable
  const loginFactor = calculateLoginScore(45, 18);
  const featureAdoptionFactor = calculateFeatureAdoptionScore([
    { featureId: 'ai_chat', name: 'AI Chat', enabled: true, activated: true, usageCount: 120, adoptionScore: 80, firstUsedAt: '2026-01-15', lastUsedAt: '2026-03-25' },
    { featureId: 'churn_prediction', name: 'Churn Prediction', enabled: true, activated: true, usageCount: 30, adoptionScore: 60, firstUsedAt: '2026-02-01', lastUsedAt: '2026-03-24' },
    { featureId: 'schedule_optimizer', name: 'Schedule Optimizer', enabled: true, activated: false, usageCount: 0, adoptionScore: 0 },
  ]);
  const supportFactor = calculateSupportScore(1, 3, 12);
  const billingFactor = calculateBillingScore(true, 0, 15, false);
  const dataFactor = calculateDataActivityScore(85, 42, 12);

  const factors: HealthFactors = {
    loginFrequency: loginFactor,
    featureAdoption: featureAdoptionFactor,
    supportTickets: supportFactor,
    billingHealth: billingFactor,
    dataActivity: dataFactor,
  };

  const { overall, grade } = calculateHealthScore(factors);

  const churnRisk = assessChurnRisk(overall, {
    loginDecline: 0,
    supportComplaints: 1,
    failedPayments: 0,
    daysWithoutLogin: 2,
    cancelPageVisits: 0,
    downgradedRecently: false,
  });

  return NextResponse.json({
    tenantId,
    healthScore: {
      overall,
      grade,
      trend: 'stable',
      factors,
    },
    churnRisk: {
      ...churnRisk,
      tenantId,
    },
  });
}
