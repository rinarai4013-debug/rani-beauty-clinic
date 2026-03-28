import { NextResponse } from 'next/server';

/**
 * GET /api/dashboard/revenue-optimizer/actions
 *
 * Today's prioritized revenue actions -- aggregated from all engines.
 */

export async function GET() {
  try {
    // This endpoint would aggregate from gaps, retention, upsells, and opportunities
    // For now, return curated action list
    const actions = {
      date: new Date().toISOString().split('T')[0],
      actionsCompleted: 2,
      totalActions: 10,
      totalPotentialRevenue: 8450,
      actions: [
        {
          id: 'act-1',
          rank: 1,
          category: 'fill-slot',
          title: 'Fill 2:00-4:00 PM slot with Rina',
          description: 'Same-day opening worth ~$500. Contact waitlist clients immediately.',
          estimatedRevenue: 500,
          effort: 'medium',
          timeToImpact: 'same-day',
          priority: 95,
          status: 'pending',
          suggestedScript: 'Great news -- we have a last-minute opening today for a treatment. Would you like to grab it?',
        },
        {
          id: 'act-2',
          rank: 2,
          category: 'rebook-overdue',
          title: 'Rebook Amanda L. -- Botox overdue 5 days',
          description: 'Regular Botox client, 95 days since last injection. Immediate rebooking opportunity.',
          estimatedRevenue: 350,
          effort: 'low',
          timeToImpact: 'this-week',
          priority: 88,
          status: 'pending',
          targetClient: 'Amanda L.',
          suggestedScript: 'Amanda, your Botox touch-up is due! We have availability this week to keep your results looking fresh.',
        },
        {
          id: 'act-3',
          rank: 3,
          category: 'reactivate-vip',
          title: 'VIP outreach: Michelle T. ($8.5K lifetime)',
          description: 'High-value client showing churn risk (72%). Personal call from preferred provider recommended.',
          estimatedRevenue: 650,
          effort: 'high',
          timeToImpact: 'this-week',
          priority: 85,
          status: 'pending',
          targetClient: 'Michelle T.',
        },
        {
          id: 'act-4',
          rank: 4,
          category: 'activate-membership',
          title: 'Activate 5 underutilizing Halo members',
          description: 'Five Halo members have used less than 25% of their monthly credits. Quick SMS reminder.',
          estimatedRevenue: 745,
          effort: 'low',
          timeToImpact: 'this-week',
          priority: 82,
          status: 'pending',
        },
        {
          id: 'act-5',
          rank: 5,
          category: 'upsell',
          title: 'Upsell LED Light Therapy to Sarah K. (HydraFacial today)',
          description: 'Sarah is booked for HydraFacial. High propensity (72%) for LED add-on.',
          estimatedRevenue: 75,
          effort: 'low',
          timeToImpact: 'same-day',
          priority: 78,
          status: 'completed',
          targetClient: 'Sarah K.',
        },
      ],
    };

    return NextResponse.json(actions);
  } catch (error) {
    console.error('Actions error:', error);
    return NextResponse.json({ error: 'Failed to generate actions' }, { status: 500 });
  }
}
