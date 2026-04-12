import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, rateLimitedQuery, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import { predictChurn, ChurnInput } from '@/lib/churn/engine';
import { logPhiAccessFromRequest } from '@/lib/compliance/phi-logger';
import { withSentry } from '@/lib/sentry-utils';

interface TransactionFields {
  'Date': string;
  'Amount': number;
  'Status': string;
}

interface AppointmentFields {
  'Date': string;
  'Status': string;
  'Service Name': string;
}

interface MembershipFields {
  'Tier': string;
  'Status': string;
}

interface MessageFields {
  'Date': string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withSentry('dashboard/clients/[id]/churn', async () => {
    try {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!hasPermission(session.role, 'view_clients')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { id } = await params;

      // Check cache first (5 min TTL — matches SWR hook)
      const cacheKey = `client-churn-${id}`;
      const cached = cache.get<unknown>(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }

      // 1. Fetch client record to get linked record IDs
      const record = await rateLimitedQuery(() => Tables.clients().find(id));
      const clientName = (record.fields['Client'] as string) || 'Unknown';
      const status = (record.fields['Status'] as string) || '';

      // HIPAA §164.312(b): log the PHI access. Churn scoring reads the
      // full client profile + appointment + transaction + membership +
      // message history, which is a broad treatment-records scope.
      logPhiAccessFromRequest(request, session, {
        patientId: record.id,
        patientName: clientName,
        action: 'view',
        dataCategory: 'treatment_records',
        details: 'Churn prediction — visit history, transactions, memberships, messages',
      });

      const appointmentIds = (record.fields['Appointments'] as string[]) || [];
      const transactionIds = (record.fields['Transactions'] as string[]) || [];
      const membershipIds = (record.fields['Memberships'] as string[]) || [];
      const messageIds = (record.fields['Messages Log'] as string[]) || [];

      // 2. Fetch linked records in parallel
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      const twelveMonthsAgoISO = twelveMonthsAgo.toISOString().split('T')[0];

      const [appointments, transactions, memberships, messages] = await Promise.all([
        appointmentIds.length > 0
          ? fetchAll<AppointmentFields>(Tables.appointments(), {
              filterByFormula: `AND(OR(${appointmentIds.map(aid => `RECORD_ID() = '${aid}'`).join(',')}), IS_AFTER({Date}, '${twelveMonthsAgoISO}'))`,
            }).catch(() => [])
          : Promise.resolve([]),
        transactionIds.length > 0
          ? fetchAll<TransactionFields>(Tables.transactions(), {
              filterByFormula: `AND(OR(${transactionIds.map(tid => `RECORD_ID() = '${tid}'`).join(',')}), IS_AFTER({Date}, '${twelveMonthsAgoISO}'))`,
            }).catch(() => [])
          : Promise.resolve([]),
        membershipIds.length > 0
          ? fetchAll<MembershipFields>(Tables.memberships(), {
              filterByFormula: `OR(${membershipIds.map(mid => `RECORD_ID() = '${mid}'`).join(',')})`,
            }).catch(() => [])
          : Promise.resolve([]),
        messageIds.length > 0
          ? fetchAll<MessageFields>(Tables.messagesLog(), {
              filterByFormula: `OR(${messageIds.map(mid => `RECORD_ID() = '${mid}'`).join(',')})`,
            }).catch(() => [])
          : Promise.resolve([]),
      ]);

      // 3. Transform data into the shape predictChurn() expects

      // Sort appointments by date descending to find last visit
      const completedAppts = appointments
        .filter(a => a.fields['Date'])
        .sort((a, b) => (b.fields['Date'] || '').localeCompare(a.fields['Date'] || ''));

      const lastVisitDate = completedAppts[0]?.fields['Date'] || '';
      const daysSinceLastVisit = lastVisitDate
        ? Math.floor((Date.now() - new Date(lastVisitDate).getTime()) / (1000 * 60 * 60 * 24))
        : 365; // Default to high risk if no visits found

      // Visit dates sorted newest first
      const visitDates = completedAppts.map(a => a.fields['Date']).filter(Boolean) as string[];

      // Transaction amounts sorted newest first (matching visit date order)
      const sortedTransactions = [...transactions]
        .filter(t => t.fields['Date'] && t.fields['Amount'])
        .sort((a, b) => (b.fields['Date'] || '').localeCompare(a.fields['Date'] || ''));
      const transactionAmounts = sortedTransactions.map(t => t.fields['Amount'] || 0);

      // Membership status
      const activeMembership = memberships.find(m => m.fields['Status'] === 'Active');
      const hasMembership = !!activeMembership;
      const membershipTier = activeMembership?.fields['Tier'] || undefined;

      // Message engagement
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const totalMessages = messages.length;
      const recentMessageCount = messages.filter(m => {
        const d = m.fields['Date'];
        return d && new Date(d).getTime() > thirtyDaysAgo;
      }).length;

      // 4. Build input and run prediction
      const churnInput: ChurnInput = {
        daysSinceLastVisit,
        visitDates,
        transactionAmounts,
        hasMembership,
        membershipTier,
        totalMessages,
        recentMessageCount,
        status,
      };

      const prediction = predictChurn(churnInput);

      const result = {
        clientId: id,
        clientName,
        ...prediction,
        computedAt: new Date().toISOString(),
      };

      cache.set(cacheKey, result, TTL.RELAXED);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Error computing churn prediction:', error);
      return NextResponse.json({ error: 'Failed to compute churn prediction' }, { status: 500 });
    }
  });
}
