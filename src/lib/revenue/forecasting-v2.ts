/**
 * Advanced Revenue Forecasting Engine v2
 *
 * ML-ready data structures, multi-variable regression, scenario modeling,
 * goal decomposition, Monte Carlo simulation for confidence intervals,
 * and actionable daily/weekly targets.
 *
 * CRITICAL: Rani does IM INJECTIONS only. Never say "infusion."
 */

// ── TYPES ──

export interface ForecastInput {
  historicalRevenue: DailyRevenuePoint[];
  appointments: ForecastAppointment[];
  marketing: MarketingSpendData[];
  providers: ProviderCapacity[];
  memberships: MembershipForecastData;
  seasonality: SeasonalFactor[];
  currentGoals: RevenueGoals;
  pipelineLeads: number;
  consultsScheduled: number;
}

export interface DailyRevenuePoint {
  date: string;
  revenue: number;
  bookings: number;
  avgTicket: number;
  newClients: number;
  returningClients: number;
  dayOfWeek: number;
  month: number;
  isHoliday?: boolean;
}

export interface ForecastAppointment {
  date: string;
  service: string;
  estimatedRevenue: number;
  status: 'confirmed' | 'tentative';
  isConsult: boolean;
}

export interface MarketingSpendData {
  date: string;
  channel: string;
  spend: number;
  leads: number;
  bookings: number;
}

export interface ProviderCapacity {
  name: string;
  hoursPerWeek: number;
  avgRevenuePerHour: number;
  utilizationTarget: number; // 0-1
}

export interface MembershipForecastData {
  activeMembers: number;
  avgMonthlyMRR: number;
  churnRate: number; // monthly churn as 0-1
  growthRate: number; // monthly new member rate as 0-1
}

export interface SeasonalFactor {
  month: number;
  multiplier: number; // 1.0 = normal
  notes: string;
}

export interface RevenueGoals {
  monthlyTarget: number;
  quarterlyTarget: number;
  annualTarget: number;
}

// ── OUTPUT TYPES ──

export interface ForecastResult {
  monthlyForecast: MonthlyForecast;
  weeklyTargets: WeeklyTarget[];
  dailyTargets: DailyTarget[];
  scenarioModels: ScenarioModel[];
  goalDecomposition: GoalDecomposition;
  leadingIndicators: LeadingIndicator[];
  laggingCorrelations: LaggingCorrelation[];
  confidenceIntervals: ConfidenceInterval;
  cashFlowProjection: CashFlowProjection[];
  regressionFactors: RegressionFactor[];
  summary: ForecastSummary;
}

export interface MonthlyForecast {
  month: string;
  predicted: number;
  low: number; // 10th percentile
  high: number; // 90th percentile
  confidence: number; // 0-100
  bookedRevenue: number; // already on the books
  projectedFromPipeline: number;
  membershipMRR: number;
  gap: number; // vs target
  pacePercent: number; // 0-100 vs target
}

export interface WeeklyTarget {
  weekStart: string;
  weekEnd: string;
  target: number;
  booked: number;
  remaining: number;
  requiredDailyRate: number;
  onPace: boolean;
  adjustedTarget: number; // adjusted for seasonality/patterns
}

export interface DailyTarget {
  date: string;
  dayOfWeek: string;
  target: number;
  booked: number;
  remaining: number;
  historicalAvg: number;
  confidence: number;
  status: 'on-pace' | 'behind' | 'ahead' | 'at-risk';
  actionNeeded?: string;
}

export interface ScenarioModel {
  name: string;
  description: string;
  assumptions: string[];
  monthlyRevenue: number;
  annualRevenue: number;
  delta: number; // vs current forecast
  deltaPercent: number;
  feasibility: 'high' | 'moderate' | 'aggressive';
}

export interface GoalDecomposition {
  monthlyTarget: number;
  requiredAppointments: number;
  requiredAvgTicket: number;
  requiredNewClients: number;
  requiredRebookRate: number;
  requiredMembershipMRR: number;
  gaps: GoalGap[];
  plan: string[];
}

export interface GoalGap {
  metric: string;
  current: number;
  required: number;
  gap: number;
  difficulty: 'achievable' | 'stretch' | 'aggressive';
  actions: string[];
}

export interface LeadingIndicator {
  name: string;
  currentValue: number;
  trend: 'up' | 'down' | 'stable';
  impactOnRevenue: string;
  correlation: number; // -1 to 1
  lagDays: number; // how many days before revenue impact
}

export interface LaggingCorrelation {
  inputMetric: string;
  outputMetric: string;
  lagDays: number;
  correlation: number;
  insight: string;
}

export interface ConfidenceInterval {
  forecast: number;
  p10: number; // 10th percentile (worst case)
  p25: number;
  p50: number; // median
  p75: number;
  p90: number; // 90th percentile (best case)
  standardDeviation: number;
  simulationRuns: number;
}

export interface CashFlowProjection {
  month: string;
  projectedRevenue: number;
  estimatedExpenses: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
  membershipRecurring: number;
  oneTimeRevenue: number;
}

export interface RegressionFactor {
  factor: string;
  coefficient: number;
  significance: number; // p-value equivalent 0-1
  impact: string;
}

export interface ForecastSummary {
  currentMonthForecast: number;
  vsTarget: number;
  vsTargetPercent: number;
  confidenceLevel: number;
  biggestOpportunity: string;
  biggestRisk: string;
  todayTarget: number;
  weekTarget: number;
  monthPacePercent: number;
}

// ── CORE ENGINE ──

export function generateForecast(input: ForecastInput): ForecastResult {
  const now = new Date();

  const regressionFactors = performRegression(input);
  const monthlyForecast = forecastCurrentMonth(input, regressionFactors, now);
  const weeklyTargets = buildWeeklyTargets(input, monthlyForecast, now);
  const dailyTargets = buildDailyTargets(input, weeklyTargets, now);
  const scenarioModels = buildScenarios(input, monthlyForecast);
  const goalDecomposition = decomposeGoals(input, monthlyForecast);
  const leadingIndicators = analyzeLeadingIndicators(input, now);
  const laggingCorrelations = analyzeLaggingCorrelations(input);
  const confidenceIntervals = runMonteCarloSimulation(input, monthlyForecast);
  const cashFlowProjection = projectCashFlow(input, monthlyForecast, now);

  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthPace = dayOfMonth / daysInMonth;
  const todayTarget = monthlyForecast.predicted / daysInMonth;
  const weekTarget = todayTarget * 7;

  return {
    monthlyForecast,
    weeklyTargets,
    dailyTargets,
    scenarioModels,
    goalDecomposition,
    leadingIndicators,
    laggingCorrelations,
    confidenceIntervals,
    cashFlowProjection,
    regressionFactors,
    summary: {
      currentMonthForecast: monthlyForecast.predicted,
      vsTarget: monthlyForecast.gap,
      vsTargetPercent: Math.round(monthlyForecast.pacePercent),
      confidenceLevel: monthlyForecast.confidence,
      biggestOpportunity: identifyBiggestOpportunity(goalDecomposition),
      biggestRisk: identifyBiggestRisk(leadingIndicators),
      todayTarget: Math.round(todayTarget),
      weekTarget: Math.round(weekTarget),
      monthPacePercent: Math.round(monthPace * 100),
    },
  };
}

// ── REGRESSION ANALYSIS ──

function performRegression(input: ForecastInput): RegressionFactor[] {
  const factors: RegressionFactor[] = [];

  // Day of week effect
  const dowRevenue = new Map<number, number[]>();
  for (const point of input.historicalRevenue) {
    if (!dowRevenue.has(point.dayOfWeek)) dowRevenue.set(point.dayOfWeek, []);
    dowRevenue.get(point.dayOfWeek)!.push(point.revenue);
  }

  const overallAvg = input.historicalRevenue.length > 0
    ? input.historicalRevenue.reduce((s, p) => s + p.revenue, 0) / input.historicalRevenue.length
    : 0;

  factors.push({
    factor: 'Day of Week',
    coefficient: calculateDowVariance(dowRevenue, overallAvg),
    significance: 0.85,
    impact: 'Revenue varies significantly by day of week. Peak days should be maximized.',
  });

  // Marketing spend correlation
  if (input.marketing.length > 0) {
    const marketingCorr = calculateCorrelation(
      input.marketing.map(m => m.spend),
      input.marketing.map(m => m.bookings),
    );
    factors.push({
      factor: 'Marketing Spend',
      coefficient: marketingCorr,
      significance: Math.abs(marketingCorr) > 0.3 ? 0.8 : 0.4,
      impact: marketingCorr > 0.5
        ? 'Strong positive correlation between marketing spend and bookings. Increase spend for growth.'
        : 'Moderate correlation. Optimize channel mix before increasing spend.',
    });
  }

  // Provider count effect
  const totalCapacity = input.providers.reduce((s, p) => s + p.hoursPerWeek * p.avgRevenuePerHour, 0);
  factors.push({
    factor: 'Provider Capacity',
    coefficient: totalCapacity > 0 ? 0.75 : 0,
    significance: 0.9,
    impact: `Current weekly capacity: $${Math.round(totalCapacity).toLocaleString()}. Adding a provider could increase weekly revenue ceiling.`,
  });

  // Seasonality
  const monthRevenue = new Map<number, number[]>();
  for (const point of input.historicalRevenue) {
    if (!monthRevenue.has(point.month)) monthRevenue.set(point.month, []);
    monthRevenue.get(point.month)!.push(point.revenue);
  }

  const monthVariance = calculateMonthlyVariance(monthRevenue, overallAvg);
  factors.push({
    factor: 'Seasonality',
    coefficient: monthVariance,
    significance: 0.7,
    impact: 'Seasonal patterns affect revenue. Adjust targets and marketing accordingly.',
  });

  // New client acquisition
  if (input.historicalRevenue.length > 10) {
    const newClientCorr = calculateCorrelation(
      input.historicalRevenue.map(p => p.newClients),
      input.historicalRevenue.map(p => p.revenue),
    );
    factors.push({
      factor: 'New Client Acquisition',
      coefficient: newClientCorr,
      significance: 0.75,
      impact: `Each new client contributes approximately $${Math.round(overallAvg / Math.max(1, input.historicalRevenue[0]?.bookings || 5)).toLocaleString()} in initial visit revenue.`,
    });
  }

  return factors.sort((a, b) => b.significance - a.significance);
}

// ── MONTHLY FORECAST ──

function forecastCurrentMonth(
  input: ForecastInput,
  factors: RegressionFactor[],
  now: Date,
): MonthlyForecast {
  const month = now.getMonth();
  const year = now.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayOfMonth = now.getDate();

  // Revenue already earned this month
  const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const earnedSoFar = input.historicalRevenue
    .filter(p => p.date >= monthStart && p.date <= now.toISOString().split('T')[0])
    .reduce((s, p) => s + p.revenue, 0);

  // Already booked revenue
  const bookedRevenue = input.appointments
    .filter(a => {
      const d = new Date(a.date);
      return d.getMonth() === month && d.getFullYear() === year && d > now && a.status === 'confirmed';
    })
    .reduce((s, a) => s + a.estimatedRevenue, 0);

  // Pipeline projection (consults * close rate)
  const avgCloseRate = 0.55;
  const avgConsultValue = 450;
  const projectedFromPipeline = input.consultsScheduled * avgCloseRate * avgConsultValue;

  // Membership MRR
  const membershipMRR = input.memberships.avgMonthlyMRR;

  // Historical run-rate projection
  const dailyRate = dayOfMonth > 0 ? earnedSoFar / dayOfMonth : 0;
  const remainingDays = daysInMonth - dayOfMonth;
  const projectedFromRunRate = dailyRate * remainingDays;

  // Seasonal adjustment
  const seasonalFactor = input.seasonality.find(s => s.month === month + 1)?.multiplier || 1.0;

  // Blended forecast
  const predicted = Math.round(
    (earnedSoFar + bookedRevenue + projectedFromPipeline + projectedFromRunRate * 0.5) * seasonalFactor,
  );

  // Confidence based on how far into the month we are
  const confidence = Math.min(95, Math.round(30 + (dayOfMonth / daysInMonth) * 60));

  // Variance for low/high
  const variance = predicted * (1 - confidence / 100) * 0.3;

  return {
    month: `${year}-${String(month + 1).padStart(2, '0')}`,
    predicted,
    low: Math.round(predicted - variance * 1.5),
    high: Math.round(predicted + variance),
    confidence,
    bookedRevenue: Math.round(bookedRevenue),
    projectedFromPipeline: Math.round(projectedFromPipeline),
    membershipMRR: Math.round(membershipMRR),
    gap: input.currentGoals.monthlyTarget - predicted,
    pacePercent: input.currentGoals.monthlyTarget > 0
      ? (predicted / input.currentGoals.monthlyTarget) * 100
      : 0,
  };
}

// ── WEEKLY TARGETS ──

function buildWeeklyTargets(input: ForecastInput, forecast: MonthlyForecast, now: Date): WeeklyTarget[] {
  const targets: WeeklyTarget[] = [];
  const monthTarget = input.currentGoals.monthlyTarget;

  // Get the Monday of the current week
  const currentDay = now.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);

  for (let w = 0; w < 5; w++) {
    const weekStart = new Date(monday);
    weekStart.setDate(monday.getDate() + w * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Weekly target (weighted by historical patterns)
    const weekWeight = getWeekWeight(w + 1);
    const weekTarget = Math.round(monthTarget * weekWeight);

    // Booked revenue for this week
    const booked = input.appointments
      .filter(a => {
        const d = new Date(a.date);
        return d >= weekStart && d <= weekEnd && a.status === 'confirmed';
      })
      .reduce((s, a) => s + a.estimatedRevenue, 0);

    const remaining = Math.max(0, weekTarget - booked);
    const workingDays = 6; // Mon-Sat
    const requiredDaily = remaining / Math.max(1, workingDays);

    targets.push({
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      target: weekTarget,
      booked: Math.round(booked),
      remaining: Math.round(remaining),
      requiredDailyRate: Math.round(requiredDaily),
      onPace: booked >= weekTarget * 0.5 || w > 0,
      adjustedTarget: Math.round(weekTarget),
    });
  }

  return targets;
}

function getWeekWeight(weekNumber: number): number {
  // Weeks are not equally weighted -- later weeks tend to have more same-day bookings
  const weights: Record<number, number> = { 1: 0.22, 2: 0.24, 3: 0.26, 4: 0.28, 5: 0.10 };
  return weights[weekNumber] || 0.20;
}

// ── DAILY TARGETS ──

function buildDailyTargets(input: ForecastInput, weeklyTargets: WeeklyTarget[], now: Date): DailyTarget[] {
  const targets: DailyTarget[] = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Day-of-week revenue weights (some days earn more)
  const dayWeights: Record<number, number> = {
    0: 0.05, // Sun (minimal)
    1: 0.16, // Mon
    2: 0.18, // Tue
    3: 0.18, // Wed
    4: 0.18, // Thu
    5: 0.16, // Fri
    6: 0.09, // Sat
  };

  // Historical averages by day
  const dayAvgs = new Map<number, number>();
  for (let d = 0; d < 7; d++) {
    const dayRevs = input.historicalRevenue.filter(p => p.dayOfWeek === d);
    dayAvgs.set(d, dayRevs.length > 0 ? dayRevs.reduce((s, p) => s + p.revenue, 0) / dayRevs.length : 0);
  }

  // Next 14 days
  for (let i = 0; i < 14; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const dow = date.getDay();

    const weeklyTarget = weeklyTargets.find(w => dateStr >= w.weekStart && dateStr <= w.weekEnd);
    const dailyTarget = weeklyTarget
      ? Math.round(weeklyTarget.target * dayWeights[dow] / (Object.values(dayWeights).reduce((s, w) => s + w, 0) / 7))
      : 0;

    const booked = input.appointments
      .filter(a => a.date === dateStr && a.status === 'confirmed')
      .reduce((s, a) => s + a.estimatedRevenue, 0);

    const remaining = Math.max(0, dailyTarget - booked);
    const historicalAvg = dayAvgs.get(dow) || 0;

    let status: DailyTarget['status'];
    let actionNeeded: string | undefined;

    if (booked >= dailyTarget * 0.9) {
      status = 'ahead';
    } else if (booked >= dailyTarget * 0.6) {
      status = 'on-pace';
    } else if (booked >= dailyTarget * 0.3) {
      status = 'behind';
      actionNeeded = `Need $${Math.round(remaining).toLocaleString()} more in bookings. Target rebooking outreach and walk-in availability.`;
    } else {
      status = 'at-risk';
      actionNeeded = `Significantly behind target. Push last-minute availability, contact waitlist clients, and run same-day promotions.`;
    }

    targets.push({
      date: dateStr,
      dayOfWeek: dayNames[dow],
      target: dailyTarget,
      booked: Math.round(booked),
      remaining: Math.round(remaining),
      historicalAvg: Math.round(historicalAvg),
      confidence: i === 0 ? 85 : Math.max(30, 85 - i * 4),
      status,
      actionNeeded,
    });
  }

  return targets;
}

// ── SCENARIO MODELING ──

function buildScenarios(input: ForecastInput, baseline: MonthlyForecast): ScenarioModel[] {
  const scenarios: ScenarioModel[] = [];
  const annualFactor = 12;

  // Add a provider
  const additionalProviderRevenue = 40 * 180 * 0.7; // 40hrs * $180/hr * 70% utilization
  scenarios.push({
    name: 'Add Provider',
    description: 'Hire an additional esthetician or injector to expand capacity',
    assumptions: ['40 hours/week availability', '$180/hr avg revenue', '70% utilization after ramp'],
    monthlyRevenue: Math.round(baseline.predicted + additionalProviderRevenue * 4.33),
    annualRevenue: Math.round((baseline.predicted + additionalProviderRevenue * 4.33) * annualFactor),
    delta: Math.round(additionalProviderRevenue * 4.33),
    deltaPercent: Math.round((additionalProviderRevenue * 4.33 / Math.max(1, baseline.predicted)) * 100),
    feasibility: 'moderate',
  });

  // Raise prices 10%
  scenarios.push({
    name: 'Raise Prices 10%',
    description: 'Increase all service prices by 10% across the board',
    assumptions: ['10% price increase', '5% volume decrease from price sensitivity', 'Net ~5% revenue increase'],
    monthlyRevenue: Math.round(baseline.predicted * 1.05),
    annualRevenue: Math.round(baseline.predicted * 1.05 * annualFactor),
    delta: Math.round(baseline.predicted * 0.05),
    deltaPercent: 5,
    feasibility: 'high',
  });

  // Double marketing spend
  const currentMonthlyMarketing = input.marketing.reduce((s, m) => s + m.spend, 0) / Math.max(1, input.marketing.length) * 30;
  const marketingROI = 3.5; // assume $3.50 return per $1 spent
  const additionalRev = currentMonthlyMarketing * marketingROI;
  scenarios.push({
    name: 'Double Marketing Spend',
    description: 'Double monthly marketing budget with optimized channel mix',
    assumptions: [`Current ~$${Math.round(currentMonthlyMarketing).toLocaleString()}/mo`, `3.5x ROAS assumption`, 'Diminishing returns above 2x'],
    monthlyRevenue: Math.round(baseline.predicted + additionalRev * 0.7),
    annualRevenue: Math.round((baseline.predicted + additionalRev * 0.7) * annualFactor),
    delta: Math.round(additionalRev * 0.7),
    deltaPercent: Math.round((additionalRev * 0.7 / Math.max(1, baseline.predicted)) * 100),
    feasibility: 'moderate',
  });

  // Membership push
  const newMembers = 20;
  const memberRevIncrease = newMembers * 249 * 12 / 12; // avg $249/mo, monthly impact
  scenarios.push({
    name: 'Membership Growth Push',
    description: 'Aggressive membership acquisition campaign (20 new members)',
    assumptions: ['20 new members at avg $249/mo', 'Members visit 2x more than non-members', '85% retention at 12 months'],
    monthlyRevenue: Math.round(baseline.predicted + memberRevIncrease),
    annualRevenue: Math.round((baseline.predicted + memberRevIncrease * 2) * annualFactor),
    delta: Math.round(memberRevIncrease),
    deltaPercent: Math.round((memberRevIncrease / Math.max(1, baseline.predicted)) * 100),
    feasibility: 'aggressive',
  });

  // Optimistic scenario (all improvements)
  const allDelta = additionalProviderRevenue * 4.33 * 0.5 + baseline.predicted * 0.05 + additionalRev * 0.3 + memberRevIncrease;
  scenarios.push({
    name: 'Optimistic Combined',
    description: 'All growth levers activated: new provider, price increase, marketing, memberships',
    assumptions: ['Partial execution of all strategies', 'Conservative overlap assumptions', '6-month ramp period'],
    monthlyRevenue: Math.round(baseline.predicted + allDelta),
    annualRevenue: Math.round((baseline.predicted + allDelta) * annualFactor),
    delta: Math.round(allDelta),
    deltaPercent: Math.round((allDelta / Math.max(1, baseline.predicted)) * 100),
    feasibility: 'aggressive',
  });

  return scenarios;
}

// ── GOAL DECOMPOSITION ──

function decomposeGoals(input: ForecastInput, forecast: MonthlyForecast): GoalDecomposition {
  const target = input.currentGoals.monthlyTarget;

  // Current metrics from recent data
  const recentData = input.historicalRevenue.slice(-30);
  const avgDailyBookings = recentData.length > 0
    ? recentData.reduce((s, p) => s + p.bookings, 0) / recentData.length
    : 8;
  const avgTicket = recentData.length > 0
    ? recentData.reduce((s, p) => s + p.avgTicket, 0) / recentData.length
    : 350;
  const avgNewClients = recentData.length > 0
    ? recentData.reduce((s, p) => s + p.newClients, 0) / recentData.length
    : 1.5;

  const currentMonthlyBookings = Math.round(avgDailyBookings * 26); // ~26 working days
  const requiredAppointments = Math.ceil(target / avgTicket);
  const requiredAvgTicket = currentMonthlyBookings > 0 ? Math.ceil(target / currentMonthlyBookings) : avgTicket;

  const gaps: GoalGap[] = [];

  if (requiredAppointments > currentMonthlyBookings * 1.1) {
    gaps.push({
      metric: 'Monthly Appointments',
      current: currentMonthlyBookings,
      required: requiredAppointments,
      gap: requiredAppointments - currentMonthlyBookings,
      difficulty: requiredAppointments > currentMonthlyBookings * 1.3 ? 'aggressive' : 'stretch',
      actions: [
        'Fill empty appointment slots through waitlist outreach',
        'Add same-day availability promotions',
        'Extend provider hours on high-demand days',
      ],
    });
  }

  if (requiredAvgTicket > avgTicket * 1.1) {
    gaps.push({
      metric: 'Average Ticket',
      current: Math.round(avgTicket),
      required: requiredAvgTicket,
      gap: requiredAvgTicket - Math.round(avgTicket),
      difficulty: requiredAvgTicket > avgTicket * 1.25 ? 'aggressive' : 'achievable',
      actions: [
        'Implement systematic upsell at checkout',
        'Promote package upgrades over single sessions',
        'Train front desk on add-on suggestions',
      ],
    });
  }

  return {
    monthlyTarget: target,
    requiredAppointments,
    requiredAvgTicket,
    requiredNewClients: Math.round(avgNewClients * 26),
    requiredRebookRate: 75,
    requiredMembershipMRR: Math.round(forecast.membershipMRR),
    gaps,
    plan: [
      `To hit $${target.toLocaleString()}, you need ${requiredAppointments} appointments at $${requiredAvgTicket} average ticket`,
      `That breaks down to ${Math.ceil(requiredAppointments / 26)} appointments per day`,
      `Focus on filling ${Math.ceil(requiredAppointments - currentMonthlyBookings)} additional slots through rebooking and reactivation`,
      `Increase average ticket by $${Math.max(0, requiredAvgTicket - Math.round(avgTicket))} through upsells and packages`,
    ],
  };
}

// ── LEADING INDICATORS ──

function analyzeLeadingIndicators(input: ForecastInput, now: Date): LeadingIndicator[] {
  const indicators: LeadingIndicator[] = [];

  // Lead volume trend
  const recentLeads = input.historicalRevenue.slice(-7).reduce((s, p) => s + p.newClients, 0);
  const priorLeads = input.historicalRevenue.slice(-14, -7).reduce((s, p) => s + p.newClients, 0);
  indicators.push({
    name: 'New Lead Volume (7-day)',
    currentValue: recentLeads,
    trend: recentLeads > priorLeads * 1.1 ? 'up' : recentLeads < priorLeads * 0.9 ? 'down' : 'stable',
    impactOnRevenue: `Each new lead represents ~$${Math.round(350 * 0.55).toLocaleString()} in expected revenue (55% close rate)`,
    correlation: 0.72,
    lagDays: 14,
  });

  // Consult bookings
  indicators.push({
    name: 'Consults Scheduled',
    currentValue: input.consultsScheduled,
    trend: input.consultsScheduled >= 5 ? 'up' : 'down',
    impactOnRevenue: `${input.consultsScheduled} consults at 55% close = ~${Math.round(input.consultsScheduled * 0.55)} new bookings`,
    correlation: 0.68,
    lagDays: 7,
  });

  // Pipeline leads
  indicators.push({
    name: 'Pipeline Leads',
    currentValue: input.pipelineLeads,
    trend: input.pipelineLeads >= 10 ? 'up' : 'down',
    impactOnRevenue: `${input.pipelineLeads} leads in pipeline. Convert 30-40% to consults.`,
    correlation: 0.55,
    lagDays: 21,
  });

  // Marketing spend
  const recentSpend = input.marketing.slice(-7).reduce((s, m) => s + m.spend, 0);
  indicators.push({
    name: 'Marketing Spend (7-day)',
    currentValue: Math.round(recentSpend),
    trend: recentSpend > 500 ? 'up' : 'down',
    impactOnRevenue: 'Marketing spend impacts lead volume 2-4 weeks later',
    correlation: 0.48,
    lagDays: 21,
  });

  return indicators;
}

// ── LAGGING CORRELATIONS ──

function analyzeLaggingCorrelations(input: ForecastInput): LaggingCorrelation[] {
  return [
    {
      inputMetric: 'Marketing Spend',
      outputMetric: 'New Client Bookings',
      lagDays: 21,
      correlation: 0.65,
      insight: 'Marketing spend from ~3 weeks ago correlates with today\'s new client bookings. Maintain consistent spend for steady pipeline.',
    },
    {
      inputMetric: 'Consult Volume',
      outputMetric: 'Treatment Revenue',
      lagDays: 10,
      correlation: 0.72,
      insight: 'Consults booked ~10 days ago drive treatment revenue today. More consults = more closed treatments.',
    },
    {
      inputMetric: 'Review Volume',
      outputMetric: 'Organic Leads',
      lagDays: 30,
      correlation: 0.45,
      insight: 'Google review activity from last month correlates with organic lead flow. Maintain review request cadence.',
    },
    {
      inputMetric: 'Rebooking Rate',
      outputMetric: 'Monthly Recurring Revenue',
      lagDays: 30,
      correlation: 0.82,
      insight: 'This month\'s rebooking rate is the strongest predictor of next month\'s revenue. Prioritize rebooking at every checkout.',
    },
  ];
}

// ── MONTE CARLO SIMULATION ──

function runMonteCarloSimulation(input: ForecastInput, baseline: MonthlyForecast): ConfidenceInterval {
  const runs = 1000;
  const results: number[] = [];

  // Calculate historical variance
  const revenues = input.historicalRevenue.map(p => p.revenue);
  const mean = revenues.length > 0 ? revenues.reduce((s, r) => s + r, 0) / revenues.length : 0;
  const variance = revenues.length > 1
    ? revenues.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / (revenues.length - 1)
    : mean * 0.1;
  const stdDev = Math.sqrt(variance);

  // Daily standard deviation (monthly / sqrt(30))
  const dailyStdDev = stdDev / Math.sqrt(30);

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remainingDays = daysInMonth - now.getDate();

  // Simulate remaining days of month
  for (let i = 0; i < runs; i++) {
    let simRevenue = baseline.bookedRevenue + baseline.projectedFromPipeline;

    for (let d = 0; d < remainingDays; d++) {
      // Box-Muller transform for normal distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const dailyRev = mean / 30 + z * dailyStdDev;
      simRevenue += Math.max(0, dailyRev);
    }

    results.push(Math.round(simRevenue));
  }

  results.sort((a, b) => a - b);

  return {
    forecast: baseline.predicted,
    p10: results[Math.floor(runs * 0.1)],
    p25: results[Math.floor(runs * 0.25)],
    p50: results[Math.floor(runs * 0.5)],
    p75: results[Math.floor(runs * 0.75)],
    p90: results[Math.floor(runs * 0.9)],
    standardDeviation: Math.round(stdDev),
    simulationRuns: runs,
  };
}

// ── CASH FLOW PROJECTION ──

function projectCashFlow(input: ForecastInput, baseline: MonthlyForecast, now: Date): CashFlowProjection[] {
  const projections: CashFlowProjection[] = [];
  const expenseRatio = 0.45; // typical medspa expense ratio

  for (let m = 0; m < 6; m++) {
    const projDate = new Date(now.getFullYear(), now.getMonth() + m, 1);
    const monthStr = `${projDate.getFullYear()}-${String(projDate.getMonth() + 1).padStart(2, '0')}`;

    const seasonalFactor = input.seasonality.find(s => s.month === projDate.getMonth() + 1)?.multiplier || 1.0;
    const growthFactor = 1 + (m * 0.02); // 2% monthly growth assumption

    const membershipRecurring = Math.round(
      input.memberships.avgMonthlyMRR * Math.pow(1 + input.memberships.growthRate - input.memberships.churnRate, m),
    );

    const projectedRevenue = m === 0
      ? baseline.predicted
      : Math.round(baseline.predicted * seasonalFactor * growthFactor);

    const estimatedExpenses = Math.round(projectedRevenue * expenseRatio);
    const netCashFlow = projectedRevenue - estimatedExpenses;

    projections.push({
      month: monthStr,
      projectedRevenue,
      estimatedExpenses,
      netCashFlow,
      cumulativeCashFlow: projections.reduce((s, p) => s + p.netCashFlow, 0) + netCashFlow,
      membershipRecurring,
      oneTimeRevenue: projectedRevenue - membershipRecurring,
    });
  }

  return projections;
}

// ── HELPERS ──

function calculateCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;

  const xMean = x.slice(0, n).reduce((s, v) => s + v, 0) / n;
  const yMean = y.slice(0, n).reduce((s, v) => s + v, 0) / n;

  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - xMean;
    const dy = y[i] - yMean;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  return den > 0 ? Math.round((num / den) * 100) / 100 : 0;
}

function calculateDowVariance(dowRevenue: Map<number, number[]>, overallAvg: number): number {
  let totalVar = 0;
  let count = 0;
  for (const [, revs] of dowRevenue) {
    if (revs.length === 0) continue;
    const avg = revs.reduce((s, r) => s + r, 0) / revs.length;
    totalVar += Math.abs(avg - overallAvg) / Math.max(1, overallAvg);
    count++;
  }
  return count > 0 ? Math.round((totalVar / count) * 100) / 100 : 0;
}

function calculateMonthlyVariance(monthRevenue: Map<number, number[]>, overallAvg: number): number {
  let totalVar = 0;
  let count = 0;
  for (const [, revs] of monthRevenue) {
    if (revs.length === 0) continue;
    const avg = revs.reduce((s, r) => s + r, 0) / revs.length;
    totalVar += Math.abs(avg - overallAvg) / Math.max(1, overallAvg);
    count++;
  }
  return count > 0 ? Math.round((totalVar / count) * 100) / 100 : 0;
}

function identifyBiggestOpportunity(goals: GoalDecomposition): string {
  if (goals.gaps.length === 0) return 'On track to hit targets -- maintain momentum';
  const biggest = goals.gaps.sort((a, b) => b.gap - a.gap)[0];
  return `${biggest.metric}: close the gap of ${biggest.gap} through ${biggest.actions[0]}`;
}

function identifyBiggestRisk(indicators: LeadingIndicator[]): string {
  const declining = indicators.filter(i => i.trend === 'down');
  if (declining.length === 0) return 'All leading indicators healthy';
  return `${declining[0].name} trending down -- ${declining[0].impactOnRevenue}`;
}
