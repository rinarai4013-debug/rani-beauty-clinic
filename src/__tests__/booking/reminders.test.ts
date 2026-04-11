import { describe, it, expect } from 'vitest';
import {
  getPreInstructions,
  buildReminderSchedule,
  generateReminderContent,
  checkLateArrivals,
  createNoShowFollowUp,
  generateRebookingNudges,
  getWeatherAwareMessage,
  processDueReminders,
} from '@/lib/booking/reminders';
import type { Appointment, WeatherAlert } from '@/lib/booking/types';

const mockAppointment: Appointment = {
  id: 'apt-1',
  clientId: 'c1',
  clientName: 'Jane Doe',
  clientEmail: 'jane@example.com',
  clientPhone: '555-1234',
  serviceId: 'botox',
  serviceName: 'Botox',
  providerId: 'dr-landfield',
  providerName: 'Dr. Alexander Landfield',
  roomId: 'glow',
  date: '2026-04-15',
  startTime: '10:00',
  endTime: '10:30',
  duration: 30,
  status: 'confirmed',
  isNewClient: false,
  isMember: false,
  estimatedRevenue: 400,
  depositPaid: 50,
  notes: '',
  createdAt: '2026-03-20T00:00:00Z',
  updatedAt: '2026-03-20T00:00:00Z',
  isEmergencySlot: false,
  source: 'online',
};

describe('getPreInstructions', () => {
  it('returns instructions for Botox', () => {
    const instructions = getPreInstructions('botox');
    expect(instructions.length).toBeGreaterThan(0);
    expect(instructions.some(i => i.toLowerCase().includes('alcohol'))).toBe(true);
  });

  it('returns instructions for filler', () => {
    const instructions = getPreInstructions('filler-lips');
    expect(instructions.length).toBeGreaterThan(0);
    expect(instructions.some(i => i.toLowerCase().includes('alcohol'))).toBe(true);
  });

  it('returns generic instructions for LHR variants', () => {
    const instructions = getPreInstructions('lhr-full-body');
    expect(instructions.length).toBeGreaterThan(0);
    expect(instructions.some(i => i.toLowerCase().includes('shave'))).toBe(true);
  });

  it('returns generic instructions for wellness', () => {
    const instructions = getPreInstructions('wellness-glutathione');
    expect(instructions.length).toBeGreaterThan(0);
    expect(instructions.some(i => i.toLowerCase().includes('hydrated'))).toBe(true);
  });

  it('returns HydraFacial instructions for variants', () => {
    const instructions = getPreInstructions('hydrafacial-express');
    expect(instructions.length).toBeGreaterThan(0);
  });

  it('returns default for unknown service', () => {
    const instructions = getPreInstructions('unknown-service-xyz');
    expect(instructions.length).toBe(1);
    expect(instructions[0]).toContain('No special preparation');
  });

  it('returns instructions for chemical peels', () => {
    const instructions = getPreInstructions('vi-peel');
    expect(instructions.some(i => i.toLowerCase().includes('retinoid'))).toBe(true);
  });

  it('returns instructions for RF microneedling', () => {
    const instructions = getPreInstructions('rf-microneedling-face');
    expect(instructions.some(i => i.toLowerCase().includes('sun'))).toBe(true);
  });

  it('returns instructions for Sofwave', () => {
    const instructions = getPreInstructions('sofwave-full-face');
    expect(instructions.some(i => i.toLowerCase().includes('clean skin'))).toBe(true);
  });
});

describe('buildReminderSchedule', () => {
  it('creates schedule with correct items', () => {
    const config = buildReminderSchedule(mockAppointment);

    expect(config.appointmentId).toBe('apt-1');
    expect(config.clientId).toBe('c1');
    expect(config.schedule.length).toBeGreaterThan(0);
    expect(config.status).toBe('scheduled');
  });

  it('includes pre-instructions', () => {
    const config = buildReminderSchedule(mockAppointment);
    expect(config.preInstructions.length).toBeGreaterThan(0);
  });

  it('includes both SMS and email channels', () => {
    const config = buildReminderSchedule(mockAppointment, ['sms', 'email']);
    const channels = new Set(config.schedule.map(s => s.channel));
    expect(channels.has('sms')).toBe(true);
    expect(channels.has('email')).toBe(true);
  });

  it('creates 7-day reminder as email', () => {
    const config = buildReminderSchedule(mockAppointment);
    const sevenDay = config.schedule.find(s => s.timing === '7-day');
    if (sevenDay) {
      expect(sevenDay.channel).toBe('email');
      expect(sevenDay.status).toBe('pending');
    }
  });

  it('creates day-of reminder as SMS', () => {
    const config = buildReminderSchedule(mockAppointment);
    const dayOf = config.schedule.find(s => s.timing === 'day-of');
    if (dayOf) {
      expect(dayOf.channel).toBe('sms');
    }
  });
});

describe('generateReminderContent', () => {
  const urls = {
    confirm: 'https://ranibeautyclinic.com/confirm/apt-1',
    reschedule: 'https://ranibeautyclinic.com/reschedule/apt-1',
    cancel: 'https://ranibeautyclinic.com/cancel/apt-1',
  };

  it('generates 7-day email content', () => {
    const content = generateReminderContent(mockAppointment, '7-day', 'email', urls.confirm, urls.reschedule, urls.cancel);
    expect(content.subject).toContain('Botox');
    expect(content.body).toContain('Jane');
    expect(content.body).toContain('Dr. Alexander Landfield');
  });

  it('generates 2-day SMS with confirm/reschedule options', () => {
    const content = generateReminderContent(mockAppointment, '2-day', 'sms', urls.confirm, urls.reschedule, urls.cancel);
    expect(content.body).toContain('CONFIRM');
    expect(content.body).toContain('RESCHEDULE');
    expect(content.body).toContain('CANCEL');
  });

  it('generates day-of SMS with address', () => {
    const content = generateReminderContent(mockAppointment, 'day-of', 'sms', urls.confirm, urls.reschedule, urls.cancel);
    expect(content.body).toContain('Renton');
    expect(content.body).toContain('Botox');
  });

  it('generates late arrival notification', () => {
    const content = generateReminderContent(mockAppointment, 'late-arrival', 'sms', urls.confirm, urls.reschedule, urls.cancel);
    expect(content.body).toContain('checked in');
  });

  it('generates no-show follow-up', () => {
    const content = generateReminderContent(mockAppointment, 'no-show', 'email', urls.confirm, urls.reschedule, urls.cancel);
    expect(content.subject).toContain('Missed You');
    expect(content.body).toContain('reschedule');
  });

  it('generates rebooking nudge', () => {
    const content = generateReminderContent(mockAppointment, 'rebooking', 'email', urls.confirm, urls.reschedule, urls.cancel);
    expect(content.subject).toContain('Botox');
    expect(content.body).toContain('results');
  });

  it('includes clinic address in day-of email', () => {
    const content = generateReminderContent(mockAppointment, 'day-of', 'email', urls.confirm, urls.reschedule, urls.cancel);
    expect(content.body).toContain('401 Olympia Ave');
  });
});

describe('checkLateArrivals', () => {
  it('detects late arrivals', () => {
    const now = new Date('2026-04-15T10:12:00');
    const appointments: Appointment[] = [{
      ...mockAppointment,
      date: '2026-04-15',
      startTime: '10:00',
      status: 'confirmed',
    }];

    const results = checkLateArrivals(appointments, now);
    expect(results.length).toBe(1);
    expect(results[0].minutesLate).toBe(12);
    expect(results[0].action).toBe('notify'); // 12 min >= 10 threshold, < 15 cancel-warning
  });

  it('recommends cancel after threshold', () => {
    const now = new Date('2026-04-15T10:25:00');
    const appointments: Appointment[] = [{
      ...mockAppointment,
      date: '2026-04-15',
      startTime: '10:00',
      status: 'confirmed',
    }];

    const results = checkLateArrivals(appointments, now, 10, 20);
    expect(results[0].action).toBe('cancel');
  });

  it('ignores non-confirmed appointments', () => {
    const now = new Date('2026-04-15T10:15:00');
    const appointments: Appointment[] = [{
      ...mockAppointment,
      date: '2026-04-15',
      startTime: '10:00',
      status: 'checked-in',
    }];

    const results = checkLateArrivals(appointments, now);
    expect(results.length).toBe(0);
  });

  it('ignores appointments on other dates', () => {
    const now = new Date('2026-04-16T10:15:00');
    const appointments: Appointment[] = [{
      ...mockAppointment,
      date: '2026-04-15',
      startTime: '10:00',
      status: 'confirmed',
    }];

    const results = checkLateArrivals(appointments, now);
    expect(results.length).toBe(0);
  });
});

describe('createNoShowFollowUp', () => {
  it('creates 3-step follow-up sequence', () => {
    const followUp = createNoShowFollowUp(mockAppointment, 'https://ranibeautyclinic.com/book');

    expect(followUp.sequence.length).toBe(3);
    expect(followUp.sequence[0].channel).toBe('sms');
    expect(followUp.sequence[1].channel).toBe('email');
    expect(followUp.sequence[2].channel).toBe('sms');
  });

  it('includes client name in messages', () => {
    const followUp = createNoShowFollowUp(mockAppointment, 'https://ranibeautyclinic.com/book');

    for (const step of followUp.sequence) {
      expect(step.message).toContain('Jane');
    }
  });

  it('includes service name in messages', () => {
    const followUp = createNoShowFollowUp(mockAppointment, 'https://ranibeautyclinic.com/book');

    for (const step of followUp.sequence) {
      expect(step.message).toContain('Botox');
    }
  });

  it('all steps start as pending', () => {
    const followUp = createNoShowFollowUp(mockAppointment, 'https://ranibeautyclinic.com/book');

    for (const step of followUp.sequence) {
      expect(step.status).toBe('pending');
    }
  });
});

describe('generateRebookingNudges', () => {
  it('generates nudges for overdue clients', () => {
    // Use a date that makes Botox clearly overdue (90-day interval)
    const completed: Appointment[] = [{
      ...mockAppointment,
      date: '2025-12-15', // ~3.5 months ago, well within 90-day overdue window
      status: 'completed',
    }];

    const nudges = generateRebookingNudges(completed, []);
    expect(nudges.length).toBeGreaterThan(0);
    // The first nudge should be the overdue botox
    expect(nudges[0].lastServiceId).toBe('botox');
    expect(nudges[0].daysOverdue).toBeGreaterThan(0);
  });

  it('excludes clients with upcoming appointments', () => {
    const completed: Appointment[] = [{
      ...mockAppointment,
      date: '2026-01-01',
      status: 'completed',
    }];

    const upcoming: Appointment[] = [{
      ...mockAppointment,
      id: 'apt-2',
      date: '2026-04-20',
      status: 'confirmed',
    }];

    const nudges = generateRebookingNudges(completed, upcoming);
    expect(nudges.length).toBe(0);
  });

  it('sorts by most overdue first', () => {
    const completed: Appointment[] = [
      { ...mockAppointment, serviceId: 'botox', date: '2026-01-01', status: 'completed' },
      {
        ...mockAppointment,
        id: 'apt-2',
        serviceId: 'hydrafacial-signature',
        serviceName: 'Signature HydraFacial',
        date: '2026-02-01', // More recent
        status: 'completed',
      },
    ];

    const nudges = generateRebookingNudges(completed, []);
    if (nudges.length >= 2) {
      expect(nudges[0].daysOverdue).toBeGreaterThanOrEqual(nudges[1].daysOverdue);
    }
  });
});

describe('getWeatherAwareMessage', () => {
  it('suggests reschedule for severe weather', () => {
    const weather: WeatherAlert = {
      date: '2026-04-15',
      severity: 'severe',
      type: 'snow',
      description: 'heavy snowfall',
    };

    const result = getWeatherAwareMessage(mockAppointment, weather);
    expect(result.shouldOffer).toBe('reschedule-suggestion');
    expect(result.message).toContain('safe');
  });

  it('offers flexibility for warning weather', () => {
    const weather: WeatherAlert = {
      date: '2026-04-15',
      severity: 'warning',
      type: 'ice',
      description: 'icy conditions',
    };

    const result = getWeatherAwareMessage(mockAppointment, weather);
    expect(result.shouldOffer).toBe('flexibility');
  });

  it('returns normal for advisory weather', () => {
    const weather: WeatherAlert = {
      date: '2026-04-15',
      severity: 'advisory',
      type: 'storm',
      description: 'light rain',
    };

    const result = getWeatherAwareMessage(mockAppointment, weather);
    expect(result.shouldOffer).toBe('normal');
  });
});

describe('processDueReminders', () => {
  it('returns empty for no reminders', () => {
    const due = processDueReminders([], []);
    expect(due.length).toBe(0);
  });

  it('skips cancelled appointment reminders', () => {
    const reminders = [buildReminderSchedule({ ...mockAppointment, status: 'cancelled' })];
    const appointments = [{ ...mockAppointment, status: 'cancelled' as const }];
    const due = processDueReminders(reminders, appointments);
    expect(due.length).toBe(0);
  });
});
