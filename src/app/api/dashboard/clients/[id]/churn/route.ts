import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, rateLimitedQuery, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import { predictChurn } from '@/lib/churn/engine';

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
    const cacheKey = `churn-${id}`;
    const cached = cache.get<unknown>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch client record
    const record = await rateLimitedQuery(() => Tables.clients().find(id));
    const appointmentIds = (record.fields['Appointments'] as string[]) || [];
    const transactionIds = (record.fields['Transactions'] as string[]) || [];
    const membershipIds = (record.fields['Memberships'] as string[]) || [];
    const messageIds = (record.fields['Messages Log'] as string[]) || [];

    // Fetch related data in parallel
    const [appointments, transactions, memberships, messages] = await Promise.all([
      appointmentIds.length > 0
        ? fetchAll<{ Date: string; Status: string }>(Tables.appointments(), {
            filterByFormula: `OR(${appointmentIds.slice(0, 50).map(aid => `RECORD_ID() = '${aid}'`).join(',')})`,
          }).catch(() => [])
        : Promise.resolve([]),
      transactionIds.length > 0
        ? fetchAll<{ Date: string; Amount: number }>(Tables.transactions(), {
            filterByFormula: `OR(${transactionIds.slice(0, 50).map(tid => `RECORD_ID() = '${tid}'`).join(',')})`,
          }).catch(() => [])
        : Promise.resolve([]),
      membershipIds.length > 0
        ? fetchAll<{ Status: string; Tier: string }>(Tables.memberships(), {
            filterByFormula: `OR(${membershipIds.map(mid => `RECORD_ID() = '${mid}'`).join(',')})`,
          }).catch(() => [])
        : Promise.resolve([]),
      messageIds.length > 0
        ? fetchAll<{ Date: string }>(Tables.messagesLog(), {
            filterByFormula: `OR(${messageIds.slice(0, 50).map(mid => `RECORD_ID() = '${mid}'`).join(',')})`,
          }).catch(() => [])
        : Promise.resolve([]),
    ]);

    // Build churn input
    const visitDates = appointments
      .filter(a => a.fields['Date'])
      .map(a => a.fields['Date'])
      .sort((a, b) => b.localeCompare(a));

    const lastVisitDate = visitDates[0] || '';
    const daysSinceLastVisit = lastVisitDate
      ? Math.floor((Date.now() - new Date(lastVisitDate).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const transactionAmounts = transactions
      .filter(t => t.fields['Amount'])
      .sort((a, b) => (b.fields['Date'] || '').localeCompare(a.fields['Date'] || ''))
      .map(t => t.fields['Amount']);

    const activeMembership = memberships.find(m => m.fields['Status'] === 'Active');

    // Recent messages (last 30 days) — count from actual message records
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const recentMessageCount = messages.filter(m => {
      const msgDate = m.fields['Date'] || '';
      return msgDate >= thirtyDaysAgo;
    }).length;

    const churnScore = predictChurn({
      daysSinceLastVisit,
      visitDates,
      transactionAmounts,
      hasMembership: !!activeMembership,
      membershipTier: activeMembership?.fields['Tier'],
      totalMessages: messageIds.length,
      recentMessageCount,
      status: (record.fields['Status'] as string) || '',
    });

    cache.set(cacheKey, churnScore, TTL.RELAXED);
    return NextResponse.json(churnScore);
  } catch (error) {
    console.error('Error calculating churn score:', error);
    return NextResponse.json({ error: 'Failed to calculate churn score' }, { status: 500 });
  }
}
