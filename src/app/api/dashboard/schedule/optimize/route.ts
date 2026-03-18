import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import { optimizeSchedule, type ScheduleInput, type AppointmentData } from '@/lib/schedule/optimizer';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const now = new Date();
    const sevenDaysOut = new Date(now.getTime() + 7 * 86400000);
    const todayStr = now.toISOString().slice(0, 10);
    const endStr = sevenDaysOut.toISOString().slice(0, 10);

    // Query Appointments table for next 7 days
    let appointmentRecords: { id: string; fields: Record<string, unknown> }[] = [];
    try {
      appointmentRecords = await fetchAll(
        Tables.appointments(),
        {
          filterByFormula: `AND(
            IS_AFTER({${FIELDS.appointments.date}}, DATEADD(TODAY(), -1, 'days')),
            IS_BEFORE({${FIELDS.appointments.date}}, '${endStr}'),
            {${FIELDS.appointments.status}} != 'Cancelled'
          )`,
        }
      );
    } catch (err) {
      console.error('Error fetching appointments for schedule optimizer:', err);
    }

    // Map appointment records to the engine's AppointmentData format
    const appointments: AppointmentData[] = appointmentRecords.map(rec => {
      const dateStr = (rec.fields[FIELDS.appointments.date] as string) || todayStr;
      const timeStr = (rec.fields[FIELDS.appointments.time] as string) || '10:00';
      const duration = Number(rec.fields[FIELDS.appointments.duration]) || 60;
      const service = (rec.fields[FIELDS.appointments.service] as string) || 'Service';
      const provider = (rec.fields[FIELDS.appointments.provider] as string) || 'Mom';
      const amountQuoted = Number(rec.fields[FIELDS.appointments.amountQuoted]) || 0;
      const amountPaid = Number(rec.fields[FIELDS.appointments.amountPaid]) || 0;
      const status = ((rec.fields[FIELDS.appointments.status] as string) || 'confirmed').toLowerCase();

      // Calculate end time from start time + duration
      const [hours, minutes] = timeStr.split(':').map(Number);
      const startMinutes = (hours || 10) * 60 + (minutes || 0);
      const endMinutes = startMinutes + duration;
      const endHour = Math.floor(endMinutes / 60);
      const endMin = endMinutes % 60;
      const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

      // Map Airtable status to engine status
      let mappedStatus: AppointmentData['status'] = 'confirmed';
      if (status.includes('complete')) mappedStatus = 'completed';
      else if (status.includes('cancel')) mappedStatus = 'cancelled';
      else if (status.includes('no-show') || status.includes('no show')) mappedStatus = 'no-show';
      else if (status.includes('check')) mappedStatus = 'checked-in';
      else if (status.includes('tentative')) mappedStatus = 'tentative';

      return {
        id: rec.id,
        date: dateStr.slice(0, 10),
        startTime: timeStr,
        endTime,
        service,
        provider,
        clientName: 'Client', // Client name is on linked record
        clientType: 'returning' as const,
        estimatedRevenue: amountQuoted || amountPaid || estimateServiceRevenue(service),
        status: mappedStatus,
      };
    });

    // If no appointments exist, return a meaningful response
    if (appointments.length === 0) {
      const emptyInput: ScheduleInput = {
        appointments: [],
        providers: getProviderConfig(),
        rooms: getRoomConfig(),
        historicalPatterns: [],
        serviceConfig: getServiceConfig(),
        dateRange: { start: todayStr, end: endStr },
      };

      const result = optimizeSchedule(emptyInput);

      return NextResponse.json({
        success: true,
        data: result,
        message: 'No appointments found for the next 7 days. Schedule is wide open for bookings.',
        generatedAt: new Date().toISOString(),
      });
    }

    const scheduleInput: ScheduleInput = {
      appointments,
      providers: getProviderConfig(),
      rooms: getRoomConfig(),
      historicalPatterns: [],
      serviceConfig: getServiceConfig(),
      dateRange: { start: todayStr, end: endStr },
    };

    const result = optimizeSchedule(scheduleInput);

    return NextResponse.json({
      success: true,
      data: result,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Schedule optimization error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to optimize schedule' },
      { status: 500 }
    );
  }
}

/** Provider configuration (static for Rani) */
function getProviderConfig() {
  return [
    {
      name: 'Mom',
      role: 'provider' as const,
      workingDays: [1, 2, 3, 4, 5, 6],
      startTime: '10:00',
      endTime: '19:00',
      services: ['HydraFacial', 'VI Peel', 'RF Microneedling', 'Laser Hair Removal', 'Botox', 'Fillers', 'GLP-1', 'NAD+', 'B12', 'Sofwave', 'PRX-T33', 'PicoWay'],
      maxDailyAppointments: 12,
      preferredBreakTime: '13:00',
    },
  ];
}

/** Room configuration (static for Rani) */
function getRoomConfig() {
  return [
    { name: 'Treatment Room 1', equipment: ['HydraFacial Syndeo', 'GentleMax Pro Plus'], suitableServices: ['HydraFacial', 'Laser Hair Removal'] },
    { name: 'Treatment Room 2', equipment: ['Cutera Secret Pro', 'Sofwave'], suitableServices: ['RF Microneedling', 'Sofwave'] },
    { name: 'Consultation Room', equipment: [], suitableServices: ['Consultation', 'Botox', 'Fillers', 'Injections'] },
  ];
}

/** Service schedule config (static for Rani) */
function getServiceConfig() {
  return [
    { service: 'HydraFacial', duration: 60, setupTime: 15, revenue: 275, revenuePerMinute: 4.58 },
    { service: 'VI Peel', duration: 30, setupTime: 10, revenue: 395, revenuePerMinute: 13.17 },
    { service: 'RF Microneedling', duration: 60, setupTime: 15, revenue: 495, revenuePerMinute: 8.25 },
    { service: 'Botox', duration: 30, setupTime: 10, revenue: 400, revenuePerMinute: 13.33 },
    { service: 'Laser Hair Removal', duration: 25, setupTime: 10, revenue: 225, revenuePerMinute: 9.00 },
    { service: 'Sofwave', duration: 45, setupTime: 15, revenue: 2750, revenuePerMinute: 61.11 },
    { service: 'GLP-1', duration: 15, setupTime: 5, revenue: 499, revenuePerMinute: 33.27 },
    { service: 'Consultation', duration: 30, setupTime: 5, revenue: 0, revenuePerMinute: 0 },
    { service: 'PRX-T33', duration: 30, setupTime: 10, revenue: 495, revenuePerMinute: 16.50 },
    { service: 'PicoWay', duration: 30, setupTime: 10, revenue: 475, revenuePerMinute: 15.83 },
    { service: 'NAD+ Injection', duration: 10, setupTime: 5, revenue: 150, revenuePerMinute: 15.00 },
    { service: 'B12 Injection', duration: 5, setupTime: 5, revenue: 35, revenuePerMinute: 7.00 },
  ];
}

/** Estimate service revenue from service name */
function estimateServiceRevenue(service: string): number {
  const prices: Record<string, number> = {
    'HydraFacial': 275, 'VI Peel': 395, 'RF Microneedling': 495,
    'Botox': 400, 'Laser Hair Removal': 225, 'Sofwave': 2750,
    'GLP-1': 499, 'NAD+ Injection': 150, 'B12 Injection': 35,
    'PRX-T33': 495, 'PicoWay': 475, 'Fillers': 600, 'Consultation': 0,
  };
  return prices[service] || 200;
}
