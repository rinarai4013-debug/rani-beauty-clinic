import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchFirst } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import type { ActivityItem } from '@/types/dashboard';

interface TransactionFields {
  'Date': string;
  'Type': string;
  'Amount': number;
  'Payment Method': string;
  'Provider': string;
  'Service Name': string;
  'Status': string;
}

interface AppointmentFields {
  'Service Name': string;
  'Provider': string;
  'Date': string;
  'Time': string;
  'Status': string;
  'Booking Source': string;
}

interface ClientFields {
  'Client': string;
  'Status': string;
  'Email': string;
  'Phone': string;
}

interface ReviewFields {
  'Platform': string;
  'Star Rating': number;
  'Review Text': string;
  'Reviewer Name': string;
  'Review Date': string;
  'Sentiment': string;
}

interface AlertFields {
  'Type': string;
  'Severity': string;
  'Message': string;
  'Status': string;
  'Created Date': string;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!hasPermission(session.role, 'view_executive')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cacheKey = 'dashboard-activity';
  const cached = cache.get<{ activities: ActivityItem[] }>(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const [recentTransactions, recentAppointments, recentClients, recentReviews, recentAlerts] =
      await Promise.all([
        // Recent payments
        fetchFirst<TransactionFields>(Tables.transactions(), 5, {
          sort: [{ field: 'Date', direction: 'desc' }],
          filterByFormula: `{Status} = "Completed"`,
        }),
        // Recent bookings (exclude cancelled)
        fetchFirst<AppointmentFields>(Tables.appointments(), 5, {
          sort: [{ field: 'Date', direction: 'desc' }],
          filterByFormula: `{Status} != "Cancelled"`,
        }),
        // Recent new leads
        fetchFirst<ClientFields>(Tables.clients(), 5, {
          sort: [{ field: 'Created Date', direction: 'desc' }],
          filterByFormula: `{Status} = "New Lead"`,
        }, true),
        // Recent reviews
        fetchFirst<ReviewFields>(Tables.reviews(), 5, {
          sort: [{ field: 'Review Date', direction: 'desc' }],
        }),
        // Recent alerts
        fetchFirst<AlertFields>(Tables.alerts(), 5, {
          sort: [{ field: 'Created Date', direction: 'desc' }],
        }),
      ]);

    const activities: ActivityItem[] = [];

    // Map transactions → payment activities
    for (const t of recentTransactions) {
      const f = t.fields;
      activities.push({
        id: t.id,
        type: 'payment',
        title: 'Payment received',
        description: `${f['Provider'] || 'Unknown'} — ${f['Service Name'] || 'Service'} — $${f['Amount'] || 0}`,
        timestamp: f['Date'] ? new Date(f['Date']).toISOString() : new Date().toISOString(),
      });
    }

    // Map appointments → booking activities
    for (const a of recentAppointments) {
      const f = a.fields;
      activities.push({
        id: a.id,
        type: 'booking',
        title: 'New booking',
        description: `${f['Service Name'] || 'Appointment'} — ${f['Date'] || ''} ${f['Time'] || ''}`.trim(),
        timestamp: f['Date'] ? new Date(f['Date']).toISOString() : new Date().toISOString(),
      });
    }

    // Map clients → lead activities
    for (const c of recentClients) {
      const f = c.fields;
      activities.push({
        id: c.id,
        type: 'lead',
        title: 'New lead',
        description: f['Client'] || 'Unknown client',
        timestamp: new Date().toISOString(), // Clients table lacks a date field; use now
      });
    }

    // Map reviews → review activities
    for (const r of recentReviews) {
      const f = r.fields;
      const stars = f['Star Rating'] || 0;
      const reviewer = f['Reviewer Name'] || 'Anonymous';
      const snippet = f['Review Text'] ? f['Review Text'].substring(0, 60) : '';
      activities.push({
        id: r.id,
        type: 'review',
        title: `${stars}-star review`,
        description: `${reviewer}${snippet ? ` — "${snippet}..."` : ''}`,
        timestamp: f['Review Date'] ? new Date(f['Review Date']).toISOString() : new Date().toISOString(),
      });
    }

    // Map alerts → alert activities
    for (const al of recentAlerts) {
      const f = al.fields;
      activities.push({
        id: al.id,
        type: 'alert',
        title: `${f['Severity'] || 'Info'} alert`,
        description: f['Message'] || 'System alert',
        timestamp: f['Created Date'] ? new Date(f['Created Date']).toISOString() : new Date().toISOString(),
      });
    }

    // Sort by timestamp descending and take top 15
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const top15 = activities.slice(0, 15);

    const result = { activities: top15 };
    cache.set(cacheKey, result, TTL.REALTIME);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Activity route error:', error);
    return NextResponse.json({ error: 'Failed to fetch activity data' }, { status: 500 });
  }
}
