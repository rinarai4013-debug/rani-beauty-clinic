import { NextRequest, NextResponse } from 'next/server';
import { Tables, fetchAll, createRecord } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import { calculateClinicScore } from '@/lib/gamification/engine';
import type { DailyMetrics } from '@/types/gamification';

// POST - Daily KPI snapshot creation
// Triggered by n8n or Vercel Cron with CRON_SECRET auth
export async function POST(request: NextRequest) {
  try {
    // Auth: cron secret only (no session - this runs unattended)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Check if KPI snapshot already exists for today
    const existing = await fetchAll<Record<string, unknown>>(
      Tables.kpis(),
      {
        filterByFormula: `AND({${FIELDS.kpiSnapshots.date}} = "${today}", {${FIELDS.kpiSnapshots.period}} = "Daily")`,
        maxRecords: 1,
      },
      true
    );

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'KPI snapshot already exists for today',
        snapshotId: existing[0].id,
        date: today,
      });
    }

    // 1. Query Transactions for today's revenue
    const transactions = await fetchAll<Record<string, unknown>>(
      Tables.transactions(),
      {
        filterByFormula: `{${FIELDS.transactions.date}} = "${today}"`,
      }
    );

    const todayRevenue = transactions.reduce((sum, t) => {
      const amount = Number(t.fields[FIELDS.transactions.amount] || 0);
      const status = String(t.fields[FIELDS.transactions.status] || '');
      // Only count completed/paid transactions
      if (status === 'Refunded' || status === 'Cancelled') return sum;
      return sum + amount;
    }, 0);

    const avgTicket = transactions.length > 0
      ? Math.round(todayRevenue / transactions.length)
      : 0;

    // Revenue by provider
    const revenueByProvider: Record<string, number> = {};
    transactions.forEach(t => {
      const provider = String(t.fields[FIELDS.transactions.provider] || 'Unknown');
      const amount = Number(t.fields[FIELDS.transactions.amount] || 0);
      revenueByProvider[provider] = (revenueByProvider[provider] || 0) + amount;
    });

    // 2. Query Appointments for today's count
    const appointments = await fetchAll<Record<string, unknown>>(
      Tables.appointments(),
      {
        filterByFormula: `{${FIELDS.appointments.date}} = "${today}"`,
      }
    );

    const totalBookings = appointments.length;
    const totalShows = appointments.filter(
      a => !['no_show', 'cancelled', 'No-Show', 'Cancelled'].includes(
        String(a.fields[FIELDS.appointments.status] || '')
      )
    ).length;
    const totalNoShows = appointments.filter(
      a => ['no_show', 'No-Show'].includes(String(a.fields[FIELDS.appointments.status] || ''))
    ).length;
    const showRate = totalBookings > 0
      ? Math.round((totalShows / totalBookings) * 100)
      : 0;

    // Consults completed
    const consults = appointments.filter(
      a => a.fields[FIELDS.appointments.isConsult]
    );
    const consultsCompleted = consults.filter(
      a => String(a.fields[FIELDS.appointments.status] || '') === 'completed' ||
           String(a.fields[FIELDS.appointments.status] || '') === 'Completed'
    ).length;

    // Close rate (consults that led to booking/package)
    const consultsWithOutcome = consults.filter(
      a => a.fields[FIELDS.appointments.consultOutcome]
    );
    const closedConsults = consultsWithOutcome.filter(
      a => ['Booked', 'Package Sold', 'booked', 'package_sold'].includes(
        String(a.fields[FIELDS.appointments.consultOutcome] || '')
      )
    ).length;
    const closeRate = consultsWithOutcome.length > 0
      ? Math.round((closedConsults / consultsWithOutcome.length) * 100)
      : 0;

    // 3. Query Clients for new client count (new leads today)
    const newClients = await fetchAll<Record<string, unknown>>(
      Tables.clients(),
      {
        filterByFormula: `AND({${FIELDS.clients.status}} = "New Lead", IS_SAME(CREATED_TIME(), "${today}", "day"))`,
        fields: [FIELDS.clients.name, FIELDS.clients.status],
      },
      true
    );

    // MTD revenue
    const monthStart = today.substring(0, 7) + '-01'; // YYYY-MM-01
    const mtdTransactions = await fetchAll<Record<string, unknown>>(
      Tables.transactions(),
      {
        filterByFormula: `AND(IS_AFTER({${FIELDS.transactions.date}}, "${monthStart}"), NOT(IS_AFTER({${FIELDS.transactions.date}}, "${today}")))`,
      }
    );
    const mtdRevenue = mtdTransactions.reduce((sum, t) => {
      const status = String(t.fields[FIELDS.transactions.status] || '');
      if (status === 'Refunded' || status === 'Cancelled') return sum;
      return sum + Number(t.fields[FIELDS.transactions.amount] || 0);
    }, 0) + todayRevenue;

    // Memberships
    const memberships = await fetchAll<Record<string, unknown>>(
      Tables.memberships(),
      {
        filterByFormula: `{${FIELDS.memberships.status}} = "Active"`,
        fields: [FIELDS.memberships.monthlyPrice, FIELDS.memberships.status],
      }
    );
    const activeMembers = memberships.length;
    const membershipMRR = memberships.reduce(
      (sum, m) => sum + Number(m.fields[FIELDS.memberships.monthlyPrice] || 0),
      0
    );

    // Reviews today
    const todayReviews = await fetchAll<Record<string, unknown>>(
      Tables.reviews(),
      {
        filterByFormula: `{${FIELDS.reviews.reviewDate}} = "${today}"`,
        fields: [FIELDS.reviews.starRating],
      },
      true
    );
    const reviewsReceived = todayReviews.length;
    const averageRating = reviewsReceived > 0
      ? Math.round(
          (todayReviews.reduce((s, r) => s + Number(r.fields[FIELDS.reviews.starRating] || 0), 0) /
            reviewsReceived) *
            10
        ) / 10
      : 0;

    // 4. Calculate daily clinic score for streak tracking
    const bookedMinutes = appointments.reduce(
      (sum, a) => sum + Number(a.fields['Duration'] || 0), 0
    );
    const completedApptsForScore = appointments.filter(
      (a) => String(a.fields[FIELDS.appointments.status] || '') === 'completed'
    );

    const dailyMetrics: DailyMetrics = {
      revenue: todayRevenue,
      revenueTarget: 4000,
      bookedHours: bookedMinutes / 60,
      availableHours: 16,
      consultsClosed: closedConsults,
      consultsCompleted: consultsCompleted,
      patientsRebooked: completedApptsForScore.length,
      patientsSeen: completedApptsForScore.length,
      reviewsReceived,
      followUpsCompleted: 0,
      followUpsDue: 0,
      onTimeStarts: totalBookings,
      totalAppointments: totalBookings,
      noShows: totalNoShows,
      cancellations: appointments.filter(
        (a) => ['cancelled', 'Cancelled'].includes(String(a.fields[FIELDS.appointments.status] || ''))
      ).length,
    };

    const { total: dailyScore } = calculateClinicScore(dailyMetrics);

    // 5. Create KPI Snapshot record
    const kpiFields = {
      [FIELDS.kpiSnapshots.date]: today,
      [FIELDS.kpiSnapshots.period]: 'Daily',
      [FIELDS.kpiSnapshots.revenue]: Math.round(todayRevenue * 100) / 100,
      [FIELDS.kpiSnapshots.revenueMTD]: Math.round(mtdRevenue * 100) / 100,
      [FIELDS.kpiSnapshots.totalBookings]: totalBookings,
      [FIELDS.kpiSnapshots.totalShows]: totalShows,
      [FIELDS.kpiSnapshots.totalNoShows]: totalNoShows,
      [FIELDS.kpiSnapshots.showRate]: showRate,
      [FIELDS.kpiSnapshots.newLeads]: newClients.length,
      [FIELDS.kpiSnapshots.consultsCompleted]: consultsCompleted,
      [FIELDS.kpiSnapshots.closeRate]: closeRate,
      [FIELDS.kpiSnapshots.avgTicket]: avgTicket,
      [FIELDS.kpiSnapshots.activeMembers]: activeMembers,
      [FIELDS.kpiSnapshots.membershipMRR]: Math.round(membershipMRR * 100) / 100,
      [FIELDS.kpiSnapshots.reviewsReceived]: reviewsReceived,
      [FIELDS.kpiSnapshots.averageRating]: averageRating,
      [FIELDS.kpiSnapshots.revenueByProviderJSON]: JSON.stringify(revenueByProvider),
      'Daily Score': dailyScore,
    };

    const snapshotId = await createRecord(Tables.kpis(), kpiFields);

    return NextResponse.json({
      success: true,
      snapshotId,
      date: today,
      data: {
        revenue: todayRevenue,
        revenueMTD: mtdRevenue,
        totalBookings,
        totalShows,
        totalNoShows,
        showRate,
        newLeads: newClients.length,
        consultsCompleted,
        closeRate,
        avgTicket,
        activeMembers,
        membershipMRR,
        reviewsReceived,
        averageRating,
        revenueByProvider,
        dailyScore,
      },
    });
  } catch (error) {
    console.error('Daily KPI cron error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create KPI snapshot' },
      { status: 500 }
    );
  }
}
