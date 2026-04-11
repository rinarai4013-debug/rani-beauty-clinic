import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, rateLimitedQuery, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import { z } from 'zod';

interface AppointmentFields {
  'Service Name': string;
  'Service Category': string;
  'Provider': string;
  'Date': string;
  'Time': string;
  'Duration': number;
  'Status': string;
  'Amount Paid': number;
  'Is Consult': boolean;
}

interface TransactionFields {
  'Date': string;
  'Type': string;
  'Amount': number;
  'Payment Method': string;
  'Service Name': string;
  'Status': string;
}

interface MembershipFields {
  'Tier': string;
  'Monthly Price': number;
  'Status': string;
  'Start Date': string;
  'Churn Risk Score': number;
}

interface MessageFields {
  'Date': string;
  'Channel': string;
  'Direction': string;
  'Subject': string;
  'Body': string;
  'Status': string;
}

interface ReviewFields {
  'Star Rating': number;
  'Review Text': string;
  'Review Date': string;
  'Platform': string;
  'Sentiment': string;
}

const clientQuerySchema = z.object({
  full: z.enum(['true', 'false']).optional(),
});

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
    const { searchParams } = new URL(request.url);
    const parsedQuery = clientQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );
    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }

    const full = parsedQuery.data.full === 'true';

    const cacheKey = full ? `client-full-${id}` : `client-${id}`;
    const cached = cache.get<unknown>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const record = await rateLimitedQuery(() => Tables.clients().find(id));

    const fullName = (record.fields['Client'] as string) || '';
    const nameParts = fullName.split(' ');

    // Linked record IDs from Airtable
    const appointmentIds = (record.fields['Appointments'] as string[]) || [];
    const transactionIds = (record.fields['Transactions'] as string[]) || [];
    const membershipIds = (record.fields['Memberships'] as string[]) || [];
    const messageIds = (record.fields['Messages Log'] as string[]) || [];
    const reviewIds = (record.fields['Reviews'] as string[]) || [];

    const client: Record<string, unknown> = {
      id: record.id,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      name: fullName,
      email: (record.fields['Email'] as string) || '',
      phone: (record.fields['Phone'] as string) || '',
      status: (record.fields['Status'] as string) || '',
      preferredContact: (record.fields['Preferred Contact'] as string) || '',
      source: '',
      tags: '',
      valueSegment: '',
      treatmentTier: '',
      ltv: 0,
      visitCount: appointmentIds.length,
      lastVisitDate: '',
      daysSinceLastVisit: 0,
      membershipTier: '',
      membershipStatus: '',
      riskFlags: '',
      providerMatch: '',
      createdDate: '',
    };

    // If full profile requested, fetch linked records
    if (full) {
      const [appointments, transactions, memberships, messages, reviews] = await Promise.all([
        appointmentIds.length > 0
          ? fetchAll<AppointmentFields>(Tables.appointments(), {
              filterByFormula: `OR(${appointmentIds.map(aid => `RECORD_ID() = '${aid}'`).join(',')})`,
            }).catch(() => [])
          : Promise.resolve([]),
        transactionIds.length > 0
          ? fetchAll<TransactionFields>(Tables.transactions(), {
              filterByFormula: `OR(${transactionIds.map(tid => `RECORD_ID() = '${tid}'`).join(',')})`,
            }).catch(() => [])
          : Promise.resolve([]),
        membershipIds.length > 0
          ? fetchAll<MembershipFields>(Tables.memberships(), {
              filterByFormula: `OR(${membershipIds.map(mid => `RECORD_ID() = '${mid}'`).join(',')})`,
            }).catch(() => [])
          : Promise.resolve([]),
        messageIds.length > 0 && messageIds.length <= 20
          ? fetchAll<MessageFields>(Tables.messagesLog(), {
              filterByFormula: `OR(${messageIds.map(mid => `RECORD_ID() = '${mid}'`).join(',')})`,
            }).catch(() => [])
          : Promise.resolve([]),
        reviewIds.length > 0
          ? fetchAll<ReviewFields>(Tables.reviews(), {
              filterByFormula: `OR(${reviewIds.map(rid => `RECORD_ID() = '${rid}'`).join(',')})`,
            }).catch(() => [])
          : Promise.resolve([]),
      ]);

      // Calculate LTV from transactions
      const ltv = transactions.reduce((sum, t) => sum + (t.fields['Amount'] || 0), 0);

      // Find last visit date
      const sortedAppts = [...appointments]
        .filter(a => a.fields['Status'] === 'completed' || a.fields['Date'])
        .sort((a, b) => (b.fields['Date'] || '').localeCompare(a.fields['Date'] || ''));
      const lastVisitDate = sortedAppts[0]?.fields['Date'] || '';
      const daysSinceLastVisit = lastVisitDate
        ? Math.floor((Date.now() - new Date(lastVisitDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Find active membership
      const activeMembership = memberships.find(m => m.fields['Status'] === 'Active');

      client.ltv = ltv;
      client.visitCount = appointments.length;
      client.lastVisitDate = lastVisitDate;
      client.daysSinceLastVisit = daysSinceLastVisit;
      client.membershipTier = activeMembership?.fields['Tier'] || '';
      client.membershipStatus = activeMembership?.fields['Status'] || '';

      client.appointments = appointments.map(a => ({
        id: a.id,
        service: a.fields['Service Name'] || '',
        category: a.fields['Service Category'] || '',
        provider: a.fields['Provider'] || '',
        date: a.fields['Date'] || '',
        time: a.fields['Time'] || '',
        duration: a.fields['Duration'] || 0,
        status: a.fields['Status'] || '',
        amountPaid: a.fields['Amount Paid'] || 0,
        isConsult: a.fields['Is Consult'] || false,
      })).sort((a, b) => ((b as { date: string }).date).localeCompare((a as { date: string }).date));

      client.transactions = transactions.map(t => ({
        id: t.id,
        date: t.fields['Date'] || '',
        type: t.fields['Type'] || '',
        amount: t.fields['Amount'] || 0,
        paymentMethod: t.fields['Payment Method'] || '',
        service: t.fields['Service Name'] || '',
        status: t.fields['Status'] || '',
      })).sort((a, b) => ((b as { date: string }).date).localeCompare((a as { date: string }).date));

      client.memberships = memberships.map(m => ({
        id: m.id,
        tier: m.fields['Tier'] || '',
        monthlyPrice: m.fields['Monthly Price'] || 0,
        status: m.fields['Status'] || '',
        startDate: m.fields['Start Date'] || '',
        churnRiskScore: m.fields['Churn Risk Score'] || 0,
      }));

      client.messages = messages.map(m => ({
        id: m.id,
        date: m.fields['Date'] || '',
        channel: m.fields['Channel'] || '',
        direction: m.fields['Direction'] || '',
        subject: m.fields['Subject'] || '',
        status: m.fields['Status'] || '',
      })).sort((a, b) => ((b as { date: string }).date).localeCompare((a as { date: string }).date));

      client.reviews = reviews.map(r => ({
        id: r.id,
        rating: r.fields['Star Rating'] || 0,
        text: r.fields['Review Text'] || '',
        date: r.fields['Review Date'] || '',
        platform: r.fields['Platform'] || '',
        sentiment: r.fields['Sentiment'] || '',
      }));
    }

    cache.set(cacheKey, client, TTL.RELAXED);
    return NextResponse.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}
