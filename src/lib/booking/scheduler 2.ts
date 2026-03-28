/**
 * Smart Scheduling Engine
 *
 * Intelligent appointment scheduling with:
 * - Optimal slot suggestion (fill gaps, reduce dead time)
 * - Provider load balancing
 * - Revenue-optimized scheduling (higher-value services in premium slots)
 * - Combination appointment handling (Botox + HydraFacial in one visit)
 * - Recurring appointment scheduling (every 3 months for Botox)
 * - Waitlist management integration (notify when slot opens)
 * - Same-day booking rules
 * - Advance booking limits (max 6 months out)
 * - New client booking rules (require consultation first for certain services)
 */

import { format, parseISO, addDays, differenceInDays, isBefore } from 'date-fns';
import type {
  Appointment,
  AvailabilityQuery,
  BookableService,
  BookingRequest,
  BookingResult,
  ProviderSchedule,
  RecurringConfig,
  RoomId,
  SchedulingConfig,
  TimeSlot,
  WaitlistEntry,
} from './types';
import { AvailabilityEngine, addMinutesToTime, minutesBetween, doTimesOverlap } from './availability';

// ── SCHEDULER TYPES ──

export interface OptimalSlotSuggestion {
  slot: TimeSlot;
  score: number;           // 0-100
  reasons: string[];
  gapFillScore: number;    // how well it fills gaps
  revenueScore: number;    // revenue optimization
  balanceScore: number;    // provider load balance
}

export interface CombinationBooking {
  primaryServiceId: string;
  additionalServiceIds: string[];
  totalDuration: number;
  totalPrice: number;
  suggestedOrder: string[]; // service IDs in optimal order
  breakBetween: number;     // minutes between services
}

export interface ProviderLoad {
  providerId: string;
  providerName: string;
  date: string;
  appointmentCount: number;
  totalMinutesBooked: number;
  totalAvailableMinutes: number;
  utilizationPercent: number;
  totalRevenue: number;
  revenuePerHour: number;
  status: 'underloaded' | 'balanced' | 'overloaded';
}

export interface ScheduleGap {
  providerId: string;
  roomId: RoomId;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  suggestedServices: SuggestedFill[];
  potentialRevenue: number;
}

export interface SuggestedFill {
  serviceId: string;
  serviceName: string;
  duration: number;
  price: number;
  fitScore: number; // how well it fits the gap
}

export interface RevenueSlotAnalysis {
  date: string;
  startTime: string;
  endTime: string;
  currentRevenue: number;
  potentialRevenue: number;
  revenueGap: number;
  suggestion: string;
}

export interface RecurringScheduleResult {
  seriesId: string;
  appointments: BookingResult[];
  totalBooked: number;
  totalFailed: number;
  nextSuggested?: string; // if some failed, suggest alternate dates
}

// ── PREMIUM TIME SLOTS ──

const PREMIUM_HOURS: { start: string; end: string; multiplier: number }[] = [
  { start: '10:00', end: '11:00', multiplier: 1.3 },  // Late morning - high demand
  { start: '11:00', end: '12:00', multiplier: 1.2 },
  { start: '14:00', end: '15:00', multiplier: 1.2 },  // Post-lunch
  { start: '16:00', end: '18:00', multiplier: 1.4 },  // After-work rush
];

const SATURDAY_PREMIUM_MULTIPLIER = 1.5;

// ── SERVICE COMBINATION RULES ──

const COMBINATION_RULES: Record<string, { canCombineWith: string[]; optimalOrder: number }> = {
  'botox': { canCombineWith: ['hydrafacial-signature', 'vi-peel', 'biorepeel-face'], optimalOrder: 2 },
  'dysport': { canCombineWith: ['hydrafacial-signature', 'vi-peel', 'biorepeel-face'], optimalOrder: 2 },
  'hydrafacial-signature': { canCombineWith: ['botox', 'dysport', 'hydrafacial-dermaplaning', 'hydrafacial-red-light', 'hydrafacial-neck-decollete'], optimalOrder: 1 },
  'hydrafacial-express': { canCombineWith: ['hydrafacial-dermaplaning', 'hydrafacial-red-light'], optimalOrder: 1 },
  'vi-peel': { canCombineWith: ['hydrafacial-signature'], optimalOrder: 1 },
  'biorepeel-face': { canCombineWith: ['hydrafacial-signature'], optimalOrder: 1 },
};

// ── REBOOKING INTERVALS (in days) ──

export const REBOOKING_INTERVALS: Record<string, number> = {
  'botox': 90,
  'dysport': 90,
  'filler-lips': 365,
  'filler-cheeks': 365,
  'filler-jawline': 365,
  'filler-undereyes': 365,
  'hydrafacial-signature': 30,
  'hydrafacial-express': 21,
  'vi-peel': 28,
  'biorepeel-face': 28,
  'biorepeel-face-neck': 28,
  'prx-t33-face': 28,
  'laser-facial-ndyag': 42,
  'rf-microneedling-face': 42,
  'rf-microneedling-face-neck': 42,
  'sofwave-full-face': 365,
  'sofwave-full-face-neck': 365,
  'wellness-vitamin-d3': 7,
  'wellness-tri-immune': 7,
  'wellness-glutathione': 7,
  'wellness-b12': 7,
  'wellness-nad-plus': 14,
};

// ── SMART SCHEDULER ──

export class SmartScheduler {
  private engine: AvailabilityEngine;
  private services: Map<string, BookableService>;
  private config: SchedulingConfig;

  constructor(engine: AvailabilityEngine, services: BookableService[], config: SchedulingConfig) {
    this.engine = engine;
    this.services = new Map(services.map(s => [s.id, s]));
    this.config = config;
  }

  // ── OPTIMAL SLOT SUGGESTIONS ──

  /**
   * Get the best slots for a booking, ranked by multiple optimization factors
   */
  suggestOptimalSlots(
    query: AvailabilityQuery,
    maxSuggestions: number = 5,
  ): OptimalSlotSuggestion[] {
    const result = this.engine.getAvailableSlots(query);
    if (result.slots.length === 0) return [];

    const service = this.services.get(query.serviceId);
    if (!service) return [];

    const dayAppointments = this.engine.getAppointmentsForDate(query.date);

    return result.slots
      .filter(slot => !slot.isEmergencyReserved)
      .map(slot => this.scoreSlot(slot, service, dayAppointments, query.date))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions);
  }

  private scoreSlot(
    slot: TimeSlot,
    service: BookableService,
    dayAppointments: Appointment[],
    dateStr: string,
  ): OptimalSlotSuggestion {
    const reasons: string[] = [];

    // Gap-fill score: how well does this reduce dead time?
    const gapFillScore = this.calculateGapFillScore(slot, service, dayAppointments);
    if (gapFillScore > 70) reasons.push('Fills a schedule gap efficiently');

    // Revenue score: premium time slots for high-value services
    const revenueScore = this.calculateRevenueScore(slot, service, dateStr);
    if (revenueScore > 70) reasons.push('Revenue-optimal time slot');

    // Balance score: distribute load across providers
    const balanceScore = this.calculateBalanceScore(slot, dayAppointments);
    if (balanceScore > 70) reasons.push('Helps balance provider workload');

    // Time preference bonus
    const timeBonus = this.getTimePreferenceBonus(slot.startTime);
    if (timeBonus > 0) reasons.push('Popular booking time');

    // Weighted overall score
    const score = Math.round(
      gapFillScore * 0.35 +
      revenueScore * 0.30 +
      balanceScore * 0.20 +
      timeBonus * 0.15
    );

    return {
      slot: { ...slot, isOptimal: score >= 70, revenueScore },
      score,
      reasons,
      gapFillScore,
      revenueScore,
      balanceScore,
    };
  }

  private calculateGapFillScore(
    slot: TimeSlot,
    service: BookableService,
    dayAppointments: Appointment[],
  ): number {
    const providerApts = dayAppointments
      .filter(a => a.providerId === slot.providerId && a.status !== 'cancelled')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (providerApts.length === 0) return 50; // Neutral - no gaps to fill

    // Find the gap this slot fills
    const slotEnd = addMinutesToTime(slot.startTime, service.duration + service.cleanupTime);
    let bestFit = 0;

    for (let i = 0; i < providerApts.length; i++) {
      const apt = providerApts[i];
      const nextApt = providerApts[i + 1];

      // Check gap before first appointment
      if (i === 0 && slot.startTime < apt.startTime) {
        const gapMinutes = minutesBetween(slot.startTime, apt.startTime);
        const totalNeeded = service.duration + service.prepTime + service.cleanupTime;
        if (gapMinutes >= totalNeeded && gapMinutes <= totalNeeded + 15) {
          bestFit = 95; // Perfect gap fill
        } else if (gapMinutes >= totalNeeded) {
          bestFit = Math.max(bestFit, 70);
        }
      }

      // Check gap between consecutive appointments
      if (nextApt) {
        const gapStart = apt.endTime;
        const gapEnd = nextApt.startTime;
        const gapMinutes = minutesBetween(gapStart, gapEnd);
        const totalNeeded = service.duration + service.prepTime + service.cleanupTime;

        if (slot.startTime >= gapStart && slotEnd <= gapEnd) {
          if (gapMinutes <= totalNeeded + 15) {
            bestFit = 95; // Tight fit - excellent
          } else {
            bestFit = Math.max(bestFit, 75);
          }
        }
      }

      // Check immediately after last appointment
      if (i === providerApts.length - 1 && slot.startTime >= apt.endTime) {
        const gapMinutes = minutesBetween(apt.endTime, slot.startTime);
        if (gapMinutes <= 15) {
          bestFit = Math.max(bestFit, 85); // Right after previous = good flow
        }
      }
    }

    return bestFit || 40;
  }

  private calculateRevenueScore(
    slot: TimeSlot,
    service: BookableService,
    dateStr: string,
  ): number {
    const revenuePerMinute = service.price / service.duration;
    let score = Math.min(100, revenuePerMinute * 10); // Base score from revenue density

    // Premium time multiplier
    const premiumHour = PREMIUM_HOURS.find(p =>
      slot.startTime >= p.start && slot.startTime < p.end
    );
    if (premiumHour) {
      // High-value services should be in premium hours
      if (service.price >= 500) {
        score = Math.min(100, score * premiumHour.multiplier);
      } else {
        // Low-value services in premium hours = not optimal
        score = score * 0.7;
      }
    }

    // Saturday premium
    const dayOfWeek = parseISO(dateStr).getDay();
    if (dayOfWeek === 6 && service.price >= 300) {
      score = Math.min(100, score * 1.2);
    }

    return Math.round(score);
  }

  private calculateBalanceScore(
    slot: TimeSlot,
    dayAppointments: Appointment[],
  ): number {
    const providers = this.engine.getProviders();
    const loads = providers.map(p => ({
      providerId: p.providerId,
      count: dayAppointments.filter(a => a.providerId === p.providerId && a.status !== 'cancelled').length,
    }));

    if (loads.length <= 1) return 50;

    const avgLoad = loads.reduce((sum, l) => sum + l.count, 0) / loads.length;
    const currentProviderLoad = loads.find(l => l.providerId === slot.providerId)?.count ?? 0;

    // Score is higher if this provider is below average (needs more appointments)
    if (currentProviderLoad < avgLoad) {
      return 90;
    } else if (currentProviderLoad === Math.floor(avgLoad)) {
      return 70;
    } else {
      return Math.max(20, 70 - (currentProviderLoad - avgLoad) * 15);
    }
  }

  private getTimePreferenceBonus(startTime: string): number {
    const hour = parseInt(startTime.split(':')[0]);
    // Popular booking times get a bonus
    if (hour >= 10 && hour <= 11) return 80;
    if (hour >= 14 && hour <= 16) return 70;
    if (hour === 9) return 60;
    return 40;
  }

  // ── PROVIDER LOAD BALANCING ──

  /**
   * Get workload distribution across providers for a date
   */
  getProviderLoads(dateStr: string): ProviderLoad[] {
    const providers = this.engine.getProviders();
    const dayAppointments = this.engine.getAppointmentsForDate(dateStr);

    return providers.map(provider => {
      const hours = this.engine.getProviderHours(provider, dateStr);
      if (!hours) {
        return {
          providerId: provider.providerId,
          providerName: provider.providerName,
          date: dateStr,
          appointmentCount: 0,
          totalMinutesBooked: 0,
          totalAvailableMinutes: 0,
          utilizationPercent: 0,
          totalRevenue: 0,
          revenuePerHour: 0,
          status: 'underloaded' as const,
        };
      }

      const providerApts = dayAppointments.filter(
        a => a.providerId === provider.providerId && a.status !== 'cancelled' && a.status !== 'no-show'
      );

      const totalMinutesBooked = providerApts.reduce((sum, a) => sum + a.duration, 0);
      const lunchDuration = minutesBetween(provider.lunchBreak.start, provider.lunchBreak.end);
      const totalAvailableMinutes = minutesBetween(hours.start, hours.end) - lunchDuration;
      const utilizationPercent = totalAvailableMinutes > 0
        ? Math.round((totalMinutesBooked / totalAvailableMinutes) * 100)
        : 0;
      const totalRevenue = providerApts.reduce((sum, a) => sum + a.estimatedRevenue, 0);
      const hoursWorked = totalMinutesBooked / 60;

      let status: 'underloaded' | 'balanced' | 'overloaded' = 'balanced';
      if (utilizationPercent < 40) status = 'underloaded';
      else if (utilizationPercent > 85) status = 'overloaded';

      return {
        providerId: provider.providerId,
        providerName: provider.providerName,
        date: dateStr,
        appointmentCount: providerApts.length,
        totalMinutesBooked,
        totalAvailableMinutes,
        utilizationPercent,
        totalRevenue,
        revenuePerHour: hoursWorked > 0 ? Math.round(totalRevenue / hoursWorked) : 0,
        status,
      };
    });
  }

  /**
   * Suggest which provider to book with based on load balancing
   */
  suggestProvider(serviceId: string, dateStr: string): string | null {
    const qualified = this.engine.getQualifiedProviders(serviceId);
    if (qualified.length === 0) return null;
    if (qualified.length === 1) return qualified[0].providerId;

    const loads = this.getProviderLoads(dateStr);
    const qualifiedLoads = loads.filter(l =>
      qualified.some(q => q.providerId === l.providerId)
    );

    // Pick the least loaded qualified provider
    qualifiedLoads.sort((a, b) => a.utilizationPercent - b.utilizationPercent);
    return qualifiedLoads[0]?.providerId ?? null;
  }

  // ── COMBINATION BOOKING ──

  /**
   * Plan a combination appointment (e.g., Botox + HydraFacial)
   */
  planCombinationBooking(serviceIds: string[]): CombinationBooking | null {
    if (serviceIds.length < 2) return null;

    const services = serviceIds
      .map(id => this.services.get(id))
      .filter((s): s is BookableService => s !== undefined);

    if (services.length !== serviceIds.length) return null;

    // Verify compatibility
    for (const svc of services) {
      const rules = COMBINATION_RULES[svc.id];
      if (!rules) continue;
      const otherIds = serviceIds.filter(id => id !== svc.id);
      for (const otherId of otherIds) {
        if (!rules.canCombineWith.includes(otherId)) {
          // Check the other direction
          const otherRules = COMBINATION_RULES[otherId];
          if (!otherRules?.canCombineWith.includes(svc.id)) {
            return null; // Incompatible combination
          }
        }
      }
    }

    // Determine optimal order
    const sortedServices = [...services].sort((a, b) => {
      const orderA = COMBINATION_RULES[a.id]?.optimalOrder ?? 5;
      const orderB = COMBINATION_RULES[b.id]?.optimalOrder ?? 5;
      return orderA - orderB;
    });

    const breakBetween = 5; // 5 minutes between combined services
    const totalDuration = sortedServices.reduce((sum, s) => sum + s.duration, 0) +
      (sortedServices.length - 1) * breakBetween;
    const totalPrice = sortedServices.reduce((sum, s) => sum + s.price, 0);

    return {
      primaryServiceId: sortedServices[0].id,
      additionalServiceIds: sortedServices.slice(1).map(s => s.id),
      totalDuration,
      totalPrice,
      suggestedOrder: sortedServices.map(s => s.id),
      breakBetween,
    };
  }

  /**
   * Book a combination appointment
   */
  bookCombination(
    combo: CombinationBooking,
    providerId: string,
    roomId: RoomId,
    date: string,
    startTime: string,
    clientId?: string,
    clientInfo?: BookingRequest['clientInfo'],
  ): BookingResult[] {
    const results: BookingResult[] = [];
    let currentTime = startTime;

    for (const serviceId of combo.suggestedOrder) {
      const service = this.services.get(serviceId);
      if (!service) continue;

      const result = this.engine.bookAppointment({
        serviceId,
        providerId,
        roomId,
        date,
        startTime: currentTime,
        clientId,
        clientInfo,
        combinedServiceIds: combo.suggestedOrder.filter(id => id !== serviceId),
        source: 'online',
      });

      results.push(result);

      if (result.success) {
        currentTime = addMinutesToTime(currentTime, service.duration + combo.breakBetween);
      } else {
        break; // Stop if any in the combination fails
      }
    }

    return results;
  }

  // ── RECURRING APPOINTMENTS ──

  /**
   * Schedule a recurring series of appointments
   */
  scheduleRecurring(
    request: BookingRequest,
    config: RecurringConfig,
  ): RecurringScheduleResult {
    const seriesId = `series-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const results: BookingResult[] = [];
    let currentDate = request.date;

    for (let i = 0; i < config.occurrences; i++) {
      if (config.endDate && currentDate > config.endDate) break;

      // For subsequent appointments, find best available slot
      let slotDate = currentDate;
      let slotTime = request.startTime;

      if (i > 0) {
        const available = this.engine.getAvailableSlots({
          serviceId: request.serviceId,
          date: currentDate,
          providerId: request.providerId,
        });

        if (available.slots.length > 0) {
          // Try to match original time
          const sameTimeSlot = available.slots.find(s => s.startTime === request.startTime);
          if (sameTimeSlot) {
            slotTime = sameTimeSlot.startTime;
          } else {
            // Find closest time
            const sorted = available.slots.sort((a, b) => {
              const diffA = Math.abs(minutesBetween(request.startTime, a.startTime));
              const diffB = Math.abs(minutesBetween(request.startTime, b.startTime));
              return diffA - diffB;
            });
            slotTime = sorted[0].startTime;
          }
        } else {
          // Try next few days
          let found = false;
          for (let d = 1; d <= 7; d++) {
            const altDate = format(addDays(parseISO(currentDate), d), 'yyyy-MM-dd');
            const altAvailable = this.engine.getAvailableSlots({
              serviceId: request.serviceId,
              date: altDate,
              providerId: request.providerId,
            });
            if (altAvailable.slots.length > 0) {
              slotDate = altDate;
              slotTime = altAvailable.slots[0].startTime;
              found = true;
              break;
            }
          }
          if (!found) {
            results.push({ success: false, error: `No availability around ${currentDate}` });
            currentDate = format(addDays(parseISO(currentDate), config.intervalDays), 'yyyy-MM-dd');
            continue;
          }
        }
      }

      const result = this.engine.bookAppointment({
        ...request,
        date: slotDate,
        startTime: slotTime,
        recurringConfig: undefined, // Don't recurse
      });

      if (result.success && result.appointment) {
        result.appointment.recurringSeriesId = seriesId;
      }

      results.push(result);
      currentDate = format(addDays(parseISO(slotDate), config.intervalDays), 'yyyy-MM-dd');
    }

    return {
      seriesId,
      appointments: results,
      totalBooked: results.filter(r => r.success).length,
      totalFailed: results.filter(r => !r.success).length,
    };
  }

  // ── GAP DETECTION ──

  /**
   * Find schedule gaps that could be filled
   */
  findGaps(dateStr: string, minGapMinutes: number = 30): ScheduleGap[] {
    const gaps: ScheduleGap[] = [];
    const providers = this.engine.getProviders();

    for (const provider of providers) {
      const hours = this.engine.getProviderHours(provider, dateStr);
      if (!hours) continue;

      const appointments = this.engine.getAppointmentsForProvider(provider.providerId, dateStr)
        .filter(a => a.status !== 'cancelled' && a.status !== 'no-show')
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      // Check gap from start of day to first appointment
      if (appointments.length > 0) {
        const firstGap = minutesBetween(hours.start, appointments[0].startTime);
        if (firstGap >= minGapMinutes) {
          gaps.push(this.createGap(
            provider.providerId, appointments[0].roomId, dateStr,
            hours.start, appointments[0].startTime, firstGap, provider
          ));
        }
      }

      // Check gaps between appointments
      for (let i = 0; i < appointments.length - 1; i++) {
        const current = appointments[i];
        const next = appointments[i + 1];
        const svc = this.services.get(current.serviceId);
        const gapStart = addMinutesToTime(current.endTime, svc?.cleanupTime ?? 10);
        const gapMinutes = minutesBetween(gapStart, next.startTime);

        // Skip if gap overlaps with lunch
        if (doTimesOverlap(gapStart, next.startTime, provider.lunchBreak.start, provider.lunchBreak.end)) {
          continue;
        }

        if (gapMinutes >= minGapMinutes) {
          gaps.push(this.createGap(
            provider.providerId, current.roomId, dateStr,
            gapStart, next.startTime, gapMinutes, provider
          ));
        }
      }

      // Check gap from last appointment to end of day
      if (appointments.length > 0) {
        const lastApt = appointments[appointments.length - 1];
        const svc = this.services.get(lastApt.serviceId);
        const gapStart = addMinutesToTime(lastApt.endTime, svc?.cleanupTime ?? 10);
        const gapMinutes = minutesBetween(gapStart, hours.end);
        if (gapMinutes >= minGapMinutes) {
          gaps.push(this.createGap(
            provider.providerId, lastApt.roomId, dateStr,
            gapStart, hours.end, gapMinutes, provider
          ));
        }
      }
    }

    return gaps.sort((a, b) => b.potentialRevenue - a.potentialRevenue);
  }

  private createGap(
    providerId: string,
    roomId: RoomId,
    dateStr: string,
    startTime: string,
    endTime: string,
    durationMinutes: number,
    provider: ProviderSchedule,
  ): ScheduleGap {
    // Find services that fit in this gap
    const suggestedServices: SuggestedFill[] = [];

    for (const [id, service] of this.services) {
      if (!provider.qualifiedServices.includes(id)) continue;
      const totalNeeded = service.duration + service.prepTime + service.cleanupTime;
      if (totalNeeded <= durationMinutes) {
        const fitScore = Math.round((totalNeeded / durationMinutes) * 100);
        suggestedServices.push({
          serviceId: id,
          serviceName: service.name,
          duration: service.duration,
          price: service.price,
          fitScore,
        });
      }
    }

    // Sort by revenue descending, then fit score
    suggestedServices.sort((a, b) => {
      if (b.price !== a.price) return b.price - a.price;
      return b.fitScore - a.fitScore;
    });

    return {
      providerId,
      roomId,
      date: dateStr,
      startTime,
      endTime,
      durationMinutes,
      suggestedServices: suggestedServices.slice(0, 5),
      potentialRevenue: suggestedServices[0]?.price ?? 0,
    };
  }

  // ── REVENUE OPTIMIZATION ──

  /**
   * Analyze schedule for revenue optimization opportunities
   */
  analyzeRevenueOpportunities(dateStr: string): RevenueSlotAnalysis[] {
    const analyses: RevenueSlotAnalysis[] = [];
    const appointments = this.engine.getAppointmentsForDate(dateStr)
      .filter(a => a.status !== 'cancelled' && a.status !== 'no-show');

    for (const apt of appointments) {
      const service = this.services.get(apt.serviceId);
      if (!service) continue;

      const premiumHour = PREMIUM_HOURS.find(p =>
        apt.startTime >= p.start && apt.startTime < p.end
      );

      if (premiumHour && service.price < 300) {
        // Low-value service in premium time
        const potentialRevenue = this.estimatePremiumSlotValue(apt.startTime, apt.duration);
        analyses.push({
          date: dateStr,
          startTime: apt.startTime,
          endTime: apt.endTime,
          currentRevenue: service.price,
          potentialRevenue,
          revenueGap: potentialRevenue - service.price,
          suggestion: `Consider moving ${service.name} to a non-premium slot and booking a higher-value service here`,
        });
      }
    }

    return analyses.sort((a, b) => b.revenueGap - a.revenueGap);
  }

  private estimatePremiumSlotValue(startTime: string, durationMinutes: number): number {
    // Average premium service revenue per minute
    const premiumRevenuePerMinute = 8; // ~$480/hr for premium services
    return Math.round(premiumRevenuePerMinute * durationMinutes);
  }

  // ── NEW CLIENT RULES ──

  /**
   * Check if a new client can book a service directly or needs consultation first
   */
  checkNewClientEligibility(serviceId: string, isNewClient: boolean): {
    canBook: boolean;
    requiresConsultation: boolean;
    message: string;
  } {
    if (!isNewClient) {
      return { canBook: true, requiresConsultation: false, message: 'Returning client can book directly' };
    }

    if (this.config.newClientConsultRequired.includes(serviceId)) {
      const service = this.services.get(serviceId);
      return {
        canBook: false,
        requiresConsultation: true,
        message: `A consultation is required before your first ${service?.name ?? 'treatment'}. This ensures we create the perfect treatment plan tailored to your unique needs.`,
      };
    }

    return { canBook: true, requiresConsultation: false, message: 'No consultation required for this service' };
  }

  // ── REBOOKING SUGGESTIONS ──

  /**
   * Get rebooking suggestions for a client based on their last appointments
   */
  getRebookingSuggestions(
    clientId: string,
    pastAppointments: Appointment[],
  ): { serviceId: string; serviceName: string; suggestedDate: string; daysOverdue: number }[] {
    const suggestions: { serviceId: string; serviceName: string; suggestedDate: string; daysOverdue: number }[] = [];
    const today = format(new Date(), 'yyyy-MM-dd');

    // Group by service, take most recent
    const lastByService = new Map<string, Appointment>();
    for (const apt of pastAppointments.filter(a => a.status === 'completed' && a.clientId === clientId)) {
      const existing = lastByService.get(apt.serviceId);
      if (!existing || apt.date > existing.date) {
        lastByService.set(apt.serviceId, apt);
      }
    }

    for (const [serviceId, lastApt] of lastByService) {
      const interval = REBOOKING_INTERVALS[serviceId];
      if (!interval) continue;

      const suggestedDate = format(addDays(parseISO(lastApt.date), interval), 'yyyy-MM-dd');
      const daysOverdue = differenceInDays(new Date(), parseISO(suggestedDate));

      if (daysOverdue >= -14) { // Show suggestions starting 2 weeks before due
        suggestions.push({
          serviceId,
          serviceName: lastApt.serviceName,
          suggestedDate,
          daysOverdue: Math.max(0, daysOverdue),
        });
      }
    }

    return suggestions.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }

  // ── SAME-DAY BOOKING ──

  /**
   * Check if same-day booking is allowed and return available slots
   */
  checkSameDayAvailability(serviceId: string): {
    allowed: boolean;
    reason: string;
    slots: TimeSlot[];
  } {
    const today = format(new Date(), 'yyyy-MM-dd');
    const now = format(new Date(), 'HH:mm');

    if (!this.config.sameDayBookingEnabled) {
      return {
        allowed: false,
        reason: 'Same-day booking is not available. Please book at least one day in advance.',
        slots: [],
      };
    }

    if (now >= this.config.sameDayBookingCutoff) {
      return {
        allowed: false,
        reason: `Same-day bookings must be made before ${this.config.sameDayBookingCutoff}. Please book for tomorrow or later.`,
        slots: [],
      };
    }

    const result = this.engine.getAvailableSlots({
      serviceId,
      date: today,
    });

    return {
      allowed: result.slots.length > 0,
      reason: result.slots.length > 0
        ? `${result.slots.length} same-day slots available`
        : 'No same-day slots available. Try booking for another day.',
      slots: result.slots,
    };
  }

  // ── SCHEDULE EFFICIENCY ──

  /**
   * Calculate overall schedule efficiency score for a day
   */
  calculateEfficiencyScore(dateStr: string): {
    score: number;
    utilizationPercent: number;
    revenuePerHour: number;
    gapCount: number;
    totalGapMinutes: number;
    providerBalance: number;
    recommendations: string[];
  } {
    const loads = this.getProviderLoads(dateStr);
    const gaps = this.findGaps(dateStr);
    const revenueOpps = this.analyzeRevenueOpportunities(dateStr);

    const avgUtilization = loads.length > 0
      ? loads.reduce((sum, l) => sum + l.utilizationPercent, 0) / loads.length
      : 0;

    const totalRevenue = loads.reduce((sum, l) => sum + l.totalRevenue, 0);
    const totalHours = loads.reduce((sum, l) => sum + l.totalMinutesBooked / 60, 0);
    const revenuePerHour = totalHours > 0 ? Math.round(totalRevenue / totalHours) : 0;

    const totalGapMinutes = gaps.reduce((sum, g) => sum + g.durationMinutes, 0);

    // Provider balance score (0-100, 100 = perfectly balanced)
    const utilizations = loads.map(l => l.utilizationPercent);
    const maxUtil = Math.max(...utilizations, 0);
    const minUtil = Math.min(...utilizations, 0);
    const providerBalance = maxUtil > 0 ? Math.round(100 - (maxUtil - minUtil)) : 100;

    // Composite score
    const score = Math.round(
      avgUtilization * 0.4 +
      providerBalance * 0.3 +
      Math.max(0, 100 - totalGapMinutes / 3) * 0.2 +
      Math.max(0, 100 - revenueOpps.length * 10) * 0.1
    );

    const recommendations: string[] = [];
    if (avgUtilization < 50) recommendations.push('Schedule is underutilized — consider outreach to waitlisted clients');
    if (gaps.length > 3) recommendations.push(`${gaps.length} gaps detected — use gap-fill suggestions to maximize bookings`);
    if (providerBalance < 60) recommendations.push('Provider workload is unbalanced — direct new bookings to less-loaded providers');
    if (revenueOpps.length > 0) recommendations.push(`${revenueOpps.length} revenue optimization opportunities found`);

    return {
      score,
      utilizationPercent: Math.round(avgUtilization),
      revenuePerHour,
      gapCount: gaps.length,
      totalGapMinutes,
      providerBalance,
      recommendations,
    };
  }
}
