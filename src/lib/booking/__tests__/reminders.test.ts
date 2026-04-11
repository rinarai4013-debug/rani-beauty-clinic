import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildReminderSchedule,
  checkLateArrivals,
  createNoShowFollowUp,
  generateRebookingNudges,
  generateReminderContent,
  getPreInstructions,
  getWeatherAwareMessage,
  processDueReminders,
} from '@/lib/booking/reminders';

const appointment = {
  id: 'apt-1',
  clientId: 'c1',
  clientName: 'Rina Patel',
  clientEmail: 'rina@example.com',
  clientPhone: '4255550100',
  serviceId: 'botox',
  serviceName: 'Botox',
  providerId: 'dr-landfield',
  providerName: 'Dr. Alexander Landfield',
  roomId: 'glow' as const,
  date: '2026-04-20',
  startTime: '10:00',
  endTime: '10:30',
  duration: 30,
  status: 'confirmed' as const,
  isNewClient: false,
  isMember: false,
  estimatedRevenue: 400,
  depositPaid: 0,
  notes: '',
  createdAt: '2026-04-10T12:00:00.000Z',
  updatedAt: '2026-04-10T12:00:00.000Z',
  isEmergencySlot: false,
  source: 'online' as const,
};

describe('booking/reminders', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns direct and fallback pre-instructions by service family', () => {
    expect(getPreInstructions('botox')[0]).toContain('Avoid alcohol');
    expect(getPreInstructions('lhr-upper-lip')[0]).toContain('Shave the treatment area');
    expect(getPreInstructions('unknown-service')).toEqual(['No special preparation required. We look forward to seeing you!']);
  });

  it('builds the full reminder cadence for a future appointment', () => {
    const config = buildReminderSchedule(appointment, ['sms', 'email']);

    expect(config.schedule).toHaveLength(4);
    expect(config.schedule.map(item => item.timing)).toEqual(['7-day', '2-day', '2-day', 'day-of']);
    expect(config.preInstructions.length).toBeGreaterThan(0);
  });

  it('generates reminder copy for confirmation and day-of flows', () => {
    const twoDaySms = generateReminderContent(
      appointment,
      '2-day',
      'sms',
      'https://example.com/confirm',
      'https://example.com/reschedule',
      'https://example.com/cancel',
    );
    const dayOfEmail = generateReminderContent(
      appointment,
      'day-of',
      'email',
      'https://example.com/confirm',
      'https://example.com/reschedule',
      'https://example.com/cancel',
    );

    expect(twoDaySms.body).toContain('Reply CONFIRM, RESCHEDULE, or CANCEL.');
    expect(dayOfEmail.body).toContain('Reminders for today:');
    expect(dayOfEmail.body).toContain('Avoid alcohol for 24 hours');
  });

  it('flags late arrivals for notify and cancel actions at the documented thresholds', () => {
    const checks = checkLateArrivals(
      [appointment],
      new Date('2026-04-20T10:12:00Z'),
      10,
      20,
    );
    const cancellationChecks = checkLateArrivals(
      [appointment],
      new Date('2026-04-20T10:25:00Z'),
      10,
      20,
    );

    expect(checks[0].action).toBe('notify');
    expect(checks[0].shouldNotify).toBe(true);
    expect(cancellationChecks[0].action).toBe('cancel');
  });

  it('creates no-show follow-up sequences at 1 hour, 24 hours, and 7 days', () => {
    const followUp = createNoShowFollowUp(appointment, 'https://example.com/rebook');

    expect(followUp.sequence).toHaveLength(3);
    expect(followUp.sequence.map(step => step.timing)).toEqual(['1 hour after', '24 hours after', '7 days after']);
  });

  it('generates overdue rebooking nudges and skips clients who already have upcoming appointments', () => {
    const completed = [
      {
        ...appointment,
        date: '2026-01-01',
        status: 'completed' as const,
      },
    ];

    const nudges = generateRebookingNudges(completed, []);
    const blockedNudges = generateRebookingNudges(completed, [appointment]);

    expect(nudges).toHaveLength(1);
    expect(nudges[0].lastServiceId).toBe('botox');
    expect(blockedNudges).toEqual([]);
  });

  it('adjusts weather messaging by severity', () => {
    expect(getWeatherAwareMessage(appointment, {
      date: '2026-04-20',
      severity: 'severe',
      type: 'snow',
      description: 'heavy snow conditions',
    }).shouldOffer).toBe('reschedule-suggestion');

    expect(getWeatherAwareMessage(appointment, {
      date: '2026-04-20',
      severity: 'warning',
      type: 'storm',
      description: 'stormy travel conditions',
    }).shouldOffer).toBe('flexibility');
  });

  it('processes due reminders only for pending items at or before the current time', () => {
    const reminders = [buildReminderSchedule(appointment, ['sms'])];
    reminders[0].schedule[0].sendAt = '2026-04-10T11:00:00.000Z';

    const due = processDueReminders(reminders, [appointment], new Date('2026-04-10T12:00:00Z'));

    expect(due).toHaveLength(1);
    expect(due[0].channel).toBe('email');
    expect(due[0].status).toBe('ready');
  });
});
