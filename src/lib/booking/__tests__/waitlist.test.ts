import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AvailabilityEngine } from '@/lib/booking/availability';
import { BOOKABLE_SERVICES } from '@/lib/booking/services';
import { WaitlistManager, formatWaitlistEmail, formatWaitlistSMS, generateWaitlistNotification } from '@/lib/booking/waitlist';

describe('booking/waitlist', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds waitlist entries with derived priority and expiry dates', () => {
    const engine = new AvailabilityEngine(undefined, undefined, [], BOOKABLE_SERVICES);
    const manager = new WaitlistManager(engine);

    const vip = manager.addToWaitlist({
      clientId: 'c1',
      clientName: 'Rina Patel',
      clientEmail: 'rina@example.com',
      clientPhone: '4255550100',
      serviceId: 'botox',
      serviceName: 'Botox',
      timePreference: ['morning'],
      isVip: true,
    });

    expect(vip.priority).toBe('vip');
    expect(vip.expiresAt).toBe('2026-05-10');
  });

  it('orders active entries by priority and signup time', () => {
    const engine = new AvailabilityEngine(undefined, undefined, [], BOOKABLE_SERVICES);
    const manager = new WaitlistManager(engine);

    manager.addToWaitlist({
      clientId: 'c1',
      clientName: 'Standard Client',
      clientEmail: 'standard@example.com',
      clientPhone: '4255550101',
      serviceId: 'botox',
      serviceName: 'Botox',
      timePreference: [],
    });
    manager.addToWaitlist({
      clientId: 'c2',
      clientName: 'VIP Client',
      clientEmail: 'vip@example.com',
      clientPhone: '4255550102',
      serviceId: 'botox',
      serviceName: 'Botox',
      timePreference: [],
      isVip: true,
    });

    expect(manager.getActiveEntries()[0].priority).toBe('vip');
  });

  it('finds service matches from real availability and respects time preferences', () => {
    const engine = new AvailabilityEngine(undefined, undefined, [], BOOKABLE_SERVICES);
    const manager = new WaitlistManager(engine);

    manager.addToWaitlist({
      clientId: 'c1',
      clientName: 'Rina Patel',
      clientEmail: 'rina@example.com',
      clientPhone: '4255550100',
      serviceId: 'botox',
      serviceName: 'Botox',
      timePreference: ['morning'],
      preferredProviderId: 'dr-landfield',
    });

    const matches = manager.findMatchesForService('botox', '2026-04-13');

    expect(matches).toHaveLength(1);
    expect(matches[0].matchingSlots.length).toBeGreaterThan(0);
    expect(matches[0].matchingSlots.every(slot => parseInt(slot.startTime.split(':')[0], 10) < 12)).toBe(true);
  });

  it('marks notifications and conversions on entries', () => {
    const engine = new AvailabilityEngine(undefined, undefined, [], BOOKABLE_SERVICES);
    const manager = new WaitlistManager(engine);
    const entry = manager.addToWaitlist({
      clientId: 'c1',
      clientName: 'Rina Patel',
      clientEmail: 'rina@example.com',
      clientPhone: '4255550100',
      serviceId: 'botox',
      serviceName: 'Botox',
      timePreference: [],
    });

    manager.markNotified(entry.id);
    expect(manager.getEntry(entry.id)?.status).toBe('notified');
    expect(manager.getEntry(entry.id)?.notificationsSent).toBe(1);

    manager.markConverted(entry.id, 'apt-100');
    expect(manager.getEntry(entry.id)?.status).toBe('booked');
    expect(manager.getEntry(entry.id)?.convertedAppointmentId).toBe('apt-100');
  });

  it('expires old active entries and reports waitlist stats', () => {
    const engine = new AvailabilityEngine(undefined, undefined, [], BOOKABLE_SERVICES);
    const manager = new WaitlistManager(engine, [
      {
        id: 'wl-old',
        clientId: 'c-old',
        clientName: 'Old Client',
        clientEmail: 'old@example.com',
        clientPhone: '4255550103',
        serviceId: 'botox',
        serviceName: 'Botox',
        timePreference: [],
        dateRangeStart: '2026-03-01',
        dateRangeEnd: '2026-06-01',
        priority: 'standard',
        isMember: false,
        isVip: false,
        status: 'active',
        notificationsSent: 0,
        createdAt: '2026-03-01T12:00:00.000Z',
        expiresAt: '2026-04-01',
      },
    ]);

    const expired = manager.expireOldEntries();
    const stats = manager.getStats();

    expect(expired).toHaveLength(1);
    expect(stats.totalExpired).toBe(1);
  });

  it('builds waitlist notifications and channel formatting', () => {
    const engine = new AvailabilityEngine(undefined, undefined, [], BOOKABLE_SERVICES);
    const manager = new WaitlistManager(engine);
    const entry = manager.addToWaitlist({
      clientId: 'c1',
      clientName: 'Rina Patel',
      clientEmail: 'rina@example.com',
      clientPhone: '4255550100',
      serviceId: 'botox',
      serviceName: 'Botox',
      timePreference: [],
    });
    const slots = engine.getAvailableSlots({
      serviceId: 'botox',
      date: '2026-04-13',
      providerId: 'dr-landfield',
    }).slots;

    const notification = generateWaitlistNotification(entry, slots, 'https://example.com/book');
    const sms = formatWaitlistSMS(notification);
    const email = formatWaitlistEmail(notification);

    expect(notification.availableSlots.length).toBeGreaterThan(0);
    expect(notification.bookingUrl).toContain('/botox?waitlist=');
    expect(sms).toContain('Great news');
    expect(email.subject).toContain('Botox');
    expect(email.body).toContain('Available times:');
  });
});
