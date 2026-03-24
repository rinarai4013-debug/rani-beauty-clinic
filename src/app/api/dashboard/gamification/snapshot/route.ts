import { NextRequest, NextResponse } from 'next/server';
import { Tables, fetchAll, createRecord, updateRecord } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import { calculateClinicScore } from '@/lib/gamification/engine';
import { getSession } from '@/lib/auth/session';
import type { DailyMetrics } from '@/types/gamification';

interface AppointmentFields {
  'Service Name': string;
  'Provider': string;
  'Date': string;
  'Time': string;
  'Duration': number;
  'Status': string;
  'Is Consult': boolean;
  'Consult Outcome': string;
}

interface TransactionFields {
  'Date': string;
  'Type': string;
  'Amount': number;
  'Status': string;
}

// POST — Calculate and store today's clinic score in a KPI Snapshot
// Called by n8n daily (WF9) or manually. Auth via CRON_SECRET.
export async function POST(request: NextRequest) {
  try {
    // Auth: valid dashboard session OR CRON_SECRET in Authorization header
    const session = await getSession();
    if (!session) {
      const authHeader = request.headers.get('authorization');
      const cronSecret = process.env.CRON_SECRET;
      if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const today = new Date().toISOString().split('T')[0];

    // Fetch today's appointments and transactions
    const [todayAppts, todayTxns] = await Promise.all([
      fetchAll<AppointmentFields>(Tables.appointments(), {
        filterByFormula: `{Date} = '${today}'`,
      }),
      fetchAll<TransactionFields>(Tables.transactions(), {
        filterByFormula: `AND({Date} = '${today}', {Type} = 'Service')`,
      }),
    ]);

    // Build DailyMetrics
    const revenue = todayTxns
      .filter((t) => t.fields['Status'] === 'Completed')
      .reduce((sum, t) => sum + (t.fields['Amount'] || 0), 0);

    const bookedMinutes = todayAppts.reduce((sum, a) => sum + (a.fields['Duration'] || 0), 0);
    const completedAppts = todayAppts.filter((a) => a.fields['Status'] === 'completed');
    const consultAppts = todayAppts.filter((a) => a.fields['Is Consult']);
    const consultsClosed = consultAppts.filter(
      (a) => a.fields['Consult Outcome'] === 'Booked' || a.fields['Consult Outcome'] === 'Closed'
    ).length;

    const noShows = todayAppts.filter((a) => a.fields['Status'] === 'no_show').length;
    const cancellations = todayAppts.filter((a) => a.fields['Status'] === 'cancelled').length;

    const metrics: DailyMetrics = {
      revenue,
      revenueTarget: 4000,
      bookedHours: bookedMinutes / 60,
      availableHours: 16,
      consultsClosed,
      consultsCompleted: consultAppts.length,
      patientsRebooked: completedAppts.length,
      patientsSeen: completedAppts.length,
      reviewsReceived: 0,
      followUpsCompleted: 0,
      followUpsDue: 0,
      onTimeStarts: todayAppts.length,
      totalAppointments: todayAppts.length,
      noShows,
      cancellations,
    };

    const { total } = calculateClinicScore(metrics);

    // Check if a KPI snapshot already exists for today
    const existing = await fetchAll<Record<string, unknown>>(
      Tables.kpis(),
      {
        filterByFormula: `AND({${FIELDS.kpiSnapshots.date}} = "${today}", {${FIELDS.kpiSnapshots.period}} = "Daily")`,
        maxRecords: 1,
      },
      true
    );

    let snapshotId: string;

    if (existing.length > 0) {
      // Update existing snapshot with Daily Score
      snapshotId = existing[0].id;
      await updateRecord(Tables.kpis(), snapshotId, {
        'Daily Score': total,
      });
    } else {
      // Create new snapshot with just the score fields
      snapshotId = await createRecord(Tables.kpis(), {
        [FIELDS.kpiSnapshots.date]: today,
        [FIELDS.kpiSnapshots.period]: 'Daily',
        [FIELDS.kpiSnapshots.revenue]: Math.round(revenue * 100) / 100,
        [FIELDS.kpiSnapshots.totalBookings]: todayAppts.length,
        'Daily Score': total,
      });
    }

    return NextResponse.json({
      success: true,
      snapshotId,
      date: today,
      dailyScore: total,
      revenue: Math.round(revenue * 100) / 100,
      appointments: todayAppts.length,
    });
  } catch (error) {
    console.error('Gamification snapshot error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create gamification snapshot', details: String(error) },
      { status: 500 }
    );
  }
}
