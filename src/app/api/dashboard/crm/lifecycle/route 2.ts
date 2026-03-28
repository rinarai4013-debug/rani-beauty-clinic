import { NextRequest, NextResponse } from 'next/server';
import { evaluateLifecycle, calculateLifecycleMetrics } from '@/lib/crm/lifecycle';
import type { LifecycleMetrics, ClientLifecycle } from '@/types/crm';

/**
 * GET /api/dashboard/crm/lifecycle
 * Returns lifecycle metrics for all clients.
 */
export async function GET(request: NextRequest) {
  try {
    // In production, fetch clients from Airtable and evaluate lifecycles
    const sampleClients = getSampleLifecycles();
    const metrics = calculateLifecycleMetrics(sampleClients);

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('CRM Lifecycle error:', error);
    return NextResponse.json({ error: 'Failed to load lifecycle data' }, { status: 500 });
  }
}

function getSampleLifecycles(): ClientLifecycle[] {
  return [
    {
      clientId: 'c001', clientName: 'Sarah Johnson', stage: 'prospect', enteredStageAt: '2026-03-20T00:00:00Z',
      daysInStage: 6, totalVisits: 0, totalSpend: 0, avgTicket: 0, lastVisitDate: '', daysSinceLastVisit: 999,
      projectedLTV: 600, retentionRiskScore: 0, hasMembership: false,
      milestones: [], communicationPreference: 'email',
    },
    {
      clientId: 'c002', clientName: 'Emily Chen', stage: 'active', enteredStageAt: '2026-02-15T00:00:00Z',
      daysInStage: 39, totalVisits: 4, totalSpend: 2100, avgTicket: 525, lastVisitDate: '2026-03-15',
      daysSinceLastVisit: 11, projectedLTV: 8400, retentionRiskScore: 15, hasMembership: true, membershipTier: 'Gold',
      milestones: [
        { type: 'visit_count', label: '5th Visit', targetValue: 5, currentValue: 4, achieved: false },
        { type: 'spend_threshold', label: '$1,000 Invested', targetValue: 1000, currentValue: 2100, achieved: true, achievedAt: '2026-02-20' },
      ],
      communicationPreference: 'sms',
    },
    {
      clientId: 'c003', clientName: 'Michelle Park', stage: 'vip', enteredStageAt: '2026-01-01T00:00:00Z',
      daysInStage: 84, totalVisits: 15, totalSpend: 12500, avgTicket: 833, lastVisitDate: '2026-03-20',
      daysSinceLastVisit: 6, projectedLTV: 50000, retentionRiskScore: 5, hasMembership: true, membershipTier: 'Platinum',
      milestones: [
        { type: 'visit_count', label: '5th Visit', targetValue: 5, currentValue: 15, achieved: true, achievedAt: '2025-10-15' },
        { type: 'visit_count', label: '10th Visit', targetValue: 10, currentValue: 15, achieved: true, achievedAt: '2026-01-10' },
        { type: 'spend_threshold', label: '$10,000 Invested', targetValue: 10000, currentValue: 12500, achieved: true, achievedAt: '2026-02-01' },
      ],
      communicationPreference: 'email',
    },
  ];
}
