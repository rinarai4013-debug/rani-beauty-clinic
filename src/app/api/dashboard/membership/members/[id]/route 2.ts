import { NextRequest, NextResponse } from 'next/server';
import { PLANS } from '@/lib/membership/plans';
import type { MembershipTier } from '@/lib/membership/plans';
import { initializeBenefits, addBonusCredits, recordCreditUsage } from '@/lib/membership/benefits';
import { generateRetentionActions } from '@/lib/membership/retention';
import type { MemberRetentionProfile } from '@/lib/membership/retention';

/**
 * GET /api/dashboard/membership/members/[id]
 *
 * Returns full member detail for the dashboard member detail page.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    // In production, fetch from Airtable by member ID.
    // Mock data for now.
    const memberData = getMockMemberById(id);
    if (!memberData) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json(memberData);
  } catch (error) {
    console.error('Member detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch member detail' },
      { status: 500 },
    );
  }
}

function getMockMemberById(id: string) {
  const tier: MembershipTier = id.includes('003') || id.includes('005') ? 'elite' : id.includes('001') || id.includes('006') ? 'glow' : 'halo';
  const plan = PLANS[tier];

  const benefits = initializeBenefits(
    id, `c_${id.slice(-3)}`, 'Sample Member', tier, '2025-10-15', 6,
  );
  const updatedBenefits = recordCreditUsage(benefits, plan.monthlyCredits * 0.6);

  const profile: MemberRetentionProfile = {
    memberId: id, clientId: `c_${id.slice(-3)}`, clientName: 'Sample Member',
    tier, status: 'active', joinDate: '2025-10-15', monthsAsMember: 5,
    engagementScore: 65, engagementTrend: 'stable',
    creditUsageRate: 60, visitFrequency: 1.2, addOnPurchases: 2,
    lastVisitDate: '2026-03-15', daysSinceLastVisit: 11,
    churnRisk: 'moderate', churnScore: 35,
    riskFactors: [
      { factor: 'Engagement', score: 35, weight: 35, detail: 'Moderate engagement', severity: 'medium' },
      { factor: 'Credit Usage', score: 40, weight: 20, detail: '60% credits used', severity: 'medium' },
    ],
    paymentIssues: false, failedPaymentCount: 0, surveysDue: [90],
    retentionActions: [],
  };

  const actions = generateRetentionActions(profile);

  return {
    member: {
      memberId: id,
      clientId: `c_${id.slice(-3)}`,
      clientName: 'Sample Member',
      email: 'member@example.com',
      phone: '(206) 555-0100',
      tier,
      status: 'active',
      joinDate: '2025-10-15',
      monthlyRate: plan.monthlyPrice,
      billingCycle: 'monthly',
      nextBillingDate: '2026-04-15',
      provider: 'Dr. Mom',
    },
    benefits: updatedBenefits,
    retention: profile,
    actions,
    billingHistory: [
      { id: 'inv_101', amount: plan.monthlyPrice, status: 'paid', date: '2026-03-15' },
      { id: 'inv_100', amount: plan.monthlyPrice, status: 'paid', date: '2026-02-15' },
      { id: 'inv_099', amount: plan.monthlyPrice, status: 'paid', date: '2026-01-15' },
    ],
    visitHistory: [
      { date: '2026-03-15', service: 'HydraFacial Signature', amount: 275, provider: 'Dr. Mom' },
      { date: '2026-02-20', service: 'Vitamin D3 Injection', amount: 50, provider: 'Dr. Mom' },
      { date: '2026-02-10', service: 'RF Microneedling', amount: 495, provider: 'Dr. Mom' },
      { date: '2026-01-25', service: 'HydraFacial Signature', amount: 275, provider: 'Dr. Mom' },
    ],
  };
}
