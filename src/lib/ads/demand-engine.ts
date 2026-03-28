/**
 * Ads War Machine - Demand Engine
 *
 * Demand-based ad triggering system that monitors seasonal patterns,
 * events, inventory/appointment availability, weather, revenue gaps,
 * and competitor activity to automatically adjust ad campaigns.
 *
 * Geo: Renton, WA (PNW area)
 * CRITICAL: Always "injection" - never "infusion."
 */

// ── TYPES ──

export type DemandSignalType =
  | 'seasonal'
  | 'event'
  | 'inventory'
  | 'competitor'
  | 'weather'
  | 'revenue_gap'
  | 'trending'
  | 'emergency';

export type DemandPriority = 'critical' | 'high' | 'medium' | 'low';

export interface DemandSignal {
  id: string;
  type: DemandSignalType;
  priority: DemandPriority;
  title: string;
  description: string;
  affectedServices: string[];
  recommendedAction: DemandAction;
  budgetImpact: number; // percentage change recommended (-50 to +100)
  confidence: number; // 0-100
  validFrom: string;
  validUntil: string;
  dataSource: string;
}

export type DemandActionType =
  | 'increase_budget'
  | 'decrease_budget'
  | 'launch_campaign'
  | 'pause_campaign'
  | 'adjust_targeting'
  | 'refresh_creative'
  | 'emergency_launch'
  | 'hold';

export interface DemandAction {
  type: DemandActionType;
  description: string;
  budgetChange: number;
  targetCampaigns: string[];
  newCampaignConfig?: EmergencyCampaignConfig;
  creativeRefresh?: boolean;
  audienceExpansion?: boolean;
}

export interface EmergencyCampaignConfig {
  name: string;
  services: string[];
  dailyBudget: number;
  duration: number; // days
  urgencyLevel: 'high' | 'medium';
  hook: string;
  cta: string;
}

export interface DemandEngineInput {
  currentDate: string;
  monthlyRevenueTarget: number;
  currentMonthRevenue: number;
  daysInMonth: number;
  dayOfMonth: number;
  appointmentSlots: AppointmentSlotData;
  weatherData?: WeatherData;
  competitorSignals?: CompetitorSignal[];
  historicalDemand?: MonthlyDemandPattern[];
  activeCampaigns: ActiveCampaignSummary[];
  currentMonthlyBudget: number;
}

export interface AppointmentSlotData {
  totalSlots: number;
  bookedSlots: number;
  utilizationRate: number; // 0-100
  emptySlotsByService: Record<string, number>;
  nextWeekUtilization: number;
  peakHoursAvailable: boolean;
}

export interface WeatherData {
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy' | 'clear';
  temperature: number; // Fahrenheit
  forecast7Day: { day: string; condition: string; high: number; low: number }[];
  rainyDaysThisWeek: number;
  sunnyDaysThisWeek: number;
}

export interface CompetitorSignal {
  competitor: string;
  signalType: 'new_campaign' | 'price_change' | 'new_service' | 'promotion' | 'ad_increase';
  description: string;
  detectedDate: string;
  relevantServices: string[];
  threatLevel: 'high' | 'medium' | 'low';
}

export interface MonthlyDemandPattern {
  month: number;
  services: Record<string, number>; // service -> demand multiplier (1.0 = average)
  topServices: string[];
  bottomServices: string[];
}

export interface ActiveCampaignSummary {
  id: string;
  name: string;
  platform: 'meta' | 'google';
  dailyBudget: number;
  spent: number;
  roas: number;
  status: 'active' | 'paused';
}

// ── OUTPUT ──

export interface DemandEngineResult {
  signals: DemandSignal[];
  priorityQueue: CampaignPriorityItem[];
  budgetAdjustments: BudgetAdjustment[];
  emergencyCampaigns: EmergencyCampaignConfig[];
  autoScalingRules: AutoScaleRule[];
  overallDemandScore: number; // 0-100, how urgently we need to advertise
  summary: string;
}

export interface CampaignPriorityItem {
  rank: number;
  campaignId?: string;
  service: string;
  reason: string;
  priority: DemandPriority;
  estimatedRevenuePotential: number;
  recommendedBudget: number;
}

export interface BudgetAdjustment {
  campaignId: string;
  campaignName: string;
  currentBudget: number;
  recommendedBudget: number;
  changePercent: number;
  reason: string;
}

export interface AutoScaleRule {
  metric: string;
  condition: string;
  threshold: number;
  action: string;
  budgetImpact: number;
}

// ── SEASONAL DEMAND PATTERNS ──

const SEASONAL_PATTERNS: MonthlyDemandPattern[] = [
  {
    month: 1, // January
    services: { glp1: 1.8, wellness: 1.3, botox: 0.9, hydrafacial: 1.0, laser_hair: 0.7, sofwave: 1.0, peptides: 1.2 },
    topServices: ['glp1', 'wellness', 'peptides'],
    bottomServices: ['laser_hair'],
  },
  {
    month: 2, // February
    services: { glp1: 1.6, botox: 1.3, fillers: 1.4, hydrafacial: 1.2, wellness: 1.2, laser_hair: 0.8 },
    topServices: ['glp1', 'fillers', 'botox'],
    bottomServices: ['laser_hair'],
  },
  {
    month: 3, // March
    services: { glp1: 1.5, laser_hair: 1.3, hydrafacial: 1.2, botox: 1.1, wellness: 1.1 },
    topServices: ['glp1', 'laser_hair', 'hydrafacial'],
    bottomServices: [],
  },
  {
    month: 4, // April
    services: { laser_hair: 1.5, hydrafacial: 1.3, botox: 1.2, glp1: 1.4, vi_peel: 1.2 },
    topServices: ['laser_hair', 'glp1', 'hydrafacial'],
    bottomServices: [],
  },
  {
    month: 5, // May
    services: { laser_hair: 1.7, botox: 1.4, fillers: 1.3, hydrafacial: 1.4, glp1: 1.3, sofwave: 1.1 },
    topServices: ['laser_hair', 'botox', 'hydrafacial'],
    bottomServices: [],
  },
  {
    month: 6, // June
    services: { laser_hair: 1.8, hydrafacial: 1.5, botox: 1.5, fillers: 1.3, glp1: 1.1, picoway: 1.2 },
    topServices: ['laser_hair', 'hydrafacial', 'botox'],
    bottomServices: ['wellness'],
  },
  {
    month: 7, // July
    services: { laser_hair: 1.6, hydrafacial: 1.4, botox: 1.3, picoway: 1.3, glp1: 1.0, wellness: 0.8 },
    topServices: ['laser_hair', 'hydrafacial', 'picoway'],
    bottomServices: ['wellness', 'glp1'],
  },
  {
    month: 8, // August
    services: { laser_hair: 1.4, hydrafacial: 1.3, botox: 1.2, glp1: 1.2, rf_microneedling: 1.1 },
    topServices: ['laser_hair', 'hydrafacial', 'glp1'],
    bottomServices: [],
  },
  {
    month: 9, // September
    services: { vi_peel: 1.5, rf_microneedling: 1.4, hydrafacial: 1.2, glp1: 1.4, botox: 1.1, wellness: 1.2 },
    topServices: ['vi_peel', 'rf_microneedling', 'glp1'],
    bottomServices: ['laser_hair'],
  },
  {
    month: 10, // October
    services: { vi_peel: 1.4, rf_microneedling: 1.3, sofwave: 1.3, wellness: 1.4, glp1: 1.3, botox: 1.1 },
    topServices: ['wellness', 'vi_peel', 'sofwave'],
    bottomServices: [],
  },
  {
    month: 11, // November
    services: { sofwave: 1.5, botox: 1.4, fillers: 1.3, hydrafacial: 1.3, wellness: 1.5, glp1: 1.2 },
    topServices: ['wellness', 'sofwave', 'botox'],
    bottomServices: ['laser_hair'],
  },
  {
    month: 12, // December
    services: { botox: 1.6, fillers: 1.5, hydrafacial: 1.5, wellness: 1.4, sofwave: 1.2, glp1: 1.0 },
    topServices: ['botox', 'fillers', 'hydrafacial'],
    bottomServices: ['laser_hair', 'vi_peel'],
  },
];

// ── EVENT-BASED TRIGGERS ──

interface EventTrigger {
  name: string;
  month: number;
  dayRange: [number, number];
  services: string[];
  budgetMultiplier: number;
  hookAngle: string;
}

const EVENT_TRIGGERS: EventTrigger[] = [
  { name: 'New Year Resolution', month: 1, dayRange: [1, 21], services: ['glp1', 'wellness', 'peptides'], budgetMultiplier: 1.5, hookAngle: 'New year, new you - but make it science-backed' },
  { name: 'Valentine\'s Day', month: 2, dayRange: [1, 14], services: ['botox', 'fillers', 'hydrafacial'], budgetMultiplier: 1.3, hookAngle: 'The best gift is confidence' },
  { name: 'Spring Break Prep', month: 3, dayRange: [1, 20], services: ['laser_hair', 'hydrafacial', 'glp1'], budgetMultiplier: 1.2, hookAngle: 'Spring break ready' },
  { name: 'Allergy Season', month: 4, dayRange: [1, 30], services: ['wellness', 'tri_immune'], budgetMultiplier: 1.2, hookAngle: 'PNW allergy season defense' },
  { name: 'Mother\'s Day', month: 5, dayRange: [1, 12], services: ['hydrafacial', 'botox', 'wellness'], budgetMultiplier: 1.4, hookAngle: 'She deserves more than brunch' },
  { name: 'Summer Body Prep', month: 5, dayRange: [15, 31], services: ['laser_hair', 'glp1', 'hydrafacial'], budgetMultiplier: 1.3, hookAngle: 'Summer confidence starts now' },
  { name: 'Wedding Season', month: 6, dayRange: [1, 30], services: ['botox', 'fillers', 'hydrafacial'], budgetMultiplier: 1.3, hookAngle: 'Camera-ready in time for the big day' },
  { name: 'Fourth of July', month: 7, dayRange: [1, 4], services: ['laser_hair', 'hydrafacial', 'wellness'], budgetMultiplier: 1.2, hookAngle: 'BBQ-ready confidence' },
  { name: 'Back to School', month: 8, dayRange: [15, 31], services: ['wellness', 'hydrafacial', 'botox'], budgetMultiplier: 1.1, hookAngle: 'Back to school, back to self-care' },
  { name: 'Fall Skin Reset', month: 9, dayRange: [15, 30], services: ['vi_peel', 'rf_microneedling', 'hydrafacial'], budgetMultiplier: 1.3, hookAngle: 'Summer damage, meet fall reset' },
  { name: 'Breast Cancer Awareness', month: 10, dayRange: [1, 31], services: ['wellness', 'hydrafacial'], budgetMultiplier: 1.1, hookAngle: 'Prioritize your health this October' },
  { name: 'Flu Season Kickoff', month: 10, dayRange: [15, 31], services: ['wellness', 'tri_immune', 'b12'], budgetMultiplier: 1.3, hookAngle: 'Immunity season is here' },
  { name: 'Holiday Party Season', month: 11, dayRange: [15, 30], services: ['botox', 'fillers', 'hydrafacial'], budgetMultiplier: 1.4, hookAngle: 'Holiday party ready' },
  { name: 'Black Friday/Cyber Monday', month: 11, dayRange: [25, 30], services: ['sofwave', 'glp1', 'botox', 'hydrafacial'], budgetMultiplier: 1.5, hookAngle: 'The best investment is in yourself' },
  { name: 'Holiday Glow', month: 12, dayRange: [1, 23], services: ['botox', 'fillers', 'hydrafacial', 'wellness'], budgetMultiplier: 1.4, hookAngle: 'Holiday glow guaranteed' },
];

// ── WEATHER-BASED TRIGGERS ──

interface WeatherTrigger {
  condition: string;
  services: string[];
  budgetChange: number;
  hookAngle: string;
}

const WEATHER_TRIGGERS: WeatherTrigger[] = [
  { condition: 'rainy_streak', services: ['wellness', 'nad', 'b12', 'hydrafacial'], budgetChange: 20, hookAngle: 'PNW rain getting you down? Boost from within.' },
  { condition: 'sunny_streak', services: ['laser_hair', 'picoway', 'hydrafacial'], budgetChange: 15, hookAngle: 'The sun is here - is your skin ready?' },
  { condition: 'cold_snap', services: ['wellness', 'tri_immune', 'nad'], budgetChange: 25, hookAngle: 'Cold front moving in. Protect your immunity.' },
  { condition: 'warm_spell', services: ['laser_hair', 'hydrafacial', 'botox'], budgetChange: 15, hookAngle: 'Warm days ahead - get treatment-ready.' },
  { condition: 'overcast', services: ['vi_peel', 'rf_microneedling', 'prx'], budgetChange: 10, hookAngle: 'Overcast skies = perfect skin treatment weather.' },
];

// ── MAIN ENGINE ──

export function runDemandEngine(input: DemandEngineInput): DemandEngineResult {
  const signals: DemandSignal[] = [];
  const now = new Date(input.currentDate);
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // 1. Seasonal demand signals
  signals.push(...detectSeasonalDemand(month));

  // 2. Event-based triggers
  signals.push(...detectEventTriggers(month, day));

  // 3. Inventory/appointment signals
  signals.push(...detectInventorySignals(input.appointmentSlots));

  // 4. Weather-based triggers
  if (input.weatherData) {
    signals.push(...detectWeatherTriggers(input.weatherData));
  }

  // 5. Revenue gap detection
  signals.push(...detectRevenueGap(input));

  // 6. Competitor signals
  if (input.competitorSignals) {
    signals.push(...processCompetitorSignals(input.competitorSignals));
  }

  // Sort by priority
  const priorityOrder: Record<DemandPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  signals.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Build priority queue
  const priorityQueue = buildPriorityQueue(signals, input);

  // Budget adjustments
  const budgetAdjustments = calculateBudgetAdjustments(signals, input);

  // Emergency campaigns
  const emergencyCampaigns = identifyEmergencyCampaigns(signals, input);

  // Auto-scaling rules
  const autoScalingRules = generateAutoScaleRules(input);

  // Overall demand score
  const overallDemandScore = calculateDemandScore(signals, input);

  // Summary
  const summary = generateSummary(signals, overallDemandScore, budgetAdjustments, emergencyCampaigns);

  return {
    signals,
    priorityQueue,
    budgetAdjustments,
    emergencyCampaigns,
    autoScalingRules,
    overallDemandScore,
    summary,
  };
}

// ── SEASONAL DEMAND ──

function detectSeasonalDemand(month: number): DemandSignal[] {
  const signals: DemandSignal[] = [];
  const pattern = SEASONAL_PATTERNS.find(p => p.month === month);
  if (!pattern) return signals;

  for (const service of pattern.topServices) {
    const multiplier = pattern.services[service] || 1.0;
    if (multiplier > 1.2) {
      signals.push({
        id: `seasonal_${month}_${service}`,
        type: 'seasonal',
        priority: multiplier > 1.5 ? 'high' : 'medium',
        title: `Peak season for ${service}`,
        description: `${service} demand is ${Math.round((multiplier - 1) * 100)}% above baseline this month. Increase ad spend to capture seasonal demand.`,
        affectedServices: [service],
        recommendedAction: {
          type: 'increase_budget',
          description: `Increase ${service} campaign budget by ${Math.round((multiplier - 1) * 100)}%`,
          budgetChange: Math.round((multiplier - 1) * 100),
          targetCampaigns: [`campaign_${service}`],
        },
        budgetImpact: Math.round((multiplier - 1) * 100),
        confidence: 85,
        validFrom: new Date(new Date().getFullYear(), month - 1, 1).toISOString(),
        validUntil: new Date(new Date().getFullYear(), month, 0).toISOString(),
        dataSource: 'Historical seasonal patterns',
      });
    }
  }

  for (const service of pattern.bottomServices) {
    const multiplier = pattern.services[service] || 1.0;
    if (multiplier < 0.8) {
      signals.push({
        id: `seasonal_low_${month}_${service}`,
        type: 'seasonal',
        priority: 'low',
        title: `Low season for ${service}`,
        description: `${service} demand is ${Math.round((1 - multiplier) * 100)}% below baseline. Consider reducing spend or shifting budget.`,
        affectedServices: [service],
        recommendedAction: {
          type: 'decrease_budget',
          description: `Reduce ${service} campaign budget by ${Math.round((1 - multiplier) * 50)}%`,
          budgetChange: -Math.round((1 - multiplier) * 50),
          targetCampaigns: [`campaign_${service}`],
        },
        budgetImpact: -Math.round((1 - multiplier) * 50),
        confidence: 80,
        validFrom: new Date(new Date().getFullYear(), month - 1, 1).toISOString(),
        validUntil: new Date(new Date().getFullYear(), month, 0).toISOString(),
        dataSource: 'Historical seasonal patterns',
      });
    }
  }

  return signals;
}

// ── EVENT TRIGGERS ──

function detectEventTriggers(month: number, day: number): DemandSignal[] {
  const signals: DemandSignal[] = [];

  const activeEvents = EVENT_TRIGGERS.filter(
    e => e.month === month && day >= e.dayRange[0] && day <= e.dayRange[1]
  );

  for (const event of activeEvents) {
    signals.push({
      id: `event_${event.name.toLowerCase().replace(/\s/g, '_')}`,
      type: 'event',
      priority: event.budgetMultiplier > 1.3 ? 'high' : 'medium',
      title: `${event.name} campaign window`,
      description: `${event.name} is active. Recommended ${Math.round((event.budgetMultiplier - 1) * 100)}% budget increase for ${event.services.join(', ')}.`,
      affectedServices: event.services,
      recommendedAction: {
        type: 'increase_budget',
        description: `Increase budget by ${Math.round((event.budgetMultiplier - 1) * 100)}% and refresh creative with event-specific hook: "${event.hookAngle}"`,
        budgetChange: Math.round((event.budgetMultiplier - 1) * 100),
        targetCampaigns: event.services.map(s => `campaign_${s}`),
        creativeRefresh: true,
      },
      budgetImpact: Math.round((event.budgetMultiplier - 1) * 100),
      confidence: 90,
      validFrom: `${new Date().getFullYear()}-${String(month).padStart(2, '0')}-${String(event.dayRange[0]).padStart(2, '0')}`,
      validUntil: `${new Date().getFullYear()}-${String(month).padStart(2, '0')}-${String(event.dayRange[1]).padStart(2, '0')}`,
      dataSource: 'Event calendar',
    });
  }

  return signals;
}

// ── INVENTORY/APPOINTMENT SIGNALS ──

function detectInventorySignals(slots: AppointmentSlotData): DemandSignal[] {
  const signals: DemandSignal[] = [];

  // Low utilization = increase ads
  if (slots.utilizationRate < 60) {
    signals.push({
      id: 'inventory_low_utilization',
      type: 'inventory',
      priority: slots.utilizationRate < 40 ? 'critical' : 'high',
      title: `Low appointment utilization: ${slots.utilizationRate}%`,
      description: `Only ${slots.bookedSlots} of ${slots.totalSlots} slots booked (${slots.utilizationRate}%). Increase ad spend to fill open appointments.`,
      affectedServices: Object.keys(slots.emptySlotsByService).filter(s => slots.emptySlotsByService[s] > 2),
      recommendedAction: {
        type: 'increase_budget',
        description: `Increase daily ad budget by ${Math.round((1 - slots.utilizationRate / 100) * 50)}% to drive bookings`,
        budgetChange: Math.round((1 - slots.utilizationRate / 100) * 50),
        targetCampaigns: ['all'],
        audienceExpansion: true,
      },
      budgetImpact: Math.round((1 - slots.utilizationRate / 100) * 50),
      confidence: 95,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
      dataSource: 'Appointment system',
    });
  }

  // High utilization = pull back or shift budget
  if (slots.utilizationRate > 90) {
    signals.push({
      id: 'inventory_high_utilization',
      type: 'inventory',
      priority: 'medium',
      title: `High utilization: ${slots.utilizationRate}%`,
      description: `Appointments nearly full at ${slots.utilizationRate}%. Consider reducing spend or shifting to higher-margin services.`,
      affectedServices: [],
      recommendedAction: {
        type: 'decrease_budget',
        description: 'Pull back broad campaigns by 15-20%. Focus remaining budget on high-margin services only.',
        budgetChange: -15,
        targetCampaigns: ['campaign_brand'],
      },
      budgetImpact: -15,
      confidence: 85,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 3 * 86400000).toISOString(),
      dataSource: 'Appointment system',
    });
  }

  // Next week low utilization = pre-emptive push
  if (slots.nextWeekUtilization < 50) {
    signals.push({
      id: 'inventory_next_week_low',
      type: 'inventory',
      priority: 'high',
      title: `Next week utilization only ${slots.nextWeekUtilization}%`,
      description: `Next week is looking empty. Launch a "this week only" urgency push to fill slots.`,
      affectedServices: Object.keys(slots.emptySlotsByService),
      recommendedAction: {
        type: 'launch_campaign',
        description: 'Launch short-burst campaign with "limited availability" messaging for next week',
        budgetChange: 30,
        targetCampaigns: ['all'],
        newCampaignConfig: {
          name: 'Rani - Flash - Fill Next Week',
          services: Object.keys(slots.emptySlotsByService).slice(0, 3),
          dailyBudget: 50,
          duration: 5,
          urgencyLevel: 'high',
          hook: 'Limited openings next week. Book before they fill.',
          cta: 'See Available Times',
        },
        creativeRefresh: true,
      },
      budgetImpact: 30,
      confidence: 90,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 5 * 86400000).toISOString(),
      dataSource: 'Appointment system',
    });
  }

  // Service-specific empty slots
  for (const [service, emptyCount] of Object.entries(slots.emptySlotsByService)) {
    if (emptyCount > 5) {
      signals.push({
        id: `inventory_empty_${service}`,
        type: 'inventory',
        priority: 'medium',
        title: `${emptyCount} empty ${service} slots`,
        description: `${service} has ${emptyCount} unfilled slots this week. Increase targeted ad spend for this service.`,
        affectedServices: [service],
        recommendedAction: {
          type: 'increase_budget',
          description: `Boost ${service} campaign by 25% to fill empty slots`,
          budgetChange: 25,
          targetCampaigns: [`campaign_${service}`],
        },
        budgetImpact: 25,
        confidence: 85,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
        dataSource: 'Appointment system',
      });
    }
  }

  return signals;
}

// ── WEATHER TRIGGERS ──

function detectWeatherTriggers(weather: WeatherData): DemandSignal[] {
  const signals: DemandSignal[] = [];

  // Rainy streak (3+ rainy days this week)
  if (weather.rainyDaysThisWeek >= 3) {
    const trigger = WEATHER_TRIGGERS.find(t => t.condition === 'rainy_streak');
    if (trigger) {
      signals.push({
        id: 'weather_rainy_streak',
        type: 'weather',
        priority: 'medium',
        title: `Rainy week ahead (${weather.rainyDaysThisWeek} days)`,
        description: `PNW rainy streak = opportunity for wellness and indoor treatments. "${trigger.hookAngle}"`,
        affectedServices: trigger.services,
        recommendedAction: {
          type: 'increase_budget',
          description: `Increase wellness/indoor treatment ads by ${trigger.budgetChange}%. Use rain-specific creative.`,
          budgetChange: trigger.budgetChange,
          targetCampaigns: trigger.services.map(s => `campaign_${s}`),
          creativeRefresh: true,
        },
        budgetImpact: trigger.budgetChange,
        confidence: 75,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
        dataSource: 'Weather API',
      });
    }
  }

  // Sunny streak (3+ sunny days)
  if (weather.sunnyDaysThisWeek >= 3) {
    const trigger = WEATHER_TRIGGERS.find(t => t.condition === 'sunny_streak');
    if (trigger) {
      signals.push({
        id: 'weather_sunny_streak',
        type: 'weather',
        priority: 'medium',
        title: `Sunny week ahead (${weather.sunnyDaysThisWeek} days)`,
        description: `Sunny days in the PNW = body confidence and outdoor preparation. "${trigger.hookAngle}"`,
        affectedServices: trigger.services,
        recommendedAction: {
          type: 'increase_budget',
          description: `Increase laser/skin treatment ads by ${trigger.budgetChange}%. Use sun-ready creative.`,
          budgetChange: trigger.budgetChange,
          targetCampaigns: trigger.services.map(s => `campaign_${s}`),
          creativeRefresh: true,
        },
        budgetImpact: trigger.budgetChange,
        confidence: 70,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
        dataSource: 'Weather API',
      });
    }
  }

  // Cold snap (<40F)
  if (weather.temperature < 40) {
    const trigger = WEATHER_TRIGGERS.find(t => t.condition === 'cold_snap');
    if (trigger) {
      signals.push({
        id: 'weather_cold_snap',
        type: 'weather',
        priority: 'medium',
        title: `Cold snap: ${weather.temperature}F`,
        description: `Temperature dropped to ${weather.temperature}F. Push immunity and wellness services. "${trigger.hookAngle}"`,
        affectedServices: trigger.services,
        recommendedAction: {
          type: 'increase_budget',
          description: `Increase wellness/immune boost ads by ${trigger.budgetChange}%`,
          budgetChange: trigger.budgetChange,
          targetCampaigns: trigger.services.map(s => `campaign_${s}`),
          creativeRefresh: true,
        },
        budgetImpact: trigger.budgetChange,
        confidence: 70,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 5 * 86400000).toISOString(),
        dataSource: 'Weather API',
      });
    }
  }

  return signals;
}

// ── REVENUE GAP DETECTION ──

function detectRevenueGap(input: DemandEngineInput): DemandSignal[] {
  const signals: DemandSignal[] = [];

  const expectedRevenue = (input.monthlyRevenueTarget / input.daysInMonth) * input.dayOfMonth;
  const gap = expectedRevenue - input.currentMonthRevenue;
  const gapPercent = expectedRevenue > 0 ? (gap / expectedRevenue) * 100 : 0;

  if (gapPercent > 10) {
    const isLateMonth = input.dayOfMonth > input.daysInMonth * 0.7;
    const priority: DemandPriority = gapPercent > 25 ? 'critical' : gapPercent > 15 ? 'high' : 'medium';

    signals.push({
      id: 'revenue_gap',
      type: 'revenue_gap',
      priority,
      title: `Revenue gap: $${Math.round(gap).toLocaleString()} behind target`,
      description: `Current month revenue $${Math.round(input.currentMonthRevenue).toLocaleString()} vs expected $${Math.round(expectedRevenue).toLocaleString()} (${Math.round(gapPercent)}% behind). ${isLateMonth ? 'Late month - aggressive action needed.' : 'Early enough to recover with increased spend.'}`,
      affectedServices: ['all'],
      recommendedAction: {
        type: isLateMonth && gapPercent > 20 ? 'emergency_launch' : 'increase_budget',
        description: isLateMonth
          ? `Launch emergency campaign to close $${Math.round(gap).toLocaleString()} gap in remaining ${input.daysInMonth - input.dayOfMonth} days`
          : `Increase overall ad budget by ${Math.round(gapPercent)}% to get back on track`,
        budgetChange: Math.round(gapPercent),
        targetCampaigns: ['all'],
        newCampaignConfig: isLateMonth && gapPercent > 20 ? {
          name: 'Rani - Emergency - Revenue Recovery',
          services: ['botox', 'hydrafacial', 'wellness', 'glp1'],
          dailyBudget: Math.round(gap * 0.15 / (input.daysInMonth - input.dayOfMonth)),
          duration: input.daysInMonth - input.dayOfMonth,
          urgencyLevel: 'high',
          hook: 'Limited availability this month. Book now.',
          cta: 'Book Now',
        } : undefined,
      },
      budgetImpact: Math.round(gapPercent),
      confidence: 95,
      validFrom: new Date().toISOString(),
      validUntil: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
      dataSource: 'Revenue tracking',
    });
  }

  // Surplus - opportunity to invest
  if (gapPercent < -15) {
    signals.push({
      id: 'revenue_surplus',
      type: 'revenue_gap',
      priority: 'low',
      title: `Revenue ahead of target by ${Math.round(Math.abs(gapPercent))}%`,
      description: `Strong month. Consider investing surplus into brand awareness or testing new service campaigns.`,
      affectedServices: ['brand'],
      recommendedAction: {
        type: 'launch_campaign',
        description: 'Invest 10-15% of surplus into brand awareness or new service testing',
        budgetChange: 15,
        targetCampaigns: ['campaign_brand'],
      },
      budgetImpact: 15,
      confidence: 80,
      validFrom: new Date().toISOString(),
      validUntil: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
      dataSource: 'Revenue tracking',
    });
  }

  return signals;
}

// ── COMPETITOR SIGNALS ──

function processCompetitorSignals(competitorSignals: CompetitorSignal[]): DemandSignal[] {
  const signals: DemandSignal[] = [];

  for (const cs of competitorSignals) {
    if (cs.threatLevel === 'high' || cs.threatLevel === 'medium') {
      signals.push({
        id: `competitor_${cs.competitor.toLowerCase().replace(/\s/g, '_')}_${cs.signalType}`,
        type: 'competitor',
        priority: cs.threatLevel === 'high' ? 'high' : 'medium',
        title: `Competitor alert: ${cs.competitor} - ${cs.signalType}`,
        description: cs.description,
        affectedServices: cs.relevantServices,
        recommendedAction: {
          type: cs.signalType === 'promotion' ? 'increase_budget' : 'refresh_creative',
          description: cs.signalType === 'promotion'
            ? `Increase budget on ${cs.relevantServices.join(', ')} to maintain share of voice against ${cs.competitor}`
            : `Refresh creative to differentiate from ${cs.competitor}'s new messaging`,
          budgetChange: cs.threatLevel === 'high' ? 20 : 10,
          targetCampaigns: cs.relevantServices.map(s => `campaign_${s}`),
          creativeRefresh: true,
        },
        budgetImpact: cs.threatLevel === 'high' ? 20 : 10,
        confidence: 65,
        validFrom: cs.detectedDate,
        validUntil: new Date(Date.now() + 14 * 86400000).toISOString(),
        dataSource: 'Competitor monitoring',
      });
    }
  }

  return signals;
}

// ── PRIORITY QUEUE ──

function buildPriorityQueue(
  signals: DemandSignal[],
  input: DemandEngineInput,
): CampaignPriorityItem[] {
  const serviceScores: Record<string, { score: number; reasons: string[]; signals: DemandSignal[] }> = {};

  for (const signal of signals) {
    for (const service of signal.affectedServices) {
      if (!serviceScores[service]) serviceScores[service] = { score: 0, reasons: [], signals: [] };
      const priorityWeight: Record<DemandPriority, number> = { critical: 40, high: 25, medium: 15, low: 5 };
      serviceScores[service].score += priorityWeight[signal.priority];
      serviceScores[service].reasons.push(signal.title);
      serviceScores[service].signals.push(signal);
    }
  }

  const avgBookingValues: Record<string, number> = {
    sofwave: 3500, glp1: 2000, rf_microneedling: 650, laser_hair: 800,
    botox: 350, fillers: 600, hydrafacial: 275, vi_peel: 395,
    picoway: 450, prx: 495, wellness: 75, nad: 325, peptides: 400,
  };

  return Object.entries(serviceScores)
    .filter(([service]) => service !== 'all')
    .map(([service, data], idx) => ({
      rank: idx + 1,
      service,
      reason: data.reasons.slice(0, 3).join('; '),
      priority: data.score >= 40 ? 'critical' as DemandPriority : data.score >= 25 ? 'high' as DemandPriority : data.score >= 15 ? 'medium' as DemandPriority : 'low' as DemandPriority,
      estimatedRevenuePotential: (avgBookingValues[service] || 300) * 5, // rough estimate: 5 bookings
      recommendedBudget: Math.round((data.score / 100) * (input.currentMonthlyBudget * 0.2)),
    }))
    .sort((a, b) => b.estimatedRevenuePotential - a.estimatedRevenuePotential)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));
}

// ── BUDGET ADJUSTMENTS ──

function calculateBudgetAdjustments(
  signals: DemandSignal[],
  input: DemandEngineInput,
): BudgetAdjustment[] {
  const adjustments: BudgetAdjustment[] = [];

  for (const campaign of input.activeCampaigns) {
    const relevantSignals = signals.filter(s =>
      s.recommendedAction.targetCampaigns.includes(campaign.id) ||
      s.recommendedAction.targetCampaigns.includes('all')
    );

    if (relevantSignals.length === 0) continue;

    const totalBudgetChange = relevantSignals.reduce((sum, s) => sum + s.budgetImpact, 0);
    // Cap at +50% / -30% per campaign
    const cappedChange = Math.max(-30, Math.min(50, totalBudgetChange));
    const newBudget = Math.round(campaign.dailyBudget * (1 + cappedChange / 100) * 100) / 100;

    if (Math.abs(cappedChange) > 5) {
      adjustments.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        currentBudget: campaign.dailyBudget,
        recommendedBudget: newBudget,
        changePercent: cappedChange,
        reason: relevantSignals.map(s => s.title).join('; '),
      });
    }
  }

  return adjustments.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
}

// ── EMERGENCY CAMPAIGNS ──

function identifyEmergencyCampaigns(
  signals: DemandSignal[],
  input: DemandEngineInput,
): EmergencyCampaignConfig[] {
  return signals
    .filter(s => s.recommendedAction.type === 'emergency_launch' && s.recommendedAction.newCampaignConfig)
    .map(s => s.recommendedAction.newCampaignConfig!)
    .slice(0, 3); // max 3 emergency campaigns at a time
}

// ── AUTO-SCALE RULES ──

function generateAutoScaleRules(input: DemandEngineInput): AutoScaleRule[] {
  return [
    { metric: 'ROAS', condition: 'greater_than', threshold: 3.0, action: 'Increase daily budget by 20%', budgetImpact: 20 },
    { metric: 'ROAS', condition: 'less_than', threshold: 1.5, action: 'Decrease daily budget by 15%', budgetImpact: -15 },
    { metric: 'CPA', condition: 'greater_than', threshold: 200, action: 'Decrease daily budget by 20% and review targeting', budgetImpact: -20 },
    { metric: 'CTR', condition: 'less_than', threshold: 0.8, action: 'Pause campaign and refresh creative', budgetImpact: -100 },
    { metric: 'Appointment Utilization', condition: 'less_than', threshold: 50, action: 'Increase all campaign budgets by 30%', budgetImpact: 30 },
    { metric: 'Appointment Utilization', condition: 'greater_than', threshold: 90, action: 'Reduce top-of-funnel spend by 20%', budgetImpact: -20 },
    { metric: 'Revenue vs Target', condition: 'less_than', threshold: -20, action: 'Launch emergency campaign', budgetImpact: 40 },
    { metric: 'Frequency', condition: 'greater_than', threshold: 4.0, action: 'Rotate creative and expand audience', budgetImpact: 0 },
  ];
}

// ── DEMAND SCORE ──

function calculateDemandScore(signals: DemandSignal[], input: DemandEngineInput): number {
  let score = 50; // baseline

  // Utilization impact
  if (input.appointmentSlots.utilizationRate < 50) score += 25;
  else if (input.appointmentSlots.utilizationRate < 70) score += 15;
  else if (input.appointmentSlots.utilizationRate > 90) score -= 10;

  // Revenue gap impact
  const expectedRevenue = (input.monthlyRevenueTarget / input.daysInMonth) * input.dayOfMonth;
  const gapPercent = expectedRevenue > 0 ? ((expectedRevenue - input.currentMonthRevenue) / expectedRevenue) * 100 : 0;
  if (gapPercent > 20) score += 20;
  else if (gapPercent > 10) score += 10;
  else if (gapPercent < -10) score -= 10;

  // Signal count impact
  const criticalCount = signals.filter(s => s.priority === 'critical').length;
  const highCount = signals.filter(s => s.priority === 'high').length;
  score += criticalCount * 10 + highCount * 5;

  return Math.max(0, Math.min(100, score));
}

// ── SUMMARY ──

function generateSummary(
  signals: DemandSignal[],
  demandScore: number,
  adjustments: BudgetAdjustment[],
  emergencies: EmergencyCampaignConfig[],
): string {
  const criticals = signals.filter(s => s.priority === 'critical');
  const highs = signals.filter(s => s.priority === 'high');
  const increases = adjustments.filter(a => a.changePercent > 0);
  const decreases = adjustments.filter(a => a.changePercent < 0);

  let summary = `Demand Score: ${demandScore}/100. `;

  if (criticals.length > 0) {
    summary += `${criticals.length} critical signal(s) detected. `;
  }
  if (highs.length > 0) {
    summary += `${highs.length} high-priority signal(s). `;
  }
  if (increases.length > 0) {
    summary += `Recommending budget increases on ${increases.length} campaign(s). `;
  }
  if (decreases.length > 0) {
    summary += `Recommending budget decreases on ${decreases.length} campaign(s). `;
  }
  if (emergencies.length > 0) {
    summary += `${emergencies.length} emergency campaign(s) recommended. `;
  }
  if (demandScore > 70) {
    summary += 'Aggressive advertising recommended to capture demand and fill appointments.';
  } else if (demandScore > 50) {
    summary += 'Moderate advertising adjustments recommended based on current signals.';
  } else {
    summary += 'Steady state. Monitor and optimize existing campaigns.';
  }

  return summary;
}
