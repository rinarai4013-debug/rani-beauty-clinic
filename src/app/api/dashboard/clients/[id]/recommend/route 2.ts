import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, rateLimitedQuery, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import { recommendNextTreatment, type TreatmentRecord } from '@/lib/recommendations/engine';

/**
 * GET /api/dashboard/clients/[id]/recommend
 *
 * Returns AI-powered next-best-treatment recommendations
 * based on the client's treatment history and profile.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'view_clients')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const cacheKey = `recommend-${id}`;
    const cached = cache.get<unknown>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch client record
    const record = await rateLimitedQuery(() => Tables.clients().find(id));
    const appointmentIds = (record.fields['Appointments'] as string[]) || [];
    const transactionIds = (record.fields['Transactions'] as string[]) || [];
    const membershipIds = (record.fields['Memberships'] as string[]) || [];

    // Fetch related data
    const [appointments, transactions, memberships] = await Promise.all([
      appointmentIds.length > 0
        ? fetchAll<{
            'Service Name': string;
            'Service Category': string;
            'Date': string;
            'Status': string;
            'Amount Paid': number;
          }>(Tables.appointments(), {
            filterByFormula: `OR(${appointmentIds.slice(0, 30).map(aid => `RECORD_ID() = '${aid}'`).join(',')})`,
          }).catch(() => [])
        : Promise.resolve([]),
      transactionIds.length > 0
        ? fetchAll<{ Amount: number }>(Tables.transactions(), {
            filterByFormula: `OR(${transactionIds.slice(0, 30).map(tid => `RECORD_ID() = '${tid}'`).join(',')})`,
          }).catch(() => [])
        : Promise.resolve([]),
      membershipIds.length > 0
        ? fetchAll<{ Status: string; Tier: string }>(Tables.memberships(), {
            filterByFormula: `OR(${membershipIds.map(mid => `RECORD_ID() = '${mid}'`).join(',')})`,
          }).catch(() => [])
        : Promise.resolve([]),
    ]);

    // Build treatment history
    const treatmentHistory: TreatmentRecord[] = appointments
      .filter(a => a.fields['Date'] && a.fields['Service Name'])
      .map(a => ({
        service: a.fields['Service Name'],
        category: a.fields['Service Category'] || '',
        date: a.fields['Date'],
        amountPaid: a.fields['Amount Paid'] || 0,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    // Average spend
    const totalSpend = transactions.reduce((s, t) => s + (t.fields['Amount'] || 0), 0);
    const avgSpend = transactions.length > 0 ? totalSpend / transactions.length : 0;

    // Days since last visit
    const lastDate = treatmentHistory[0]?.date;
    const daysSinceLastVisit = lastDate
      ? Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Active membership
    const activeMembership = memberships.find(m => m.fields['Status'] === 'Active');

    const result = recommendNextTreatment({
      treatmentHistory,
      membershipTier: activeMembership?.fields['Tier'],
      avgSpend,
      daysSinceLastVisit,
    });

    cache.set(cacheKey, result, TTL.RELAXED);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
