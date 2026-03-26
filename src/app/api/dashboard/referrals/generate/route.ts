import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { cache } from '@/lib/cache';
import {
  generateReferralCode,
  isValidReferralCode,
  createReferral,
  checkActiveReferralLimit,
  checkDuplicateReferee,
  checkSelfReferral,
  generateShareContent,
  MAX_ACTIVE_REFERRALS,
  type Referral,
} from '@/lib/referral/engine';

/**
 * POST /api/dashboard/referrals/generate
 * Generate a new referral code for a client.
 *
 * Body:
 *   {
 *     referrerId: string,
 *     referrerName: string,
 *     referrerEmail: string,
 *     refereeEmail?: string,     // optional: pre-assign referee
 *     source?: 'sms' | 'email' | 'link' | 'social'
 *   }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { referrerId, referrerName, referrerEmail, refereeEmail, source } = body;

    if (!referrerId || !referrerName) {
      return NextResponse.json(
        { error: 'referrerId and referrerName are required' },
        { status: 400 },
      );
    }

    // Anti-abuse: check self-referral
    if (refereeEmail && referrerEmail) {
      if (checkSelfReferral(referrerEmail, refereeEmail)) {
        return NextResponse.json(
          { error: 'Cannot refer yourself', code: 'SELF_REFERRAL' },
          { status: 400 },
        );
      }
    }

    // Anti-abuse: check max active referrals (10)
    // In production: fetch existing referrals from Airtable
    const existingReferrals: Referral[] = []; // would come from DB
    const limitCheck = checkActiveReferralLimit(existingReferrals, referrerId);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: limitCheck.reason,
          code: 'MAX_REFERRALS',
          activeCount: limitCheck.activeCount,
          maxAllowed: MAX_ACTIVE_REFERRALS,
        },
        { status: 429 },
      );
    }

    // Anti-abuse: check duplicate referee
    if (refereeEmail) {
      const dupCheck = checkDuplicateReferee(existingReferrals, refereeEmail);
      if (dupCheck.isDuplicate) {
        return NextResponse.json(
          { error: 'This person has already been referred', code: 'DUPLICATE_REFEREE' },
          { status: 409 },
        );
      }
    }

    // Generate unique code (retry if collision)
    let code = generateReferralCode();
    let attempts = 0;
    while (!isValidReferralCode(code) && attempts < 5) {
      code = generateReferralCode();
      attempts++;
    }

    // Create referral record
    const referral = createReferral(referrerId, referrerName, code, source);
    if (refereeEmail) {
      referral.refereeEmail = refereeEmail;
    }

    // In production: save to Airtable

    // Generate share content
    const firstName = referrerName.split(' ')[0];
    const shareContent = generateShareContent(code, firstName);

    // Invalidate cached referral data
    cache.invalidate('referrals:dashboard');
    cache.invalidate(`referrals:${referrerId}`);

    return NextResponse.json({
      success: true,
      referral: {
        id: referral.id,
        code: referral.referralCode,
        status: referral.status,
        createdAt: referral.createdAt,
        attributionExpiry: referral.attributionExpiry,
      },
      shareContent,
    });
  } catch (error) {
    console.error('[Referral Generate API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
