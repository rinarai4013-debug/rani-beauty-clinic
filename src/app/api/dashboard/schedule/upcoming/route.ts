import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import type { AppointmentItem } from '@/types/dashboard';

interface AppointmentFields {
  'Service Name': string;
  'Service Category': string;
  'Provider': string;
  'Date': string;
  'Time': string;
  'Duration': number;
  'Status': string;
  'Is Consult': boolean;
  'Deposit Paid': boolean;
  'Amount Quoted': number;
  'Amount Paid': number;
  'Booking Source': string;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!hasPermission(session.role, 'view_schedule')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cacheKey = 'schedule-upcoming';
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const upcomingAppointments = await fetchAll<AppointmentFields>(
      Tables.appointments(),
      {
        filterByFormula: `AND({Date} >= TODAY(), {Date} <= DATEADD(TODAY(), 7, 'days'))`,
        sort: [
          { field: 'Date', direction: 'asc' },
          { field: 'Time', direction: 'asc' },
        ],
      }
    );

    // Map to AppointmentItem shape
    const upcoming: AppointmentItem[] = upcomingAppointments.map((a) => {
      const bookingSource = a.fields['Booking Source'] || '';
      const isNewClient = bookingSource.toLowerCase().includes('new') ||
        bookingSource.toLowerCase().includes('first');

      return {
        id: a.id,
        clientName: 'Walk-in',
        service: a.fields['Service Name'] || 'Unknown Service',
        category: a.fields['Service Category'] || 'Other',
        provider: a.fields['Provider'] || 'Unassigned',
        room: '',
        time: a.fields['Time'] || '',
        duration: a.fields['Duration'] || 60,
        status: (a.fields['Status'] as AppointmentItem['status']) || 'scheduled',
        revenue: a.fields['Amount Paid'] || a.fields['Amount Quoted'] || 0,
        isConsult: a.fields['Is Consult'] || false,
        isNewClient,
        depositPaid: a.fields['Deposit Paid'] || false,
      };
    });

    // Group by date
    const byDate: Record<string, number> = {};
    for (const appt of upcomingAppointments) {
      const date = appt.fields['Date'] || '';
      if (date) {
        byDate[date] = (byDate[date] || 0) + 1;
      }
    }

    const data = {
      upcoming,
      byDate,
    };

    cache.set(cacheKey, data, TTL.REALTIME);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Schedule upcoming route error:', error);
    return NextResponse.json({ error: 'Failed to fetch upcoming schedule' }, { status: 500 });
  }
}
