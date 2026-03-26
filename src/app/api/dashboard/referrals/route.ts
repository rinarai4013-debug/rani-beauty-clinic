import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { cache, TTL } from '@/lib/cache';
import {
  calculateReferralStats,
  getTopReferrers,
  calculateReferralRevenue,
  advanceReferral,
  lookupByCode,
  isReferralExpired,
  getActiveReferralCodes,
  type Referral,
  type ReferralStatus,
  type ReferralStats,
} from '@/lib/referral/engine';

interface ReferralDashboardData {
  stats: ReferralStats;
  topReferrers: ReturnType<typeof getTopReferrers>;
  revenue: ReturnType<typeof calculateReferralRevenue>;
  recentReferrals: Referral[];
  activeCodes: { code: string; status: ReferralStatus; createdAt: string }[];
}

/**
 * GET /api/dashboard/referrals
 * Returns referral program analytics and tracking data.
 *
 * Query params:
 *   ?referrerId=xxx - Filter by referrer
 *   ?code=xxx - Look up specific referral code
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const referrerId = searchParams.get('referrerId');
    const code = searchParams.get('code');

    // Code lookup
    if (code) {
      const referrals = generateSampleReferrals();
      const found = lookupByCode(referrals, code);
      if (!found) {
        return NextResponse.json({ error: 'Referral code not found or expired' }, { status: 404 });
      }
      return NextResponse.json({ referral: found });
    }

    // Full dashboard data
    const cacheKey = referrerId ? `referrals:${referrerId}` : 'referrals:dashboard';
    const cached = cache.get<ReferralDashboardData>(cacheKey);
    if (cached) return NextResponse.json(cached);

    let referrals = generateSampleReferrals();

    // Check for newly expired referrals
    referrals = referrals.map(r => {
      if (isReferralExpired(r) && r.status !== 'expired') {
        return advanceReferral(r, 'expired');
      }
      return r;
    });

    // Filter by referrer if requested
    if (referrerId) {
      referrals = referrals.filter(r => r.referrerId === referrerId);
    }

    const stats = calculateReferralStats(referrals);
    const topReferrers = getTopReferrers(referrals);
    const revenue = calculateReferralRevenue(referrals);

    const recentReferrals = [...referrals]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);

    const activeCodes = referrerId
      ? getActiveReferralCodes(referrals, referrerId)
      : [];

    const data: ReferralDashboardData = {
      stats,
      topReferrers,
      revenue,
      recentReferrals,
      activeCodes,
    };

    cache.set(cacheKey, data, TTL.MODERATE);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Referrals API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/dashboard/referrals
 * Update referral status (advance pipeline).
 *
 * Body:
 *   { referralId: string, newStatus: ReferralStatus, refereeEmail?: string, refereeName?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { referralId, newStatus, refereeEmail, refereeName, refereeId } = body;

    if (!referralId || !newStatus) {
      return NextResponse.json({ error: 'referralId and newStatus required' }, { status: 400 });
    }

    const validStatuses: ReferralStatus[] = ['sent', 'clicked', 'booked', 'completed', 'rewarded', 'expired'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // In production: fetch from Airtable, update, save
    const referrals = generateSampleReferrals();
    const referral = referrals.find(r => r.id === referralId);
    if (!referral) {
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    }

    const updated = advanceReferral(referral, newStatus as ReferralStatus, {
      refereeEmail,
      refereeName,
      refereeId,
    });

    cache.invalidate('referrals:dashboard');

    return NextResponse.json({ success: true, referral: updated });
  } catch (error) {
    console.error('[Referrals API] POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── Sample Data ──────────────────────────────────────────────────────────

function generateSampleReferrals(): Referral[] {
  const now = new Date();
  const day = 86400000;
  const expiry = (d: Date) => {
    const e = new Date(d);
    e.setDate(e.getDate() + 30);
    return e.toISOString();
  };

  return [
    {
      id: 'ref-001', referrerId: 'client-001', referrerName: 'Sarah Chen',
      referralCode: 'RANI-SC4K', refereeEmail: 'lisa@example.com', refereeName: 'Lisa Wang',
      refereeId: 'client-010', status: 'completed',
      createdAt: new Date(now.getTime() - 15 * day).toISOString(),
      clickedAt: new Date(now.getTime() - 14 * day).toISOString(),
      bookedAt: new Date(now.getTime() - 10 * day).toISOString(),
      completedAt: new Date(now.getTime() - 5 * day).toISOString(),
      referrerRewardIssued: true, refereeRewardIssued: true,
      source: 'sms', attributionExpiry: expiry(new Date(now.getTime() - 15 * day)),
    },
    {
      id: 'ref-002', referrerId: 'client-001', referrerName: 'Sarah Chen',
      referralCode: 'RANI-SC7B', refereeEmail: 'kate@example.com', refereeName: 'Kate Lee',
      status: 'booked',
      createdAt: new Date(now.getTime() - 5 * day).toISOString(),
      clickedAt: new Date(now.getTime() - 4 * day).toISOString(),
      bookedAt: new Date(now.getTime() - 2 * day).toISOString(),
      referrerRewardIssued: false, refereeRewardIssued: true,
      source: 'email', attributionExpiry: expiry(new Date(now.getTime() - 5 * day)),
    },
    {
      id: 'ref-003', referrerId: 'client-002', referrerName: 'Maria Rodriguez',
      referralCode: 'RANI-MR9X', refereeEmail: 'ana@example.com',
      status: 'clicked',
      createdAt: new Date(now.getTime() - 3 * day).toISOString(),
      clickedAt: new Date(now.getTime() - 2 * day).toISOString(),
      referrerRewardIssued: false, refereeRewardIssued: false,
      source: 'link', attributionExpiry: expiry(new Date(now.getTime() - 3 * day)),
    },
    {
      id: 'ref-004', referrerId: 'client-003', referrerName: 'Jennifer Park',
      referralCode: 'RANI-JP2M',
      status: 'sent',
      createdAt: new Date(now.getTime() - 1 * day).toISOString(),
      referrerRewardIssued: false, refereeRewardIssued: false,
      source: 'social', attributionExpiry: expiry(new Date(now.getTime() - 1 * day)),
    },
    {
      id: 'ref-005', referrerId: 'client-001', referrerName: 'Sarah Chen',
      referralCode: 'RANI-SC3N', refereeEmail: 'old@example.com',
      status: 'expired',
      createdAt: new Date(now.getTime() - 45 * day).toISOString(),
      referrerRewardIssued: false, refereeRewardIssued: false,
      source: 'sms', attributionExpiry: new Date(now.getTime() - 15 * day).toISOString(),
    },
    {
      id: 'ref-006', referrerId: 'client-002', referrerName: 'Maria Rodriguez',
      referralCode: 'RANI-MR5T', refereeEmail: 'friend@example.com', refereeName: 'Amy Smith',
      refereeId: 'client-011', status: 'rewarded',
      createdAt: new Date(now.getTime() - 25 * day).toISOString(),
      clickedAt: new Date(now.getTime() - 24 * day).toISOString(),
      bookedAt: new Date(now.getTime() - 20 * day).toISOString(),
      completedAt: new Date(now.getTime() - 15 * day).toISOString(),
      rewardedAt: new Date(now.getTime() - 14 * day).toISOString(),
      referrerRewardIssued: true, refereeRewardIssued: true,
      source: 'email', attributionExpiry: expiry(new Date(now.getTime() - 25 * day)),
    },
  ];
}
