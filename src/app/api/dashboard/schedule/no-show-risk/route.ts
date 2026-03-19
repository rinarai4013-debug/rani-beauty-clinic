import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';
import { cache, TTL } from '@/lib/cache';
import { FIELDS } from '@/lib/airtable/tables';
import { predictNoShow } from '@/lib/predictions/no-show';

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

    // Fetch today's appointments (include Client linked field for history lookup)
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
      'Client': string[];
    }>(Tables.appointments(), {
      filterByFormula: `{Date} = '${sanitizeFormulaValue(dateParam)}'`,
    });

    // Collect unique client IDs from today's appointments
    const clientIdSet = new Set<string>();
    for (const a of appointments) {
      const clientIds = a.fields['Client'] || [];
      if (clientIds.length > 0) clientIdSet.add(clientIds[0]);
    }
    const uniqueClientIds = Array.from(clientIdSet);

    // Batch fetch client records to get their names and linked Appointments lists
    const clientApptMap = new Map<string, { totalAppointments: number; totalNoShows: number }>();
    const clientNameMap = new Map<string, string>();
    if (uniqueClientIds.length > 0) {
      const clientRecords = await fetchAll<{
        [key: string]: unknown;
        'Appointments': string[];
      }>(Tables.clients(), {
        filterByFormula: `OR(${uniqueClientIds.map(id => `RECORD_ID() = '${id}'`).join(',')})`,
      }, true);

      // Map client IDs to names
      for (const c of clientRecords) {
        const name = (c.fields[FIELDS.clients.name] as string) || 'Client';
        clientNameMap.set(c.id, name);
      }

      // Collect all appointment IDs from these clients
      const allApptIds = new Set<string>();
      const clientToApptIds = new Map<string, string[]>();
      for (const c of clientRecords) {
        const apptIds = c.fields['Appointments'] || [];
        clientToApptIds.set(c.id, apptIds);
        for (const aid of apptIds) allApptIds.add(aid);
      }

      // Batch fetch all those appointments to count statuses (in batches of 50)
      const apptIdArr = Array.from(allApptIds);
      let allClientAppts: { id: string; fields: { Status: string } }[] = [];
      for (let i = 0; i < apptIdArr.length; i += 50) {
        const batch = apptIdArr.slice(i, i + 50);
        const batchResults = await fetchAll<{ Status: string }>(Tables.appointments(), {
          filterByFormula: `OR(${batch.map(id => `RECORD_ID() = '${id}'`).join(',')})`,
        }).catch(() => []);
        allClientAppts = allClientAppts.concat(batchResults);
      }

      // Build status map: apptId → status
      const apptStatusMap = new Map<string, string>();
      for (const a of allClientAppts) {
        apptStatusMap.set(a.id, (a.fields['Status'] || '').toLowerCase());
      }

      // Calculate per-client totals
      for (const c of clientRecords) {
        const apptIds = clientToApptIds.get(c.id) || [];
        let total = 0;
        let noShows = 0;
        for (const aid of apptIds) {
          const status = apptStatusMap.get(aid);
          if (status !== undefined) {
            total++;
            if (status === 'no_show' || status === 'no-show' || status === 'no show') {
              noShows++;
            }
          }
        }
        clientApptMap.set(c.id, { totalAppointments: total, totalNoShows: noShows });
      }
    }

    // Score each appointment with real client history
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

        // Look up client history
        const clientIds = a.fields['Client'] || [];
        const clientId = clientIds[0];
        const history = clientId ? clientApptMap.get(clientId) : undefined;
        const isNewClient = !history || history.totalAppointments <= 1;

        const noShowResult = predictNoShow({
          totalAppointments: history?.totalAppointments ?? 0,
          totalNoShows: history?.totalNoShows ?? 0,
          isNewClient,
          hasMembership: false,
          daysSinceLastVisit: 0,
          depositPaid: a.fields['Deposit Paid'] || false,
          depositAmount: a.fields['Deposit Amount'] || 0,
          bookingLeadDays: 7,
          bookingSource: a.fields['Booking Source'] || 'online',
          dayOfWeek,
          hourOfDay: hour,
          serviceCategory: a.fields['Service Category'] || '',
          isConsult: a.fields['Is Consult'] || false,
        });

        const clientName = clientId ? clientNameMap.get(clientId) || 'Client' : 'Walk-in';

        return {
          id: a.id,
          appointmentId: a.id,
          clientName,
          service: a.fields['Service Name'] || '',
          category: a.fields['Service Category'] || '',
          provider: a.fields['Provider'] || '',
          time: a.fields['Time'] || '',
          status: a.fields['Status'] || '',
          depositPaid: a.fields['Deposit Paid'] || false,
          isConsult: a.fields['Is Consult'] || false,
          score: noShowResult.score,
          level: noShowResult.risk,
          factors: noShowResult.factors.map(f => f.detail),
          recommendation: noShowResult.recommendation,
          noShowRisk: {
            score: noShowResult.score,
            risk: noShowResult.risk,
            factors: noShowResult.factors.map(f => f.detail),
            recommendation: noShowResult.recommendation,
          },
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
