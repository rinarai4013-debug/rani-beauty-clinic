import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll, fetchFirst } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import { calculateClinicScore } from '@/lib/gamification/engine';
import { TARGETS } from '@/data/dashboard/score-weights';
import type { KPIData, AlertItem } from '@/types/dashboard';
import type { DailyMetrics } from '@/types/gamification';

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
  'Consult Outcome': string;
  'Deposit Amount': number;
  'Deposit Paid': boolean;
  'Amount Quoted': number;
  'Amount Paid': number;
  'Booking Source': string;
  'Review Requested': boolean;
  'Review Received': boolean;
}

interface TransactionFields {
  'Date': string;
  'Type': string;
  'Amount': number;
  'Payment Method': string;
  'Provider': string;
  'Service Name': string;
  'Status': string;
  'Is Financing': boolean;
  'Financing Provider': string;
}

interface KPISnapshotFields {
  'Date': string;
  'Period': string;
  'Revenue': number;
  'Revenue MTD': number;
  'Total Bookings': number;
  'Total Shows': number;
  'Total No-Shows': number;
  'Show Rate': number;
  'New Leads': number;
  'Consultations Completed': number;
  'Packages Sold': number;
  'Close Rate': number;
  'Average Ticket': number;
  'Active Members Count': number;
  'New Members': number;
  'Churned Members': number;
  'Membership MRR': number;
  'Review Requests Sent': number;
  'Reviews Received': number;
  'Average Rating': number;
  'Revenue by Provider JSON': string;
}

interface AlertFields {
  'Type': string;
  'Severity': string;
  'Metric Name': string;
  'Metric Value': number;
  'Threshold Value': number;
  'Message': string;
  'Action Recommended': string;
  'Status': string;
  'Created Date': string;
}

// Actual fields in the live Airtable Clients table
interface ClientFields {
  'Client': string;
  'Status': string;
  'Email': string;
  'Phone': string;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!hasPermission(session.role, 'view_executive')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cacheKey = 'kpis';
  const cached = cache.get<KPIData>(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    // Fetch data in parallel
    const [todayAppointments, weekTransactions, kpiSnapshots, activeAlerts, recentClients, allClients] =
      await Promise.all([
        // Today's appointments
        fetchAll<AppointmentFields>(Tables.appointments(), {
          filterByFormula: `{Date} = TODAY()`,
        }),
        // This week's completed transactions
        fetchAll<TransactionFields>(Tables.transactions(), {
          filterByFormula: `AND({Date} >= DATEADD(TODAY(), -7, 'days'), {Status} = "Completed")`,
        }),
        // Last 7 KPI snapshots for trends
        fetchFirst<KPISnapshotFields>(Tables.kpis(), 7, {
          sort: [{ field: 'Date', direction: 'desc' }],
          filterByFormula: `{Period} = "daily"`,
        }),
        // Active alerts
        fetchAll<AlertFields>(Tables.alerts(), {
          filterByFormula: `{Status} = "active"`,
        }),
        // Clients created this week (no "Is Test" or "Created Date" field - use CREATED_TIME())
        fetchAll<ClientFields>(Tables.clients(), {
          filterByFormula: `CREATED_TIME() >= DATEADD(TODAY(), -7, 'days')`,
        }, true),
        // All active clients for counts (no "Is Test" field)
        fetchAll<ClientFields>(Tables.clients(), {
          filterByFormula: `{Status} = "Active"`,
        }, true),
      ]);

    // --- Revenue calculations ---
    const revenueToday = weekTransactions
      .filter((t) => {
        const txDate = t.fields['Date'];
        if (!txDate) return false;
        const today = new Date().toISOString().split('T')[0];
        return txDate === today;
      })
      .reduce((sum, t) => sum + (t.fields['Amount'] || 0), 0);

    const revenueWtd = weekTransactions.reduce(
      (sum, t) => sum + (t.fields['Amount'] || 0),
      0
    );

    // MTD from latest KPI snapshot or calculate
    const latestSnapshot = kpiSnapshots[0]?.fields;
    const revenueMtd = latestSnapshot?.['Revenue MTD'] || revenueWtd;

    // Revenue trend from KPI snapshots (last 7 days, chronological order)
    const revenueTrend = kpiSnapshots
      .slice()
      .reverse()
      .map((s) => s.fields['Revenue'] || 0);

    // --- Bookings calculations ---
    const bookingsToday = todayAppointments.length;
    const completedToday = todayAppointments.filter(
      (a) => a.fields['Status'] === 'completed' || a.fields['Status'] === 'checked_in' || a.fields['Status'] === 'in_progress'
    ).length;

    // Utilization: booked hours vs available hours (8 hours per provider)
    const providers = [...new Set(todayAppointments.map((a) => a.fields['Provider']).filter(Boolean))];
    const totalAvailableHours = Math.max(providers.length, 1) * 8;
    const totalBookedHours = todayAppointments.reduce(
      (sum, a) => sum + ((a.fields['Duration'] || 60) / 60),
      0
    );
    const utilization = Math.round((totalBookedHours / totalAvailableHours) * 100);

    const bookingsTrend = kpiSnapshots
      .slice()
      .reverse()
      .map((s) => s.fields['Total Bookings'] || 0);

    // --- Consults calculations ---
    const consults = todayAppointments.filter((a) => a.fields['Is Consult']);
    const consultsCompleted = consults.filter(
      (a) => a.fields['Status'] === 'completed'
    ).length;
    const consultsClosed = consults.filter(
      (a) => a.fields['Consult Outcome'] === 'Booked' || a.fields['Consult Outcome'] === 'Closed'
    ).length;

    const closeRate =
      consultsCompleted > 0
        ? Math.round((consultsClosed / consultsCompleted) * 100)
        : latestSnapshot?.['Close Rate'] || 0;

    const consultsTrend = kpiSnapshots
      .slice()
      .reverse()
      .map((s) => s.fields['Close Rate'] || 0);

    // --- Client calculations ---
    const newThisWeek = recentClients.length;
    const activeCount = allClients.length;

    // Rebook rate - Clients table doesn't have Visit Count or Days Since Last Visit
    // Use KPI snapshot data or default to 0
    const rebookRate = 0;

    // Average ticket from this week's transactions
    const completedTransactions = weekTransactions.filter(
      (t) => t.fields['Type'] !== 'Refund'
    );
    const avgTicket =
      completedTransactions.length > 0
        ? Math.round(
            completedTransactions.reduce((sum, t) => sum + (t.fields['Amount'] || 0), 0) /
              completedTransactions.length
          )
        : latestSnapshot?.['Average Ticket'] || 0;

    // Member count
    const memberCount = latestSnapshot?.['Active Members Count'] || 0;

    // --- Alerts ---
    const alerts: AlertItem[] = activeAlerts.map((a) => ({
      id: a.id,
      type: (a.fields['Type'] as AlertItem['type']) || 'custom',
      severity: (a.fields['Severity'] as AlertItem['severity']) || 'info',
      message: a.fields['Message'] || '',
      actionRecommended: a.fields['Action Recommended'] || '',
      metricName: a.fields['Metric Name'] || undefined,
      metricValue: a.fields['Metric Value'] || undefined,
      thresholdValue: a.fields['Threshold Value'] || undefined,
      status: 'active' as const,
      createdAt: a.fields['Created Date'] || new Date().toISOString(),
    }));

    // --- Clinic Score ---
    const noShows = todayAppointments.filter((a) => a.fields['Status'] === 'no_show').length;
    const cancellations = todayAppointments.filter((a) => a.fields['Status'] === 'cancelled').length;
    const reviewsReceived = todayAppointments.filter((a) => a.fields['Review Received']).length;

    const dailyMetrics: DailyMetrics = {
      revenue: revenueToday,
      revenueTarget: TARGETS.dailyRevenue,
      bookedHours: totalBookedHours,
      availableHours: totalAvailableHours,
      consultsClosed,
      consultsCompleted,
      patientsRebooked: 0,
      patientsSeen: completedToday,
      reviewsReceived,
      followUpsCompleted: 0,
      followUpsDue: 0,
      onTimeStarts: 0,
      totalAppointments: bookingsToday,
      noShows,
      cancellations,
    };

    const { total, breakdown, status } = calculateClinicScore(dailyMetrics);

    // --- Build response ---
    const data: KPIData = {
      revenue: {
        today: revenueToday,
        wtd: revenueWtd,
        mtd: revenueMtd,
        target: TARGETS.monthlyRevenue,
        projectedMonth: revenueMtd > 0
          ? Math.round(revenueMtd / (new Date().getDate() / 30) )
          : 0,
        trend: revenueTrend.length > 0 ? revenueTrend : [0],
      },
      bookings: {
        today: bookingsToday,
        thisWeek: latestSnapshot?.['Total Bookings'] || bookingsToday,
        utilization,
        trend: bookingsTrend.length > 0 ? bookingsTrend : [0],
      },
      consults: {
        booked: consults.length,
        completed: consultsCompleted,
        closeRate,
        showRate: latestSnapshot?.['Show Rate'] || 0,
        trend: consultsTrend.length > 0 ? consultsTrend : [0],
      },
      clients: {
        newThisWeek,
        activeCount,
        rebookRate,
        avgTicket,
        memberCount,
      },
      alerts,
      clinicScore: {
        total,
        breakdown,
        status,
        streak: 0, // Would need historical data to calculate streak
      },
    };

    cache.set(cacheKey, data, TTL.STANDARD);
    return NextResponse.json(data);
  } catch (error) {
    console.error('KPIs route error:', error);
    return NextResponse.json({ error: 'Failed to fetch KPI data' }, { status: 500 });
  }
}
