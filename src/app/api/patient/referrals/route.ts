import { NextResponse } from 'next/server';
import { getPatientSession, generateReferralCode } from '@/lib/patient-auth/session';

export async function GET() {
  try {
    const session = await getPatientSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Generate a deterministic-style referral code for this patient
    // Note: generateReferralCode is random-based, so for a stable code
    // we derive one from the patient ID
    const code = deriveReferralCode(session.patientId);

    return NextResponse.json({
      referral: {
        code,
        // Placeholder stats until a referral tracking table is built
        totalReferrals: 0,
        successfulReferrals: 0,
        pendingReferrals: 0,
        rewardsEarned: 0,
        link: `https://ranibeautyclinic.com?ref=${code}`,
      },
    });
  } catch (error) {
    console.error('[Patient API] Referrals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral info' },
      { status: 500 }
    );
  }
}

/**
 * Derive a stable referral code from a patient's Airtable record ID.
 * Uses the same RANI-XXXX format as generateReferralCode but deterministically.
 */
function deriveReferralCode(patientId: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  // Simple hash from the record ID characters
  for (let i = 0; i < 4; i++) {
    const charCode = patientId.charCodeAt((i * 3) % patientId.length);
    code += chars[charCode % chars.length];
  }
  return `RANI-${code}`;
}
