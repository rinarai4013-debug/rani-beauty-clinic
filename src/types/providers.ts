// Provider performance, compensation, goals, scheduling, and development types

// ── CORE PROVIDER ──

export interface Provider {
  id: string;
  name: string;
  role: 'lead_provider' | 'provider' | 'associate' | 'trainee';
  specialties: string[];
  color: string;
  hireDate: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  status: 'active' | 'on_leave' | 'terminated';
}

// ── PERFORMANCE METRICS ──

export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface ProviderRevenue {
  providerId: string;
  period: TimePeriod;
  periodStart: string;
  periodEnd: string;
  totalRevenue: number;
  serviceRevenue: number;
  productRevenue: number;
  membershipRevenue: number;
  previousPeriodRevenue: number;
  growthRate: number;
}

export interface RevenuePerHour {
  providerId: string;
  period: TimePeriod;
  totalRevenue: number;
  hoursWorked: number;
  revenuePerHour: number;
  benchmark: number;
  percentileRank: number;
}

export interface ServiceMixEntry {
  service: string;
  category: string;
  count: number;
  revenue: number;
  percentOfTotal: number;
  avgTicket: number;
}

export interface ServiceMixAnalysis {
  providerId: string;
  topServices: ServiceMixEntry[];
  categoryBreakdown: { category: string; count: number; revenue: number; percent: number }[];
  diversityScore: number; // 0-100, higher = more diverse
}

export interface PerformanceMetrics {
  providerId: string;
  providerName: string;
  period: TimePeriod;
  periodStart: string;
  periodEnd: string;

  // Revenue
  revenue: ProviderRevenue;
  revenuePerHour: RevenuePerHour;
  avgTicketSize: number;

  // Client metrics
  clientRetentionRate: number;
  rebookRate: number;
  noShowRate: number;
  newClientConversionRate: number;
  upsellRate: number;

  // Efficiency
  utilizationRate: number;
  avgAppointmentDuration: number;
  appointmentsCompleted: number;

  // Quality
  avgReviewRating: number;
  reviewCount: number;
  treatmentOutcomeScore: number;

  // Service mix
  serviceMix: ServiceMixAnalysis;
}

export interface ProviderComparison {
  providers: PerformanceMetrics[];
  rankings: ProviderRanking[];
  insights: string[];
}

export interface ProviderRanking {
  providerId: string;
  providerName: string;
  metric: string;
  value: number;
  rank: number;
  percentile: number;
}

export interface TrendPoint {
  date: string;
  value: number;
}

export interface TrendAnalysis {
  providerId: string;
  metric: string;
  dataPoints: TrendPoint[];
  direction: 'improving' | 'stable' | 'declining';
  changeRate: number;
  forecast: number;
}

// ── COMPENSATION ──

export type CommissionTier = { min: number; max: number | null; rate: number };

export interface CompensationConfig {
  providerId: string;
  baseSalary: number;
  payFrequency: 'biweekly' | 'monthly';
  commissionTiers: CommissionTier[];
  serviceCommissions: Record<string, number>; // service name → override rate
  productCommissionRate: number;
  membershipEnrollmentBonus: number;
  performanceBonusThresholds: PerformanceBonusThreshold[];
}

export interface PerformanceBonusThreshold {
  metric: string;
  target: number;
  bonusAmount: number;
  period: 'monthly' | 'quarterly';
}

export interface PayrollPeriod {
  startDate: string;
  endDate: string;
  providerId: string;
  basePay: number;
  serviceCommission: number;
  productCommission: number;
  membershipBonuses: number;
  performanceBonuses: number;
  tips: number;
  grossPay: number;
  estimatedTaxWithholding: number;
  benefitsCost: number;
  netPay: number;
}

export interface CompensationSummary {
  providerId: string;
  providerName: string;
  period: string;
  baseSalary: number;
  totalCommissions: number;
  totalBonuses: number;
  totalTips: number;
  grossCompensation: number;
  estimatedTaxes: number;
  benefitsCost: number;
  netCompensation: number;
  effectiveHourlyRate: number;
  commissionBreakdown: {
    serviceCommission: number;
    productCommission: number;
    membershipBonuses: number;
    tier: string;
    tierRate: number;
  };
}

export interface CompensationModel {
  scenario: string;
  currentComp: CompensationSummary;
  projectedComp: CompensationSummary;
  difference: number;
  percentChange: number;
}

export interface PayEquityAnalysis {
  providers: { name: string; role: string; effectiveRate: number; totalComp: number }[];
  avgRate: number;
  median: number;
  spreadPercent: number;
  equityScore: number; // 0-100, higher = more equitable
  flags: string[];
}

// ── GOALS ──

export type GoalType = 'revenue' | 'service_count' | 'retention' | 'rebook' | 'review' | 'training' | 'custom';
export type GoalStatus = 'not_started' | 'on_track' | 'at_risk' | 'behind' | 'exceeded' | 'completed';

export interface ProviderGoal {
  id: string;
  providerId: string;
  type: GoalType;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  period: 'monthly' | 'quarterly' | 'annual';
  startDate: string;
  endDate: string;
  status: GoalStatus;
  progressPercent: number;
  milestones: GoalMilestone[];
}

export interface GoalMilestone {
  label: string;
  targetValue: number;
  achieved: boolean;
  achievedDate?: string;
}

export interface GoalProgress {
  providerId: string;
  goals: ProviderGoal[];
  overallProgress: number;
  goalsOnTrack: number;
  goalsAtRisk: number;
  goalsBehind: number;
  goalsExceeded: number;
  streak: number;
  coachingRecommendations: CoachingRecommendation[];
}

export interface CoachingRecommendation {
  goalId: string;
  goalTitle: string;
  gap: number;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  actionItems: string[];
}

export interface LeaderboardEntry {
  providerId: string;
  providerName: string;
  rank: number;
  score: number;
  metric: string;
  trend: 'up' | 'down' | 'stable';
  streak: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'revenue' | 'clients' | 'quality' | 'growth' | 'consistency';
  requirement: { metric: string; threshold: number };
  unlockedBy: string[];
  unlockedAt?: string;
}

// ── SCHEDULING ──

export interface WorkingHours {
  providerId: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday
  startTime: string; // HH:MM
  endTime: string;
  isWorkday: boolean;
}

export type TimeOffType = 'pto' | 'sick' | 'personal' | 'bereavement' | 'jury_duty' | 'holiday';
export type TimeOffStatus = 'pending' | 'approved' | 'denied' | 'cancelled';

export interface TimeOffRequest {
  id: string;
  providerId: string;
  type: TimeOffType;
  startDate: string;
  endDate: string;
  hours: number;
  reason: string;
  status: TimeOffStatus;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

export interface TimeOffBalance {
  providerId: string;
  type: TimeOffType;
  annualAllowance: number;
  used: number;
  pending: number;
  available: number;
  carryOver: number;
}

export interface ShiftSwapRequest {
  id: string;
  requesterId: string;
  targetId: string;
  originalDate: string;
  swapDate: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  requestedAt: string;
}

export interface OvertimeRecord {
  providerId: string;
  weekStartDate: string;
  regularHours: number;
  overtimeHours: number;
  overtimeRate: number;
  overtimePay: number;
}

export interface ScheduleTemplate {
  id: string;
  name: string;
  description: string;
  weeks: number;
  shifts: { dayOfWeek: number; startTime: string; endTime: string; providerId: string }[];
}

export interface CoverageCheck {
  date: string;
  timeSlot: string;
  providersAvailable: string[];
  meetsMinimum: boolean;
  minimumRequired: number;
  gaps: { time: string; duration: number }[];
}

// ── PROFESSIONAL DEVELOPMENT ──

export type CECreditStatus = 'planned' | 'in_progress' | 'completed' | 'expired';

export interface CECredit {
  id: string;
  providerId: string;
  title: string;
  provider: string; // Educational provider (not clinic provider)
  credits: number;
  completedDate?: string;
  expiryDate?: string;
  status: CECreditStatus;
  certificateUrl?: string;
  category: string;
}

export interface CECreditSummary {
  providerId: string;
  requiredCredits: number;
  completedCredits: number;
  pendingCredits: number;
  renewalDeadline: string;
  onTrack: boolean;
  credits: CECredit[];
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedHours: number;
  requiredFor: string[]; // service names
  prerequisites: string[];
}

export interface TrainingProgress {
  moduleId: string;
  providerId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
  score?: number;
}

export interface SkillCertification {
  providerId: string;
  service: string;
  certified: boolean;
  certifiedDate?: string;
  expiryDate?: string;
  level: 'trainee' | 'basic' | 'proficient' | 'advanced' | 'expert';
  supervisor?: string;
}

export interface MentorshipPairing {
  id: string;
  mentorId: string;
  menteeId: string;
  startDate: string;
  endDate?: string;
  goals: string[];
  status: 'active' | 'completed' | 'paused';
  notes: string[];
}

export type CareerLevel = 'associate' | 'provider' | 'senior' | 'lead' | 'director';

export interface CareerPath {
  providerId: string;
  currentLevel: CareerLevel;
  nextLevel: CareerLevel | null;
  requirements: CareerRequirement[];
  progressPercent: number;
  estimatedPromotion?: string;
}

export interface CareerRequirement {
  category: string;
  description: string;
  targetValue: number;
  currentValue: number;
  met: boolean;
}

export interface PerformanceReview {
  id: string;
  providerId: string;
  reviewerId: string;
  period: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  overallRating?: number;
  categories: { name: string; rating: number; comments: string }[];
  goals: string[];
  developmentPlan: string[];
}

export interface FeedbackEntry {
  id: string;
  providerId: string;
  fromId: string;
  fromRole: string;
  type: 'peer' | 'manager' | 'self' | 'client';
  rating: number;
  strengths: string[];
  improvements: string[];
  comments: string;
  submittedAt: string;
  anonymous: boolean;
}

export interface TrainingBudget {
  providerId: string;
  annualBudget: number;
  spent: number;
  committed: number;
  available: number;
  items: { description: string; amount: number; date: string; status: 'approved' | 'pending' | 'denied' }[];
}
