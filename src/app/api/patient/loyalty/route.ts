import { NextResponse } from 'next/server';
import { requirePatientAuth, getAirtableBase } from '@/lib/patient-auth/require-patient';
import {
  determineTier,
  calculateTierProgress,
  getTierBenefits,
  type LoyaltyTier,
} from '@/lib/loyalty/engine';

export async function GET() {
  const auth = await requirePatientAuth();
  if (auth.error) return auth.error;

  try {
    const base = await getAirtableBase();

    // Fetch patient's transaction data to calculate loyalty
    let totalSpend = 0;
    let transactionCount = 0;
    const pointsHistory: Array<{
      id: string;
      type: string;
      points: number;
      description: string;
      date: string;
    }> = [];

    try {
      const txRecords = await base('Transactions')
        .select({
          filterByFormula: `AND(
            FIND("${auth.session.patientId}", ARRAYJOIN({Clients})),
            {Status} = "Completed"
          )`,
          sort: [{ field: 'Date', direction: 'desc' }],
          maxRecords: 100,
          fields: ['Date', 'Amount', 'Service Name', 'Type'],
        })
        .firstPage();

      for (const tx of txRecords) {
        const amount = (tx.get('Amount') as number) || 0;
        totalSpend += amount;
        transactionCount++;

        // Each transaction earns points (1 pt per $1)
        pointsHistory.push({
          id: tx.id,
          type: 'treatment_spend',
          points: Math.floor(amount),
          description: (tx.get('Service Name') as string) || 'Treatment',
          date: (tx.get('Date') as string) || '',
        });
      }
    } catch {
      // Transactions table may have different fields
    }

    // Calculate loyalty status
    const totalPointsEarned = Math.floor(totalSpend);
    const tier = determineTier(totalPointsEarned);
    const { progress, pointsToNextTier, nextTier } = calculateTierProgress(totalPointsEarned);
    const benefits = getTierBenefits(tier);

    // For now, assume no redemptions (would be tracked in a Loyalty Transactions table)
    const totalPointsRedeemed = 0;
    const pointsBalance = totalPointsEarned - totalPointsRedeemed;

    // Build rewards list based on tier
    const rewards = getRewardsForTier(tier, pointsBalance);

    return NextResponse.json({
      account: {
        tier,
        pointsBalance,
        totalEarned: totalPointsEarned,
        totalRedeemed: totalPointsRedeemed,
        tierProgress: progress,
        nextTier,
        pointsToNextTier,
      },
      benefits: {
        discountPercent: benefits.discountPercent,
        priorityBooking: benefits.priorityBooking,
        freeAddons: benefits.freeAddons,
        description: benefits.description,
      },
      history: pointsHistory.slice(0, 20),
      rewards,
      patientName: auth.session.name,
    });
  } catch (error) {
    console.error('Patient loyalty error:', error);
    return NextResponse.json(
      { error: 'Failed to load loyalty data' },
      { status: 500 }
    );
  }
}

function getRewardsForTier(
  tier: LoyaltyTier,
  balance: number
): Array<{
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  available: boolean;
}> {
  const allRewards = [
    { id: 'r1', name: 'Luxury Lip Treatment', description: 'Medical-grade lip balm', pointsCost: 250, minTier: 'Silver' as LoyaltyTier },
    { id: 'r2', name: 'HydraFacial Boost', description: 'Free boost add-on', pointsCost: 500, minTier: 'Silver' as LoyaltyTier },
    { id: 'r3', name: 'Mini Skincare Set', description: 'Medical-grade minis', pointsCost: 750, minTier: 'Silver' as LoyaltyTier },
    { id: 'r4', name: '$25 Treatment Credit', description: '$25 toward any treatment', pointsCost: 1000, minTier: 'Silver' as LoyaltyTier },
    { id: 'r5', name: '$50 Treatment Credit', description: '$50 toward any treatment', pointsCost: 1800, minTier: 'Gold' as LoyaltyTier },
    { id: 'r6', name: 'Free HydraFacial', description: 'Full Signature treatment', pointsCost: 2500, minTier: 'Gold' as LoyaltyTier },
    { id: 'r7', name: 'VIP Treatment Day', description: 'Extended appointment + luxury add-ons', pointsCost: 4000, minTier: 'Platinum' as LoyaltyTier },
    { id: 'r8', name: '$100 Treatment Credit', description: '$100 toward any treatment', pointsCost: 3500, minTier: 'Platinum' as LoyaltyTier },
  ];

  const tierOrder: LoyaltyTier[] = ['Silver', 'Gold', 'Platinum'];
  const tierIdx = tierOrder.indexOf(tier);

  return allRewards
    .filter((r) => tierOrder.indexOf(r.minTier) <= tierIdx)
    .map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      pointsCost: r.pointsCost,
      available: balance >= r.pointsCost,
    }));
}
