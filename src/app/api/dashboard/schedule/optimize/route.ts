import { NextResponse } from 'next/server';
import { optimizeSchedule, type ScheduleInput } from '@/lib/schedule/optimizer';

export async function GET() {
  try {
    // In production, pulls from Airtable Appointments + Mangomint
    const now = new Date();
    const sevenDaysOut = new Date(now.getTime() + 7 * 86400000);

    const sampleInput: ScheduleInput = {
      appointments: [],
      providers: [
        {
          name: 'Mom',
          role: 'provider',
          workingDays: [1, 2, 3, 4, 5, 6],
          startTime: '10:00',
          endTime: '19:00',
          services: ['HydraFacial', 'VI Peel', 'RF Microneedling', 'Laser Hair Removal', 'Botox', 'Fillers', 'GLP-1', 'NAD+', 'B12'],
          maxDailyAppointments: 12,
          preferredBreakTime: '13:00',
        },
      ],
      rooms: [
        { name: 'Treatment Room 1', equipment: ['HydraFacial Syndeo', 'GentleMax Pro Plus'], suitableServices: ['HydraFacial', 'Laser Hair Removal'] },
        { name: 'Treatment Room 2', equipment: ['Cutera Secret Pro', 'Sofwave'], suitableServices: ['RF Microneedling', 'Sofwave'] },
        { name: 'Consultation Room', equipment: [], suitableServices: ['Consultation', 'Botox', 'Fillers', 'Injections'] },
      ],
      historicalPatterns: [],
      serviceConfig: [
        { service: 'HydraFacial', duration: 60, setupTime: 15, revenue: 225, revenuePerMinute: 3.75 },
        { service: 'VI Peel', duration: 30, setupTime: 10, revenue: 325, revenuePerMinute: 10.83 },
        { service: 'RF Microneedling', duration: 60, setupTime: 15, revenue: 495, revenuePerMinute: 8.25 },
        { service: 'Botox', duration: 30, setupTime: 10, revenue: 400, revenuePerMinute: 13.33 },
        { service: 'Laser Hair Removal', duration: 25, setupTime: 10, revenue: 225, revenuePerMinute: 9.00 },
        { service: 'Sofwave', duration: 45, setupTime: 15, revenue: 2750, revenuePerMinute: 61.11 },
        { service: 'GLP-1', duration: 15, setupTime: 5, revenue: 499, revenuePerMinute: 33.27 },
        { service: 'Consultation', duration: 30, setupTime: 5, revenue: 0, revenuePerMinute: 0 },
      ],
      dateRange: {
        start: now.toISOString().slice(0, 10),
        end: sevenDaysOut.toISOString().slice(0, 10),
      },
    };

    const result = optimizeSchedule(sampleInput);

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
