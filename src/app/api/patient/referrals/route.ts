import { NextResponse } from 'next/server';
import { requirePatientAuth } from '@/lib/patient-auth/require-patient';
import {
  generateReferralCode,
  generateShareContent,
  type ReferralStatus,
} from '@/lib/referral/engine';

export async function GET() {
  const auth = await requirePatientAuth();
  if (auth.error) return auth.error;

  try {
    // Generate referral code for this patient
    // In production, this would be stored in Airtable and looked up
    const firstName = auth.session.name.split(' ')[0];
    const referralCode = generateReferralCode();
    const shareContent = generateShareContent(referralCode, firstName);

    // In production, referrals would be fetched from Airtable
    // For now, return structure with empty referral list
    const referrals: Array<{
      id: string;
      refereeName?: string;
      refereeEmail?: string;
      status: ReferralStatus;
      createdAt: string;
      completedAt?: string;
    }> = [];

    const stats = {
      totalReferrals: referrals.length,
      completed: referrals.filter((r) => r.status === 'completed' || r.status === 'rewarded').length,
      rewarded: referrals.filter((r) => r.status === 'rewarded').length,
      totalRewardsEarned:
        referrals.filter((r) => r.status === 'completed' || r.status === 'rewarded').length * 50,
    };

    return NextResponse.json({
      shareContent,
      stats,
      referrals,
    });
  } catch (error) {
    console.error('Patient referrals error:', error);
    return NextResponse.json(
      { error: 'Failed to load referral data' },
      { status: 500 }
    );
  }
}
