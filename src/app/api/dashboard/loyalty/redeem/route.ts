import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache } from '@/lib/cache';
import { validateRedemption, pointsToDollars, generateTransactionId } from '@/lib/loyalty/engine';
import { canRedeem, getRewardById, processRewardRedemption } from '@/lib/loyalty/rewards';
import type { LoyaltyTier } from '@/lib/loyalty/engine';

/**
 * POST /api/dashboard/loyalty/redeem
 * Redeem loyalty points for a reward.
 *
 * Body:
 *   { clientId: string, rewardId: string, tier: LoyaltyTier, currentBalance: number }
 *
 * Or for custom point redemption:
 *   { clientId: string, pointsToRedeem: number, currentBalance: number, description: string }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.role, 'entry_sale')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { clientId, rewardId, tier, currentBalance, pointsToRedeem, description } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'clientId required' }, { status: 400 });
    }

    // Reward-based redemption
    if (rewardId) {
      if (!tier || currentBalance === undefined) {
        return NextResponse.json({ error: 'tier and currentBalance required for reward redemption' }, { status: 400 });
      }

      const result = processRewardRedemption(rewardId, tier as LoyaltyTier, currentBalance);
      if (!result.success) {
        return NextResponse.json({ error: result.error, success: false }, { status: 400 });
      }

      // In production: update Airtable, create transaction record
      const transactionId = generateTransactionId();

      cache.invalidate('loyalty:analytics');

      return NextResponse.json({
        success: true,
        transactionId,
        reward: result.reward,
        pointsDeducted: result.pointsDeducted,
        creditAmount: result.creditAmount,
        newBalance: currentBalance - result.pointsDeducted,
      });
    }

    // Custom points redemption
    if (pointsToRedeem) {
      if (currentBalance === undefined) {
        return NextResponse.json({ error: 'currentBalance required' }, { status: 400 });
      }

      const validation = validateRedemption(currentBalance, pointsToRedeem);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error, success: false }, { status: 400 });
      }

      const dollarValue = pointsToDollars(pointsToRedeem);
      const transactionId = generateTransactionId();

      cache.invalidate('loyalty:analytics');

      return NextResponse.json({
        success: true,
        transactionId,
        pointsDeducted: pointsToRedeem,
        dollarValue,
        newBalance: currentBalance - pointsToRedeem,
        description: description || `Redeemed ${pointsToRedeem} points for $${dollarValue} credit`,
      });
    }

    return NextResponse.json({ error: 'rewardId or pointsToRedeem required' }, { status: 400 });
  } catch (error) {
    console.error('[Loyalty Redeem API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
