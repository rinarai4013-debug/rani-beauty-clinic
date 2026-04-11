import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache, TTL } from '@/lib/cache';
import { z } from 'zod';
import {
  buildAnalytics,
  determineTier,
  calculateTierProgress,
  getTierBenefits,
  awardBonus,
  type LoyaltyMember,
  type PointsTransaction,
  type LoyaltyAnalytics,
  type ServiceType,
  type BonusType,
} from '@/lib/loyalty/engine';
import { getAvailableRewards } from '@/lib/loyalty/rewards';

/**
 * GET /api/dashboard/loyalty
 * Returns loyalty program analytics and member data.
 *
 * Query params:
 *   ?action=analytics - Full analytics dashboard data
 *   ?action=member&clientId=xxx - Single member details
 *   ?action=rewards&tier=xxx&balance=xxx - Available rewards for tier/balance
 */

const loyaltyTierSchema = z.enum(['Silver', 'Gold', 'Platinum']);
const bonusTypeSchema = z.enum(['birthday', 'review', 'referral', 'visit_streak', 'tier_up']);
const serviceTypeSchema = z.enum(['standard', 'membership', 'package']);
const loyaltyGetActionSchema = z.enum(['analytics', 'member', 'rewards']);

const loyaltyGetAnalyticsSchema = z.object({ action: z.literal('analytics') });
const loyaltyGetMemberSchema = z.object({
  action: z.literal('member'),
  clientId: z.string().trim().min(1, 'clientId is required for member action'),
});
const loyaltyGetRewardsSchema = z.object({
  action: z.literal('rewards'),
  tier: loyaltyTierSchema.default('Silver'),
  balance: z.coerce.number().int().nonnegative().default(0),
});

const loyaltyGetQuerySchema = z.object({
  action: loyaltyGetActionSchema.default('analytics'),
  clientId: z.string().trim().min(1).optional(),
  tier: loyaltyTierSchema.optional(),
  balance: z.coerce.number().int().nonnegative().optional(),
});

const loyaltyPostAwardBonusSchema = z.object({
  action: z.literal('award_bonus'),
  clientId: z.string().trim().min(1, 'clientId is required'),
  bonusType: bonusTypeSchema,
});

const loyaltyPostProcessSpendSchema = z.object({
  action: z.literal('process_spend'),
  clientId: z.string().trim().min(1, 'clientId is required'),
  amount: z.coerce.number().positive('amount must be greater than 0'),
  serviceType: serviceTypeSchema.default('standard'),
});

function parseLoyaltyPostBody(rawBody: unknown) {
  if (!rawBody || typeof rawBody !== 'object' || rawBody === null) {
    throw new Error('Body must be an object');
  }

  const action = (rawBody as { action?: unknown }).action;
  if (action === 'award_bonus') {
    return loyaltyPostAwardBonusSchema.parse(rawBody);
  }

  if (action === 'process_spend') {
    return loyaltyPostProcessSpendSchema.parse(rawBody);
  }

  return z.object({ action: z.string() }).parse(rawBody);
}

function formatZodError(error: z.ZodError) {
  return { errors: error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message })) };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    let query;
    try {
      const parsedQuery = loyaltyGetQuerySchema.safeParse({
        action: searchParams.get('action') ?? undefined,
        clientId: searchParams.get('clientId') ?? undefined,
        tier: searchParams.get('tier') ?? undefined,
        balance: searchParams.get('balance') ?? undefined,
      });

      if (!parsedQuery.success) {
        return NextResponse.json({ error: 'Invalid query parameters', details: formatZodError(parsedQuery.error) }, { status: 400 });
      }

      if (parsedQuery.data.action === 'member') {
        const memberQuery = loyaltyGetMemberSchema.safeParse(parsedQuery.data);
        if (!memberQuery.success) {
          return NextResponse.json({ error: 'Invalid query parameters', details: formatZodError(memberQuery.error) }, { status: 400 });
        }
        query = memberQuery.data;
      } else if (parsedQuery.data.action === 'rewards') {
        const rewardsQuery = loyaltyGetRewardsSchema.safeParse(parsedQuery.data);
        if (!rewardsQuery.success) {
          return NextResponse.json({ error: 'Invalid query parameters', details: formatZodError(rewardsQuery.error) }, { status: 400 });
        }
        query = rewardsQuery.data;
      } else {
        query = loyaltyGetAnalyticsSchema.parse({ action: 'analytics' });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid query parameters', details: formatZodError(error) }, { status: 400 });
      }
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }

    const { action } = query;

    if (action === 'analytics') {
      const cacheKey = 'loyalty:analytics';
      const cached = cache.get<LoyaltyAnalytics>(cacheKey);
      if (cached) return NextResponse.json(cached);

      // In production, these would come from Airtable
      // For now, return structured mock data that matches the analytics interface
      const members = generateSampleMembers();
      const transactions = generateSampleTransactions();
      const analytics = buildAnalytics(members, transactions);

      cache.set(cacheKey, analytics, TTL.MODERATE);
      return NextResponse.json(analytics);
    }

    if (action === 'member') {
      const { clientId } = query;

      // In production: fetch from Airtable Clients + Loyalty Points tables
      const member = generateSampleMembers().find(m => m.clientId === clientId);
      if (!member) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 });
      }

      const tier = determineTier(member.totalPointsEarned);
      const progress = calculateTierProgress(member.totalPointsEarned);
      const benefits = getTierBenefits(tier);
      const rewards = getAvailableRewards(tier, member.currentBalance);

      return NextResponse.json({
        member,
        tier,
        progress,
        benefits,
        availableRewards: rewards,
      });
    }

    if (action === 'rewards') {
      const { tier, balance } = query;
      const rewards = getAvailableRewards(tier, balance);
      return NextResponse.json({ rewards });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Loyalty API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/dashboard/loyalty
 * Award bonus points or process transactions.
 *
 * Body:
 *   { action: 'award_bonus', clientId: string, bonusType: BonusType }
 *   { action: 'process_spend', clientId: string, amount: number, serviceType: string }
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

    let body: {
      action: string;
      clientId?: string;
      bonusType?: BonusType;
      amount?: number;
      serviceType?: ServiceType;
    };
    try {
      const rawBody = await req.json();
      body = parseLoyaltyPostBody(rawBody) as typeof body;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid request body', details: formatZodError(error) }, { status: 400 });
      }
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (body.action === 'award_bonus') {
      const { clientId, bonusType } = body;

      // In production: fetch member from Airtable, update, save
      const member = generateSampleMembers().find(m => m.clientId === clientId);
      if (!member) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 });
      }

      const result = awardBonus(member, bonusType as BonusType);
      cache.invalidate('loyalty:analytics');

      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    if (body.action === 'process_spend') {
      return NextResponse.json(
        {
          error: 'process_spend action is not yet implemented',
        },
        { status: 501 },
      );
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Loyalty API] POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── Sample Data (replace with Airtable queries in production) ────────────

function generateSampleMembers(): LoyaltyMember[] {
  return [
    {
      clientId: 'client-001', clientName: 'Sarah Chen', email: 'sarah@example.com',
      totalPointsEarned: 6200, totalPointsRedeemed: 2500, totalPointsExpired: 0,
      currentBalance: 3700, tier: 'Platinum', lifetimeSpend: 6200,
      visitCount: 18, lastActivityDate: '2026-03-15T00:00:00Z',
      enrolledDate: '2024-06-01', birthdayMonth: 5, streakCount: 18,
    },
    {
      clientId: 'client-002', clientName: 'Maria Rodriguez', email: 'maria@example.com',
      totalPointsEarned: 3800, totalPointsRedeemed: 1000, totalPointsExpired: 0,
      currentBalance: 2800, tier: 'Gold', lifetimeSpend: 3800,
      visitCount: 12, lastActivityDate: '2026-03-10T00:00:00Z',
      enrolledDate: '2024-09-01', birthdayMonth: 8, streakCount: 12,
    },
    {
      clientId: 'client-003', clientName: 'Jennifer Park', email: 'jen@example.com',
      totalPointsEarned: 1500, totalPointsRedeemed: 0, totalPointsExpired: 0,
      currentBalance: 1500, tier: 'Silver', lifetimeSpend: 1500,
      visitCount: 5, lastActivityDate: '2026-03-01T00:00:00Z',
      enrolledDate: '2025-01-01', birthdayMonth: 3, streakCount: 5,
    },
    {
      clientId: 'client-004', clientName: 'Ashley Kim', email: 'ashley@example.com',
      totalPointsEarned: 2200, totalPointsRedeemed: 500, totalPointsExpired: 0,
      currentBalance: 1700, tier: 'Gold', lifetimeSpend: 2200,
      visitCount: 8, lastActivityDate: '2026-02-20T00:00:00Z',
      enrolledDate: '2025-03-01', birthdayMonth: 11, streakCount: 8,
    },
    {
      clientId: 'client-005', clientName: 'Emily Watson', email: 'emily@example.com',
      totalPointsEarned: 800, totalPointsRedeemed: 0, totalPointsExpired: 0,
      currentBalance: 800, tier: 'Silver', lifetimeSpend: 800,
      visitCount: 3, lastActivityDate: '2026-01-15T00:00:00Z',
      enrolledDate: '2025-10-01', streakCount: 3,
    },
  ];
}

function generateSampleTransactions(): PointsTransaction[] {
  const now = new Date();
  return [
    { id: 'pt-1', clientId: 'client-001', type: 'treatment_spend', points: 275, balance: 3700, description: 'HydraFacial Signature', createdAt: new Date(now.getTime() - 86400000).toISOString() },
    { id: 'pt-2', clientId: 'client-002', type: 'treatment_spend', points: 495, balance: 2800, description: 'RF Microneedling', createdAt: new Date(now.getTime() - 172800000).toISOString() },
    { id: 'pt-3', clientId: 'client-001', type: 'referral_bonus', points: 500, balance: 3425, description: 'Referral bonus - friend completed first treatment', createdAt: new Date(now.getTime() - 259200000).toISOString() },
    { id: 'pt-4', clientId: 'client-003', type: 'treatment_spend', points: 350, balance: 1500, description: 'PicoWay Laser', createdAt: new Date(now.getTime() - 345600000).toISOString() },
    { id: 'pt-5', clientId: 'client-001', type: 'redemption', points: -2500, balance: 2925, description: 'Redeemed: $25 Treatment Credit', createdAt: new Date(now.getTime() - 432000000).toISOString() },
  ];
}
