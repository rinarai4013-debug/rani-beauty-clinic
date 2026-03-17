import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import { quickNoShowScore } from '@/lib/predictions/no-show';

/**
 * GET /api/dashboard/schedule/no-show-risk
 *
 * Scores all upcoming appointments for no-show risk.
 * Returns appointments sorted by risk (highest first).
 *
 * Query params:
 * - date: ISO date string (default: today)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(session.role, 'view_schedule')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const cacheKey = `no-show-risk-${dateParam}`;
    const cached = cache.get<unknown>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch today's appointments
    const appointments = await fetchAll<{
      'Service Name': string;
      'Service Category': string;
      'Provider': string;
      'Date': string;
      'Time': string;
      'Status': string;
      'Deposit Paid': boolean;
      'Deposit Amount': number;
      'Booking Source': string;
      'Is Consult': boolean;
    }>(Tables.appointments(), {
      filterByFormula: `{Date} = '${dateParam}'`,
    });

    // Score each appointment
    const scored = appointments
      .filter(a => {
        const status = a.fields['Status'] || '';
        return status !== 'completed' && status !== 'cancelled' && status !== 'no_show';
      })
      .map(a => {
        const timeStr = a.fields['Time'] || '12:00';
        const [hourStr] = timeStr.split(':');
        const hour = parseInt(hourStr, 10) || 12;
        const apptDate = new Date(a.fields['Date'] || dateParam);
        const dayOfWeek = apptDate.getDay();

        const noShowRisk = quickNoShowScore({
          depositPaid: a.fields['Deposit Paid'] || false,
          depositAmount: a.fields['Deposit Amount'] || 0,
          bookingSource: a.fields['Booking Source'] || 'online',
          dayOfWeek,
          hourOfDay: hour,
          isConsult: a.fields['Is Consult'] || false,
        });

        return {
          id: a.id,
          service: a.fields['Service Name'] || '',
          category: a.fields['Service Category'] || '',
          provider: a.fields['Provider'] || '',
          time: a.fields['Time'] || '',
          status: a.fields['Status'] || '',
          depositPaid: a.fields['Deposit Paid'] || false,
          isConsult: a.fields['Is Consult'] || false,
          noShowRisk,
        };
      })
      .sort((a, b) => b.noShowRisk.score - a.noShowRisk.score);

    const data = {
      date: dateParam,
      appointments: scored,
      summary: {
        total: scored.length,
        highRisk: scored.filter(a => a.noShowRisk.risk === 'high').length,
        moderateRisk: scored.filter(a => a.noShowRisk.risk === 'moderate').length,
        lowRisk: scored.filter(a => a.noShowRisk.risk === 'low').length,
      },
    };

    cache.set(cacheKey, data, TTL.STANDARD);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error calculating no-show risk:', error);
    return NextResponse.json({ error: 'Failed to calculate no-show risk' }, { status: 500 });
  }
}
