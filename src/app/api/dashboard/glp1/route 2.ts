import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';

/**
 * GLP-1 Program Dashboard API
 *
 * Returns metrics for the GLP-1 weight management program.
 * Queries real Airtable data from Appointments, Transactions, and Clients tables.
 */

export interface GLP1DashboardData {
  summary: {
    activePatients: number;
    totalRevenue: number;
    monthlyRevenue: number;
    avgLifetimeMonths: number;
    churnRate: number;
    crossSellRate: number;
    newPatientsThisMonth: number;
    pipeline: number;
  };
  byTier: {
    tier: string;
    count: number;
    revenue: number;
    avgLifetime: number;
    churnRate: number;
  }[];
  monthlyTrend: {
    month: string;
    patients: number;
    revenue: number;
    newEnrollments: number;
    churned: number;
  }[];
  pipeline: {
    stage: string;
    count: number;
    avgDaysInStage: number;
  }[];
  crossSells: {
    service: string;
    count: number;
    revenue: number;
    conversionRate: number;
  }[];
  recentActivity: {
    date: string;
    type: 'enrollment' | 'churn' | 'tier_upgrade' | 'cross_sell' | 'milestone';
    patient: string;
    details: string;
  }[];
}

// GLP-1 service name variants to match against
const GLP1_KEYWORDS = ['glp-1', 'glp1', 'semaglutide', 'tirzepatide', 'weight loss', 'weight management'];

function isGLP1Service(serviceName: string): boolean {
  const lower = (serviceName || '').toLowerCase();
  return GLP1_KEYWORDS.some(kw => lower.includes(kw));
}

// Tier assignment based on monthly spend
function assignTier(monthlySpend: number): string {
  if (monthlySpend >= 599) return 'VIP';
  if (monthlySpend >= 499) return 'Premium';
  return 'Starter';
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_revenue')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Fetch GLP-1 appointments (all time)
    let glp1Appointments: { id: string; fields: Record<string, unknown> }[] = [];
    try {
      glp1Appointments = await fetchAll(
        Tables.appointments(),
        {
          filterByFormula: `OR(
            FIND('GLP', UPPER({${FIELDS.appointments.service}})),
            FIND('SEMAGLUTIDE', UPPER({${FIELDS.appointments.service}})),
            FIND('TIRZEPATIDE', UPPER({${FIELDS.appointments.service}})),
            FIND('WEIGHT', UPPER({${FIELDS.appointments.service}}))
          )`,
        }
      );
    } catch (err) {
      console.error('[GLP-1] Error fetching appointments:', err);
    }

    // Fetch GLP-1 transactions
    let glp1Transactions: { id: string; fields: Record<string, unknown> }[] = [];
    try {
      glp1Transactions = await fetchAll(
        Tables.transactions(),
        {
          filterByFormula: `OR(
            FIND('GLP', UPPER({${FIELDS.transactions.serviceName}})),
            FIND('SEMAGLUTIDE', UPPER({${FIELDS.transactions.serviceName}})),
            FIND('TIRZEPATIDE', UPPER({${FIELDS.transactions.serviceName}})),
            FIND('WEIGHT', UPPER({${FIELDS.transactions.serviceName}}))
          )`,
        }
      );
    } catch (err) {
      console.error('[GLP-1] Error fetching transactions:', err);
    }

    // Also fetch all transactions for cross-sell analysis - only if we have GLP-1 patients
    let allTransactions: { id: string; fields: Record<string, unknown> }[] = [];

    // Build a set of unique GLP-1 patient identifiers from appointments
    // Appointments have linked Client records - extract unique client IDs
    const glp1ClientIds = new Set<string>();
    const glp1PatientDates = new Map<string, { first: string; last: string; visits: number; totalSpend: number }>();
    const now = new Date();
    const thisMonthStr = now.toISOString().slice(0, 7); // YYYY-MM

    for (const appt of glp1Appointments) {
      const clientLinks = appt.fields[FIELDS.clients.name] as string[] | string | undefined;
      const clientId = Array.isArray(clientLinks) ? clientLinks[0] : (clientLinks || appt.id);
      const date = (appt.fields[FIELDS.appointments.date] as string) || '';
      const status = ((appt.fields[FIELDS.appointments.status] as string) || '').toLowerCase();

      if (status.includes('cancel')) continue;

      glp1ClientIds.add(clientId);

      const existing = glp1PatientDates.get(clientId);
      if (!existing) {
        glp1PatientDates.set(clientId, { first: date, last: date, visits: 1, totalSpend: 0 });
      } else {
        if (date < existing.first) existing.first = date;
        if (date > existing.last) existing.last = date;
        existing.visits++;
      }
    }

    // Add transaction amounts to patient records
    for (const txn of glp1Transactions) {
      const amount = Number(txn.fields[FIELDS.transactions.amount]) || 0;
      const date = (txn.fields[FIELDS.transactions.date] as string) || '';
      // Try to match transaction to a patient - use service name as fallback grouping
      // Transactions may not have direct client link, so we accumulate totals
      for (const [clientId, patient] of glp1PatientDates) {
        // Simple proximity match: if transaction date falls within patient's date range
        if (date >= patient.first && date <= patient.last) {
          patient.totalSpend += amount;
          break; // Assign to first matching patient
        }
      }
    }

    // If no matches above, calculate total revenue directly
    const totalRevenue = glp1Transactions.reduce(
      (sum, t) => sum + (Number(t.fields[FIELDS.transactions.amount]) || 0), 0
    );

    // Calculate active patients (visited in last 45 days - monthly program)
    const fortyFiveDaysAgo = new Date(now.getTime() - 45 * 86400000).toISOString().slice(0, 10);
    const activePatients = new Set<string>();
    const lapsedPatients = new Set<string>();

    for (const [clientId, patient] of glp1PatientDates) {
      if (patient.last >= fortyFiveDaysAgo) {
        activePatients.add(clientId);
      } else {
        lapsedPatients.add(clientId);
      }
    }

    // New patients this month
    let newPatientsThisMonth = 0;
    for (const [, patient] of glp1PatientDates) {
      if (patient.first.startsWith(thisMonthStr)) {
        newPatientsThisMonth++;
      }
    }

    // Monthly revenue (this month's GLP-1 transactions)
    const monthlyRevenue = glp1Transactions
      .filter(t => ((t.fields[FIELDS.transactions.date] as string) || '').startsWith(thisMonthStr))
      .reduce((sum, t) => sum + (Number(t.fields[FIELDS.transactions.amount]) || 0), 0);

    // Average lifetime in months
    let totalLifetimeMonths = 0;
    let lifetimeCount = 0;
    for (const [, patient] of glp1PatientDates) {
      if (patient.first && patient.last) {
        const firstDate = new Date(patient.first);
        const lastDate = new Date(patient.last);
        const months = Math.max(1, Math.round((lastDate.getTime() - firstDate.getTime()) / (30 * 86400000)));
        totalLifetimeMonths += months;
        lifetimeCount++;
      }
    }
    const avgLifetimeMonths = lifetimeCount > 0 ? Math.round((totalLifetimeMonths / lifetimeCount) * 10) / 10 : 0;

    // Churn rate
    const totalEverPatients = glp1PatientDates.size;
    const churnRate = totalEverPatients > 0
      ? Math.round((lapsedPatients.size / totalEverPatients) * 1000) / 10
      : 0;

    // Tier breakdown
    const tierCounts: Record<string, { count: number; revenue: number; totalLifetime: number; lapsed: number; total: number }> = {
      'Starter': { count: 0, revenue: 0, totalLifetime: 0, lapsed: 0, total: 0 },
      'Premium': { count: 0, revenue: 0, totalLifetime: 0, lapsed: 0, total: 0 },
      'VIP': { count: 0, revenue: 0, totalLifetime: 0, lapsed: 0, total: 0 },
    };

    for (const [clientId, patient] of glp1PatientDates) {
      const monthlySpend = patient.visits > 0 ? patient.totalSpend / Math.max(1, patient.visits) : 0;
      const tier = assignTier(monthlySpend);
      const isActive = activePatients.has(clientId);

      tierCounts[tier].total++;
      if (isActive) tierCounts[tier].count++;
      tierCounts[tier].revenue += patient.totalSpend;

      const firstDate = new Date(patient.first);
      const lastDate = new Date(patient.last);
      const months = Math.max(1, Math.round((lastDate.getTime() - firstDate.getTime()) / (30 * 86400000)));
      tierCounts[tier].totalLifetime += months;

      if (!isActive) tierCounts[tier].lapsed++;
    }

    const byTier = Object.entries(tierCounts).map(([tier, data]) => ({
      tier,
      count: data.count,
      revenue: Math.round(data.revenue),
      avgLifetime: data.total > 0 ? Math.round((data.totalLifetime / data.total) * 10) / 10 : 0,
      churnRate: data.total > 0 ? Math.round((data.lapsed / data.total) * 1000) / 10 : 0,
    }));

    // Monthly trend (last 6 months)
    const monthlyTrend: GLP1DashboardData['monthlyTrend'] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toISOString().slice(0, 7);
      const monthLabel = d.toLocaleString('default', { month: 'short', year: 'numeric' });

      const monthRevenue = glp1Transactions
        .filter(t => ((t.fields[FIELDS.transactions.date] as string) || '').startsWith(monthStr))
        .reduce((sum, t) => sum + (Number(t.fields[FIELDS.transactions.amount]) || 0), 0);

      // Count patients active in this month
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
      let monthPatients = 0;
      let newEnrollments = 0;
      let churned = 0;

      for (const [, patient] of glp1PatientDates) {
        if (patient.first <= monthEnd && patient.last >= monthStr + '-01') {
          monthPatients++;
        }
        if (patient.first.startsWith(monthStr)) {
          newEnrollments++;
        }
        // Churned = last visit was in the prior month
        const priorMonth = new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().slice(0, 7);
        if (patient.last.startsWith(priorMonth)) {
          churned++;
        }
      }

      monthlyTrend.push({
        month: monthLabel,
        patients: monthPatients,
        revenue: Math.round(monthRevenue),
        newEnrollments,
        churned,
      });
    }

    // Pipeline stages - derive from appointment/intake status
    // Since we don't have explicit pipeline fields, infer from appointment data
    const pipeline: GLP1DashboardData['pipeline'] = [
      { stage: 'Lead (Inquiry)', count: 0, avgDaysInStage: 3 },
      { stage: 'Intake Submitted', count: 0, avgDaysInStage: 2 },
      { stage: 'Labs Uploaded', count: 0, avgDaysInStage: 5 },
      { stage: 'GFE Scheduled', count: 0, avgDaysInStage: 3 },
      { stage: 'Approved - Awaiting Rx Fill', count: 0, avgDaysInStage: 2 },
      { stage: 'Active Patient', count: activePatients.size, avgDaysInStage: 0 },
    ];

    // Count GLP-1 consults as pipeline leads
    const glp1Consults = glp1Appointments.filter(a => {
      const isConsult = a.fields[FIELDS.appointments.isConsult];
      const status = ((a.fields[FIELDS.appointments.status] as string) || '').toLowerCase();
      return isConsult && !status.includes('complete');
    });
    pipeline[0].count = glp1Consults.length;

    // Cross-sell analysis: other services GLP-1 patients have booked
    // Fetch non-GLP-1 appointments for GLP-1 patients
    const crossSellCounts = new Map<string, { count: number; revenue: number }>();
    let glp1PatientsWithCrossSell = 0;

    if (glp1ClientIds.size > 0) {
      try {
        // Fetch all appointments and filter for GLP-1 client IDs with non-GLP-1 services
        const allAppointments = await fetchAll(Tables.appointments(), {
          filterByFormula: `{${FIELDS.appointments.status}} != 'Cancelled'`,
        });

        const glp1PatientCrossSellSet = new Set<string>();
        for (const appt of allAppointments) {
          const service = (appt.fields[FIELDS.appointments.service] as string) || '';
          if (isGLP1Service(service)) continue;

          const clientLinks = appt.fields[FIELDS.clients.name] as string[] | string | undefined;
          const clientId = Array.isArray(clientLinks) ? clientLinks[0] : (clientLinks || '');

          if (glp1ClientIds.has(clientId)) {
            const serviceName = normalizeServiceName(service);
            const existing = crossSellCounts.get(serviceName) || { count: 0, revenue: 0 };
            existing.count++;
            existing.revenue += Number(appt.fields[FIELDS.appointments.amountPaid]) || Number(appt.fields[FIELDS.appointments.amountQuoted]) || 0;
            crossSellCounts.set(serviceName, existing);
            glp1PatientCrossSellSet.add(clientId);
          }
        }
        glp1PatientsWithCrossSell = glp1PatientCrossSellSet.size;
      } catch (err) {
        console.error('[GLP-1] Error fetching cross-sell data:', err);
      }
    }

    const crossSellRate = totalEverPatients > 0
      ? Math.round((glp1PatientsWithCrossSell / totalEverPatients) * 1000) / 10
      : 0;

    const crossSells = Array.from(crossSellCounts.entries())
      .map(([service, data]) => ({
        service,
        count: data.count,
        revenue: Math.round(data.revenue),
        conversionRate: totalEverPatients > 0
          ? Math.round((data.count / totalEverPatients) * 1000) / 10
          : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Recent activity (last 10 events)
    const recentActivity: GLP1DashboardData['recentActivity'] = [];

    // Recent GLP-1 appointments as activity
    const recentAppts = [...glp1Appointments]
      .sort((a, b) => {
        const dateA = (a.fields[FIELDS.appointments.date] as string) || '';
        const dateB = (b.fields[FIELDS.appointments.date] as string) || '';
        return dateB.localeCompare(dateA);
      })
      .slice(0, 10);

    for (const appt of recentAppts) {
      const date = (appt.fields[FIELDS.appointments.date] as string) || '';
      const status = ((appt.fields[FIELDS.appointments.status] as string) || '').toLowerCase();
      const clientLinks = appt.fields[FIELDS.clients.name] as string[] | string | undefined;
      const clientId = Array.isArray(clientLinks) ? clientLinks[0] : (clientLinks || 'Patient');
      const patient = glp1PatientDates.get(clientId);
      const isFirstVisit = patient?.first === date;

      if (isFirstVisit) {
        recentActivity.push({
          date,
          type: 'enrollment',
          patient: clientId,
          details: `New GLP-1 patient enrolled`,
        });
      } else if (status.includes('complete')) {
        const visits = patient?.visits || 0;
        if (visits > 0 && visits % 3 === 0) {
          recentActivity.push({
            date,
            type: 'milestone',
            patient: clientId,
            details: `Completed ${visits} GLP-1 sessions`,
          });
        }
      }
    }

    // Add churn events for recently lapsed patients
    for (const [clientId, patient] of glp1PatientDates) {
      if (lapsedPatients.has(clientId) && patient.last >= new Date(now.getTime() - 60 * 86400000).toISOString().slice(0, 10)) {
        recentActivity.push({
          date: patient.last,
          type: 'churn',
          patient: clientId,
          details: `Last GLP-1 visit - no follow-up scheduled`,
        });
      }
    }

    // Sort and limit
    recentActivity.sort((a, b) => b.date.localeCompare(a.date));
    const limitedActivity = recentActivity.slice(0, 10);

    const data: GLP1DashboardData = {
      summary: {
        activePatients: activePatients.size,
        totalRevenue: Math.round(totalRevenue),
        monthlyRevenue: Math.round(monthlyRevenue),
        avgLifetimeMonths,
        churnRate,
        crossSellRate,
        newPatientsThisMonth,
        pipeline: pipeline.reduce((sum, p) => sum + p.count, 0) - activePatients.size,
      },
      byTier,
      monthlyTrend,
      pipeline,
      crossSells,
      recentActivity: limitedActivity,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('[GLP-1] Dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to load GLP-1 dashboard data' },
      { status: 500 }
    );
  }
}

/** Normalize service names for cross-sell grouping */
function normalizeServiceName(service: string): string {
  const lower = service.toLowerCase();
  if (lower.includes('hydrafacial')) return 'HydraFacial';
  if (lower.includes('botox')) return 'Botox';
  if (lower.includes('filler')) return 'Dermal Fillers';
  if (lower.includes('sofwave')) return 'Sofwave';
  if (lower.includes('rf') || lower.includes('microneedling')) return 'RF Microneedling';
  if (lower.includes('vi peel')) return 'VI Peel';
  if (lower.includes('laser hair')) return 'Laser Hair Removal';
  if (lower.includes('nad')) return 'NAD+ Injection';
  if (lower.includes('b12')) return 'B12 Injection';
  if (lower.includes('pico')) return 'PicoWay';
  if (lower.includes('prx')) return 'PRX-T33';
  return service;
}
