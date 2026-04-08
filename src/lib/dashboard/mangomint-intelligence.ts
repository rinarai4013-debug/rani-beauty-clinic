import { fetchAll, fetchFirst, Tables } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';
import { BOOKING_URL, REVENUE_TARGET_MONTHLY } from '@/data/clinic-config';
import { loadAppointmentsForDate, loadAppointmentsForRange } from '@/lib/booking/data';
import { BOOKABLE_SERVICES } from '@/lib/booking/services';
import { DEFAULT_PROVIDERS, DEFAULT_ROOMS } from '@/lib/booking/availability';
import { getServices, getTodayAppointments, isConfigured as isMangomintConfigured, isWebhookConfigured } from '@/lib/mangomint/client';
import { optimizeSchedule, type AppointmentData, type HistoricalPattern, type ProviderAvailability, type RoomConfig, type ServiceScheduleConfig } from '@/lib/schedule/optimizer';
import type { AlertItem, KPIData } from '@/types/dashboard';

interface AirtableAppointmentFields {
  [FIELDS.appointments.service]?: string;
  [FIELDS.appointments.category]?: string;
  [FIELDS.appointments.provider]?: string;
  [FIELDS.appointments.date]?: string;
  [FIELDS.appointments.time]?: string;
  [FIELDS.appointments.duration]?: number;
  [FIELDS.appointments.status]?: string;
  [FIELDS.appointments.isConsult]?: boolean;
  [FIELDS.appointments.consultOutcome]?: string;
  [FIELDS.appointments.depositPaid]?: boolean;
  [FIELDS.appointments.amountQuoted]?: number;
  [FIELDS.appointments.amountPaid]?: number;
  [FIELDS.appointments.bookingSource]?: string;
  Client?: string;
  'Client Name'?: string;
  'Client ID'?: string;
}

interface AirtableTransactionFields {
  [FIELDS.transactions.date]?: string;
  [FIELDS.transactions.type]?: string;
  [FIELDS.transactions.amount]?: number;
  [FIELDS.transactions.paymentMethod]?: string;
  [FIELDS.transactions.provider]?: string;
  [FIELDS.transactions.serviceName]?: string;
  [FIELDS.transactions.status]?: string;
  [FIELDS.transactions.isFinancing]?: boolean;
  [FIELDS.transactions.financingProvider]?: string;
}

interface AirtableClientFields {
  [FIELDS.clients.name]?: string;
  [FIELDS.clients.email]?: string;
  [FIELDS.clients.phone]?: string;
  [FIELDS.clients.status]?: string;
  [FIELDS.clients.appointments]?: string[] | number;
  [FIELDS.clients.memberships]?: string[] | number;
  'Created Date'?: string;
}

interface AirtableAlertFields {
  [FIELDS.alerts.type]?: string;
  [FIELDS.alerts.severity]?: 'info' | 'warning' | 'critical';
  [FIELDS.alerts.metricName]?: string;
  [FIELDS.alerts.metricValue]?: number;
  [FIELDS.alerts.thresholdValue]?: number;
  [FIELDS.alerts.message]?: string;
  [FIELDS.alerts.actionRecommended]?: string;
  [FIELDS.alerts.status]?: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  [FIELDS.alerts.createdDate]?: string;
}

interface AirtableMembershipFields {
  [FIELDS.memberships.status]?: string;
}

interface AirtableReviewFields {
  [FIELDS.reviews.platform]?: string;
  [FIELDS.reviews.starRating]?: number;
  [FIELDS.reviews.reviewDate]?: string;
  [FIELDS.reviews.sentiment]?: string;
}

export interface MangomintHealth {
  configured: boolean;
  webhookConfigured: boolean;
  bookingUrl: string;
  todayBookingCount: number;
  serviceCount: number;
  syncMode: 'mangomint-primary' | 'airtable-fallback';
  lastSyncStatus: 'healthy' | 'degraded' | 'offline';
  issues: string[];
}

export interface NoShowRiskItem {
  appointmentId: string;
  clientName: string;
  service: string;
  provider: string;
  time: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  reasons: string[];
  suggestedAction: string;
}

export interface ProviderPerformanceItem {
  provider: string;
  appointments: number;
  completed: number;
  noShows: number;
  cancellations: number;
  utilization: number;
  revenue: number;
  avgTicket: number;
  completionRate: number;
  noShowRate: number;
  fillPressure: 'light' | 'healthy' | 'urgent';
  nextOpenWindowHours: number;
  recommendation: string;
}

export interface ProviderScheduleItem {
  provider: string;
  totalAppointments: number;
  bookedHours: number;
  openHours: number;
  utilization: number;
  gaps: Array<{
    date: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    suggestedAction: string;
  }>;
}

export interface AtRiskClientItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  riskScore: number;
  reason: string;
  suggestedAction: string;
}

export interface ClientOverviewItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  appointmentCount: number;
  membershipCount: number;
  segment: 'new' | 'active' | 'lapsed' | 'churned';
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return end;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function round(value: number): number {
  return Math.round(value);
}

function toNumber(value: unknown): number {
  return typeof value === 'number' ? value : Number(value || 0);
}

function normalizeAppointmentStatus(value: string | undefined): string {
  const status = (value || '').toLowerCase();
  if (status.includes('no-show') || status.includes('noshow')) return 'no_show';
  if (status.includes('checked')) return 'checked_in';
  if (status.includes('in progress')) return 'in_progress';
  if (status.includes('cancel')) return 'cancelled';
  if (status.includes('complete')) return 'completed';
  if (status.includes('confirm')) return 'confirmed';
  return 'scheduled';
}

function isCompletedStatus(value: string | undefined): boolean {
  return normalizeAppointmentStatus(value) === 'completed';
}

function mapToOptimizerStatus(value: string): AppointmentData['status'] {
  switch (normalizeAppointmentStatus(value)) {
    case 'confirmed':
      return 'confirmed';
    case 'checked_in':
      return 'checked-in';
    case 'in_progress':
      return 'checked-in';
    case 'completed':
      return 'completed';
    case 'no_show':
      return 'no-show';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'tentative';
  }
}

function getMonthlyRevenueTarget(): number {
  return REVENUE_TARGET_MONTHLY;
}

function daysElapsedInMonth(now: Date): number {
  return now.getDate();
}

function daysInCurrentMonth(now: Date): number {
  return endOfMonth(now).getDate();
}

function buildGeneratedAlerts(kpis: KPIData, noShowRisks: NoShowRiskItem[]): AlertItem[] {
  const alerts: AlertItem[] = [];

  if (kpis.revenue.mtd < getMonthlyRevenueTarget() * 0.35) {
    alerts.push({
      id: 'generated-revenue-pace',
      type: 'revenue',
      severity: 'warning',
      message: 'Month-to-date revenue is trailing six-figure pace.',
      actionRecommended: 'Push rebooking, financing closes, and same-week fill offers today.',
      metricName: 'Revenue pace',
      metricValue: kpis.revenue.mtd,
      thresholdValue: getMonthlyRevenueTarget(),
      status: 'active',
      createdAt: new Date().toISOString(),
    });
  }

  if (kpis.bookings.utilization < 65) {
    alerts.push({
      id: 'generated-utilization',
      type: 'provider_capacity',
      severity: 'warning',
      message: 'Provider utilization is below a healthy six-figure pace.',
      actionRecommended: 'Target open slots with reactivation, waitlist outreach, and high-intent consult follow-up.',
      metricName: 'Utilization',
      metricValue: kpis.bookings.utilization,
      thresholdValue: 75,
      status: 'active',
      createdAt: new Date().toISOString(),
    });
  }

  const highRiskCount = noShowRisks.filter((item) => item.riskLevel === 'high').length;
  if (highRiskCount > 0) {
    alerts.push({
      id: 'generated-no-show-risk',
      type: 'no_shows',
      severity: 'critical',
      message: `${highRiskCount} appointments have high no-show risk today.`,
      actionRecommended: 'Front desk should text-call confirm the top-risk list before noon.',
      metricName: 'High-risk appointments',
      metricValue: highRiskCount,
      thresholdValue: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    });
  }

  return alerts;
}

export async function getMangomintHealth(): Promise<MangomintHealth> {
  const issues: string[] = [];
  let todayBookingCount = 0;
  let serviceCount = 0;
  let lastSyncStatus: MangomintHealth['lastSyncStatus'] = 'offline';
  let syncMode: MangomintHealth['syncMode'] = 'airtable-fallback';

  if (isMangomintConfigured()) {
    try {
      const [todayAppointments, services] = await Promise.all([
        getTodayAppointments(),
        getServices(),
      ]);
      todayBookingCount = todayAppointments.length;
      serviceCount = services.length;
      lastSyncStatus = 'healthy';
      syncMode = 'mangomint-primary';
    } catch {
      issues.push('Mangomint API is configured but the live fetch failed.');
      lastSyncStatus = 'degraded';
    }
  } else {
    issues.push('Mangomint API key is not configured.');
  }

  if (!isWebhookConfigured()) {
    issues.push('Mangomint webhook secret is missing, so booking events cannot be trusted end-to-end.');
  }

  return {
    configured: isMangomintConfigured(),
    webhookConfigured: isWebhookConfigured(),
    bookingUrl: BOOKING_URL,
    todayBookingCount,
    serviceCount,
    syncMode,
    lastSyncStatus,
    issues,
  };
}

export async function getDashboardKpis(): Promise<KPIData> {
  const now = new Date();
  const today = formatDate(now);
  const weekStart = formatDate(startOfWeek(now));
  const monthStart = formatDate(startOfMonth(now));

  const [appointments, transactions, clients, memberships, activeAlerts, recentReviews] = await Promise.all([
    fetchAll<AirtableAppointmentFields>(Tables.appointments(), {
      filterByFormula: `AND({Date} >= "${monthStart}", {Date} <= "${today}")`,
      sort: [{ field: 'Date', direction: 'asc' }, { field: 'Time', direction: 'asc' }],
    }),
    fetchAll<AirtableTransactionFields>(Tables.transactions(), {
      filterByFormula: `AND({Date} >= "${monthStart}", {Date} <= "${today}", {Status} = "Completed")`,
      sort: [{ field: 'Date', direction: 'asc' }],
    }),
    fetchAll<AirtableClientFields>(Tables.clients(), undefined, true),
    fetchAll<AirtableMembershipFields>(Tables.memberships(), undefined, true),
    fetchFirst<AirtableAlertFields>(Tables.alerts(), 10, {
      filterByFormula: `{Status} = "active"`,
      sort: [{ field: 'Created Date', direction: 'desc' }],
    }, true),
    fetchAll<AirtableReviewFields>(Tables.reviews(), {
      filterByFormula: `{${FIELDS.reviews.reviewDate}} >= "${monthStart}"`,
    }, true),
  ]);

  const revenueToday = transactions
    .filter((record) => record.fields.Date === today && record.fields.Status === 'Completed')
    .reduce((sum, record) => sum + toNumber(record.fields.Amount), 0);

  const revenueWtd = transactions
    .filter((record) => (record.fields.Date || '') >= weekStart)
    .reduce((sum, record) => sum + toNumber(record.fields.Amount), 0);

  const revenueMtd = transactions.reduce((sum, record) => sum + toNumber(record.fields.Amount), 0);

  const appointmentRecords = appointments.map((record) => ({
    ...record,
    normalizedStatus: normalizeAppointmentStatus(record.fields.Status),
  }));

  const bookingsToday = appointmentRecords.filter((record) => record.fields.Date === today).length;
  const bookingsThisWeek = appointmentRecords.filter((record) => (record.fields.Date || '') >= weekStart).length;

  const bookedMinutesThisWeek = appointmentRecords
    .filter((record) => (record.fields.Date || '') >= weekStart && record.normalizedStatus !== 'cancelled')
    .reduce((sum, record) => sum + toNumber(record.fields.Duration || 60), 0);
  const providerCount = Math.max(
    1,
    new Set(appointmentRecords.map((record) => record.fields.Provider).filter(Boolean)).size,
  );
  const availableMinutesThisWeek = providerCount * 5 * 8 * 60;
  const utilization = availableMinutesThisWeek > 0 ? round((bookedMinutesThisWeek / availableMinutesThisWeek) * 100) : 0;

  const consultAppointments = appointmentRecords.filter((record) => !!record.fields['Is Consult'] || (record.fields['Service Name'] || '').toLowerCase().includes('consult'));
  const consultBooked = consultAppointments.filter((record) => (record.fields.Date || '') >= weekStart).length;
  const consultCompletedRecords = consultAppointments.filter((record) => isCompletedStatus(record.fields.Status) && (record.fields.Date || '') >= weekStart);
  const consultCompleted = consultCompletedRecords.length;
  const consultOutcomeWins = consultCompletedRecords.filter((record) => {
    const outcome = (record.fields['Consult Outcome'] || '').toLowerCase();
    return outcome.includes('book') || outcome.includes('close') || outcome.includes('sale') || toNumber(record.fields['Amount Paid']) > 0;
  }).length;
  const closeRate = consultCompleted > 0 ? round((consultOutcomeWins / consultCompleted) * 100) : 0;
  const showRate = consultBooked > 0 ? round((consultCompleted / consultBooked) * 100) : 0;

  const activeCount = clients.filter((record) => {
    const status = (record.fields.Status || '').toLowerCase();
    return status !== 'churned';
  }).length;
  const memberCount = memberships.filter((record) => (record.fields.Status || '').toLowerCase() === 'active').length;

  const clientVisitCounts = new Map<string, number>();
  appointmentRecords.forEach((record) => {
    const key = String(record.fields['Client ID'] || record.fields.Client || record.fields['Client Name'] || record.id);
    clientVisitCounts.set(key, (clientVisitCounts.get(key) || 0) + 1);
  });

  // New clients this week: clients with status "New Lead" whose first appointment is this week,
  // OR clients whose earliest appointment in this month falls within this week (first-time visitors)
  const clientFirstSeenThisMonth = new Map<string, string>();
  appointmentRecords.forEach((record) => {
    const key = String(record.fields['Client ID'] || record.fields.Client || record.fields['Client Name'] || record.id);
    const date = String(record.fields.Date || '');
    if (!date) return;
    const previous = clientFirstSeenThisMonth.get(key);
    if (!previous || date < previous) {
      clientFirstSeenThisMonth.set(key, date);
    }
  });
  // Count clients whose first appointment this month is in the current week
  // AND who only have 1 visit this month (likely genuinely new)
  const newThisWeek = Array.from(clientFirstSeenThisMonth.entries())
    .filter(([key, date]) => date >= weekStart && (clientVisitCounts.get(key) || 0) <= 1)
    .length;
  const repeatingClients = Array.from(clientVisitCounts.values()).filter((count) => count > 1).length;
  const rebookRate = clientVisitCounts.size > 0 ? round((repeatingClients / clientVisitCounts.size) * 100) : 0;
  const avgTicket = appointmentRecords.filter((record) => isCompletedStatus(record.fields.Status)).length > 0
    ? round(
        appointmentRecords
          .filter((record) => isCompletedStatus(record.fields.Status))
          .reduce((sum, record) => sum + Math.max(toNumber(record.fields['Amount Paid']), toNumber(record.fields['Amount Quoted'])), 0) /
          appointmentRecords.filter((record) => isCompletedStatus(record.fields.Status)).length,
      )
    : 0;

  const trendDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));
    return formatDate(date);
  });

  const revenueTrend = trendDates.map((date) =>
    transactions
      .filter((record) => record.fields.Date === date)
      .reduce((sum, record) => sum + toNumber(record.fields.Amount), 0),
  );
  const bookingTrend = trendDates.map((date) =>
    appointmentRecords.filter((record) => record.fields.Date === date && record.normalizedStatus !== 'cancelled').length,
  );
  const consultTrend = trendDates.map((date) =>
    consultAppointments.filter((record) => record.fields.Date === date).length,
  );

  const noShowRisks = await getNoShowRisk(today);

  const alerts: AlertItem[] = activeAlerts.map((record) => ({
    id: record.id,
    type: (record.fields.Type as AlertItem['type']) || 'custom',
    severity: record.fields.Severity || 'info',
    message: record.fields.Message || 'Alert',
    actionRecommended: record.fields['Action Recommended'] || 'Review this item.',
    metricName: record.fields['Metric Name'],
    metricValue: toNumber(record.fields['Metric Value']),
    thresholdValue: toNumber(record.fields['Threshold Value']),
    status: record.fields.Status || 'active',
    createdAt: record.fields['Created Date'] || new Date().toISOString(),
  }));

  const fullAlerts = [...alerts, ...buildGeneratedAlerts({
    revenue: {
      today: round(revenueToday),
      wtd: round(revenueWtd),
      mtd: round(revenueMtd),
      target: getMonthlyRevenueTarget(),
      projectedMonth: round((revenueMtd / Math.max(daysElapsedInMonth(now), 1)) * daysInCurrentMonth(now)),
      trend: revenueTrend.map(round),
    },
    bookings: {
      today: bookingsToday,
      thisWeek: bookingsThisWeek,
      utilization,
      trend: bookingTrend,
    },
    consults: {
      booked: consultBooked,
      completed: consultCompleted,
      closeRate,
      showRate,
      trend: consultTrend,
    },
    clients: {
      newThisWeek,
      activeCount,
      rebookRate,
      avgTicket,
      memberCount,
    },
    alerts: [],
    clinicScore: {
      total: 0,
      breakdown: {
        revenue: 0,
        utilization: 0,
        consultConversion: 0,
        rebooks: 0,
        reviews: 0,
        followUps: 0,
        operations: 0,
      },
      status: 'critical',
      streak: 0,
    },
  }, noShowRisks)];

  const projectedMonth = round((revenueMtd / Math.max(daysElapsedInMonth(now), 1)) * daysInCurrentMonth(now));

  // Calculate real review score from Airtable data
  const reviewRatings = recentReviews
    .map((r) => toNumber(r.fields[FIELDS.reviews.starRating]))
    .filter((r) => r > 0);
  const avgRating = reviewRatings.length > 0
    ? reviewRatings.reduce((sum, r) => sum + r, 0) / reviewRatings.length
    : 0;
  // Score: 5-star = 100, 4-star = 80, etc. 0 reviews = 0 (unknown, not penalized in total)
  const reviewScore = reviewRatings.length > 0 ? round((avgRating / 5) * 100) : 0;
  const hasReviewData = reviewRatings.length > 0;

  const clinicScoreTotal = round(
    (
      Math.min(projectedMonth / getMonthlyRevenueTarget(), 1) * 30 +
      Math.min(utilization / 85, 1) * 15 +
      Math.min(closeRate / 65, 1) * 15 +
      Math.min(rebookRate / 70, 1) * 10 +
      Math.min(showRate / 90, 1) * 10 +
      (hasReviewData ? Math.min(reviewScore / 100, 1) * 5 : 0) +
      Math.max(0, 1 - noShowRisks.filter((item) => item.riskLevel === 'high').length / 5) * (hasReviewData ? 5 : 10) +
      Math.max(0, 1 - fullAlerts.filter((item) => item.severity === 'critical').length / 4) * 10
    ) * 100 / 100,
  );

  return {
    revenue: {
      today: round(revenueToday),
      wtd: round(revenueWtd),
      mtd: round(revenueMtd),
      target: getMonthlyRevenueTarget(),
      projectedMonth,
      trend: revenueTrend.map(round),
    },
    bookings: {
      today: bookingsToday,
      thisWeek: bookingsThisWeek,
      utilization,
      trend: bookingTrend,
    },
    consults: {
      booked: consultBooked,
      completed: consultCompleted,
      closeRate,
      showRate,
      trend: consultTrend,
    },
    clients: {
      newThisWeek,
      activeCount,
      rebookRate,
      avgTicket,
      memberCount,
    },
    alerts: fullAlerts.slice(0, 8),
    clinicScore: {
      total: Math.max(0, Math.min(100, clinicScoreTotal)),
      breakdown: {
        revenue: Math.min(100, round((projectedMonth / getMonthlyRevenueTarget()) * 100)),
        utilization,
        consultConversion: closeRate,
        rebooks: rebookRate,
        reviews: reviewScore,
        followUps: Math.max(40, 100 - noShowRisks.filter((item) => item.riskLevel === 'high').length * 12),
        operations: Math.max(45, 100 - fullAlerts.filter((item) => item.severity === 'critical').length * 15),
      },
      status: clinicScoreTotal >= 85 ? 'elite' : clinicScoreTotal >= 70 ? 'strong' : clinicScoreTotal >= 50 ? 'growing' : 'critical',
      streak: 0, // TODO: Calculate from KPI Snapshots table (days above score 80)
    },
  };
}

export async function getNoShowRisk(date: string): Promise<NoShowRiskItem[]> {
  const appointments = await loadAppointmentsForDate(date);

  return appointments
    .filter((appointment) => ['pending', 'confirmed'].includes(appointment.status))
    .map((appointment) => {
      let score = 10;
      const reasons: string[] = [];

      if (appointment.depositPaid <= 0) {
        score += 25;
        reasons.push('No deposit on file');
      }
      if (appointment.serviceName.toLowerCase().includes('consult')) {
        score += 20;
        reasons.push('Consults historically ghost more often than treatment follow-ups');
      }
      if (appointment.startTime >= '16:00') {
        score += 10;
        reasons.push('Late-day appointments are more likely to cancel');
      }
      if (appointment.clientName.toLowerCase().includes('walk-in') || appointment.clientName.toLowerCase() === 'client') {
        score += 20;
        reasons.push('Client profile is incomplete');
      }
      if (appointment.estimatedRevenue >= 700) {
        score += 10;
        reasons.push('High-ticket service needs proactive confirmation');
      }
      if (appointment.status === 'pending') {
        score += 15;
        reasons.push('Appointment is not yet confirmed');
      }

      const riskScore = Math.min(95, score);
      const riskLevel: NoShowRiskItem['riskLevel'] = riskScore >= 70 ? 'high' : riskScore >= 45 ? 'medium' : 'low';

      return {
        appointmentId: appointment.id,
        clientName: appointment.clientName,
        service: appointment.serviceName,
        provider: appointment.providerName,
        time: appointment.startTime,
        riskScore,
        riskLevel,
        reasons,
        suggestedAction: riskLevel === 'high'
          ? 'Call and text-confirm this client, then offer a backup fill candidate.'
          : riskLevel === 'medium'
            ? 'Send a same-day reminder and confirm arrival window.'
            : 'Keep standard reminder cadence.',
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 12);
}

function buildHistoricalPatterns(appointments: Awaited<ReturnType<typeof loadAppointmentsForRange>>): HistoricalPattern[] {
  const map = new Map<string, { bookings: number; revenue: number; noShows: number }>();

  appointments.forEach((appointment) => {
    const date = new Date(`${appointment.date}T${appointment.startTime}:00`);
    const key = `${date.getDay()}-${date.getHours()}`;
    const entry = map.get(key) || { bookings: 0, revenue: 0, noShows: 0 };
    entry.bookings += 1;
    entry.revenue += appointment.estimatedRevenue;
    if (appointment.status === 'no-show') entry.noShows += 1;
    map.set(key, entry);
  });

  return Array.from(map.entries()).map(([key, value]) => {
    const [dayOfWeek, hour] = key.split('-').map(Number);
    return {
      dayOfWeek,
      hour,
      avgBookings: value.bookings,
      avgRevenue: value.revenue,
      noShowRate: value.bookings > 0 ? round((value.noShows / value.bookings) * 100) : 0,
      walkInRate: 0,
    };
  });
}

export async function getScheduleOptimizationSnapshot(startDate: string, endDate: string) {
  const appointments = await loadAppointmentsForRange(startDate, endDate);
  const historicalAppointments = await loadAppointmentsForRange(
    formatDate(new Date(new Date(startDate).getTime() - 21 * 24 * 60 * 60 * 1000)),
    endDate,
  );

  const inputAppointments: AppointmentData[] = appointments.map((appointment) => ({
    id: appointment.id,
    date: appointment.date,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    service: appointment.serviceName,
    provider: appointment.providerName,
    room: appointment.roomId,
    clientName: appointment.clientName,
    clientType: appointment.isMember ? 'member' : appointment.isNewClient ? 'new' : 'returning',
    estimatedRevenue: appointment.estimatedRevenue,
    noShowRisk: appointment.depositPaid > 0 ? 20 : 60,
    status: appointment.status === 'pending' ? 'tentative' : mapToOptimizerStatus(appointment.status),
  }));

  const providers: ProviderAvailability[] = DEFAULT_PROVIDERS.map((provider) => {
    const workingDays = Object.entries(provider.workingHours)
      .filter(([, hours]) => hours?.isAvailable)
      .map(([day]) => ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(day));
    const mondayHours = provider.workingHours.monday;
    const fridayHours = provider.workingHours.friday;
    return {
      name: provider.providerName,
      role: provider.role === 'esthetician' ? 'esthetician' : 'provider',
      workingDays,
      startTime: mondayHours?.start || '09:00',
      endTime: fridayHours?.end || '17:00',
      services: provider.qualifiedServices,
      maxDailyAppointments: provider.maxDailyAppointments,
      preferredBreakTime: provider.lunchBreak?.start || '12:00',
    };
  });

  const rooms: RoomConfig[] = DEFAULT_ROOMS.map((room) => ({
    name: room.name,
    equipment: room.equipment,
    suitableServices: room.compatibleServices,
  }));

  const serviceConfig: ServiceScheduleConfig[] = BOOKABLE_SERVICES.map((service) => ({
    service: service.name,
    duration: service.duration,
    setupTime: service.prepTime + service.cleanupTime,
    requiredEquipment: service.requiredEquipment,
    requiredRoom: service.requiredRooms[0],
    revenue: service.price,
    revenuePerMinute: round(service.price / Math.max(service.duration, 1)),
  }));

  return optimizeSchedule({
    appointments: inputAppointments,
    providers,
    rooms,
    historicalPatterns: buildHistoricalPatterns(historicalAppointments),
    serviceConfig,
    dateRange: { start: startDate, end: endDate },
  });
}

export async function getProviderPerformance(): Promise<ProviderPerformanceItem[]> {
  const now = new Date();
  const monthStart = formatDate(startOfMonth(now));
  const monthEnd = formatDate(endOfMonth(now));

  const [appointments, transactions, optimization] = await Promise.all([
    loadAppointmentsForRange(monthStart, monthEnd),
    fetchAll<AirtableTransactionFields>(Tables.transactions(), {
      filterByFormula: `AND({Date} >= "${monthStart}", {Date} <= "${monthEnd}", {Status} = "Completed")`,
    }),
    getScheduleOptimizationSnapshot(formatDate(startOfToday()), formatDate(endOfWeek(now))),
  ]);

  const nextGapByProvider = new Map<string, number>();
  optimization.gaps.forEach((gap) => {
    const existing = nextGapByProvider.get(gap.provider);
    if (existing === undefined || gap.durationMinutes > existing) {
      nextGapByProvider.set(gap.provider, gap.durationMinutes);
    }
  });

  return DEFAULT_PROVIDERS.map((provider) => {
    const providerAppointments = appointments.filter((appointment) => appointment.providerName === provider.providerName);
    const completed = providerAppointments.filter((appointment) => appointment.status === 'completed').length;
    const noShows = providerAppointments.filter((appointment) => appointment.status === 'no-show').length;
    const cancellations = providerAppointments.filter((appointment) => appointment.status === 'cancelled').length;
    const bookedHours = providerAppointments.reduce((sum, appointment) => sum + appointment.duration / 60, 0);
    const availableHours = Math.max(1, now.getDate()) * 8;
    const utilization = round((bookedHours / availableHours) * 100);
    const revenue = round(
      transactions
        .filter((record) => record.fields.Provider === provider.providerName)
        .reduce((sum, record) => sum + toNumber(record.fields.Amount), 0),
    );
    const avgTicket = completed > 0 ? round(revenue / completed) : 0;
    const completionRate = providerAppointments.length > 0 ? round((completed / providerAppointments.length) * 100) : 0;
    const noShowRate = providerAppointments.length > 0 ? round((noShows / providerAppointments.length) * 100) : 0;
    const nextOpenWindowHours = round((nextGapByProvider.get(provider.providerName) || 0) / 60);
    const fillPressure: ProviderPerformanceItem['fillPressure'] =
      utilization < 55 ? 'urgent' : utilization < 75 ? 'healthy' : 'light';

    return {
      provider: provider.providerName,
      appointments: providerAppointments.length,
      completed,
      noShows,
      cancellations,
      utilization,
      revenue,
      avgTicket,
      completionRate,
      noShowRate,
      fillPressure,
      nextOpenWindowHours,
      recommendation:
        fillPressure === 'urgent'
          ? 'Push same-week reactivation and waitlist fills into this calendar immediately.'
          : fillPressure === 'healthy'
            ? 'Protect premium slots for high-ticket services and consult closes.'
            : 'Use this provider for overflow and add-on opportunities without overloading.',
    };
  });
}

export async function getProviderScheduleSnapshot(): Promise<ProviderScheduleItem[]> {
  const start = formatDate(startOfToday());
  const end = formatDate(endOfWeek(new Date()));
  const [appointments, optimization] = await Promise.all([
    loadAppointmentsForRange(start, end),
    getScheduleOptimizationSnapshot(start, end),
  ]);

  return DEFAULT_PROVIDERS.map((provider) => {
    const providerAppointments = appointments.filter((appointment) => appointment.providerName === provider.providerName);
    const bookedHours = providerAppointments.reduce((sum, appointment) => sum + appointment.duration / 60, 0);
    const totalOpenHours = optimization.gaps
      .filter((gap) => gap.provider === provider.providerName)
      .reduce((sum, gap) => sum + gap.durationMinutes / 60, 0);
    const utilization = round((bookedHours / Math.max(bookedHours + totalOpenHours, 1)) * 100);

    return {
      provider: provider.providerName,
      totalAppointments: providerAppointments.length,
      bookedHours: round(bookedHours * 10) / 10,
      openHours: round(totalOpenHours * 10) / 10,
      utilization,
      gaps: optimization.gaps
        .filter((gap) => gap.provider === provider.providerName)
        .slice(0, 5)
        .map((gap) => ({
          date: gap.date,
          startTime: gap.startTime,
          endTime: gap.endTime,
          durationMinutes: gap.durationMinutes,
          suggestedAction: gap.suggestedAction.replace(/_/g, ' '),
        })),
    };
  });
}

export async function getAtRiskClients(): Promise<AtRiskClientItem[]> {
  const clients = await fetchAll<AirtableClientFields>(Tables.clients(), undefined, true);

  return clients
    .map((record) => {
      const status = record.fields.Status || 'Unknown';
      const appointmentsValue = record.fields.Appointments;
      const appointmentCount = Array.isArray(appointmentsValue)
        ? appointmentsValue.length
        : typeof appointmentsValue === 'number'
          ? appointmentsValue
          : 0;
      const riskScore =
        status.toLowerCase().includes('churn') ? 95 :
        status.toLowerCase().includes('lapsed 90') ? 88 :
        status.toLowerCase().includes('lapsed 60') ? 74 :
        status.toLowerCase().includes('lapsed 30') ? 58 :
        appointmentCount === 0 ? 52 :
        28;

      const reason =
        status.toLowerCase().includes('churn') ? 'Client is already marked churned and needs a comeback offer.' :
        status.toLowerCase().includes('lapsed') ? `Client is tagged ${status}.` :
        appointmentCount === 0 ? 'Lead has not converted into a booked visit.' :
        'Client is stable.';

      return {
        id: record.id,
        name: record.fields.Client || 'Unknown Client',
        email: record.fields.Email || '',
        phone: record.fields.Phone || '',
        status,
        riskScore,
        reason,
        suggestedAction:
          riskScore >= 80
            ? 'Front desk should call, text, and present a high-value return offer.'
            : riskScore >= 60
              ? 'Send a timed win-back offer tied to the next open slot window.'
              : 'Keep in standard nurture cadence.',
      };
    })
    .filter((client) => client.riskScore >= 50)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 25);
}

export async function getClientsOverview(): Promise<ClientOverviewItem[]> {
  const clients = await fetchAll<AirtableClientFields>(Tables.clients(), undefined, true);

  return clients
    .map((record) => {
      const status = record.fields.Status || 'Unknown';
      const appointmentsValue = record.fields.Appointments;
      const membershipsValue = record.fields.Memberships;
      const appointmentCount = Array.isArray(appointmentsValue)
        ? appointmentsValue.length
        : typeof appointmentsValue === 'number'
          ? appointmentsValue
          : 0;
      const membershipCount = Array.isArray(membershipsValue)
        ? membershipsValue.length
        : typeof membershipsValue === 'number'
          ? membershipsValue
          : 0;
      const loweredStatus = status.toLowerCase();

      const segment: ClientOverviewItem['segment'] =
        loweredStatus.includes('churn') ? 'churned' :
        loweredStatus.includes('lapsed') ? 'lapsed' :
        loweredStatus.includes('new') ? 'new' :
        'active';

      return {
        id: record.id,
        name: record.fields.Client || 'Unknown Client',
        email: record.fields.Email || '',
        phone: record.fields.Phone || '',
        status,
        appointmentCount,
        membershipCount,
        segment,
      };
    })
    .sort((a, b) => b.appointmentCount - a.appointmentCount)
    .slice(0, 50);
}

export async function getUpcomingSchedule(days = 3) {
  const start = startOfToday();
  const end = new Date(start);
  end.setDate(end.getDate() + Math.max(days - 1, 0));
  const appointments = await loadAppointmentsForRange(formatDate(start), formatDate(end));

  return appointments
    .filter((appointment) => !['cancelled', 'completed'].includes(appointment.status))
    .sort((a, b) => `${a.date}-${a.startTime}`.localeCompare(`${b.date}-${b.startTime}`))
    .map((appointment) => ({
      id: appointment.id,
      clientName: appointment.clientName,
      service: appointment.serviceName,
      provider: appointment.providerName,
      date: appointment.date,
      time: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      estimatedRevenue: appointment.estimatedRevenue,
      depositPaid: appointment.depositPaid > 0,
    }));
}
