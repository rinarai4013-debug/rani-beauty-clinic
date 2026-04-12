import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import { optimizeSchedule, type ScheduleInput, type AppointmentData } from '@/lib/schedule/optimizer';
import { withSentry } from '@/lib/sentry-utils';

/**
 * GET /api/dashboard/schedule/optimize
 *
 * Returns schedule optimization analysis: gaps, conflicts, opportunities.
 * Engine: src/lib/schedule/optimizer.ts — optimizeSchedule()
 * Agent: Operations Director
 *
 * Queries: Appointments table for today's schedule + builds provider data.
 */

interface AppointmentFields {
  'Date': string;
  'Start Time': string;
  'End Time': string;
  'Service Name': string;
  'Provider': string;
  'Client': string;
  'Status': string;
  'Room': string;
}

export async function GET() {
  return withSentry('dashboard/schedule/optimize', async () => {
    try {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!hasPermission(session.role, 'view_schedule')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

    const cacheKey = 'schedule-optimization';
    const cached = cache.get<unknown>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const today = new Date().toISOString().split('T')[0];

    const appointments = await fetchAll<AppointmentFields>(Tables.appointments(), {
      filterByFormula: `{Date} = '${today}'`,
      sort: [{ field: 'Start Time', direction: 'asc' }],
    }).catch(() => []);

    if (appointments.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No appointments found for today.',
        generatedAt: new Date().toISOString(),
      });
    }

    // Transform Airtable records into engine format
    const appointmentData: AppointmentData[] = appointments
      .filter(a => a.fields['Start Time'] && a.fields['End Time'])
      .map(a => ({
        id: a.id,
        date: a.fields['Date'] || today,
        startTime: a.fields['Start Time'] || '09:00',
        endTime: a.fields['End Time'] || '10:00',
        service: a.fields['Service Name'] || 'Unknown',
        provider: a.fields['Provider'] || 'Unknown',
        clientName: a.fields['Client'] || 'Unknown',
        clientType: 'returning' as const,
        estimatedRevenue: 0,
        status: (a.fields['Status'] === 'Scheduled' ? 'confirmed' : a.fields['Status']?.toLowerCase() || 'confirmed') as AppointmentData['status'],
        room: a.fields['Room'] || undefined,
      }));

    // Extract unique providers for availability config
    const uniqueProviders = [...new Set(appointmentData.map(a => a.provider))];

    const scheduleInput: ScheduleInput = {
      appointments: appointmentData,
      providers: uniqueProviders.map(name => ({
        name,
        role: 'provider' as const,
        workingDays: [1, 2, 3, 4, 5], // Mon-Fri default
        startTime: '09:00',
        endTime: '18:00',
        services: [],
        maxDailyAppointments: 10,
        preferredBreakTime: '12:00',
      })),
      rooms: [
        { name: 'Treatment Room 1', equipment: ['laser', 'hydrafacial'], suitableServices: [] },
        { name: 'Treatment Room 2', equipment: ['rf-microneedling'], suitableServices: [] },
        { name: 'Consultation Room', equipment: [], suitableServices: [] },
      ],
      historicalPatterns: [], // Future: aggregate from past data
      serviceConfig: [], // Future: map from service catalog
      dateRange: { start: today, end: today },
    };

    const optimization = optimizeSchedule(scheduleInput);

    const result = {
      success: true,
      data: optimization,
      generatedAt: new Date().toISOString(),
    };

      cache.set(cacheKey, result, TTL.STANDARD);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Schedule optimization error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to optimize schedule' },
        { status: 500 }
      );
    }
  });
}
