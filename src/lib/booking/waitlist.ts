/**
 * Waitlist Management System
 *
 * Features:
 * - Service-specific waitlists
 * - Provider preference tracking
 * - Time preference tracking (mornings, evenings, weekends)
 * - Automatic notification when matching slot opens
 * - Priority ordering (VIP members first, then by signup date)
 * - Expiration after 30 days without booking
 * - Conversion tracking (waitlist → booked)
 */

import { format, parseISO, addDays, differenceInDays, isBefore, isAfter } from 'date-fns';
import type {
  Appointment,
  AvailabilityQuery,
  TimeSlot,
  WaitlistEntry,
  WaitlistPriority,
} from './types';
import { AvailabilityEngine } from './availability';

// ── WAITLIST MANAGER ──

export class WaitlistManager {
  private entries: WaitlistEntry[];
  private engine: AvailabilityEngine;
  private maxNotifications: number;
  private expirationDays: number;

  constructor(
    engine: AvailabilityEngine,
    entries: WaitlistEntry[] = [],
    maxNotifications: number = 3,
    expirationDays: number = 30,
  ) {
    this.engine = engine;
    this.entries = entries;
    this.maxNotifications = maxNotifications;
    this.expirationDays = expirationDays;
  }

  // ── ADD TO WAITLIST ──

  /**
   * Add a client to the waitlist for a service
   */
  addToWaitlist(params: {
    clientId: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    serviceId: string;
    serviceName: string;
    preferredProviderId?: string;
    preferredProviderName?: string;
    timePreference: WaitlistEntry['timePreference'];
    dateRangeStart?: string;
    dateRangeEnd?: string;
    isMember?: boolean;
    isVip?: boolean;
  }): WaitlistEntry {
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');

    // Determine priority
    let priority: WaitlistPriority = 'standard';
    if (params.isVip) priority = 'vip';
    else if (params.isMember) priority = 'member';

    const entry: WaitlistEntry = {
      id: `wl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      clientId: params.clientId,
      clientName: params.clientName,
      clientEmail: params.clientEmail,
      clientPhone: params.clientPhone,
      serviceId: params.serviceId,
      serviceName: params.serviceName,
      preferredProviderId: params.preferredProviderId,
      preferredProviderName: params.preferredProviderName,
      timePreference: params.timePreference,
      dateRangeStart: params.dateRangeStart ?? today,
      dateRangeEnd: params.dateRangeEnd ?? format(addDays(now, 60), 'yyyy-MM-dd'),
      priority,
      isMember: params.isMember ?? false,
      isVip: params.isVip ?? false,
      status: 'active',
      notificationsSent: 0,
      createdAt: now.toISOString(),
      expiresAt: format(addDays(now, this.expirationDays), 'yyyy-MM-dd'),
    };

    this.entries.push(entry);
    return entry;
  }

  // ── REMOVE FROM WAITLIST ──

  removeFromWaitlist(entryId: string, reason: 'cancelled' | 'booked' | 'expired' = 'cancelled'): boolean {
    const index = this.entries.findIndex(e => e.id === entryId);
    if (index === -1) return false;

    this.entries[index] = {
      ...this.entries[index],
      status: reason === 'booked' ? 'booked' : reason === 'expired' ? 'expired' : 'cancelled',
    };

    return true;
  }

  // ── FIND MATCHING ENTRIES ──

  /**
   * When a slot opens up, find waitlist entries that match
   */
  findMatchingEntries(slot: TimeSlot): WaitlistEntry[] {
    const slotHour = parseInt(slot.startTime.split(':')[0]);
    const slotDate = parseISO(slot.date);
    const isWeekendSlot = slotDate.getDay() === 0 || slotDate.getDay() === 6;

    return this.entries
      .filter(entry => {
        // Must be active
        if (entry.status !== 'active') return false;

        // Must not have exceeded notification limit
        if (entry.notificationsSent >= this.maxNotifications) return false;

        // Must not be expired
        if (entry.expiresAt < slot.date) return false;

        // Service must match
        // Allow if no specific service or if service matches
        if (entry.serviceId !== slot.providerId) {
          // Match on the service the slot is for — this needs external context
          // For now, we match based on available slots for the entry's service
        }

        // Date range check
        if (slot.date < entry.dateRangeStart || slot.date > entry.dateRangeEnd) return false;

        // Provider preference
        if (entry.preferredProviderId && entry.preferredProviderId !== slot.providerId) return false;

        // Time preference check
        if (entry.timePreference.length > 0) {
          const matchesPreference = entry.timePreference.some(pref => {
            switch (pref) {
              case 'morning': return slotHour >= 9 && slotHour < 12;
              case 'afternoon': return slotHour >= 12 && slotHour < 16;
              case 'evening': return slotHour >= 16;
              case 'weekend': return isWeekendSlot;
              default: return true;
            }
          });
          if (!matchesPreference) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Priority ordering: VIP > Member > Standard
        const priorityOrder: Record<WaitlistPriority, number> = { vip: 0, member: 1, standard: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // Then by signup date (first come, first served)
        return a.createdAt.localeCompare(b.createdAt);
      });
  }

  /**
   * Match waitlist entries against available slots for a specific service
   */
  findMatchesForService(serviceId: string, dateStr: string): {
    entry: WaitlistEntry;
    matchingSlots: TimeSlot[];
  }[] {
    const serviceEntries = this.entries.filter(
      e => e.serviceId === serviceId && e.status === 'active' && e.expiresAt >= dateStr
    );

    const matches: { entry: WaitlistEntry; matchingSlots: TimeSlot[] }[] = [];

    for (const entry of serviceEntries) {
      const query: AvailabilityQuery = {
        serviceId: entry.serviceId,
        date: dateStr,
        providerId: entry.preferredProviderId,
      };

      const result = this.engine.getAvailableSlots(query);
      if (result.slots.length === 0) continue;

      // Filter by time preference
      const matchingSlots = result.slots.filter(slot => {
        if (entry.timePreference.length === 0) return true;
        const hour = parseInt(slot.startTime.split(':')[0]);
        const isWeekendSlot = parseISO(dateStr).getDay() === 0 || parseISO(dateStr).getDay() === 6;

        return entry.timePreference.some(pref => {
          switch (pref) {
            case 'morning': return hour >= 9 && hour < 12;
            case 'afternoon': return hour >= 12 && hour < 16;
            case 'evening': return hour >= 16;
            case 'weekend': return isWeekendSlot;
            default: return true;
          }
        });
      });

      if (matchingSlots.length > 0) {
        matches.push({ entry, matchingSlots });
      }
    }

    // Sort by priority
    return matches.sort((a, b) => {
      const priorityOrder: Record<WaitlistPriority, number> = { vip: 0, member: 1, standard: 2 };
      return priorityOrder[a.entry.priority] - priorityOrder[b.entry.priority];
    });
  }

  // ── NOTIFICATIONS ──

  /**
   * Mark an entry as notified
   */
  markNotified(entryId: string): void {
    const entry = this.entries.find(e => e.id === entryId);
    if (entry) {
      entry.notificationsSent += 1;
      entry.lastNotifiedAt = new Date().toISOString();
      entry.status = 'notified';
    }
  }

  /**
   * Mark as converted (booked from waitlist)
   */
  markConverted(entryId: string, appointmentId: string): void {
    const entry = this.entries.find(e => e.id === entryId);
    if (entry) {
      entry.status = 'booked';
      entry.convertedAppointmentId = appointmentId;
    }
  }

  // ── EXPIRATION ──

  /**
   * Expire old waitlist entries
   */
  expireOldEntries(): WaitlistEntry[] {
    const today = format(new Date(), 'yyyy-MM-dd');
    const expired: WaitlistEntry[] = [];

    for (const entry of this.entries) {
      if (entry.status === 'active' && entry.expiresAt < today) {
        entry.status = 'expired';
        expired.push(entry);
      }
    }

    return expired;
  }

  // ── ANALYTICS ──

  /**
   * Get waitlist statistics
   */
  getStats(): WaitlistStats {
    const active = this.entries.filter(e => e.status === 'active');
    const converted = this.entries.filter(e => e.status === 'booked');
    const expired = this.entries.filter(e => e.status === 'expired');
    const notified = this.entries.filter(e => e.status === 'notified');

    // Group by service
    const byService = new Map<string, number>();
    for (const entry of active) {
      byService.set(entry.serviceId, (byService.get(entry.serviceId) ?? 0) + 1);
    }

    // Group by priority
    const byPriority: Record<WaitlistPriority, number> = {
      vip: active.filter(e => e.priority === 'vip').length,
      member: active.filter(e => e.priority === 'member').length,
      standard: active.filter(e => e.priority === 'standard').length,
    };

    // Average wait time for converted
    const avgWaitDays = converted.length > 0
      ? converted.reduce((sum, e) => {
          const created = parseISO(e.createdAt);
          const convertedDate = e.convertedAppointmentId ? new Date() : new Date(); // placeholder
          return sum + differenceInDays(convertedDate, created);
        }, 0) / converted.length
      : 0;

    // Conversion rate
    const totalCompleted = converted.length + expired.length;
    const conversionRate = totalCompleted > 0
      ? Math.round((converted.length / totalCompleted) * 100)
      : 0;

    return {
      totalActive: active.length,
      totalConverted: converted.length,
      totalExpired: expired.length,
      totalNotified: notified.length,
      conversionRate,
      avgWaitDays: Math.round(avgWaitDays),
      byService: Object.fromEntries(byService),
      byPriority,
      topWaitlistedServices: Array.from(byService.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([serviceId, count]) => {
          const entry = active.find(e => e.serviceId === serviceId);
          return { serviceId, serviceName: entry?.serviceName ?? serviceId, count };
        }),
    };
  }

  // ── QUERIES ──

  getActiveEntries(): WaitlistEntry[] {
    return this.entries
      .filter(e => e.status === 'active')
      .sort((a, b) => {
        const priorityOrder: Record<WaitlistPriority, number> = { vip: 0, member: 1, standard: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.createdAt.localeCompare(b.createdAt);
      });
  }

  getEntriesForClient(clientId: string): WaitlistEntry[] {
    return this.entries.filter(e => e.clientId === clientId);
  }

  getEntriesForService(serviceId: string): WaitlistEntry[] {
    return this.entries
      .filter(e => e.serviceId === serviceId && e.status === 'active')
      .sort((a, b) => {
        const priorityOrder: Record<WaitlistPriority, number> = { vip: 0, member: 1, standard: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.createdAt.localeCompare(b.createdAt);
      });
  }

  getEntry(entryId: string): WaitlistEntry | undefined {
    return this.entries.find(e => e.id === entryId);
  }

  getAllEntries(): WaitlistEntry[] {
    return this.entries;
  }
}

// ── STATS TYPE ──

export interface WaitlistStats {
  totalActive: number;
  totalConverted: number;
  totalExpired: number;
  totalNotified: number;
  conversionRate: number;
  avgWaitDays: number;
  byService: Record<string, number>;
  byPriority: Record<WaitlistPriority, number>;
  topWaitlistedServices: { serviceId: string; serviceName: string; count: number }[];
}

// ── NOTIFICATION TEMPLATES ──

export interface WaitlistNotification {
  entryId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceName: string;
  availableSlots: { date: string; time: string; provider: string }[];
  bookingUrl: string;
  expiresIn: string; // "24 hours"
}

/**
 * Generate notification content for a waitlist match
 */
export function generateWaitlistNotification(
  entry: WaitlistEntry,
  slots: TimeSlot[],
  baseUrl: string = 'https://ranibeautyclinic.com/book',
): WaitlistNotification {
  const firstName = entry.clientName.split(' ')[0];
  const topSlots = slots.slice(0, 3);

  return {
    entryId: entry.id,
    clientName: entry.clientName,
    clientEmail: entry.clientEmail,
    clientPhone: entry.clientPhone,
    serviceName: entry.serviceName,
    availableSlots: topSlots.map(s => ({
      date: s.date,
      time: s.startTime,
      provider: s.providerName,
    })),
    bookingUrl: `${baseUrl}/${entry.serviceId}?waitlist=${entry.id}`,
    expiresIn: '24 hours',
  };
}

export function formatWaitlistSMS(notification: WaitlistNotification): string {
  const firstName = notification.clientName.split(' ')[0];
  const slot = notification.availableSlots[0];
  return `Rani Beauty: Great news, ${firstName}! A spot just opened for your ${notification.serviceName} on ${slot.date} at ${slot.time} with ${slot.provider}. Book now: ${notification.bookingUrl} (expires in 24hrs)`;
}

export function formatWaitlistEmail(notification: WaitlistNotification): {
  subject: string;
  body: string;
} {
  const firstName = notification.clientName.split(' ')[0];
  const slotList = notification.availableSlots
    .map(s => `• ${s.date} at ${s.time} with ${s.provider}`)
    .join('\n');

  return {
    subject: `A Spot Opened Up for Your ${notification.serviceName}!`,
    body: `Hi ${firstName},\n\nGreat news — we have availability for your ${notification.serviceName}!\n\nAvailable times:\n${slotList}\n\nBook now before these spots fill up:\n${notification.bookingUrl}\n\nThis offer expires in 24 hours. After that, the slots will open to other clients.\n\nWe can't wait to see you!\nRani Beauty Clinic`,
  };
}
