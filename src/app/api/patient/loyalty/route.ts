import { NextResponse } from 'next/server';
import { getPatientSession } from '@/lib/patient-auth/session';
import { Tables, rateLimitedQuery } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';

function getLoyaltyTier(totalSpend: number): string {
  if (totalSpend >= 5000) return 'Platinum';
  if (totalSpend >= 2000) return 'Gold';
  return 'Silver';
}

function getNextTierThreshold(tier: string): { nextTier: string; amountNeeded: number } | null {
  switch (tier) {
    case 'Silver':
      return { nextTier: 'Gold', amountNeeded: 2000 };
    case 'Gold':
      return { nextTier: 'Platinum', amountNeeded: 5000 };
    default:
      return null;
  }
}

export async function GET() {
  try {
    const session = await getPatientSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch the client record to get linked transaction IDs
    const client = await rateLimitedQuery(() =>
      Tables.clients().find(session.patientId)
    );

    const transactionIds = (client.fields[FIELDS.clients.transactions] as string[]) || [];

    let totalSpend = 0;
    let totalVisits = 0;

    if (transactionIds.length > 0) {
      const transactionRecords = await Promise.all(
        transactionIds.map((id) =>
          rateLimitedQuery(() => Tables.transactions().find(id))
        )
      );

      for (const record of transactionRecords) {
        const status = record.fields[FIELDS.transactions.status] as string;
        const amount = record.fields[FIELDS.transactions.amount] as number || 0;

        // Only count completed/paid transactions
        if (status === 'Paid' || status === 'Completed') {
          totalSpend += amount;
          totalVisits += 1;
        }
      }
    }

    const tier = getLoyaltyTier(totalSpend);
    const points = Math.floor(totalSpend); // $1 = 1 point
    const nextTierInfo = getNextTierThreshold(tier);

    return NextResponse.json({
      loyalty: {
        tier,
        points,
        totalSpend: Math.round(totalSpend * 100) / 100,
        totalVisits,
        nextTier: nextTierInfo?.nextTier || null,
        amountToNextTier: nextTierInfo
          ? Math.max(0, Math.round((nextTierInfo.amountNeeded - totalSpend) * 100) / 100)
          : 0,
      },
    });
  } catch (error) {
    console.error('[Patient API] Loyalty error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loyalty info' },
      { status: 500 }
    );
  }
}
