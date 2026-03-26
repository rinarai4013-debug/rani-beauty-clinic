/**
 * AI Schedule Optimizer Engine
 *
 * Analyzes appointment patterns, provider availability, room utilization,
 * and revenue-per-slot to generate optimal scheduling recommendations.
 *
 * Capabilities:
 * 1. Identify scheduling gaps and double-booking risks
 * 2. Suggest optimal appointment ordering for provider productivity
 * 3. Revenue-maximize time slots (push high-value services to peak hours)
 * 4. Provider workload balancing
 * 5. Buffer time optimization between treatments
 * 6. Predictive schedule filling (suggest outreach for empty slots)
 * 7. Room/equipment conflict detection
 */

// ── TYPES ──

export interface ScheduleInput {
  appointments: AppointmentData[];
  providers: ProviderAvailability[];
  rooms: RoomConfig[];
  historicalPatterns: HistoricalPattern[];
  serviceConfig: ServiceScheduleConfig[];
  dateRange: { start: string; end: string };
}

export interface AppointmentData {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  service: string;
  provider: string;
  room?: string;
  clientName: string;
  clientType: 'new' | 'returning' | 'member';
  estimatedRevenue: number;
  noShowRisk?: number; // 0-100
  status: 'confirmed' | 'tentative' | 'checked-in' | 'completed' | 'no-show' | 'cancelled';
}

export interface ProviderAvailability {
  name: string;
  role: 'provider' | 'esthetician' | 'injector';
  workingDays: number[]; // 0=Sun, 1=Mon, etc.
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  services: string[]; // services they can perform
  maxDailyAppointments: number;
  preferredBreakTime: string; // HH:MM
}

export interface RoomConfig {
  name: string;
  equipment: string[]; // e.g., ['Sofwave', 'HydraFacial']
  suitableServices: string[];
}

export interface HistoricalPattern {
  dayOfWeek: number;
  hour: number;
  avgBookings: number;
  avgRevenue: number;
  noShowRate: number;
  walkInRate: number;
}

export interface ServiceScheduleConfig {
  service: string;
  duration: number; // minutes
  setupTime: number; // minutes needed between appointments
  requiredEquipment?: string[];
  requiredRoom?: string;
  revenue: number;
  revenuePerMinute: number;
}

// ── OUTPUT TYPES ──

export interface ScheduleOptimization {
  gaps: ScheduleGap[];
  conflicts: ScheduleConflict[];
  revenueOpportunities: RevenueOpportunity[];
  providerBalance: ProviderBalanceAnalysis[];
  dailySummaries: DailyScheduleSummary[];
  recommendations: ScheduleRecommendation[];
  score: number; // 0-100 schedule efficiency score
}

export interface ScheduleGap {
  date: string;
  provider: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  potentialRevenue: number;
  suggestedService: string;
  suggestedAction: 'outreach_lapsed' | 'offer_walkin' | 'book_consult' | 'provider_admin';
}

export interface ScheduleConflict {
  date: string;
  type: 'double_booking' | 'room_conflict' | 'equipment_conflict' | 'insufficient_buffer' | 'overtime';
  description: string;
  severity: 'low' | 'medium' | 'high';
  appointments: string[]; // appointment IDs
  resolution: string;
}

export interface RevenueOpportunity {
  type: 'upgrade' | 'addon' | 'reschedule' | 'fill_gap' | 'waitlist';
  description: string;
  potentialRevenue: number;
  targetSlot?: { date: string; time: string; provider: string };
  suggestedClient?: string;
}

export interface ProviderBalanceAnalysis {
  provider: string;
  scheduledHours: number;
  availableHours: number;
  utilization: number; // percentage
  revenue: number;
  appointmentCount: number;
  avgGapBetweenAppts: number; // minutes
  status: 'underloaded' | 'balanced' | 'overloaded';
  recommendation: string;
}

export interface DailyScheduleSummary {
  date: string;
  dayOfWeek: string;
  totalAppointments: number;
  totalRevenue: number;
  utilization: number;
  gapCount: number;
  gapMinutes: number;
  highRiskNoShows: number;
  providers: { name: string; appointments: number; revenue: number }[];
}

export interface ScheduleRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'revenue' | 'efficiency' | 'balance' | 'risk';
  title: string;
  description: string;
  impact: string;
  action: string;
}

// ── CONSTANTS ──

const MIN_BUFFER_MINUTES = 10; // minimum between appointments
const IDEAL_BUFFER_MINUTES = 15;
const PREP_BUFFER_MINUTES = 5; // prep time before treatment
const CLEANUP_BUFFER_MINUTES = 10; // cleanup/turnover after treatment
const MAX_ROOMS = 3; // Rani has 3 treatment rooms
const PEAK_HOURS = [10, 11, 14, 15, 16]; // 10AM-12PM and 2-5PM
const OFF_PEAK_HOURS = [12, 13, 17, 18]; // lunch and late day

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ── MAIN ENGINE ──

export function optimizeSchedule(input: ScheduleInput): ScheduleOptimization {
  const gaps = findScheduleGaps(input);
  const conflicts = detectConflicts(input);
  const revenueOpportunities = findRevenueOpportunities(input, gaps);
  const providerBalance = analyzeProviderBalance(input);
  const dailySummaries = generateDailySummaries(input);
  const recommendations = generateRecommendations(input, gaps, conflicts, providerBalance);
  const score = calculateScheduleScore(input, gaps, conflicts, providerBalance);

  return {
    gaps,
    conflicts,
    revenueOpportunities,
    providerBalance,
    dailySummaries,
    recommendations,
    score,
  };
}

// ── GAP DETECTION ──

function findScheduleGaps(input: ScheduleInput): ScheduleGap[] {
  const gaps: ScheduleGap[] = [];

  // Group appointments by date and provider
  const byDateProvider = new Map<string, AppointmentData[]>();
  input.appointments
    .filter(a => a.status !== 'cancelled')
    .forEach(a => {
      const key = `${a.date}|${a.provider}`;
      const list = byDateProvider.get(key) || [];
      list.push(a);
      byDateProvider.set(key, list);
    });

  // For each provider-day, find gaps
  for (const provider of input.providers) {
    const dates = getDateRange(input.dateRange.start, input.dateRange.end);

    for (const date of dates) {
      const dayOfWeek = new Date(date).getDay();
      if (!provider.workingDays.includes(dayOfWeek)) continue;

      const key = `${date}|${provider.name}`;
      const dayAppts = (byDateProvider.get(key) || [])
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      // Gap at start of day
      if (dayAppts.length === 0) {
        const totalMinutes = timeToMinutes(provider.endTime) - timeToMinutes(provider.startTime);
        if (totalMinutes > 30) {
          gaps.push(createGap(date, provider.name, provider.startTime, provider.endTime, totalMinutes, input));
        }
        continue;
      }

      // Gap before first appointment
      const firstStart = timeToMinutes(dayAppts[0].startTime);
      const providerStart = timeToMinutes(provider.startTime);
      if (firstStart - providerStart >= 30) {
        gaps.push(createGap(date, provider.name, provider.startTime, dayAppts[0].startTime, firstStart - providerStart, input));
      }

      // Gaps between appointments
      for (let i = 0; i < dayAppts.length - 1; i++) {
        const endCurrent = timeToMinutes(dayAppts[i].endTime);
        const startNext = timeToMinutes(dayAppts[i + 1].startTime);
        const gapMinutes = startNext - endCurrent - IDEAL_BUFFER_MINUTES;

        if (gapMinutes >= 30) {
          const gapStart = minutesToTime(endCurrent + IDEAL_BUFFER_MINUTES);
          gaps.push(createGap(date, provider.name, gapStart, dayAppts[i + 1].startTime, gapMinutes, input));
        }
      }

      // Gap after last appointment
      const lastEnd = timeToMinutes(dayAppts[dayAppts.length - 1].endTime);
      const providerEnd = timeToMinutes(provider.endTime);
      if (providerEnd - lastEnd >= 30) {
        gaps.push(createGap(date, provider.name, dayAppts[dayAppts.length - 1].endTime, provider.endTime, providerEnd - lastEnd, input));
      }
    }
  }

  return gaps.sort((a, b) => b.potentialRevenue - a.potentialRevenue).slice(0, 20);
}

function createGap(
  date: string,
  provider: string,
  startTime: string,
  endTime: string,
  durationMinutes: number,
  input: ScheduleInput
): ScheduleGap {
  // Find best service that fits the gap
  const fittingServices = input.serviceConfig
    .filter(s => s.duration + s.setupTime <= durationMinutes)
    .sort((a, b) => b.revenuePerMinute - a.revenuePerMinute);

  const bestService = fittingServices[0];
  const hour = parseInt(startTime.split(':')[0]);
  const isPeak = PEAK_HOURS.includes(hour);

  return {
    date,
    provider,
    startTime,
    endTime,
    durationMinutes,
    potentialRevenue: bestService?.revenue || 0,
    suggestedService: bestService?.service || 'Consultation',
    suggestedAction: isPeak ? 'outreach_lapsed' : durationMinutes < 45 ? 'book_consult' : 'offer_walkin',
  };
}

// ── CONFLICT DETECTION ──

function detectConflicts(input: ScheduleInput): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  // Group by date
  const byDate = new Map<string, AppointmentData[]>();
  input.appointments
    .filter(a => a.status !== 'cancelled')
    .forEach(a => {
      const list = byDate.get(a.date) || [];
      list.push(a);
      byDate.set(a.date, list);
    });

  for (const [date, appts] of byDate.entries()) {
    // Check provider double-booking
    const byProvider = new Map<string, AppointmentData[]>();
    appts.forEach(a => {
      const list = byProvider.get(a.provider) || [];
      list.push(a);
      byProvider.set(a.provider, list);
    });

    for (const [provider, provAppts] of byProvider.entries()) {
      const sorted = provAppts.sort((a, b) => a.startTime.localeCompare(b.startTime));

      for (let i = 0; i < sorted.length - 1; i++) {
        const endCurrent = timeToMinutes(sorted[i].endTime);
        const startNext = timeToMinutes(sorted[i + 1].startTime);

        if (endCurrent > startNext) {
          conflicts.push({
            date,
            type: 'double_booking',
            description: `${provider}: "${sorted[i].service}" (ends ${sorted[i].endTime}) overlaps with "${sorted[i + 1].service}" (starts ${sorted[i + 1].startTime})`,
            severity: 'high',
            appointments: [sorted[i].id, sorted[i + 1].id],
            resolution: `Reschedule ${sorted[i + 1].service} to ${minutesToTime(endCurrent + IDEAL_BUFFER_MINUTES)} or later`,
          });
        } else if (startNext - endCurrent < MIN_BUFFER_MINUTES) {
          conflicts.push({
            date,
            type: 'insufficient_buffer',
            description: `${provider}: Only ${startNext - endCurrent}min between "${sorted[i].service}" and "${sorted[i + 1].service}" (need ${MIN_BUFFER_MINUTES}min)`,
            severity: 'medium',
            appointments: [sorted[i].id, sorted[i + 1].id],
            resolution: `Add ${MIN_BUFFER_MINUTES - (startNext - endCurrent)} minutes buffer`,
          });
        }
      }

      // Overtime check
      const providerConfig = input.providers.find(p => p.name === provider);
      if (providerConfig && sorted.length > 0) {
        const lastEnd = timeToMinutes(sorted[sorted.length - 1].endTime);
        const providerEnd = timeToMinutes(providerConfig.endTime);
        if (lastEnd > providerEnd) {
          conflicts.push({
            date,
            type: 'overtime',
            description: `${provider}: Last appointment ends at ${sorted[sorted.length - 1].endTime}, past shift end (${providerConfig.endTime})`,
            severity: 'medium',
            appointments: [sorted[sorted.length - 1].id],
            resolution: 'Reschedule to earlier slot or confirm provider overtime approval',
          });
        }
      }
    }

    // Room conflicts
    const byRoom = new Map<string, AppointmentData[]>();
    appts.filter(a => a.room).forEach(a => {
      const list = byRoom.get(a.room!) || [];
      list.push(a);
      byRoom.set(a.room!, list);
    });

    for (const [room, roomAppts] of byRoom.entries()) {
      const sorted = roomAppts.sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (let i = 0; i < sorted.length - 1; i++) {
        if (timeToMinutes(sorted[i].endTime) > timeToMinutes(sorted[i + 1].startTime)) {
          conflicts.push({
            date,
            type: 'room_conflict',
            description: `Room "${room}": "${sorted[i].service}" and "${sorted[i + 1].service}" overlap`,
            severity: 'high',
            appointments: [sorted[i].id, sorted[i + 1].id],
            resolution: `Move one appointment to different room or adjust timing`,
          });
        }
      }
    }
  }

  return conflicts;
}

// ── REVENUE OPPORTUNITIES ──

function findRevenueOpportunities(
  input: ScheduleInput,
  gaps: ScheduleGap[]
): RevenueOpportunity[] {
  const opportunities: RevenueOpportunity[] = [];

  // Gap filling
  const topGaps = gaps.slice(0, 5);
  topGaps.forEach(gap => {
    opportunities.push({
      type: 'fill_gap',
      description: `${gap.date} ${gap.startTime}-${gap.endTime} with ${gap.provider}: Book ${gap.suggestedService} ($${gap.potentialRevenue})`,
      potentialRevenue: gap.potentialRevenue,
      targetSlot: { date: gap.date, time: gap.startTime, provider: gap.provider },
    });
  });

  // Add-on opportunities (short gaps perfect for add-ons)
  const shortGaps = gaps.filter(g => g.durationMinutes >= 15 && g.durationMinutes <= 30);
  shortGaps.forEach(gap => {
    opportunities.push({
      type: 'addon',
      description: `${gap.date} ${gap.startTime}: Offer add-on service (Dermaplaning $49, Red Light $49, Neck/Décolleté $125)`,
      potentialRevenue: 75,
      targetSlot: { date: gap.date, time: gap.startTime, provider: gap.provider },
    });
  });

  // Upgrade opportunities: clients booked for lower-tier services during peak hours
  const peakAppointments = input.appointments
    .filter(a => {
      const hour = parseInt(a.startTime.split(':')[0]);
      return PEAK_HOURS.includes(hour) && a.estimatedRevenue < 200;
    });

  peakAppointments.slice(0, 3).forEach(appt => {
    const upgrade = input.serviceConfig
      .filter(s => s.revenue > appt.estimatedRevenue * 1.5)
      .sort((a, b) => b.revenuePerMinute - a.revenuePerMinute)[0];

    if (upgrade) {
      opportunities.push({
        type: 'upgrade',
        description: `${appt.date}: ${appt.clientName} booked ${appt.service} ($${appt.estimatedRevenue}) - suggest upgrade to ${upgrade.service} ($${upgrade.revenue})`,
        potentialRevenue: upgrade.revenue - appt.estimatedRevenue,
        suggestedClient: appt.clientName,
      });
    }
  });

  return opportunities.sort((a, b) => b.potentialRevenue - a.potentialRevenue);
}

// ── PROVIDER BALANCE ──

function analyzeProviderBalance(input: ScheduleInput): ProviderBalanceAnalysis[] {
  return input.providers.map(provider => {
    const providerAppts = input.appointments
      .filter(a => a.provider === provider.name && a.status !== 'cancelled');

    const scheduledMinutes = providerAppts.reduce((sum, a) => {
      return sum + (timeToMinutes(a.endTime) - timeToMinutes(a.startTime));
    }, 0);

    const workDaysInRange = getDateRange(input.dateRange.start, input.dateRange.end)
      .filter(d => provider.workingDays.includes(new Date(d).getDay())).length;

    const dailyAvailableMinutes = timeToMinutes(provider.endTime) - timeToMinutes(provider.startTime);
    const totalAvailableMinutes = workDaysInRange * dailyAvailableMinutes;
    const scheduledHours = Math.round(scheduledMinutes / 60 * 10) / 10;
    const availableHours = Math.round(totalAvailableMinutes / 60 * 10) / 10;
    const utilization = totalAvailableMinutes > 0
      ? Math.round((scheduledMinutes / totalAvailableMinutes) * 100)
      : 0;

    const revenue = providerAppts.reduce((sum, a) => sum + a.estimatedRevenue, 0);

    // Average gap between appointments
    const sortedAppts = [...providerAppts].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

    let totalGap = 0;
    let gapCount = 0;
    for (let i = 0; i < sortedAppts.length - 1; i++) {
      if (sortedAppts[i].date === sortedAppts[i + 1].date) {
        totalGap += timeToMinutes(sortedAppts[i + 1].startTime) - timeToMinutes(sortedAppts[i].endTime);
        gapCount++;
      }
    }
    const avgGap = gapCount > 0 ? Math.round(totalGap / gapCount) : 0;

    const status: 'underloaded' | 'balanced' | 'overloaded' =
      utilization < 50 ? 'underloaded' :
      utilization > 90 ? 'overloaded' : 'balanced';

    const recommendation =
      status === 'underloaded'
        ? `${provider.name} has ${Math.round(availableHours - scheduledHours)} hours open. Assign walk-ins and consultations to fill capacity.`
        : status === 'overloaded'
        ? `${provider.name} at ${utilization}% capacity - risk of burnout. Redistribute to other providers.`
        : `${provider.name} well-balanced at ${utilization}% utilization.`;

    return {
      provider: provider.name,
      scheduledHours,
      availableHours,
      utilization,
      revenue,
      appointmentCount: providerAppts.length,
      avgGapBetweenAppts: avgGap,
      status,
      recommendation,
    };
  });
}

// ── DAILY SUMMARIES ──

function generateDailySummaries(input: ScheduleInput): DailyScheduleSummary[] {
  const dates = getDateRange(input.dateRange.start, input.dateRange.end);

  return dates.map(date => {
    const dayAppts = input.appointments
      .filter(a => a.date === date && a.status !== 'cancelled');

    const dayOfWeek = DAYS_OF_WEEK[new Date(date).getDay()];
    const totalRevenue = dayAppts.reduce((sum, a) => sum + a.estimatedRevenue, 0);
    const highRiskNoShows = dayAppts.filter(a => (a.noShowRisk || 0) > 60).length;

    // Calculate utilization
    const activeProviders = input.providers.filter(p =>
      p.workingDays.includes(new Date(date).getDay())
    );
    const totalAvailableMinutes = activeProviders.reduce((sum, p) =>
      sum + (timeToMinutes(p.endTime) - timeToMinutes(p.startTime)), 0
    );
    const scheduledMinutes = dayAppts.reduce((sum, a) =>
      sum + (timeToMinutes(a.endTime) - timeToMinutes(a.startTime)), 0
    );
    const utilization = totalAvailableMinutes > 0
      ? Math.round((scheduledMinutes / totalAvailableMinutes) * 100)
      : 0;

    // Gaps
    const gapMinutes = totalAvailableMinutes - scheduledMinutes;
    const gapCount = Math.floor(gapMinutes / 30); // rough estimate

    // Provider breakdown
    const providerMap = new Map<string, { appointments: number; revenue: number }>();
    dayAppts.forEach(a => {
      const existing = providerMap.get(a.provider) || { appointments: 0, revenue: 0 };
      existing.appointments++;
      existing.revenue += a.estimatedRevenue;
      providerMap.set(a.provider, existing);
    });

    return {
      date,
      dayOfWeek,
      totalAppointments: dayAppts.length,
      totalRevenue,
      utilization,
      gapCount,
      gapMinutes,
      highRiskNoShows,
      providers: Array.from(providerMap.entries())
        .map(([name, data]) => ({ name, ...data })),
    };
  });
}

// ── RECOMMENDATIONS ──

function generateRecommendations(
  input: ScheduleInput,
  gaps: ScheduleGap[],
  conflicts: ScheduleConflict[],
  balance: ProviderBalanceAnalysis[]
): ScheduleRecommendation[] {
  const recs: ScheduleRecommendation[] = [];

  // High-priority conflicts
  const highConflicts = conflicts.filter(c => c.severity === 'high');
  if (highConflicts.length > 0) {
    recs.push({
      priority: 'high',
      category: 'risk',
      title: `${highConflicts.length} scheduling conflict${highConflicts.length > 1 ? 's' : ''} detected`,
      description: highConflicts[0].description,
      impact: 'Could result in client wait times, provider stress, or missed appointments',
      action: highConflicts[0].resolution,
    });
  }

  // Revenue gaps
  const topGaps = gaps.filter(g => g.potentialRevenue > 200).slice(0, 3);
  if (topGaps.length > 0) {
    const totalPotential = topGaps.reduce((sum, g) => sum + g.potentialRevenue, 0);
    recs.push({
      priority: 'high',
      category: 'revenue',
      title: `$${totalPotential.toLocaleString()} revenue in unfilled slots`,
      description: `${topGaps.length} high-value time slots available in the next 7 days`,
      impact: `Fill these with targeted outreach to lapsed or waitlisted clients`,
      action: `Send reactivation SMS to clients who haven\'t visited in 30+ days for these slots`,
    });
  }

  // Provider imbalance
  const underloaded = balance.filter(b => b.status === 'underloaded');
  const overloaded = balance.filter(b => b.status === 'overloaded');
  if (underloaded.length > 0 && overloaded.length > 0) {
    recs.push({
      priority: 'medium',
      category: 'balance',
      title: 'Provider workload imbalance',
      description: `${overloaded.map(o => o.provider).join(', ')} overbooked while ${underloaded.map(u => u.provider).join(', ')} has open slots`,
      impact: 'Affects provider satisfaction and client wait times',
      action: 'Redistribute new bookings to underloaded providers; route front desk accordingly',
    });
  }

  // No-show risk
  const highRiskAppts = input.appointments.filter(a => (a.noShowRisk || 0) > 70);
  if (highRiskAppts.length > 0) {
    recs.push({
      priority: 'medium',
      category: 'risk',
      title: `${highRiskAppts.length} appointments at high no-show risk`,
      description: 'These clients have history of missed appointments or no deposit on file',
      impact: `Potential loss of $${highRiskAppts.reduce((s, a) => s + a.estimatedRevenue, 0).toLocaleString()}`,
      action: 'Send confirmation SMS 24h and 2h before. Require deposit for high-risk clients.',
    });
  }

  // Peak hour optimization
  const offPeakHighValue = input.appointments.filter(a => {
    const hour = parseInt(a.startTime.split(':')[0]);
    return OFF_PEAK_HOURS.includes(hour) && a.estimatedRevenue > 500;
  });
  if (offPeakHighValue.length > 3) {
    recs.push({
      priority: 'low',
      category: 'efficiency',
      title: 'High-value services scheduled during off-peak',
      description: `${offPeakHighValue.length} premium treatments ($500+) are in off-peak slots (12-1PM, 5-6PM)`,
      impact: 'Peak slots (10AM-12PM, 2-5PM) have higher conversion and show rates',
      action: 'Encourage premium service bookings during peak hours; fill off-peak with consultations',
    });
  }

  return recs.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ── SCHEDULE SCORE ──

function calculateScheduleScore(
  input: ScheduleInput,
  gaps: ScheduleGap[],
  conflicts: ScheduleConflict[],
  balance: ProviderBalanceAnalysis[]
): number {
  let score = 100;

  // Deductions for conflicts
  const highConflicts = conflicts.filter(c => c.severity === 'high').length;
  const medConflicts = conflicts.filter(c => c.severity === 'medium').length;
  score -= highConflicts * 10;
  score -= medConflicts * 5;

  // Deductions for large gaps
  const largeGaps = gaps.filter(g => g.durationMinutes > 60).length;
  score -= largeGaps * 3;

  // Deductions for imbalanced providers
  const imbalanced = balance.filter(b => b.status !== 'balanced').length;
  score -= imbalanced * 5;

  // Bonus for good utilization
  const avgUtil = balance.reduce((s, b) => s + b.utilization, 0) / (balance.length || 1);
  if (avgUtil > 75) score += 5;
  if (avgUtil > 85) score += 5;

  return Math.max(0, Math.min(100, score));
}

// ── UTILITY FUNCTIONS ──

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function getDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  const endDate = new Date(end);

  while (current <= endDate) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}
