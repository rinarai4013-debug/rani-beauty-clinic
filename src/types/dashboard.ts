// Dashboard-wide type definitions

export interface KPIData {
  revenue: {
    today: number;
    wtd: number;
    mtd: number;
    target: number;
    projectedMonth: number;
    trend: number[]; // 7-day sparkline
  };
  bookings: {
    today: number;
    thisWeek: number;
    utilization: number; // 0-100
    trend: number[];
  };
  consults: {
    booked: number;
    completed: number;
    closeRate: number; // 0-100
    showRate: number;
    trend: number[];
  };
  clients: {
    newThisWeek: number;
    activeCount: number;
    rebookRate: number;
    avgTicket: number;
    memberCount: number;
  };
  alerts: AlertItem[];
  clinicScore: ClinicScore;
}

export interface ClinicScore {
  total: number; // 0-100
  breakdown: {
    revenue: number;
    utilization: number;
    consultConversion: number;
    rebooks: number;
    reviews: number;
    followUps: number;
    operations: number;
  };
  status: 'critical' | 'growing' | 'strong' | 'elite';
  streak: number; // days above 80
}

export interface AlertItem {
  id: string;
  type: AlertType;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  actionRecommended: string;
  metricName?: string;
  metricValue?: number;
  thresholdValue?: number;
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  createdAt: string;
}

export type AlertType =
  | 'booking_rate'
  | 'show_rate'
  | 'close_rate'
  | 'no_shows'
  | 'revenue'
  | 'membership_churn'
  | 'negative_review'
  | 'lead_volume'
  | 'provider_capacity'
  | 'financing'
  | 'system_error'
  | 'custom';

export interface RevenueData {
  daily: RevenueEntry[];
  weekly: RevenueEntry[];
  monthly: RevenueEntry[];
  byProvider: ProviderRevenue[];
  byService: ServiceRevenue[];
  byCategory: CategoryRevenue[];
  byPaymentType: PaymentTypeRevenue[];
  summary: {
    gross: number;
    net: number;
    deposits: number;
    refunds: number;
    outstanding: number;
    revenuePerHour: number;
    revenuePerVisit: number;
  };
}

export interface RevenueEntry {
  date: string;
  amount: number;
  target?: number;
}

export interface ProviderRevenue {
  provider: string;
  revenue: number;
  treatments: number;
  avgTicket: number;
  color: string;
}

export interface ServiceRevenue {
  service: string;
  category: string;
  revenue: number;
  count: number;
}

export interface CategoryRevenue {
  category: string;
  revenue: number;
  percentage: number;
}

export interface PaymentTypeRevenue {
  type: string;
  amount: number;
  count: number;
}

export interface LeadFunnelData {
  stages: FunnelStage[];
  metrics: {
    newLeads: number;
    contacted: number;
    consultsBooked: number;
    consultsCompleted: number;
    treatmentPlansSent: number;
    depositsCollected: number;
    converted: number;
    lost: number;
  };
  conversionRates: {
    leadToConsult: number;
    consultShowRate: number;
    consultCloseRate: number;
    depositCaptureRate: number;
  };
  avgResponseTime: number; // minutes
  avgTreatmentPlanValue: number;
  topLeadSources: LeadSource[];
}

export interface FunnelStage {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface LeadSource {
  source: string;
  count: number;
  conversionRate: number;
}

export interface ScheduleData {
  today: AppointmentItem[];
  upcoming: AppointmentItem[];
  utilization: {
    total: number;
    byProvider: { provider: string; rate: number }[];
    byRoom: { room: string; rate: number }[];
  };
  stats: {
    totalSlots: number;
    filledSlots: number;
    openSlots: number;
    noShows: number;
    cancellations: number;
    waitlist: number;
  };
}

export interface AppointmentItem {
  id: string;
  clientName: string;
  service: string;
  category: string;
  provider: string;
  room: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'no_show' | 'cancelled';
  revenue: number;
  isConsult: boolean;
  isNewClient: boolean;
  depositPaid: boolean;
}

export interface FinanceData {
  cashPosition: number;
  expenses: ExpenseEntry[];
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    weeklyBurn: number;
    monthlyFixedExpenses: number;
    monthlyVariableExpenses: number;
  };
  expensesByCategory: { category: string; amount: number }[];
}

export interface ExpenseEntry {
  id: string;
  date: string;
  vendor: string;
  category: string;
  subcategory?: string;
  amount: number;
  isFixed: boolean;
  isRecurring: boolean;
  notes?: string;
}

export interface WinItem {
  id: string;
  type: 'revenue' | 'booking' | 'review' | 'achievement' | 'milestone' | 'streak';
  title: string;
  description: string;
  timestamp: string;
  icon?: string;
}

export interface ActivityItem {
  id: string;
  type: 'booking' | 'payment' | 'lead' | 'review' | 'alert' | 'form' | 'achievement';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export type DateRange = 'today' | 'yesterday' | 'last7' | 'last30' | 'wtd' | 'mtd' | 'qtd' | 'ytd' | 'custom';

export interface DateRangeValue {
  start: Date;
  end: Date;
  label: string;
}
