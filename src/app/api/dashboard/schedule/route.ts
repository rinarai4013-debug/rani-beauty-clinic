import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import { logPhiAccessFromRequest } from '@/lib/compliance/phi-logger';
import { withSentry } from '@/lib/sentry-utils';
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
  'Consult Type': string;
  'Deposit Amount': number;
  'Deposit Paid': boolean;
  'Amount Quoted': number;
  'Amount Paid': number;
  'Booking Source': string;
}

const HOURS_PER_PROVIDER = 8;

export async function GET(request: NextRequest) {
  return withSentry('dashboard/schedule', async () => {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!hasPermission(session.role, 'view_schedule')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cacheKey = 'schedule-today';
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    try {
      const todayAppointments = await fetchAll<AppointmentFields>(
        Tables.appointments(),
        {
          filterByFormula: `{Date} = TODAY()`,
          sort: [{ field: 'Time', direction: 'asc' }],
        }
      );

    // Map to AppointmentItem shape
    const today: AppointmentItem[] = todayAppointments.map((a) => {
      const bookingSource = a.fields['Booking Source'] || '';
      const isNewClient = bookingSource.toLowerCase().includes('new') ||
        bookingSource.toLowerCase().includes('first');

      return {
        id: a.id,
        clientName: 'Walk-in', // Default; linked Client record name would come from Airtable lookup
        service: a.fields['Service Name'] || 'Unknown Service',
        category: a.fields['Service Category'] || 'Other',
        provider: a.fields['Provider'] || 'Unassigned',
        room: '', // Room data would come from a linked field if available
        time: a.fields['Time'] || '',
        duration: a.fields['Duration'] || 60,
        status: (a.fields['Status'] as AppointmentItem['status']) || 'scheduled',
        revenue: a.fields['Amount Paid'] || a.fields['Amount Quoted'] || 0,
        isConsult: a.fields['Is Consult'] || false,
        isNewClient,
        depositPaid: a.fields['Deposit Paid'] || false,
      };
    });

    // --- Utilization calculation ---
    const providerMap = new Map<string, number>();
    for (const appt of today) {
      const provider = appt.provider;
      if (provider && provider !== 'Unassigned') {
        providerMap.set(
          provider,
          (providerMap.get(provider) || 0) + (appt.duration / 60)
        );
      }
    }

    const providers = Array.from(providerMap.entries());
    const totalAvailableHours = Math.max(providers.length, 1) * HOURS_PER_PROVIDER;
    const totalBookedHours = providers.reduce((sum, [, hours]) => sum + hours, 0);
    const totalUtilization = Math.round((totalBookedHours / totalAvailableHours) * 100);

    const byProvider = providers.map(([provider, hours]) => ({
      provider,
      rate: Math.round((hours / HOURS_PER_PROVIDER) * 100),
    }));

    // --- Stats ---
    const noShows = today.filter((a) => a.status === 'no_show').length;
    const cancellations = today.filter((a) => a.status === 'cancelled').length;
    const filledSlots = today.filter(
      (a) => a.status !== 'cancelled' && a.status !== 'no_show'
    ).length;
    const totalSlots = today.length;
    const openSlots = Math.max(0, Math.round(totalAvailableHours * 2) - filledSlots); // Assume ~30min avg slot

    const data = {
      today,
      utilization: {
        total: totalUtilization,
        byProvider,
      },
      stats: {
        totalSlots,
        filledSlots,
        openSlots,
        noShows,
        cancellations,
      },
    };

      cache.set(cacheKey, data, TTL.REALTIME);

    // HIPAA §164.312(b): today's schedule exposes appointment metadata
    // for every client seen today. Aggregate log entry — the Client
    // names aren't included in the response payload yet (they default
    // to 'Walk-in' due to a pending linked-record lookup), but this
    // gets the audit trail in place for when the lookup is wired.
      logPhiAccessFromRequest(request, session, {
        patientId: '__LIST__',
        patientName: `Today's schedule (${today.length} appointments)`,
        action: 'view',
        dataCategory: 'treatment_records',
        details: `Schedule view — ${filledSlots} filled, ${noShows} no-shows, ${cancellations} cancelled`,
      });

      return NextResponse.json(data);
    } catch (error) {
      console.error('Schedule route error:', error);
      return NextResponse.json({ error: 'Failed to fetch schedule data' }, { status: 500 });
    }
  });
}
