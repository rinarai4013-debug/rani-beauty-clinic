/**
 * Rani Beauty Clinic - CEO Briefing System Types
 *
 * Shared types for daily, weekly, and monthly briefing generators.
 */

// ── Revenue ──────────────────────────────────────────────────
export interface RevenueSnapshot {
  total: number;
  byProvider: Record<string, number>;
  byService: Record<string, number>;
  byCategory: Record<string, number>;
  byPaymentMethod: Record<string, number>;
  transactionCount: number;
  avgTicket: number;
  financingTotal: number;
}

// ── Schedule ─────────────────────────────────────────────────
export interface ScheduleSnapshot {
  totalAppointments: number;
  byProvider: Record<string, number>;
  byCategory: Record<string, number>;
  gaps: ScheduleGap[];
  consultCount: number;
  newClientCount: number;
}

export interface ScheduleGap {
  provider: string;
  startTime: string;
  duration: number; // minutes
}

// ── Alerts ───────────────────────────────────────────────────
export interface AlertSnapshot {
  total: number;
  bySeverity: { critical: number; warning: number; info: number };
  items: AlertItem[];
}

export interface AlertItem {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  actionRecommended: string;
  createdDate: string;
}

// ── Loyalty ──────────────────────────────────────────────────
export interface LoyaltySnapshot {
  totalMembers: number;
  newMembers: number;
  churnedMembers: number;
  membershipMRR: number;
  tierBreakdown: Record<string, number>;
  redemptions: number;
  tierUpgrades: number;
}

// ── Referral ─────────────────────────────────────────────────
export interface ReferralSnapshot {
  totalActiveCodes: number;
  newCodes: number;
  conversions: number;
  revenueAttributed: number;
}

// ── Marketing ────────────────────────────────────────────────
export interface MarketingSnapshot {
  newLeads: number;
  leadsBySource: Record<string, number>;
  avgLeadScore: number;
  reviewCount: number;
  avgRating: number;
  reviewVelocity: number; // reviews per day (7-day avg)
}

// ── Cash Flow ────────────────────────────────────────────────
export interface CashFlowSnapshot {
  bankBalance: number | null; // null if Plaid not connected
  runway: number | null; // days
  plaidConnected: boolean;
  monthlyBurnRate: number | null;
}

// ── Content Calendar ─────────────────────────────────────────
export interface ContentCalendarSnapshot {
  postsScheduledToday: ContentPost[];
}

export interface ContentPost {
  platform: string;
  type: string;
  topic: string;
  scheduledTime: string;
}

// ── AI Engine Highlights ─────────────────────────────────────
export interface AIHighlights {
  topChurnRiskClient: { name: string; score: number; lastVisit: string } | null;
  highestNoShowRisk: { clientName: string; service: string; time: string; score: number } | null;
  revenueAnomaly: { type: string; message: string } | null;
}

// ── Action Items ─────────────────────────────────────────────
export interface ActionItem {
  priority: 'high' | 'medium' | 'low';
  category: string;
  action: string;
  reason: string;
}

// ── Briefing Data ────────────────────────────────────────────
export interface DailyBriefingData {
  date: string;
  dayOfWeek: string;
  revenue: RevenueSnapshot;
  schedule: ScheduleSnapshot;
  alerts: AlertSnapshot;
  loyalty: LoyaltySnapshot;
  referrals: ReferralSnapshot;
  marketing: MarketingSnapshot;
  cashFlow: CashFlowSnapshot;
  contentCalendar: ContentCalendarSnapshot;
  aiHighlights: AIHighlights;
  actionItems: ActionItem[];
}

export interface WeeklyBriefingData {
  weekStart: string;
  weekEnd: string;
  currentWeekRevenue: number;
  previousWeekRevenue: number;
  weekOverWeekChange: number;
  topServices: { name: string; revenue: number; count: number }[];
  providerUtilization: { name: string; hoursBooked: number; hoursAvailable: number; rate: number }[];
  clientRetentionRate: number;
  newVsReturning: { new: number; returning: number };
  marketingChannelPerformance: { channel: string; leads: number; conversions: number; revenue: number }[];
  complianceScore: number;
  complianceScoreChange: number;
  inventoryAlerts: { product: string; status: string; action: string }[];
  cashFlowTrend: { date: string; balance: number }[];
  topWins: string[];
  topPriorities: string[];
}

export interface MonthlyBriefingData {
  month: string;
  year: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  profitMargin: number;
  revenueByCategory: Record<string, number>;
  providerPerformance: { name: string; revenue: number; appointments: number; avgTicket: number; showRate: number }[];
  clientGrowth: { totalClients: number; newClients: number; churnedClients: number; netGrowth: number };
  loyaltyROI: { memberRevenue: number; memberCost: number; roi: number };
  referralROI: { referralRevenue: number; referralCost: number; roi: number };
  marketingSpendVsRevenue: { spend: number; revenue: number; roi: number };
  complianceAudit: { score: number; issues: string[]; resolved: number; pending: number };
  inventoryTurnover: { avgTurnoverDays: number; deadStock: number; topMovers: string[] };
  cashPosition: { balance: number | null; runway: number | null; trend: 'improving' | 'stable' | 'declining' };
  strategicRecommendations: string[];
}

// ── Rendered Briefing ────────────────────────────────────────
export interface RenderedBriefing {
  subject: string;
  preheader: string;
  html: string;
  text: string;
  type: 'daily' | 'weekly' | 'monthly';
  generatedAt: string;
  data: DailyBriefingData | WeeklyBriefingData | MonthlyBriefingData;
}

// ── Briefing Log ─────────────────────────────────────────────
export interface BriefingLogEntry {
  id?: string;
  date: string;
  type: 'daily' | 'weekly' | 'monthly';
  status: 'sent' | 'failed' | 'skipped';
  recipient: string;
  subject: string;
  error?: string;
  sentAt: string;
}

// ── Briefing Settings ────────────────────────────────────────
export interface BriefingSettings {
  dailyEnabled: boolean;
  weeklyEnabled: boolean;
  monthlyEnabled: boolean;
  recipientEmail: string;
  timezone: string;
}
