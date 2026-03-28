/**
 * Revenue Gap Detection Engine
 *
 * Identifies every unfilled appointment slot, underperforming day,
 * declining service, overdue client, and underutilized membership --
 * then calculates the total addressable revenue gap and generates
 * prioritized action items to capture every dollar.
 *
 * CRITICAL: Rani does IM INJECTIONS only. Never say "infusion."
 */

// ── TYPES ──

export interface GapFinderInput {
  appointments: ScheduledAppointment[];
  providers: ProviderSchedule[];
  services: ServiceConfig[];
  clients: ClientRecord[];
  memberships: MembershipRecord[];
  transactions: TransactionRecord[];
  kpiSnapshots: KPISnapshot[];
  dateRange: { start: string; end: string };
}

export interface ScheduledAppointment {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  service: string;
  provider: string;
  clientId: string;
  clientName: string;
  estimatedRevenue: number;
  status: 'confirmed' | 'tentative' | 'checked-in' | 'completed' | 'no-show' | 'cancelled';
}

export interface ProviderSchedule {
  name: string;
  role: 'provider' | 'esthetician' | 'injector';
  workingDays: number[]; // 0=Sun ... 6=Sat
  startTime: string;
  endTime: string;
  services: string[];
  hourlyCapacity: number; // avg revenue per hour when fully booked
}

export interface ServiceConfig {
  name: string;
  category: string;
  basePrice: number;
  duration: number; // minutes
  rebookIntervalDays: number; // e.g. Botox=90, filler=365
  avgRevenuePerSession: number;
}

export interface ClientRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  lastVisitDate: string; // ISO
  totalSpend: number;
  visitCount: number;
  membershipTier?: string;
  membershipStatus?: string;
  lastServices: string[];
  preferredProvider?: string;
}

export interface MembershipRecord {
  id: string;
  clientId: string;
  clientName: string;
  tier: string;
  monthlyPrice: number;
  status: string;
  startDate: string;
  creditsRemaining: number;
  creditsUsedThisMonth: number;
  totalMonthlyCredits: number;
  lastRedemptionDate?: string;
}

export interface TransactionRecord {
  date: string;
  amount: number;
  service: string;
  provider: string;
  clientId: string;
}

export interface KPISnapshot {
  date: string;
  revenue: number;
  totalBookings: number;
  dayOfWeek: number;
}

// ── OUTPUT TYPES ──

export interface GapFinderResult {
  summary: GapSummary;
  emptySlots: EmptySlotGap[];
  underperformingDays: DayPerformanceGap[];
  decliningServices: ServiceDeclineGap[];
  overdueClients: OverdueClientGap[];
  membershipGaps: MembershipUnderutilizationGap[];
  dormantHighValue: DormantHighValueGap[];
  actionItems: RevenueActionItem[];
}

export interface GapSummary {
  totalAddressableGap: number;
  gapByCategory: {
    emptySlots: number;
    underperformingDays: number;
    decliningServices: number;
    overdueRebookings: number;
    membershipUnderutilization: number;
    dormantHighValue: number;
  };
  fillabilityScore: number; // 0-100 how easy these gaps are to fill
  urgencyScore: number; // 0-100 how urgent it is to act
  period: string;
}

export interface EmptySlotGap {
  date: string;
  dayOfWeek: string;
  provider: string;
  timeSlot: string;
  durationMinutes: number;
  estimatedRevenue: number;
  suggestedServices: string[];
  fillDifficulty: 'easy' | 'moderate' | 'hard';
  daysUntil: number;
}

export interface DayPerformanceGap {
  dayOfWeek: string;
  dayIndex: number;
  avgRevenue: number;
  benchmarkRevenue: number;
  gap: number;
  gapPercent: number;
  avgBookings: number;
  suggestedActions: string[];
}

export interface ServiceDeclineGap {
  service: string;
  category: string;
  currentMonthBookings: number;
  previousMonthBookings: number;
  declinePercent: number;
  revenueImpact: number;
  possibleReasons: string[];
  suggestedActions: string[];
}

export interface OverdueClientGap {
  clientId: string;
  clientName: string;
  lastService: string;
  lastVisitDate: string;
  daysSinceVisit: number;
  expectedRebookDays: number;
  daysOverdue: number;
  estimatedRevenue: number;
  urgency: 'due-soon' | 'overdue' | 'significantly-overdue' | 'at-risk';
  preferredProvider?: string;
  contactMethod: string;
}

export interface MembershipUnderutilizationGap {
  clientId: string;
  clientName: string;
  tier: string;
  monthlyCredits: number;
  creditsUsedThisMonth: number;
  creditsRemaining: number;
  utilizationPercent: number;
  monthlyPrice: number;
  wastedValue: number;
  daysSinceLastRedemption: number;
  suggestedOutreach: string;
}

export interface DormantHighValueGap {
  clientId: string;
  clientName: string;
  totalSpend: number;
  visitCount: number;
  avgTicket: number;
  daysSinceVisit: number;
  estimatedRecoverableRevenue: number;
  lastServices: string[];
  suggestedApproach: string;
}

export interface RevenueActionItem {
  id: string;
  category: 'fill-slot' | 'rebook-overdue' | 'activate-membership' | 'reactivate-vip' | 'boost-service' | 'optimize-day';
  title: string;
  description: string;
  estimatedRevenue: number;
  effort: 'low' | 'medium' | 'high';
  timeToImpact: 'same-day' | 'this-week' | 'this-month';
  priority: number; // 0-100
  targetClients?: string[];
  suggestedScript?: string;
}

// ── SERVICE REBOOK INTERVALS ──

const REBOOK_INTERVALS: Record<string, number> = {
  'Botox': 90,
  'Fillers': 365,
  'Lip Filler': 365,
  'HydraFacial': 30,
  'VI Peel': 42,
  'PRX-T33': 28,
  'RF Microneedling': 42,
  'PicoWay': 42,
  'Laser Hair Removal': 42,
  'Sofwave': 365,
  'BioRePeel': 28,
  'Glutathione Injection': 14,
  'B12 Injection': 14,
  'Vitamin D3 Injection': 30,
  'Tri-Immune Injection': 14,
  'NAD+ Injection': 30,
  'GLP-1': 7,
  'Tretinoin': 30,
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ── CORE ENGINE ──

export function analyzeRevenueGaps(input: GapFinderInput): GapFinderResult {
  const now = new Date();

  const emptySlots = findEmptySlots(input, now);
  const underperformingDays = findUnderperformingDays(input);
  const decliningServices = findDecliningServices(input, now);
  const overdueClients = findOverdueClients(input, now);
  const membershipGaps = findMembershipUnderutilization(input, now);
  const dormantHighValue = findDormantHighValueClients(input, now);

  const gapByCategory = {
    emptySlots: emptySlots.reduce((s, g) => s + g.estimatedRevenue, 0),
    underperformingDays: underperformingDays.reduce((s, g) => s + g.gap, 0),
    decliningServices: decliningServices.reduce((s, g) => s + g.revenueImpact, 0),
    overdueRebookings: overdueClients.reduce((s, g) => s + g.estimatedRevenue, 0),
    membershipUnderutilization: membershipGaps.reduce((s, g) => s + g.wastedValue, 0),
    dormantHighValue: dormantHighValue.reduce((s, g) => s + g.estimatedRecoverableRevenue, 0),
  };

  const totalAddressableGap = Object.values(gapByCategory).reduce((s, v) => s + v, 0);

  const actionItems = generateActionItems(
    emptySlots, underperformingDays, decliningServices,
    overdueClients, membershipGaps, dormantHighValue,
  );

  const fillabilityScore = calculateFillabilityScore(emptySlots, overdueClients, membershipGaps);
  const urgencyScore = calculateUrgencyScore(emptySlots, overdueClients, dormantHighValue);

  return {
    summary: {
      totalAddressableGap,
      gapByCategory,
      fillabilityScore,
      urgencyScore,
      period: `${input.dateRange.start} to ${input.dateRange.end}`,
    },
    emptySlots: emptySlots.slice(0, 50),
    underperformingDays,
    decliningServices,
    overdueClients: overdueClients.slice(0, 100),
    membershipGaps: membershipGaps.slice(0, 50),
    dormantHighValue: dormantHighValue.slice(0, 50),
    actionItems: actionItems.sort((a, b) => b.priority - a.priority).slice(0, 25),
  };
}

// ── EMPTY SLOT DETECTION ──

function findEmptySlots(input: GapFinderInput, now: Date): EmptySlotGap[] {
  const gaps: EmptySlotGap[] = [];
  const { appointments, providers, dateRange } = input;

  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);

  // Build a map of booked slots per provider per day
  const bookedMap = new Map<string, ScheduledAppointment[]>();
  for (const apt of appointments) {
    if (apt.status === 'cancelled' || apt.status === 'no-show') continue;
    const key = `${apt.provider}|${apt.date}`;
    if (!bookedMap.has(key)) bookedMap.set(key, []);
    bookedMap.get(key)!.push(apt);
  }

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay();
    const daysUntil = Math.ceil((d.getTime() - now.getTime()) / (86400000));

    if (daysUntil < 0) continue; // skip past dates

    for (const provider of providers) {
      if (!provider.workingDays.includes(dayOfWeek)) continue;

      const key = `${provider.name}|${dateStr}`;
      const booked = (bookedMap.get(key) || []).sort((a, b) => a.startTime.localeCompare(b.startTime));

      // Find open windows
      const openSlots = findOpenWindows(provider.startTime, provider.endTime, booked);

      for (const slot of openSlots) {
        if (slot.durationMinutes < 30) continue; // too small to fill

        const estimatedRevenue = (slot.durationMinutes / 60) * provider.hourlyCapacity;
        const suggestedServices = suggestServicesForSlot(slot.durationMinutes, input.services, provider.services);

        gaps.push({
          date: dateStr,
          dayOfWeek: DAY_NAMES[dayOfWeek],
          provider: provider.name,
          timeSlot: `${slot.start} - ${slot.end}`,
          durationMinutes: slot.durationMinutes,
          estimatedRevenue,
          suggestedServices,
          fillDifficulty: daysUntil <= 1 ? 'hard' : daysUntil <= 3 ? 'moderate' : 'easy',
          daysUntil,
        });
      }
    }
  }

  return gaps.sort((a, b) => a.daysUntil - b.daysUntil);
}

function findOpenWindows(
  providerStart: string,
  providerEnd: string,
  booked: ScheduledAppointment[],
): { start: string; end: string; durationMinutes: number }[] {
  const windows: { start: string; end: string; durationMinutes: number }[] = [];

  if (booked.length === 0) {
    const dur = timeToMinutes(providerEnd) - timeToMinutes(providerStart);
    if (dur > 0) windows.push({ start: providerStart, end: providerEnd, durationMinutes: dur });
    return windows;
  }

  // Gap before first appointment
  const beforeFirst = timeToMinutes(booked[0].startTime) - timeToMinutes(providerStart);
  if (beforeFirst >= 30) {
    windows.push({
      start: providerStart,
      end: booked[0].startTime,
      durationMinutes: beforeFirst,
    });
  }

  // Gaps between appointments
  for (let i = 0; i < booked.length - 1; i++) {
    const gapStart = booked[i].endTime;
    const gapEnd = booked[i + 1].startTime;
    const dur = timeToMinutes(gapEnd) - timeToMinutes(gapStart);
    if (dur >= 30) {
      windows.push({ start: gapStart, end: gapEnd, durationMinutes: dur });
    }
  }

  // Gap after last appointment
  const afterLast = timeToMinutes(providerEnd) - timeToMinutes(booked[booked.length - 1].endTime);
  if (afterLast >= 30) {
    windows.push({
      start: booked[booked.length - 1].endTime,
      end: providerEnd,
      durationMinutes: afterLast,
    });
  }

  return windows;
}

function suggestServicesForSlot(durationMinutes: number, services: ServiceConfig[], providerServices: string[]): string[] {
  return services
    .filter(s => s.duration <= durationMinutes && providerServices.includes(s.name))
    .sort((a, b) => b.avgRevenuePerSession - a.avgRevenuePerSession)
    .slice(0, 3)
    .map(s => s.name);
}

// ── UNDERPERFORMING DAYS ──

function findUnderperformingDays(input: GapFinderInput): DayPerformanceGap[] {
  const dayRevenues: number[][] = [[], [], [], [], [], [], []];

  for (const snap of input.kpiSnapshots) {
    if (snap.dayOfWeek >= 0 && snap.dayOfWeek <= 6) {
      dayRevenues[snap.dayOfWeek].push(snap.revenue);
    }
  }

  const avgByDay = dayRevenues.map(revs =>
    revs.length > 0 ? revs.reduce((s, r) => s + r, 0) / revs.length : 0,
  );

  const workingDays = avgByDay.filter(a => a > 0);
  const benchmarkRevenue = workingDays.length > 0
    ? workingDays.reduce((s, r) => s + r, 0) / workingDays.length
    : 0;

  const gaps: DayPerformanceGap[] = [];

  for (let i = 0; i < 7; i++) {
    if (avgByDay[i] === 0) continue; // clinic not open

    const gap = benchmarkRevenue - avgByDay[i];
    const gapPercent = benchmarkRevenue > 0 ? (gap / benchmarkRevenue) * 100 : 0;

    if (gapPercent > 10) {
      const bookingsForDay = input.kpiSnapshots
        .filter(s => s.dayOfWeek === i)
        .map(s => s.totalBookings);
      const avgBookings = bookingsForDay.length > 0
        ? bookingsForDay.reduce((s, b) => s + b, 0) / bookingsForDay.length
        : 0;

      gaps.push({
        dayOfWeek: DAY_NAMES[i],
        dayIndex: i,
        avgRevenue: Math.round(avgByDay[i]),
        benchmarkRevenue: Math.round(benchmarkRevenue),
        gap: Math.round(gap),
        gapPercent: Math.round(gapPercent),
        avgBookings: Math.round(avgBookings * 10) / 10,
        suggestedActions: generateDayActions(DAY_NAMES[i], gapPercent, avgBookings),
      });
    }
  }

  return gaps.sort((a, b) => b.gap - a.gap);
}

function generateDayActions(day: string, gapPercent: number, avgBookings: number): string[] {
  const actions: string[] = [];

  if (gapPercent > 30) {
    actions.push(`Run "${day} Special" promotion to drive bookings`);
    actions.push(`Offer last-minute availability discounts for ${day}`);
  }
  if (avgBookings < 5) {
    actions.push(`Target reactivation outreach for ${day} appointments`);
    actions.push(`Consider adding a provider or extending hours on ${day}`);
  }
  actions.push(`Schedule high-value services (Sofwave, RF Microneedling) on ${day} to boost revenue per visit`);

  return actions;
}

// ── DECLINING SERVICES ──

function findDecliningServices(input: GapFinderInput, now: Date): ServiceDeclineGap[] {
  const gaps: ServiceDeclineGap[] = [];
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const currentMonth = new Map<string, number>();
  const prevMonth = new Map<string, number>();

  for (const tx of input.transactions) {
    const txDate = new Date(tx.date);
    if (txDate >= currentMonthStart && txDate <= now) {
      currentMonth.set(tx.service, (currentMonth.get(tx.service) || 0) + 1);
    } else if (txDate >= prevMonthStart && txDate <= prevMonthEnd) {
      prevMonth.set(tx.service, (prevMonth.get(tx.service) || 0) + 1);
    }
  }

  // Normalize current month (project if we're mid-month)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const projectionFactor = dayOfMonth > 5 ? daysInMonth / dayOfMonth : 1;

  for (const service of input.services) {
    const current = (currentMonth.get(service.name) || 0);
    const projected = Math.round(current * projectionFactor);
    const prev = prevMonth.get(service.name) || 0;

    if (prev >= 3 && projected < prev) {
      const declinePercent = Math.round(((prev - projected) / prev) * 100);
      if (declinePercent >= 15) {
        gaps.push({
          service: service.name,
          category: service.category,
          currentMonthBookings: projected,
          previousMonthBookings: prev,
          declinePercent,
          revenueImpact: (prev - projected) * service.avgRevenuePerSession,
          possibleReasons: generateDeclineReasons(service.name, declinePercent),
          suggestedActions: generateServiceActions(service.name, declinePercent),
        });
      }
    }
  }

  return gaps.sort((a, b) => b.revenueImpact - a.revenueImpact);
}

function generateDeclineReasons(service: string, declinePercent: number): string[] {
  const reasons: string[] = [];
  if (declinePercent > 40) reasons.push('Significant drop may indicate competitive pressure or seasonal shift');
  reasons.push('Clients may not be aware of current availability');
  reasons.push('Previous clients may be overdue for rebooking');
  if (service.includes('Laser') || service.includes('Peel')) {
    reasons.push('Seasonal trend -- some skin treatments slow in summer');
  }
  return reasons;
}

function generateServiceActions(service: string, declinePercent: number): string[] {
  const actions: string[] = [];
  actions.push(`Send targeted rebooking campaign to past ${service} clients`);
  if (declinePercent > 30) {
    actions.push(`Create a limited-time ${service} package to drive volume`);
  }
  actions.push(`Feature ${service} in this week's social content`);
  actions.push(`Train front desk to suggest ${service} during booking calls`);
  return actions;
}

// ── OVERDUE CLIENT DETECTION ──

function findOverdueClients(input: GapFinderInput, now: Date): OverdueClientGap[] {
  const gaps: OverdueClientGap[] = [];

  for (const client of input.clients) {
    if (!client.lastVisitDate || client.status === 'churned') continue;

    const lastVisit = new Date(client.lastVisitDate);
    const daysSinceVisit = Math.floor((now.getTime() - lastVisit.getTime()) / 86400000);

    for (const service of client.lastServices) {
      const expectedDays = REBOOK_INTERVALS[service] || getDefaultRebookInterval(service, input.services);
      if (!expectedDays) continue;

      const daysOverdue = daysSinceVisit - expectedDays;
      if (daysOverdue < -14) continue; // not due yet (more than 2 weeks out)

      let urgency: OverdueClientGap['urgency'];
      if (daysOverdue < 0) urgency = 'due-soon';
      else if (daysOverdue <= 14) urgency = 'overdue';
      else if (daysOverdue <= 45) urgency = 'significantly-overdue';
      else urgency = 'at-risk';

      const serviceConfig = input.services.find(s => s.name === service);
      const estimatedRevenue = serviceConfig?.avgRevenuePerSession || 250;

      gaps.push({
        clientId: client.id,
        clientName: client.name,
        lastService: service,
        lastVisitDate: client.lastVisitDate,
        daysSinceVisit,
        expectedRebookDays: expectedDays,
        daysOverdue: Math.max(0, daysOverdue),
        estimatedRevenue,
        urgency,
        preferredProvider: client.preferredProvider,
        contactMethod: client.phone ? 'sms' : 'email',
      });
    }
  }

  return gaps.sort((a, b) => b.estimatedRevenue - a.estimatedRevenue);
}

function getDefaultRebookInterval(service: string, services: ServiceConfig[]): number {
  const config = services.find(s => s.name === service);
  return config?.rebookIntervalDays || 60;
}

// ── MEMBERSHIP UNDERUTILIZATION ──

function findMembershipUnderutilization(input: GapFinderInput, now: Date): MembershipUnderutilizationGap[] {
  const gaps: MembershipUnderutilizationGap[] = [];

  for (const mem of input.memberships) {
    if (mem.status !== 'active') continue;

    const utilizationPercent = mem.totalMonthlyCredits > 0
      ? Math.round((mem.creditsUsedThisMonth / mem.totalMonthlyCredits) * 100)
      : 0;

    const daysSinceRedemption = mem.lastRedemptionDate
      ? Math.floor((now.getTime() - new Date(mem.lastRedemptionDate).getTime()) / 86400000)
      : 999;

    // Flag if using less than 50% of credits or haven't redeemed in 30+ days
    if (utilizationPercent < 50 || daysSinceRedemption > 30) {
      const wastedValue = mem.creditsRemaining;

      gaps.push({
        clientId: mem.clientId,
        clientName: mem.clientName,
        tier: mem.tier,
        monthlyCredits: mem.totalMonthlyCredits,
        creditsUsedThisMonth: mem.creditsUsedThisMonth,
        creditsRemaining: mem.creditsRemaining,
        utilizationPercent,
        monthlyPrice: mem.monthlyPrice,
        wastedValue,
        daysSinceLastRedemption: daysSinceRedemption === 999 ? 0 : daysSinceRedemption,
        suggestedOutreach: generateMembershipOutreach(mem.tier, utilizationPercent, daysSinceRedemption),
      });
    }
  }

  return gaps.sort((a, b) => b.wastedValue - a.wastedValue);
}

function generateMembershipOutreach(tier: string, utilization: number, daysSinceRedemption: number): string {
  if (daysSinceRedemption > 60) {
    return `Urgent: ${tier} member hasn't redeemed in ${daysSinceRedemption} days. Personal call from concierge to schedule their next appointment and remind them of unused credits.`;
  }
  if (utilization < 25) {
    return `${tier} member is barely using their credits. Send a curated treatment recommendation highlighting what their membership covers this month.`;
  }
  return `${tier} member has credits remaining. Friendly SMS reminder about available credits before month-end.`;
}

// ── DORMANT HIGH-VALUE CLIENTS ──

function findDormantHighValueClients(input: GapFinderInput, now: Date): DormantHighValueGap[] {
  const gaps: DormantHighValueGap[] = [];

  // Define "high value" as top 20% by total spend
  const sortedBySpend = [...input.clients]
    .filter(c => c.totalSpend > 0)
    .sort((a, b) => b.totalSpend - a.totalSpend);

  const topTwentyPercent = Math.ceil(sortedBySpend.length * 0.2);
  const highValueThreshold = sortedBySpend[topTwentyPercent]?.totalSpend || 500;

  for (const client of input.clients) {
    if (client.totalSpend < highValueThreshold) continue;
    if (!client.lastVisitDate) continue;

    const daysSinceVisit = Math.floor(
      (now.getTime() - new Date(client.lastVisitDate).getTime()) / 86400000,
    );

    if (daysSinceVisit < 45) continue; // not dormant yet for high value

    const avgTicket = client.visitCount > 0 ? client.totalSpend / client.visitCount : 0;

    gaps.push({
      clientId: client.id,
      clientName: client.name,
      totalSpend: client.totalSpend,
      visitCount: client.visitCount,
      avgTicket: Math.round(avgTicket),
      daysSinceVisit,
      estimatedRecoverableRevenue: Math.round(avgTicket * 2), // next 2 visits
      lastServices: client.lastServices,
      suggestedApproach: generateVipApproach(client, daysSinceVisit),
    });
  }

  return gaps.sort((a, b) => b.estimatedRecoverableRevenue - a.estimatedRecoverableRevenue);
}

function generateVipApproach(client: ClientRecord, daysSinceVisit: number): string {
  if (daysSinceVisit > 120) {
    return `White-glove win-back: Personal call from provider, exclusive return offer, complimentary add-on for their next visit. This client has invested $${client.totalSpend.toLocaleString()} with us.`;
  }
  if (daysSinceVisit > 90) {
    return `Priority outreach: Personalized SMS from their preferred provider. Mention specific results from their last ${client.lastServices[0] || 'treatment'} and suggest their next step in their transformation journey.`;
  }
  return `Gentle re-engagement: Curated treatment recommendation based on their history. Emphasize continuity of results and exclusive member-like scheduling priority.`;
}

// ── ACTION ITEM GENERATION ──

function generateActionItems(
  slots: EmptySlotGap[],
  days: DayPerformanceGap[],
  services: ServiceDeclineGap[],
  overdue: OverdueClientGap[],
  memberships: MembershipUnderutilizationGap[],
  dormant: DormantHighValueGap[],
): RevenueActionItem[] {
  const items: RevenueActionItem[] = [];
  let actionId = 0;

  // Same-day empty slots (highest priority)
  const todaySlots = slots.filter(s => s.daysUntil === 0);
  if (todaySlots.length > 0) {
    const totalRev = todaySlots.reduce((s, g) => s + g.estimatedRevenue, 0);
    items.push({
      id: `action-${++actionId}`,
      category: 'fill-slot',
      title: `Fill ${todaySlots.length} empty slot${todaySlots.length > 1 ? 's' : ''} today`,
      description: `You have ${todaySlots.length} unfilled time block${todaySlots.length > 1 ? 's' : ''} today worth ~$${Math.round(totalRev).toLocaleString()}. Push same-day availability to waitlist clients and recent inquiries.`,
      estimatedRevenue: totalRev,
      effort: 'medium',
      timeToImpact: 'same-day',
      priority: 95,
      suggestedScript: 'Great news -- we just had an opening today! Would you like to come in for your treatment?',
    });
  }

  // Tomorrow's empty slots
  const tomorrowSlots = slots.filter(s => s.daysUntil === 1);
  if (tomorrowSlots.length > 0) {
    const totalRev = tomorrowSlots.reduce((s, g) => s + g.estimatedRevenue, 0);
    items.push({
      id: `action-${++actionId}`,
      category: 'fill-slot',
      title: `Fill ${tomorrowSlots.length} empty slot${tomorrowSlots.length > 1 ? 's' : ''} tomorrow`,
      description: `Tomorrow has ${tomorrowSlots.length} open block${tomorrowSlots.length > 1 ? 's' : ''} worth ~$${Math.round(totalRev).toLocaleString()}.`,
      estimatedRevenue: totalRev,
      effort: 'low',
      timeToImpact: 'same-day',
      priority: 90,
    });
  }

  // Overdue rebookings (critical)
  const criticalOverdue = overdue.filter(o => o.urgency === 'at-risk' || o.urgency === 'significantly-overdue');
  if (criticalOverdue.length > 0) {
    const totalRev = criticalOverdue.reduce((s, c) => s + c.estimatedRevenue, 0);
    items.push({
      id: `action-${++actionId}`,
      category: 'rebook-overdue',
      title: `Rebook ${criticalOverdue.length} significantly overdue client${criticalOverdue.length > 1 ? 's' : ''}`,
      description: `${criticalOverdue.length} client${criticalOverdue.length > 1 ? 's are' : ' is'} well past their treatment due date. Immediate outreach recommended to prevent churn.`,
      estimatedRevenue: totalRev,
      effort: 'medium',
      timeToImpact: 'this-week',
      priority: 88,
      targetClients: criticalOverdue.slice(0, 10).map(c => c.clientName),
      suggestedScript: 'We noticed it has been a while since your last visit. Your results are best maintained with consistent treatments -- let us get you scheduled!',
    });
  }

  // Due-soon rebookings (proactive)
  const dueSoon = overdue.filter(o => o.urgency === 'due-soon');
  if (dueSoon.length > 0) {
    const totalRev = dueSoon.reduce((s, c) => s + c.estimatedRevenue, 0);
    items.push({
      id: `action-${++actionId}`,
      category: 'rebook-overdue',
      title: `Proactively rebook ${dueSoon.length} client${dueSoon.length > 1 ? 's' : ''} due soon`,
      description: `${dueSoon.length} client${dueSoon.length > 1 ? 's' : ''} approaching their treatment due date. Proactive outreach now prevents gaps.`,
      estimatedRevenue: totalRev,
      effort: 'low',
      timeToImpact: 'this-week',
      priority: 75,
      targetClients: dueSoon.slice(0, 10).map(c => c.clientName),
    });
  }

  // Membership underutilization
  const lowUtilMembers = memberships.filter(m => m.utilizationPercent < 25);
  if (lowUtilMembers.length > 0) {
    const totalWasted = lowUtilMembers.reduce((s, m) => s + m.wastedValue, 0);
    items.push({
      id: `action-${++actionId}`,
      category: 'activate-membership',
      title: `Activate ${lowUtilMembers.length} underutilizing member${lowUtilMembers.length > 1 ? 's' : ''}`,
      description: `${lowUtilMembers.length} member${lowUtilMembers.length > 1 ? 's have' : ' has'} used less than 25% of credits. $${Math.round(totalWasted).toLocaleString()} in credits at risk of waste -- and churn.`,
      estimatedRevenue: totalWasted,
      effort: 'low',
      timeToImpact: 'this-week',
      priority: 82,
      targetClients: lowUtilMembers.slice(0, 10).map(m => m.clientName),
      suggestedScript: 'As a valued member, you still have credits available this month! We would love to help you make the most of your membership.',
    });
  }

  // Dormant VIPs
  if (dormant.length > 0) {
    const topDormant = dormant.slice(0, 5);
    const totalRev = topDormant.reduce((s, d) => s + d.estimatedRecoverableRevenue, 0);
    items.push({
      id: `action-${++actionId}`,
      category: 'reactivate-vip',
      title: `Win back ${topDormant.length} high-value dormant client${topDormant.length > 1 ? 's' : ''}`,
      description: `These VIP clients have collectively spent $${topDormant.reduce((s, d) => s + d.totalSpend, 0).toLocaleString()} but haven't visited recently. White-glove outreach recommended.`,
      estimatedRevenue: totalRev,
      effort: 'high',
      timeToImpact: 'this-month',
      priority: 78,
      targetClients: topDormant.map(d => d.clientName),
    });
  }

  // Declining services
  for (const svc of services.slice(0, 3)) {
    items.push({
      id: `action-${++actionId}`,
      category: 'boost-service',
      title: `Boost ${svc.service} bookings (down ${svc.declinePercent}%)`,
      description: `${svc.service} bookings dropped ${svc.declinePercent}% vs last month, costing ~$${Math.round(svc.revenueImpact).toLocaleString()}.`,
      estimatedRevenue: svc.revenueImpact,
      effort: 'medium',
      timeToImpact: 'this-month',
      priority: 65,
      suggestedScript: svc.suggestedActions[0],
    });
  }

  // Underperforming days
  for (const day of days.slice(0, 2)) {
    items.push({
      id: `action-${++actionId}`,
      category: 'optimize-day',
      title: `Optimize ${day.dayOfWeek} revenue (${day.gapPercent}% below average)`,
      description: `${day.dayOfWeek} averages $${day.avgRevenue.toLocaleString()} vs $${day.benchmarkRevenue.toLocaleString()} benchmark. ${day.suggestedActions[0]}`,
      estimatedRevenue: day.gap * 4, // 4 weeks of improvement
      effort: 'medium',
      timeToImpact: 'this-month',
      priority: 55,
    });
  }

  return items;
}

// ── SCORING ──

function calculateFillabilityScore(
  slots: EmptySlotGap[],
  overdue: OverdueClientGap[],
  memberships: MembershipUnderutilizationGap[],
): number {
  let score = 50; // baseline

  // Easy fills: overdue clients who just need a nudge
  const easyOverdue = overdue.filter(o => o.urgency === 'due-soon' || o.urgency === 'overdue');
  score += Math.min(20, easyOverdue.length * 2);

  // Membership activations are usually easy
  score += Math.min(15, memberships.length * 3);

  // Slots far in advance are easier to fill
  const advanceSlots = slots.filter(s => s.daysUntil >= 3);
  score += Math.min(15, advanceSlots.length);

  return Math.min(100, Math.max(0, score));
}

function calculateUrgencyScore(
  slots: EmptySlotGap[],
  overdue: OverdueClientGap[],
  dormant: DormantHighValueGap[],
): number {
  let score = 30; // baseline

  // Today/tomorrow empty slots create immediate urgency
  const imminent = slots.filter(s => s.daysUntil <= 1);
  score += Math.min(25, imminent.length * 5);

  // At-risk clients need attention now
  const atRisk = overdue.filter(o => o.urgency === 'at-risk');
  score += Math.min(25, atRisk.length * 3);

  // Dormant VIPs = lost revenue compounding
  score += Math.min(20, dormant.length * 2);

  return Math.min(100, Math.max(0, score));
}

// ── UTILITIES ──

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export { REBOOK_INTERVALS, DAY_NAMES };
