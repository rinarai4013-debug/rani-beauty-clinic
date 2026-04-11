/**
 * Rani Beauty Clinic - CEO Briefing Data Fetchers
 *
 * Pulls data from Airtable for daily, weekly, and monthly briefings.
 * Each function handles its own error cases gracefully with fallback defaults.
 */

import { Tables, fetchAll, fetchFirst } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import {
  RevenueSnapshot,
  ScheduleSnapshot,
  ScheduleGap,
  AlertSnapshot,
  AlertItem,
  LoyaltySnapshot,
  ReferralSnapshot,
  MarketingSnapshot,
  CashFlowSnapshot,
  ContentCalendarSnapshot,
  AIHighlights,
} from './types';

// ── Date helpers ─────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDate(d);
}

function getToday(): string {
  return formatDate(new Date());
}

function getDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return formatDate(d);
}

function getMonthStart(date: Date = new Date()): string {
  return formatDate(new Date(date.getFullYear(), date.getMonth(), 1));
}

function getLastMonthStart(): string {
  const d = new Date();
  return formatDate(new Date(d.getFullYear(), d.getMonth() - 1, 1));
}

function getLastMonthEnd(): string {
  const d = new Date();
  return formatDate(new Date(d.getFullYear(), d.getMonth(), 0));
}

function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff);
  return formatDate(d);
}

function getLastWeekStart(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return getWeekStart(d);
}

function getLastWeekEnd(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  const start = new Date(getWeekStart(d));
  start.setDate(start.getDate() + 6);
  return formatDate(start);
}

// ── Revenue ──────────────────────────────────────────────────

export async function fetchRevenue(date?: string): Promise<RevenueSnapshot> {
  const targetDate = date || getYesterday();

  try {
    const transactions = await fetchAll<Record<string, unknown>>(
      Tables.transactions(),
      {
        filterByFormula: `AND({${FIELDS.transactions.date}} = '${targetDate}', {${FIELDS.transactions.status}} = 'Completed')`,
      }
    );

    const byProvider: Record<string, number> = {};
    const byService: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byPaymentMethod: Record<string, number> = {};
    let total = 0;
    let financingTotal = 0;

    for (const tx of transactions) {
      const amount = Number(tx.fields[FIELDS.transactions.amount]) || 0;
      const provider = String(tx.fields[FIELDS.transactions.provider] || 'Unknown');
      const service = String(tx.fields[FIELDS.transactions.serviceName] || 'Unknown');
      const payment = String(tx.fields[FIELDS.transactions.paymentMethod] || 'Unknown');
      const isFinancing = Boolean(tx.fields[FIELDS.transactions.isFinancing]);

      total += amount;
      byProvider[provider] = (byProvider[provider] || 0) + amount;
      byService[service] = (byService[service] || 0) + amount;
      byPaymentMethod[payment] = (byPaymentMethod[payment] || 0) + amount;

      if (isFinancing) financingTotal += amount;
    }

    return {
      total,
      byProvider,
      byService,
      byCategory,
      byPaymentMethod,
      transactionCount: transactions.length,
      avgTicket: transactions.length > 0 ? total / transactions.length : 0,
      financingTotal,
    };
  } catch (err) {
    console.error('[Briefing] Failed to fetch revenue:', err);
    return {
      total: 0,
      byProvider: {},
      byService: {},
      byCategory: {},
      byPaymentMethod: {},
      transactionCount: 0,
      avgTicket: 0,
      financingTotal: 0,
    };
  }
}

export async function fetchRevenueRange(startDate: string, endDate: string): Promise<RevenueSnapshot> {
  try {
    const transactions = await fetchAll<Record<string, unknown>>(
      Tables.transactions(),
      {
        filterByFormula: `AND(IS_AFTER({${FIELDS.transactions.date}}, '${startDate}'), IS_BEFORE({${FIELDS.transactions.date}}, '${endDate}'), {${FIELDS.transactions.status}} = 'Completed')`,
      }
    );

    const byProvider: Record<string, number> = {};
    const byService: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byPaymentMethod: Record<string, number> = {};
    let total = 0;
    let financingTotal = 0;

    for (const tx of transactions) {
      const amount = Number(tx.fields[FIELDS.transactions.amount]) || 0;
      const provider = String(tx.fields[FIELDS.transactions.provider] || 'Unknown');
      const service = String(tx.fields[FIELDS.transactions.serviceName] || 'Unknown');
      const payment = String(tx.fields[FIELDS.transactions.paymentMethod] || 'Unknown');
      const isFinancing = Boolean(tx.fields[FIELDS.transactions.isFinancing]);

      total += amount;
      byProvider[provider] = (byProvider[provider] || 0) + amount;
      byService[service] = (byService[service] || 0) + amount;
      byPaymentMethod[payment] = (byPaymentMethod[payment] || 0) + amount;

      if (isFinancing) financingTotal += amount;
    }

    return {
      total,
      byProvider,
      byService,
      byCategory,
      byPaymentMethod,
      transactionCount: transactions.length,
      avgTicket: transactions.length > 0 ? total / transactions.length : 0,
      financingTotal,
    };
  } catch (err) {
    console.error('[Briefing] Failed to fetch revenue range:', err);
    return {
      total: 0, byProvider: {}, byService: {}, byCategory: {},
      byPaymentMethod: {}, transactionCount: 0, avgTicket: 0, financingTotal: 0,
    };
  }
}

// ── Schedule ─────────────────────────────────────────────────

export async function fetchSchedule(date?: string): Promise<ScheduleSnapshot> {
  const targetDate = date || getToday();

  try {
    const appointments = await fetchAll<Record<string, unknown>>(
      Tables.appointments(),
      {
        filterByFormula: `{${FIELDS.appointments.date}} = '${targetDate}'`,
        sort: [{ field: FIELDS.appointments.time, direction: 'asc' }],
      }
    );

    const byProvider: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    let consultCount = 0;
    let newClientCount = 0;

    // Track appointment times per provider to find gaps
    const providerSlots: Record<string, { time: string; duration: number }[]> = {};

    for (const appt of appointments) {
      const provider = String(appt.fields[FIELDS.appointments.provider] || 'Unknown');
      const category = String(appt.fields[FIELDS.appointments.category] || 'Unknown');
      const time = String(appt.fields[FIELDS.appointments.time] || '');
      const duration = Number(appt.fields[FIELDS.appointments.duration]) || 60;
      const isConsult = Boolean(appt.fields[FIELDS.appointments.isConsult]);
      const bookingSource = String(appt.fields[FIELDS.appointments.bookingSource] || '');

      byProvider[provider] = (byProvider[provider] || 0) + 1;
      byCategory[category] = (byCategory[category] || 0) + 1;

      if (isConsult) consultCount++;
      if (bookingSource.toLowerCase().includes('new')) newClientCount++;

      if (!providerSlots[provider]) providerSlots[provider] = [];
      providerSlots[provider].push({ time, duration });
    }

    // Detect schedule gaps (30+ min between appointments)
    const gaps: ScheduleGap[] = [];
    for (const [provider, slots] of Object.entries(providerSlots)) {
      const sorted = slots.sort((a, b) => a.time.localeCompare(b.time));
      for (let i = 0; i < sorted.length - 1; i++) {
        const endOfCurrent = addMinutesToTime(sorted[i].time, sorted[i].duration);
        const nextStart = sorted[i + 1].time;
        const gapMinutes = timeDiffMinutes(endOfCurrent, nextStart);
        if (gapMinutes >= 30) {
          gaps.push({ provider, startTime: endOfCurrent, duration: gapMinutes });
        }
      }
    }

    return {
      totalAppointments: appointments.length,
      byProvider,
      byCategory,
      gaps,
      consultCount,
      newClientCount,
    };
  } catch (err) {
    console.error('[Briefing] Failed to fetch schedule:', err);
    return {
      totalAppointments: 0,
      byProvider: {},
      byCategory: {},
      gaps: [],
      consultCount: 0,
      newClientCount: 0,
    };
  }
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const totalMin = (h || 0) * 60 + (m || 0) + minutes;
  const newH = Math.floor(totalMin / 60);
  const newM = totalMin % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

function timeDiffMinutes(time1: string, time2: string): number {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  return ((h2 || 0) * 60 + (m2 || 0)) - ((h1 || 0) * 60 + (m1 || 0));
}

// ── Alerts ───────────────────────────────────────────────────

export async function fetchAlerts(): Promise<AlertSnapshot> {
  try {
    const alerts = await fetchAll<Record<string, unknown>>(
      Tables.alerts(),
      {
        filterByFormula: `{${FIELDS.alerts.status}} = 'Active'`,
        sort: [{ field: FIELDS.alerts.severity, direction: 'asc' }],
      }
    );

    const items: AlertItem[] = alerts.map((a) => ({
      id: a.id,
      type: String(a.fields[FIELDS.alerts.type] || 'Unknown'),
      severity: (String(a.fields[FIELDS.alerts.severity] || 'info').toLowerCase() as AlertItem['severity']),
      message: String(a.fields[FIELDS.alerts.message] || ''),
      actionRecommended: String(a.fields[FIELDS.alerts.actionRecommended] || ''),
      createdDate: String(a.fields[FIELDS.alerts.createdDate] || ''),
    }));

    const bySeverity = { critical: 0, warning: 0, info: 0 };
    for (const item of items) {
      if (item.severity in bySeverity) {
        bySeverity[item.severity]++;
      }
    }

    return { total: items.length, bySeverity, items };
  } catch (err) {
    console.error('[Briefing] Failed to fetch alerts:', err);
    return { total: 0, bySeverity: { critical: 0, warning: 0, info: 0 }, items: [] };
  }
}

// ── Loyalty ──────────────────────────────────────────────────

export async function fetchLoyalty(): Promise<LoyaltySnapshot> {
  try {
    const memberships = await fetchAll<Record<string, unknown>>(
      Tables.memberships(),
      {}
    );

    let totalMembers = 0;
    let newMembers = 0;
    let churnedMembers = 0;
    let membershipMRR = 0;
    const tierBreakdown: Record<string, number> = {};
    const today = getToday();
    const thirtyDaysAgo = getDaysAgo(30);

    for (const m of memberships) {
      const status = String(m.fields[FIELDS.memberships.status] || '');
      const tier = String(m.fields[FIELDS.memberships.tier] || 'Standard');
      const startDate = String(m.fields[FIELDS.memberships.startDate] || '');
      const monthlyPrice = Number(m.fields[FIELDS.memberships.monthlyPrice]) || 0;

      if (status === 'Active') {
        totalMembers++;
        membershipMRR += monthlyPrice;
        tierBreakdown[tier] = (tierBreakdown[tier] || 0) + 1;

        if (startDate >= thirtyDaysAgo) newMembers++;
      }

      if (status === 'Cancelled' || status === 'Churned') {
        churnedMembers++;
      }
    }

    return {
      totalMembers,
      newMembers,
      churnedMembers,
      membershipMRR,
      tierBreakdown,
      redemptions: 0, // Would require a dedicated redemptions table
      tierUpgrades: 0,
    };
  } catch (err) {
    console.error('[Briefing] Failed to fetch loyalty:', err);
    return {
      totalMembers: 0, newMembers: 0, churnedMembers: 0,
      membershipMRR: 0, tierBreakdown: {}, redemptions: 0, tierUpgrades: 0,
    };
  }
}

// ── Referrals ────────────────────────────────────────────────

export async function fetchReferrals(): Promise<ReferralSnapshot> {
  // Referral data comes from client source tracking
  try {
    const thirtyDaysAgo = getDaysAgo(30);
    const clients = await fetchAll<Record<string, unknown>>(
      Tables.clients(),
      {
        filterByFormula: `AND({${FIELDS.clients.status}} != '', FIND('referral', LOWER({${FIELDS.clients.status}})))`,
      },
      true // skipTestFilter - Clients doesn't have Is Test
    );

    return {
      totalActiveCodes: 0,
      newCodes: 0,
      conversions: clients.length,
      revenueAttributed: 0,
    };
  } catch (err) {
    console.error('[Briefing] Failed to fetch referrals:', err);
    return { totalActiveCodes: 0, newCodes: 0, conversions: 0, revenueAttributed: 0 };
  }
}

// ── Marketing ────────────────────────────────────────────────

export async function fetchMarketing(): Promise<MarketingSnapshot> {
  try {
    const yesterday = getYesterday();
    const sevenDaysAgo = getDaysAgo(7);

    // New leads from clients table
    const newLeads = await fetchAll<Record<string, unknown>>(
      Tables.clients(),
      {
        filterByFormula: `{${FIELDS.clients.status}} = 'New Lead'`,
      },
      true
    );

    // Recent reviews
    const reviews = await fetchAll<Record<string, unknown>>(
      Tables.reviews(),
      {
        filterByFormula: `IS_AFTER({${FIELDS.reviews.reviewDate}}, '${sevenDaysAgo}')`,
      }
    );

    let totalRating = 0;
    for (const r of reviews) {
      totalRating += Number(r.fields[FIELDS.reviews.starRating]) || 0;
    }

    const leadsBySource: Record<string, number> = {};
    for (const l of newLeads) {
      const source = String(l.fields[FIELDS.clients.leadSource] || '').trim();
      if (!source) continue;
      leadsBySource[source] = (leadsBySource[source] || 0) + 1;
    }

    return {
      newLeads: newLeads.length,
      leadsBySource,
      avgLeadScore: 0,
      reviewCount: reviews.length,
      avgRating: reviews.length > 0 ? totalRating / reviews.length : 0,
      reviewVelocity: reviews.length / 7,
    };
  } catch (err) {
    console.error('[Briefing] Failed to fetch marketing:', err);
    return {
      newLeads: 0, leadsBySource: {}, avgLeadScore: 0,
      reviewCount: 0, avgRating: 0, reviewVelocity: 0,
    };
  }
}

// ── Cash Flow ────────────────────────────────────────────────

export async function fetchCashFlow(): Promise<CashFlowSnapshot> {
  try {
    // Check if Plaid is connected by looking for stored connection in Alerts table
    const plaidAlerts = await fetchFirst<Record<string, unknown>>(
      Tables.alerts(),
      1,
      {
        filterByFormula: `AND({${FIELDS.alerts.type}} = 'plaid_connection', {${FIELDS.alerts.status}} = 'Active')`,
      }
    );

    const plaidConnected = plaidAlerts.length > 0;

    return {
      bankBalance: plaidConnected ? null : null, // Would need Plaid API call
      runway: null,
      plaidConnected,
      monthlyBurnRate: null,
    };
  } catch (err) {
    console.error('[Briefing] Failed to fetch cash flow:', err);
    return { bankBalance: null, runway: null, plaidConnected: false, monthlyBurnRate: null };
  }
}

// ── Content Calendar ─────────────────────────────────────────

export async function fetchContentCalendar(): Promise<ContentCalendarSnapshot> {
  // Content is generated by the social auto-post engine, not stored in Airtable
  // This returns a placeholder; the social engine would need to expose today's planned posts
  return {
    postsScheduledToday: [],
  };
}

// ── AI Highlights ────────────────────────────────────────────

export async function fetchAIHighlights(): Promise<AIHighlights> {
  try {
    // Top churn risk - find client with highest churn risk score
    const atRiskMemberships = await fetchFirst<Record<string, unknown>>(
      Tables.memberships(),
      1,
      {
        filterByFormula: `AND({${FIELDS.memberships.status}} = 'Active', {${FIELDS.memberships.churnRiskScore}} > 0)`,
        sort: [{ field: FIELDS.memberships.churnRiskScore, direction: 'desc' }],
      }
    );

    let topChurnRiskClient: AIHighlights['topChurnRiskClient'] = null;
    if (atRiskMemberships.length > 0) {
      const m = atRiskMemberships[0];
      topChurnRiskClient = {
        name: 'At-risk Member',
        score: Number(m.fields[FIELDS.memberships.churnRiskScore]) || 0,
        lastVisit: '',
      };
    }

    // Highest no-show risk - check today's appointments for high-risk ones
    const today = getToday();
    const appointments = await fetchFirst<Record<string, unknown>>(
      Tables.appointments(),
      5,
      {
        filterByFormula: `AND({${FIELDS.appointments.date}} = '${today}', {${FIELDS.appointments.status}} != 'Cancelled')`,
        sort: [{ field: FIELDS.appointments.time, direction: 'asc' }],
      }
    );

    let highestNoShowRisk: AIHighlights['highestNoShowRisk'] = null;
    // Without no-show prediction scores stored in Airtable, we flag appointments
    // without deposits as higher risk
    for (const appt of appointments) {
      const depositPaid = Boolean(appt.fields[FIELDS.appointments.depositPaid]);
      if (!depositPaid) {
        highestNoShowRisk = {
          clientName: 'Appointment (no deposit)',
          service: String(appt.fields[FIELDS.appointments.service] || 'Unknown'),
          time: String(appt.fields[FIELDS.appointments.time] || ''),
          score: 65,
        };
        break;
      }
    }

    return {
      topChurnRiskClient,
      highestNoShowRisk,
      revenueAnomaly: null,
    };
  } catch (err) {
    console.error('[Briefing] Failed to fetch AI highlights:', err);
    return { topChurnRiskClient: null, highestNoShowRisk: null, revenueAnomaly: null };
  }
}

// ── KPI Snapshots ────────────────────────────────────────────

export async function fetchKPISnapshot(date?: string) {
  const targetDate = date || getYesterday();
  try {
    const snapshots = await fetchFirst<Record<string, unknown>>(
      Tables.kpis(),
      1,
      {
        filterByFormula: `AND({${FIELDS.kpiSnapshots.date}} = '${targetDate}', {${FIELDS.kpiSnapshots.period}} = 'Daily')`,
      }
    );
    return snapshots.length > 0 ? snapshots[0].fields : null;
  } catch (err) {
    console.error('[Briefing] Failed to fetch KPI snapshot:', err);
    return null;
  }
}

// ── Provider Performance ─────────────────────────────────────

export async function fetchProviderPerformance(startDate: string, endDate: string) {
  try {
    const appointments = await fetchAll<Record<string, unknown>>(
      Tables.appointments(),
      {
        filterByFormula: `AND(IS_AFTER({${FIELDS.appointments.date}}, '${startDate}'), IS_BEFORE({${FIELDS.appointments.date}}, '${endDate}'))`,
      }
    );

    const providers: Record<string, { revenue: number; appointments: number; shows: number; noShows: number }> = {};

    for (const appt of appointments) {
      const provider = String(appt.fields[FIELDS.appointments.provider] || 'Unknown');
      const status = String(appt.fields[FIELDS.appointments.status] || '');
      const amount = Number(appt.fields[FIELDS.appointments.amountPaid]) || 0;

      if (!providers[provider]) {
        providers[provider] = { revenue: 0, appointments: 0, shows: 0, noShows: 0 };
      }

      providers[provider].appointments++;
      if (status === 'Completed' || status === 'Showed') {
        providers[provider].shows++;
        providers[provider].revenue += amount;
      }
      if (status === 'No-Show') {
        providers[provider].noShows++;
      }
    }

    return providers;
  } catch (err) {
    console.error('[Briefing] Failed to fetch provider performance:', err);
    return {};
  }
}

// ── Client Growth ────────────────────────────────────────────

export async function fetchClientGrowth() {
  try {
    const clients = await fetchAll<Record<string, unknown>>(
      Tables.clients(),
      {},
      true
    );

    let totalClients = 0;
    let newClients = 0;
    let churnedClients = 0;

    for (const c of clients) {
      const status = String(c.fields[FIELDS.clients.status] || '');
      totalClients++;
      if (status === 'New Lead') newClients++;
      if (status === 'Churned') churnedClients++;
    }

    return {
      totalClients,
      newClients,
      churnedClients,
      netGrowth: totalClients - churnedClients,
    };
  } catch (err) {
    console.error('[Briefing] Failed to fetch client growth:', err);
    return { totalClients: 0, newClients: 0, churnedClients: 0, netGrowth: 0 };
  }
}

export {
  formatDate,
  getYesterday,
  getToday,
  getDaysAgo,
  getMonthStart,
  getLastMonthStart,
  getLastMonthEnd,
  getWeekStart,
  getLastWeekStart,
  getLastWeekEnd,
};
