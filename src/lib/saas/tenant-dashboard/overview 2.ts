/**
 * RaniOS Tenant Dashboard — Overview Module
 *
 * Aggregates KPIs, utilization, alerts, top services, provider performance,
 * gamification score, and quick actions for a single tenant's dashboard home.
 * Every query is scoped to the resolved tenant via TenantDatabaseClient.
 */

import type { TenantDatabaseClient } from '@/lib/tenant/database';
import type { TenantConfig } from '@/lib/tenant/config';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RevenueKPIs {
  today: number;
  wtd: number;
  mtd: number;
  ytd: number;
  todayChange: number;   // % vs same day last week
  mtdChange: number;     // % vs prior month same period
  ytdChange: number;     // % vs prior year same period
  currency: string;
}

export interface AppointmentKPIs {
  todayCount: number;
  todayCompleted: number;
  todayCancelled: number;
  todayNoShow: number;
  weekCount: number;
  utilizationRate: number;  // 0–100
  avgDuration: number;      // minutes
}

export interface NewClientKPIs {
  today: number;
  wtd: number;
  mtd: number;
  conversionRate: number;  // lead → client %
  topSource: string;
}

export interface TopService {
  name: string;
  revenue: number;
  count: number;
  avgPrice: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ProviderSummary {
  name: string;
  revenue: number;
  appointments: number;
  utilization: number;      // 0–100
  avgRating: number;        // 1–5
  noShowRate: number;       // 0–100
}

export interface AlertSummary {
  total: number;
  critical: number;
  warning: number;
  info: number;
  noShows: number;
  churnRisks: number;
  inventoryAlerts: number;
  recentAlerts: DashboardAlert[];
}

export interface DashboardAlert {
  id: string;
  type: 'no_show' | 'churn_risk' | 'inventory' | 'revenue_anomaly' | 'schedule_gap' | 'review' | 'system';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  actionUrl?: string;
  createdAt: string;
  acknowledged: boolean;
}

export type QuickActionType =
  | 'log_sale'
  | 'add_lead'
  | 'view_schedule'
  | 'send_message'
  | 'add_appointment'
  | 'run_report'
  | 'check_inventory'
  | 'view_reviews';

export interface QuickAction {
  type: QuickActionType;
  label: string;
  description: string;
  icon: string;
  href: string;
  count?: number;
}

export interface ClinicHealthScore {
  overall: number;         // 0–100
  components: HealthComponent[];
  level: string;
  levelThreshold: number;
  nextLevel: string;
  nextLevelThreshold: number;
  xp: number;
  streak: number;          // consecutive days with activity
}

export interface HealthComponent {
  name: string;
  score: number;
  weight: number;
  detail: string;
  trend: 'up' | 'down' | 'stable';
}

export interface TenantOverviewData {
  revenue: RevenueKPIs;
  appointments: AppointmentKPIs;
  newClients: NewClientKPIs;
  topServices: TopService[];
  providers: ProviderSummary[];
  alerts: AlertSummary;
  quickActions: QuickAction[];
  healthScore: ClinicHealthScore;
  lastUpdated: string;
}

// ─── Revenue KPIs ───────────────────────────────────────────────────────────

export async function getRevenueKPIs(
  db: TenantDatabaseClient,
  _tenant: TenantConfig
): Promise<RevenueKPIs> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = getStartOfWeek(now).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

  const transactions = await db.fetchAll<{
    Amount: number;
    Date: string;
    Status: string;
  }>('Transactions', {
    filterByFormula: `AND(IS_AFTER({Date}, '${startOfYear}'), {Status} != 'Refunded')`,
    fields: ['Amount', 'Date', 'Status'],
  });

  let today = 0, wtd = 0, mtd = 0, ytd = 0;

  for (const { fields } of transactions) {
    const amount = fields.Amount || 0;
    const date = fields.Date || '';
    ytd += amount;
    if (date >= startOfMonth) mtd += amount;
    if (date >= startOfWeek) wtd += amount;
    if (date >= startOfDay) today += amount;
  }

  // Prior period comparisons - simplified calculation
  const lastWeekSameDay = new Date(now);
  lastWeekSameDay.setDate(lastWeekSameDay.getDate() - 7);
  const priorDayStart = new Date(lastWeekSameDay.getFullYear(), lastWeekSameDay.getMonth(), lastWeekSameDay.getDate()).toISOString();
  const priorDayEnd = new Date(lastWeekSameDay.getFullYear(), lastWeekSameDay.getMonth(), lastWeekSameDay.getDate() + 1).toISOString();

  const priorDayTxns = await db.fetchAll<{ Amount: number }>('Transactions', {
    filterByFormula: `AND(IS_AFTER({Date}, '${priorDayStart}'), IS_BEFORE({Date}, '${priorDayEnd}'), {Status} != 'Refunded')`,
    fields: ['Amount'],
  });

  const priorDayTotal = priorDayTxns.reduce((s, r) => s + (r.fields.Amount || 0), 0);
  const todayChange = priorDayTotal > 0 ? ((today - priorDayTotal) / priorDayTotal) * 100 : 0;

  return {
    today: Math.round(today * 100) / 100,
    wtd: Math.round(wtd * 100) / 100,
    mtd: Math.round(mtd * 100) / 100,
    ytd: Math.round(ytd * 100) / 100,
    todayChange: Math.round(todayChange * 10) / 10,
    mtdChange: 0,  // Would need prior month data
    ytdChange: 0,  // Would need prior year data
    currency: 'USD',
  };
}

// ─── Appointment KPIs ───────────────────────────────────────────────────────

export async function getAppointmentKPIs(
  db: TenantDatabaseClient,
  _tenant: TenantConfig
): Promise<AppointmentKPIs> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
  const startOfWeek = getStartOfWeek(now).toISOString();
  const endOfWeek = new Date(getStartOfWeek(now).getTime() + 7 * 86400000).toISOString();

  const todayAppts = await db.fetchAll<{
    Status: string;
    Duration: number;
    'Start Time': string;
  }>('Appointments', {
    filterByFormula: `AND(IS_AFTER({Start Time}, '${startOfDay}'), IS_BEFORE({Start Time}, '${endOfDay}'))`,
    fields: ['Status', 'Duration', 'Start Time'],
  });

  const weekAppts = await db.fetchAll<{
    Status: string;
  }>('Appointments', {
    filterByFormula: `AND(IS_AFTER({Start Time}, '${startOfWeek}'), IS_BEFORE({Start Time}, '${endOfWeek}'))`,
    fields: ['Status'],
  });

  const todayCount = todayAppts.length;
  const todayCompleted = todayAppts.filter(a => a.fields.Status === 'Completed').length;
  const todayCancelled = todayAppts.filter(a => a.fields.Status === 'Cancelled').length;
  const todayNoShow = todayAppts.filter(a => a.fields.Status === 'No Show').length;

  const durations = todayAppts.map(a => a.fields.Duration || 30);
  const avgDuration = durations.length > 0
    ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)
    : 0;

  // Utilization: completed hours / available hours (assume 8h per provider day)
  const totalMinutesBooked = durations.reduce((s, d) => s + d, 0);
  const availableMinutes = 8 * 60; // Single provider day - should be dynamic
  const utilizationRate = Math.min(100, Math.round((totalMinutesBooked / availableMinutes) * 100));

  return {
    todayCount,
    todayCompleted,
    todayCancelled,
    todayNoShow,
    weekCount: weekAppts.length,
    utilizationRate,
    avgDuration,
  };
}

// ─── New Client KPIs ────────────────────────────────────────────────────────

export async function getNewClientKPIs(
  db: TenantDatabaseClient,
  _tenant: TenantConfig
): Promise<NewClientKPIs> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = getStartOfWeek(now).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const clients = await db.fetchAll<{
    'Created Date': string;
    Status: string;
    Source: string;
  }>('Clients', {
    filterByFormula: `IS_AFTER({Created Date}, '${startOfMonth}')`,
    fields: ['Created Date', 'Status', 'Source'],
  });

  let today = 0, wtd = 0;
  const sourceCounts: Record<string, number> = {};

  for (const { fields } of clients) {
    const date = fields['Created Date'] || '';
    if (date >= startOfDay) today++;
    if (date >= startOfWeek) wtd++;
    const source = fields.Source || 'Unknown';
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  }

  const totalLeads = clients.filter(c => c.fields.Status === 'Lead').length;
  const converted = clients.filter(c => c.fields.Status === 'Active').length;
  const conversionRate = totalLeads + converted > 0
    ? Math.round((converted / (totalLeads + converted)) * 100)
    : 0;

  const topSource = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  return {
    today,
    wtd,
    mtd: clients.length,
    conversionRate,
    topSource,
  };
}

// ─── Top Services ───────────────────────────────────────────────────────────

export async function getTopServices(
  db: TenantDatabaseClient,
  _tenant: TenantConfig,
  limit = 10
): Promise<TopService[]> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const transactions = await db.fetchAll<{
    Service: string;
    Amount: number;
    Date: string;
  }>('Transactions', {
    filterByFormula: `AND(IS_AFTER({Date}, '${startOfMonth}'), {Status} != 'Refunded')`,
    fields: ['Service', 'Amount', 'Date'],
  });

  const serviceMap = new Map<string, { revenue: number; count: number; amounts: number[] }>();

  for (const { fields } of transactions) {
    const service = fields.Service || 'Unknown';
    const existing = serviceMap.get(service) || { revenue: 0, count: 0, amounts: [] };
    existing.revenue += fields.Amount || 0;
    existing.count += 1;
    existing.amounts.push(fields.Amount || 0);
    serviceMap.set(service, existing);
  }

  return Array.from(serviceMap.entries())
    .map(([name, data]) => ({
      name,
      revenue: Math.round(data.revenue * 100) / 100,
      count: data.count,
      avgPrice: Math.round((data.revenue / data.count) * 100) / 100,
      trend: 'stable' as const,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

// ─── Provider Performance ───────────────────────────────────────────────────

export async function getProviderSummary(
  db: TenantDatabaseClient,
  _tenant: TenantConfig
): Promise<ProviderSummary[]> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [appointments, transactions, reviews] = await Promise.all([
    db.fetchAll<{
      Provider: string;
      Status: string;
      'Start Time': string;
    }>('Appointments', {
      filterByFormula: `IS_AFTER({Start Time}, '${startOfMonth}')`,
      fields: ['Provider', 'Status', 'Start Time'],
    }),
    db.fetchAll<{
      Provider: string;
      Amount: number;
    }>('Transactions', {
      filterByFormula: `AND(IS_AFTER({Date}, '${startOfMonth}'), {Status} != 'Refunded')`,
      fields: ['Provider', 'Amount'],
    }),
    db.fetchAll<{
      Provider: string;
      Rating: number;
    }>('Reviews', {
      filterByFormula: `IS_AFTER({Date}, '${startOfMonth}')`,
      fields: ['Provider', 'Rating'],
    }),
  ]);

  const providerMap = new Map<string, {
    revenue: number;
    appointments: number;
    completed: number;
    noShows: number;
    ratings: number[];
  }>();

  for (const { fields } of appointments) {
    const name = fields.Provider || 'Unknown';
    const existing = providerMap.get(name) || {
      revenue: 0, appointments: 0, completed: 0, noShows: 0, ratings: [],
    };
    existing.appointments++;
    if (fields.Status === 'Completed') existing.completed++;
    if (fields.Status === 'No Show') existing.noShows++;
    providerMap.set(name, existing);
  }

  for (const { fields } of transactions) {
    const name = fields.Provider || 'Unknown';
    const existing = providerMap.get(name) || {
      revenue: 0, appointments: 0, completed: 0, noShows: 0, ratings: [],
    };
    existing.revenue += fields.Amount || 0;
    providerMap.set(name, existing);
  }

  for (const { fields } of reviews) {
    const name = fields.Provider || 'Unknown';
    const existing = providerMap.get(name);
    if (existing && fields.Rating) {
      existing.ratings.push(fields.Rating);
    }
  }

  return Array.from(providerMap.entries())
    .map(([name, data]) => ({
      name,
      revenue: Math.round(data.revenue * 100) / 100,
      appointments: data.appointments,
      utilization: data.appointments > 0
        ? Math.min(100, Math.round((data.completed / 20) * 100)) // 20 working days
        : 0,
      avgRating: data.ratings.length > 0
        ? Math.round((data.ratings.reduce((s, r) => s + r, 0) / data.ratings.length) * 10) / 10
        : 0,
      noShowRate: data.appointments > 0
        ? Math.round((data.noShows / data.appointments) * 100)
        : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

// ─── Alerts ─────────────────────────────────────────────────────────────────

export async function getAlertSummary(
  db: TenantDatabaseClient,
  _tenant: TenantConfig
): Promise<AlertSummary> {
  const alerts = await db.fetchAll<{
    Type: string;
    Severity: string;
    Title: string;
    Message: string;
    'Action URL': string;
    'Created At': string;
    Acknowledged: boolean;
  }>('Alerts', {
    filterByFormula: `{Acknowledged} = FALSE()`,
    sort: [{ field: 'Created At', direction: 'desc' }],
  });

  const mapped: DashboardAlert[] = alerts.map(a => ({
    id: a.id,
    type: (a.fields.Type || 'system') as DashboardAlert['type'],
    severity: (a.fields.Severity || 'info') as DashboardAlert['severity'],
    title: a.fields.Title || '',
    message: a.fields.Message || '',
    actionUrl: a.fields['Action URL'] || undefined,
    createdAt: a.fields['Created At'] || new Date().toISOString(),
    acknowledged: a.fields.Acknowledged || false,
  }));

  return {
    total: mapped.length,
    critical: mapped.filter(a => a.severity === 'critical').length,
    warning: mapped.filter(a => a.severity === 'warning').length,
    info: mapped.filter(a => a.severity === 'info').length,
    noShows: mapped.filter(a => a.type === 'no_show').length,
    churnRisks: mapped.filter(a => a.type === 'churn_risk').length,
    inventoryAlerts: mapped.filter(a => a.type === 'inventory').length,
    recentAlerts: mapped.slice(0, 5),
  };
}

// ─── Quick Actions ──────────────────────────────────────────────────────────

export function getQuickActions(_tenant: TenantConfig): QuickAction[] {
  return [
    {
      type: 'log_sale',
      label: 'Log Sale',
      description: 'Record a new transaction',
      icon: 'DollarSign',
      href: '/tenant/revenue?action=log',
    },
    {
      type: 'add_lead',
      label: 'Add Lead',
      description: 'Create a new client lead',
      icon: 'UserPlus',
      href: '/tenant/clients?action=add',
    },
    {
      type: 'view_schedule',
      label: 'View Schedule',
      description: "Today's appointments",
      icon: 'Calendar',
      href: '/tenant/schedule',
    },
    {
      type: 'send_message',
      label: 'Send Message',
      description: 'SMS or email a client',
      icon: 'MessageSquare',
      href: '/tenant/communications',
    },
    {
      type: 'add_appointment',
      label: 'Book Appointment',
      description: 'Schedule a new appointment',
      icon: 'CalendarPlus',
      href: '/tenant/schedule?action=book',
    },
    {
      type: 'run_report',
      label: 'Run Report',
      description: 'Generate a custom report',
      icon: 'BarChart3',
      href: '/tenant/reports',
    },
    {
      type: 'check_inventory',
      label: 'Check Inventory',
      description: 'View stock levels',
      icon: 'Package',
      href: '/tenant/integrations?tab=inventory',
    },
    {
      type: 'view_reviews',
      label: 'View Reviews',
      description: 'Recent client reviews',
      icon: 'Star',
      href: '/tenant/communications?tab=reviews',
    },
  ];
}

// ─── Clinic Health Score (Gamification) ─────────────────────────────────────

export async function getClinicHealthScore(
  db: TenantDatabaseClient,
  tenant: TenantConfig
): Promise<ClinicHealthScore> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [transactions, appointments, clients, reviews] = await Promise.all([
    db.fetchAll<{ Amount: number }>('Transactions', {
      filterByFormula: `AND(IS_AFTER({Date}, '${startOfMonth}'), {Status} != 'Refunded')`,
      fields: ['Amount'],
    }),
    db.fetchAll<{ Status: string }>('Appointments', {
      filterByFormula: `IS_AFTER({Start Time}, '${startOfMonth}')`,
      fields: ['Status'],
    }),
    db.fetchAll<{ Status: string }>('Clients', {
      filterByFormula: `IS_AFTER({Created Date}, '${startOfMonth}')`,
      fields: ['Status'],
    }),
    db.fetchAll<{ Rating: number }>('Reviews', {
      filterByFormula: `IS_AFTER({Date}, '${startOfMonth}')`,
      fields: ['Rating'],
    }),
  ]);

  const mtdRevenue = transactions.reduce((s, r) => s + (r.fields.Amount || 0), 0);
  const completedAppts = appointments.filter(a => a.fields.Status === 'Completed').length;
  const noShows = appointments.filter(a => a.fields.Status === 'No Show').length;
  const newClients = clients.length;
  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + (r.fields.Rating || 0), 0) / reviews.length
    : 0;

  // Revenue score (0–100 based on monthly target)
  const revenueTarget = 30000; // Default target, could be configurable
  const revenueScore = Math.min(100, Math.round((mtdRevenue / revenueTarget) * 100));

  // Booking score
  const bookingTarget = 100;
  const bookingScore = Math.min(100, Math.round((completedAppts / bookingTarget) * 100));

  // Retention score (inverse of no-show rate)
  const totalAppts = appointments.length;
  const noShowRate = totalAppts > 0 ? (noShows / totalAppts) * 100 : 0;
  const retentionScore = Math.round(Math.max(0, 100 - noShowRate * 5));

  // Growth score
  const growthTarget = 20;
  const growthScore = Math.min(100, Math.round((newClients / growthTarget) * 100));

  // Reputation score
  const reputationScore = avgRating > 0 ? Math.round((avgRating / 5) * 100) : 50;

  const components: HealthComponent[] = [
    { name: 'Revenue', score: revenueScore, weight: 30, detail: `$${mtdRevenue.toLocaleString()} MTD`, trend: 'stable' },
    { name: 'Bookings', score: bookingScore, weight: 25, detail: `${completedAppts} completed`, trend: 'stable' },
    { name: 'Retention', score: retentionScore, weight: 20, detail: `${Math.round(noShowRate)}% no-show rate`, trend: 'stable' },
    { name: 'Growth', score: growthScore, weight: 15, detail: `${newClients} new clients`, trend: 'stable' },
    { name: 'Reputation', score: reputationScore, weight: 10, detail: `${avgRating.toFixed(1)} avg rating`, trend: 'stable' },
  ];

  const overall = Math.round(
    components.reduce((s, c) => s + c.score * (c.weight / 100), 0)
  );

  const { level, levelThreshold, nextLevel, nextLevelThreshold } = getLevel(overall);

  return {
    overall,
    components,
    level,
    levelThreshold,
    nextLevel,
    nextLevelThreshold,
    xp: overall * 100,
    streak: 0, // Would need daily tracking
  };
}

// ─── Full Overview ──────────────────────────────────────────────────────────

export async function getTenantOverview(
  db: TenantDatabaseClient,
  tenant: TenantConfig
): Promise<TenantOverviewData> {
  const [revenue, appointments, newClients, topServices, providers, alerts, healthScore] =
    await Promise.all([
      getRevenueKPIs(db, tenant),
      getAppointmentKPIs(db, tenant),
      getNewClientKPIs(db, tenant),
      getTopServices(db, tenant),
      getProviderSummary(db, tenant),
      getAlertSummary(db, tenant),
      getClinicHealthScore(db, tenant),
    ]);

  return {
    revenue,
    appointments,
    newClients,
    topServices,
    providers,
    alerts,
    quickActions: getQuickActions(tenant),
    healthScore,
    lastUpdated: new Date().toISOString(),
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

interface LevelInfo {
  level: string;
  levelThreshold: number;
  nextLevel: string;
  nextLevelThreshold: number;
}

function getLevel(score: number): LevelInfo {
  if (score >= 90) return { level: 'Diamond', levelThreshold: 90, nextLevel: 'Diamond', nextLevelThreshold: 100 };
  if (score >= 75) return { level: 'Platinum', levelThreshold: 75, nextLevel: 'Diamond', nextLevelThreshold: 90 };
  if (score >= 60) return { level: 'Gold', levelThreshold: 60, nextLevel: 'Platinum', nextLevelThreshold: 75 };
  if (score >= 40) return { level: 'Silver', levelThreshold: 40, nextLevel: 'Gold', nextLevelThreshold: 60 };
  return { level: 'Bronze', levelThreshold: 0, nextLevel: 'Silver', nextLevelThreshold: 40 };
}
