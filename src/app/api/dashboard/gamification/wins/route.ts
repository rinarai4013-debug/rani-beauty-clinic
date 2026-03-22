import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import type { WinToday } from '@/types/gamification';

interface TransactionFields {
  'Date': string;
  'Type': string;
  'Amount': number;
  'Status': string;
  'Created': string;
}

interface AppointmentFields {
  'Date': string;
  'Status': string;
  'Is Consult': boolean;
  'Consult Outcome': string;
  'Created': string;
  'Client Name': string;
  'Service Name': string;
}

interface ReviewFields {
  'Date': string;
  'Rating': number;
  'Client Name': string;
  'Created': string;
}

interface ClientFields {
  'First Name': string;
  'Last Name': string;
  'Status': string;
  'Created': string;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'view_executive')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cached = cache.get<{ wins: WinToday[] }>('gamification-wins');
    if (cached) {
      return NextResponse.json(cached);
    }

    const today = new Date().toISOString().split('T')[0];

    const [todayTxns, todayAppts, todayReviews, todayLeads] = await Promise.all([
      fetchAll<TransactionFields>(Tables.transactions(), {
        filterByFormula: `AND({Date} = '${today}', {Type} = 'Service', {Status} = 'Completed')`,
      }),
      fetchAll<AppointmentFields>(Tables.appointments(), {
        filterByFormula: `{Date} = '${today}'`,
      }),
      fetchAll<ReviewFields>(Tables.reviews(), {
        filterByFormula: `{Date} = '${today}'`,
      }),
      fetchAll<ClientFields>(Tables.clients(), {
        filterByFormula: `AND({Status} = 'Lead', IS_SAME({Created}, TODAY(), 'day'))`,
      }, true),
    ]);

    const wins: WinToday[] = [];

    // Revenue win
    const totalRevenue = todayTxns.reduce((sum, t) => sum + (t.fields['Amount'] || 0), 0);
    if (totalRevenue > 0) {
      wins.push({
        id: 'rev-today',
        type: 'revenue',
        label: `$${totalRevenue.toLocaleString()} collected`,
        emoji: '\uD83D\uDCB0',
        timestamp: formatTime(todayTxns[todayTxns.length - 1]?.fields['Created']),
      });
    }

    // Bookings win
    const newBookings = todayAppts.filter(
      (a) => a.fields['Status'] === 'scheduled' || a.fields['Status'] === 'confirmed'
    );
    if (newBookings.length > 0) {
      wins.push({
        id: 'book-today',
        type: 'booking',
        label: `${newBookings.length} new booking${newBookings.length !== 1 ? 's' : ''}`,
        emoji: '\uD83D\uDCC5',
        timestamp: formatTime(newBookings[newBookings.length - 1]?.fields['Created']),
      });
    }

    // Completed treatments
    const completed = todayAppts.filter((a) => a.fields['Status'] === 'completed');
    if (completed.length > 0) {
      wins.push({
        id: 'treat-today',
        type: 'treatment',
        label: `${completed.length} treatment${completed.length !== 1 ? 's' : ''} completed`,
        emoji: '\u2728',
        timestamp: formatTime(completed[completed.length - 1]?.fields['Created']),
      });
    }

    // Reviews win
    for (const review of todayReviews) {
      const rating = review.fields['Rating'] || 5;
      const clientName = review.fields['Client Name'] || 'a client';
      wins.push({
        id: `review-${review.id}`,
        type: 'review',
        label: `${'⭐'.repeat(Math.min(rating, 5))} review from ${clientName}`,
        emoji: '\u2B50',
        timestamp: formatTime(review.fields['Created']),
      });
    }

    // New leads
    if (todayLeads.length > 0) {
      for (const lead of todayLeads.slice(0, 3)) {
        const name = [lead.fields['First Name'], lead.fields['Last Name']].filter(Boolean).join(' ') || 'Unknown';
        wins.push({
          id: `lead-${lead.id}`,
          type: 'lead',
          label: `New lead: ${name}`,
          emoji: '\uD83D\uDC64',
          timestamp: formatTime(lead.fields['Created']),
        });
      }
    }

    // Consult wins
    const closedConsults = todayAppts.filter(
      (a) => a.fields['Is Consult'] && (a.fields['Consult Outcome'] === 'Booked' || a.fields['Consult Outcome'] === 'Closed')
    );
    if (closedConsults.length > 0) {
      wins.push({
        id: 'consult-today',
        type: 'consult',
        label: `${closedConsults.length} consult${closedConsults.length !== 1 ? 's' : ''} closed`,
        emoji: '\uD83C\uDFAF',
        timestamp: formatTime(closedConsults[closedConsults.length - 1]?.fields['Created']),
      });
    }

    // Sort by timestamp (most recent first, fallback for missing timestamps)
    wins.sort((a, b) => {
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return b.timestamp.localeCompare(a.timestamp);
    });

    const result = { wins };
    cache.set('gamification-wins', result, TTL.REALTIME);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching daily wins:', error);
    return NextResponse.json({ error: 'Failed to fetch wins' }, { status: 500 });
  }
}

function formatTime(isoString?: string): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return '';
  }
}
