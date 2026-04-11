import { NextRequest, NextResponse } from "next/server";
import { createRecord, Tables } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import { gatherDailyData } from '@/lib/briefing';
import { env } from '@/lib/env';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await gatherDailyData();
    const snapshot = {
      [FIELDS.kpiSnapshots.date]: data.date,
      [FIELDS.kpiSnapshots.period]: 'daily',
      [FIELDS.kpiSnapshots.revenue]: data.revenue.total,
      [FIELDS.kpiSnapshots.totalBookings]: data.schedule.totalAppointments,
      [FIELDS.kpiSnapshots.newLeads]: data.marketing.newLeads,
      [FIELDS.kpiSnapshots.consultsCompleted]: data.schedule.consultCount,
      [FIELDS.kpiSnapshots.averageTicket]: data.revenue.avgTicket,
      [FIELDS.kpiSnapshots.reviewsReceived]: data.marketing.reviewCount,
      [FIELDS.kpiSnapshots.averageRating]: data.marketing.avgRating,
      [FIELDS.kpiSnapshots.revenueByProviderJSON]: JSON.stringify(data.revenue.byProvider),
    };

    const snapshotId = await createRecord(Tables.kpis(), snapshot);

    return NextResponse.json({
      status: 'ok',
      snapshotId,
      snapshot: {
        date: data.date,
        revenue: data.revenue.total,
        appointments: data.schedule.totalAppointments,
        consults: data.schedule.consultCount,
        newLeads: data.marketing.newLeads,
        reviews: data.marketing.reviewCount,
        avgRating: data.marketing.avgRating,
      },
    });
  } catch (error) {
    console.error('[cron/daily-kpi]', error);
    return NextResponse.json({ error: 'Failed to generate daily KPI snapshot' }, { status: 500 });
  }
}
