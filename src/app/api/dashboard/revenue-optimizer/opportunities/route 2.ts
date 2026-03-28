import { NextResponse } from 'next/server';
import { scoreOpportunities } from '@/lib/revenue/opportunity-scorer';
import type { OpportunityScorerInput } from '@/lib/revenue/opportunity-scorer';

/**
 * GET /api/dashboard/revenue-optimizer/opportunities
 *
 * Scored and ranked revenue opportunities across all categories.
 * Returns top 10 daily actions and weekly report.
 */

export async function GET() {
  try {
    const input: OpportunityScorerInput = {
      gapActions: [
        { type: 'fill-slot', date: new Date().toISOString().split('T')[0], provider: 'Rina', timeSlot: '2:00 PM - 4:00 PM', estimatedRevenue: 500, daysUntil: 0, suggestedServices: ['HydraFacial', 'Botox'] },
        { type: 'fill-slot', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], provider: 'Mom', timeSlot: '10:00 AM - 12:00 PM', estimatedRevenue: 360, daysUntil: 1, suggestedServices: ['VI Peel', 'PRX-T33'] },
      ],
      upsellOpportunities: [
        { type: 'upsell', clientId: '1', clientName: 'Sarah K.', currentService: 'HydraFacial', suggestedService: 'LED Light Therapy', propensityScore: 72, revenueImpact: 75 },
        { type: 'upsell', clientId: '2', clientName: 'Jessica M.', currentService: 'RF Microneedling', suggestedService: 'PRP Enhancement', propensityScore: 58, revenueImpact: 200 },
      ],
      retentionActions: [
        { type: 'rebook', clientId: '3', clientName: 'Amanda L.', daysSinceVisit: 95, estimatedRevenue: 350, urgency: 'overdue' },
        { type: 'vip-retention', clientId: '4', clientName: 'Michelle T.', daysSinceVisit: 68, estimatedRevenue: 650, urgency: 'critical', churnRisk: 72, totalSpend: 8500 },
        { type: 'winback', clientId: '5', clientName: 'Rachel P.', daysSinceVisit: 120, estimatedRevenue: 400, urgency: 'at-risk', totalSpend: 3200 },
      ],
      pricingOpportunities: [
        { type: 'bundle', service: 'Glow Package', estimatedRevenueImpact: 670, description: 'HydraFacial + VI Peel bundle at 12% savings drives higher average tickets' },
      ],
      reactivationTargets: [
        { type: 'reactivation', clientId: '6', clientName: 'Linda W.', daysSinceVisit: 85, totalSpend: 4200, lastService: 'Botox', winBackProbability: 55, estimatedRevenue: 350 },
      ],
      membershipCandidates: [
        { type: 'membership-conversion', clientId: '7', clientName: 'Karen B.', visitCount: 8, avgTicket: 320, suggestedTier: 'Glow', monthlyPrice: 249, conversionLikelihood: 65, annualValue: 2988 },
      ],
      historicalOutcomes: [],
      currentDate: new Date().toISOString().split('T')[0],
    };

    const result = scoreOpportunities(input);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Opportunity scoring error:', error);
    return NextResponse.json({ error: 'Failed to score opportunities' }, { status: 500 });
  }
}
