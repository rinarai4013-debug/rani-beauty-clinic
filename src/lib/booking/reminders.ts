/**
 * Reminder System
 *
 * Multi-channel appointment reminder engine:
 * - SMS + email reminders at 7 days, 2 days, day-of morning
 * - Confirmation request with one-tap confirm/reschedule/cancel
 * - Pre-appointment instructions (service-specific)
 * - Late arrival notifications
 * - No-show follow-up sequence
 * - Rebooking nudge after treatment (timing based on service)
 * - Weather-aware reminders (snow day flexibility)
 */

import { format, parseISO, subDays, addDays, addHours, differenceInMinutes, differenceInDays, isBefore, isAfter } from 'date-fns';
import type {
  Appointment,
  BookableService,
  RebookingNudge,
  ReminderChannel,
  ReminderConfig,
  ReminderScheduleItem,
  ReminderTiming,
} from './types';
import { REBOOKING_INTERVALS } from './scheduler';

// ── PRE-APPOINTMENT INSTRUCTIONS ──

export const PRE_INSTRUCTIONS: Record<string, string[]> = {
  // Injectables
  'botox': [
    'Avoid alcohol for 24 hours before your appointment',
    'Discontinue blood thinners (aspirin, ibuprofen, fish oil) 7 days prior if medically safe',
    'Arrive with a clean face — no makeup on the treatment area',
    'Eat a light meal before your appointment',
    'Avoid strenuous exercise the morning of your treatment',
  ],
  'dysport': [
    'Avoid alcohol for 24 hours before your appointment',
    'Discontinue blood thinners (aspirin, ibuprofen, fish oil) 7 days prior if medically safe',
    'Arrive with a clean face — no makeup on the treatment area',
    'Eat a light meal before your appointment',
  ],
  'filler-lips': [
    'Avoid alcohol for 48 hours before your appointment',
    'Discontinue blood thinners 7 days prior if medically safe',
    'No dental work 2 weeks before or after treatment',
    'Arrive with clean, moisturized lips — no lip products',
    'Take Arnica tablets 3 days before to minimize bruising (optional)',
  ],
  'filler-cheeks': [
    'Avoid alcohol for 48 hours before your appointment',
    'Discontinue blood thinners 7 days prior if medically safe',
    'Arrive with a clean face — no makeup',
  ],
  'filler-jawline': [
    'Avoid alcohol for 48 hours before your appointment',
    'Discontinue blood thinners 7 days prior if medically safe',
    'Arrive with a clean face — no makeup',
  ],
  'filler-undereyes': [
    'Avoid alcohol for 48 hours before your appointment',
    'Discontinue blood thinners 7-10 days prior if medically safe',
    'Get a good night\'s sleep — well-rested skin responds better',
    'No eye makeup on the day of treatment',
  ],

  // Laser
  'laser-facial-ndyag': [
    'No sun exposure or tanning for 2 weeks before treatment',
    'Discontinue retinoids 5-7 days before treatment',
    'Arrive with a clean face — no makeup, lotions, or SPF',
    'Shave the treatment area 24 hours before (if applicable)',
  ],

  // Chemical peels
  'vi-peel': [
    'Discontinue retinoids and exfoliating acids 5-7 days before treatment',
    'No waxing or laser hair removal 7 days before',
    'Arrive with a clean face — no makeup',
    'Avoid sun exposure for 1 week before treatment',
  ],
  'biorepeel-face': [
    'Discontinue retinoids 3-5 days before treatment',
    'Arrive with a clean face — no makeup',
    'No other facial treatments within 7 days',
  ],
  'prx-t33-face': [
    'Discontinue retinoids 5 days before treatment',
    'Arrive with a clean face — no makeup',
    'No sun exposure for 1 week before',
  ],

  // RF Microneedling
  'rf-microneedling-face': [
    'No sun exposure for 2 weeks before treatment',
    'Discontinue retinoids 7 days before treatment',
    'No blood thinners for 7 days (if medically safe)',
    'Arrive with a clean face — absolutely no makeup, lotions, or SPF',
    'Avoid alcohol for 24 hours before',
  ],

  // Sofwave
  'sofwave-full-face': [
    'No special preparation required — arrive with clean skin',
    'Remove all jewelry from the treatment area',
    'A topical numbing cream will be applied at the clinic',
  ],
  'sofwave-full-face-neck': [
    'No special preparation required — arrive with clean skin',
    'Remove all jewelry from the treatment area',
    'A topical numbing cream will be applied at the clinic',
  ],

  // Laser Hair Removal (generic for all LHR)
  'lhr-generic': [
    'Shave the treatment area 24 hours before your appointment',
    'No waxing, plucking, or threading for 4 weeks before treatment',
    'Avoid sun exposure and tanning for 2 weeks before',
    'No self-tanner for 2 weeks before treatment',
    'Arrive with clean skin — no lotions, deodorant, or products on the treatment area',
  ],

  // HydraFacial
  'hydrafacial-signature': [
    'No special preparation needed — come as you are',
    'Avoid retinoids 2-3 days before for sensitive skin',
    'No waxing or laser treatments within 48 hours',
  ],

  // Wellness injections
  'wellness-generic': [
    'Stay hydrated — drink plenty of water before your appointment',
    'Eat a light meal before your visit',
    'Wear a short-sleeved or loose-fitting top for easy arm access',
  ],
};

/** Get pre-appointment instructions for a service */
export function getPreInstructions(serviceId: string): string[] {
  // Direct match
  if (PRE_INSTRUCTIONS[serviceId]) return PRE_INSTRUCTIONS[serviceId];

  // Category-based fallback
  if (serviceId.startsWith('lhr-')) return PRE_INSTRUCTIONS['lhr-generic'];
  if (serviceId.startsWith('wellness-')) return PRE_INSTRUCTIONS['wellness-generic'];
  if (serviceId.startsWith('filler-')) return PRE_INSTRUCTIONS['filler-lips']; // similar prep
  if (serviceId.startsWith('hydrafacial-')) return PRE_INSTRUCTIONS['hydrafacial-signature'];
  if (serviceId.startsWith('sofwave-')) return PRE_INSTRUCTIONS['sofwave-full-face'];
  if (serviceId.startsWith('biorepeel-')) return PRE_INSTRUCTIONS['biorepeel-face'];
  if (serviceId.startsWith('rf-microneedling-')) return PRE_INSTRUCTIONS['rf-microneedling-face'];

  return ['No special preparation required. We look forward to seeing you!'];
}

// ── REMINDER SCHEDULE BUILDER ──

/**
 * Create a complete reminder schedule for an appointment
 */
export function buildReminderSchedule(
  appointment: Appointment,
  preferredChannels: ReminderChannel[] = ['sms', 'email'],
): ReminderConfig {
  const appointmentDate = parseISO(`${appointment.date}T${appointment.startTime}`);
  const schedule: ReminderScheduleItem[] = [];

  // 7-day reminder (email only — informational)
  const sevenDay = subDays(appointmentDate, 7);
  if (isAfter(sevenDay, new Date())) {
    schedule.push({
      timing: '7-day',
      sendAt: format(sevenDay, "yyyy-MM-dd'T'09:00:00"),
      channel: 'email',
      status: 'pending',
    });
  }

  // 2-day reminder (SMS + email — confirmation request)
  const twoDay = subDays(appointmentDate, 2);
  if (isAfter(twoDay, new Date())) {
    for (const channel of preferredChannels) {
      schedule.push({
        timing: '2-day',
        sendAt: format(twoDay, "yyyy-MM-dd'T'10:00:00"),
        channel,
        status: 'pending',
      });
    }
  }

  // Day-of morning reminder (SMS — with pre-instructions)
  const dayOf = parseISO(`${appointment.date}T08:00:00`);
  if (isAfter(dayOf, new Date())) {
    schedule.push({
      timing: 'day-of',
      sendAt: format(dayOf, "yyyy-MM-dd'T'08:00:00"),
      channel: 'sms',
      status: 'pending',
    });
  }

  return {
    appointmentId: appointment.id,
    clientId: appointment.clientId,
    channels: preferredChannels,
    schedule,
    preInstructions: getPreInstructions(appointment.serviceId),
    status: 'scheduled',
  };
}

// ── REMINDER TEMPLATES ──

export interface ReminderTemplate {
  subject?: string; // email only
  body: string;
  actionUrl?: string;
  actionLabel?: string;
}

/**
 * Generate reminder content for a specific timing
 */
export function generateReminderContent(
  appointment: Appointment,
  timing: ReminderTiming,
  channel: ReminderChannel,
  confirmUrl: string,
  rescheduleUrl: string,
  cancelUrl: string,
): ReminderTemplate {
  const dateFormatted = format(parseISO(appointment.date), 'EEEE, MMMM d');
  const timeFormatted = appointment.startTime;

  switch (timing) {
    case '7-day':
      return {
        subject: `Your ${appointment.serviceName} at Rani Beauty Clinic — ${dateFormatted}`,
        body: channel === 'email'
          ? `We're looking forward to seeing you, ${appointment.clientName.split(' ')[0]}!\n\nYour ${appointment.serviceName} with ${appointment.providerName} is scheduled for ${dateFormatted} at ${timeFormatted}.\n\nWe'll send you a reminder with preparation instructions closer to your appointment.\n\nRani Beauty Clinic\n401 Olympia Ave NE #101, Renton, WA`
          : `Rani Beauty Clinic: Your ${appointment.serviceName} is in 1 week — ${dateFormatted} at ${timeFormatted}. We'll send prep instructions soon!`,
      };

    case '2-day':
      return {
        subject: `Confirm Your Appointment — ${dateFormatted} at ${timeFormatted}`,
        body: channel === 'email'
          ? `Hi ${appointment.clientName.split(' ')[0]},\n\nJust a reminder about your upcoming appointment:\n\n${appointment.serviceName}\n${dateFormatted} at ${timeFormatted}\nWith: ${appointment.providerName}\n\nPlease confirm, reschedule, or cancel your appointment:\n\nConfirm: ${confirmUrl}\nReschedule: ${rescheduleUrl}\nCancel: ${cancelUrl}\n\nRani Beauty Clinic`
          : `Rani Beauty: Your ${appointment.serviceName} is in 2 days — ${dateFormatted} at ${timeFormatted}.\n\nReply CONFIRM, RESCHEDULE, or CANCEL.`,
        actionUrl: confirmUrl,
        actionLabel: 'Confirm Appointment',
      };

    case 'day-of': {
      const instructions = getPreInstructions(appointment.serviceId);
      const instructionText = instructions.length > 0
        ? `\n\nReminders for today:\n${instructions.map(i => `• ${i}`).join('\n')}`
        : '';

      return {
        subject: `Today's Appointment — ${timeFormatted}`,
        body: channel === 'sms'
          ? `Rani Beauty: See you today at ${timeFormatted} for your ${appointment.serviceName}!${instructions.length > 0 ? ` Quick reminder: ${instructions[0]}` : ''} — 401 Olympia Ave NE #101, Renton`
          : `Good morning, ${appointment.clientName.split(' ')[0]}!\n\nWe're excited to see you today:\n\n${appointment.serviceName}\nTime: ${timeFormatted}\nProvider: ${appointment.providerName}\nRoom: ${appointment.roomId.charAt(0).toUpperCase() + appointment.roomId.slice(1)}${instructionText}\n\nAddress: 401 Olympia Ave NE #101, Renton, WA 98056\n\nSee you soon!\nRani Beauty Clinic`,
      };
    }

    case 'late-arrival':
      return {
        body: `Rani Beauty: We noticed you haven't checked in yet for your ${timeFormatted} ${appointment.serviceName}. Are you on your way? Please let us know — (425) 555-RANI`,
      };

    case 'no-show':
      return {
        subject: `We Missed You Today — Let's Reschedule`,
        body: channel === 'email'
          ? `Hi ${appointment.clientName.split(' ')[0]},\n\nWe missed you at your ${appointment.serviceName} appointment today. We hope everything is okay!\n\nWe'd love to get you rescheduled at a time that works better. Book your new appointment here:\n\n${rescheduleUrl}\n\nIf you need to discuss anything, don't hesitate to reach out.\n\nWarm regards,\nRani Beauty Clinic`
          : `Rani Beauty: We missed you today! No worries — let's find a new time for your ${appointment.serviceName}. Reply or call us to reschedule.`,
        actionUrl: rescheduleUrl,
        actionLabel: 'Reschedule Now',
      };

    case 'rebooking':
      return {
        subject: `Time for Your Next ${appointment.serviceName}`,
        body: channel === 'email'
          ? `Hi ${appointment.clientName.split(' ')[0]},\n\nIt's been a while since your last ${appointment.serviceName} and it may be time for your next session to maintain your beautiful results.\n\nBook your next appointment:\n${rescheduleUrl}\n\nRani Beauty Clinic`
          : `Rani Beauty: Ready for your next ${appointment.serviceName}? Maintain your results — book now at ${rescheduleUrl}`,
        actionUrl: rescheduleUrl,
        actionLabel: 'Book Your Next Session',
      };

    default:
      return { body: '' };
  }
}

// ── LATE ARRIVAL DETECTION ──

export interface LateArrivalCheck {
  appointmentId: string;
  clientName: string;
  scheduledTime: string;
  minutesLate: number;
  shouldNotify: boolean;
  shouldCancelAfter: number; // minutes
  action: 'wait' | 'notify' | 'cancel-warning' | 'cancel';
}

/**
 * Check for late arrivals (run periodically during business hours)
 */
export function checkLateArrivals(
  appointments: Appointment[],
  currentTime: Date = new Date(),
  lateThresholdMinutes: number = 10,
  cancelThresholdMinutes: number = 20,
): LateArrivalCheck[] {
  const results: LateArrivalCheck[] = [];
  const now = format(currentTime, 'HH:mm');
  const today = format(currentTime, 'yyyy-MM-dd');

  const todayAppointments = appointments.filter(
    a => a.date === today &&
    a.status === 'confirmed' &&
    a.startTime <= now
  );

  for (const apt of todayAppointments) {
    const scheduledTime = parseISO(`${apt.date}T${apt.startTime}`);
    const minutesLate = differenceInMinutes(currentTime, scheduledTime);

    if (minutesLate < 0) continue;

    let action: LateArrivalCheck['action'] = 'wait';
    if (minutesLate >= cancelThresholdMinutes) action = 'cancel';
    else if (minutesLate >= lateThresholdMinutes + 5) action = 'cancel-warning';
    else if (minutesLate >= lateThresholdMinutes) action = 'notify';

    results.push({
      appointmentId: apt.id,
      clientName: apt.clientName,
      scheduledTime: apt.startTime,
      minutesLate,
      shouldNotify: minutesLate >= lateThresholdMinutes,
      shouldCancelAfter: cancelThresholdMinutes,
      action,
    });
  }

  return results.filter(r => r.action !== 'wait');
}

// ── NO-SHOW FOLLOW-UP ──

export interface NoShowFollowUp {
  appointmentId: string;
  clientId: string;
  clientName: string;
  serviceName: string;
  missedDate: string;
  sequence: NoShowSequenceStep[];
}

export interface NoShowSequenceStep {
  step: number;
  timing: string; // e.g., "1 hour after", "24 hours after", "7 days after"
  sendAt: string;
  channel: ReminderChannel;
  message: string;
  status: 'pending' | 'sent' | 'responded';
}

/**
 * Create a no-show follow-up sequence
 */
export function createNoShowFollowUp(appointment: Appointment, rescheduleUrl: string): NoShowFollowUp {
  const missedTime = parseISO(`${appointment.date}T${appointment.endTime}`);
  const firstName = appointment.clientName.split(' ')[0];

  return {
    appointmentId: appointment.id,
    clientId: appointment.clientId,
    clientName: appointment.clientName,
    serviceName: appointment.serviceName,
    missedDate: appointment.date,
    sequence: [
      {
        step: 1,
        timing: '1 hour after',
        sendAt: format(addHours(missedTime, 1), "yyyy-MM-dd'T'HH:mm:ss"),
        channel: 'sms',
        message: `Hi ${firstName}, we missed you at your ${appointment.serviceName} appointment today. We hope you're well! Reply to reschedule or call us.`,
        status: 'pending',
      },
      {
        step: 2,
        timing: '24 hours after',
        sendAt: format(addHours(missedTime, 24), "yyyy-MM-dd'T'HH:mm:ss"),
        channel: 'email',
        message: `Hi ${firstName},\n\nWe missed you at your ${appointment.serviceName} appointment yesterday. We'd love to help you reschedule at a time that works better.\n\nReschedule here: ${rescheduleUrl}\n\nIf anything came up, don't hesitate to let us know. We're here for you.\n\nRani Beauty Clinic`,
        status: 'pending',
      },
      {
        step: 3,
        timing: '7 days after',
        sendAt: format(addDays(missedTime, 7), "yyyy-MM-dd'T'HH:mm:ss"),
        channel: 'sms',
        message: `${firstName}, we still have availability for your ${appointment.serviceName}. Book your new appointment anytime: ${rescheduleUrl}`,
        status: 'pending',
      },
    ],
  };
}

// ── REBOOKING NUDGES ──

/**
 * Generate rebooking nudges for clients who are due or overdue
 */
export function generateRebookingNudges(
  completedAppointments: Appointment[],
  upcomingAppointments: Appointment[],
): RebookingNudge[] {
  const nudges: RebookingNudge[] = [];
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // Group completed appointments by client + service (most recent)
  const lastVisits = new Map<string, Appointment>();
  for (const apt of completedAppointments) {
    const key = `${apt.clientId}:${apt.serviceId}`;
    const existing = lastVisits.get(key);
    if (!existing || apt.date > existing.date) {
      lastVisits.set(key, apt);
    }
  }

  // Check which clients already have upcoming appointments for the same service
  const upcomingSet = new Set(
    upcomingAppointments
      .filter(a => a.status !== 'cancelled')
      .map(a => `${a.clientId}:${a.serviceId}`)
  );

  for (const [key, lastApt] of lastVisits) {
    if (upcomingSet.has(key)) continue; // Already rebooked

    const interval = REBOOKING_INTERVALS[lastApt.serviceId];
    if (!interval) continue;

    const suggestedDate = format(addDays(parseISO(lastApt.date), interval), 'yyyy-MM-dd');
    const daysOverdue = differenceInDays(today, parseISO(suggestedDate));

    // Only nudge if within window: 7 days before due through 90 days overdue
    if (daysOverdue >= -7 && daysOverdue <= 90) {
      nudges.push({
        clientId: lastApt.clientId,
        clientName: lastApt.clientName,
        lastServiceId: lastApt.serviceId,
        lastServiceName: lastApt.serviceName,
        lastVisitDate: lastApt.date,
        suggestedRebookDate: suggestedDate,
        intervalDays: interval,
        daysOverdue: Math.max(0, daysOverdue),
        status: 'pending',
      });
    }
  }

  // Sort: most overdue first
  return nudges.sort((a, b) => b.daysOverdue - a.daysOverdue);
}

// ── WEATHER-AWARE REMINDERS ──

export interface WeatherAlert {
  date: string;
  severity: 'advisory' | 'warning' | 'severe';
  type: 'snow' | 'ice' | 'storm' | 'extreme-heat' | 'flooding';
  description: string;
}

/**
 * Generate weather-adjusted reminder messaging
 */
export function getWeatherAwareMessage(
  appointment: Appointment,
  weather: WeatherAlert,
): {
  shouldOffer: 'flexibility' | 'reschedule-suggestion' | 'normal';
  message: string;
} {
  const firstName = appointment.clientName.split(' ')[0];

  if (weather.severity === 'severe') {
    return {
      shouldOffer: 'reschedule-suggestion',
      message: `Hi ${firstName}, due to ${weather.description}, we want to make sure you stay safe. We're happy to reschedule your ${appointment.serviceName} at no charge. Your safety comes first! Reply RESCHEDULE or call us.`,
    };
  }

  if (weather.severity === 'warning') {
    return {
      shouldOffer: 'flexibility',
      message: `Hi ${firstName}, we're aware of the ${weather.description} tomorrow. If you need to adjust your ${appointment.serviceName} appointment, we completely understand. Just let us know and we'll find a perfect time for you.`,
    };
  }

  return {
    shouldOffer: 'normal',
    message: `Looking forward to seeing you tomorrow for your ${appointment.serviceName}, ${firstName}!`,
  };
}

// ── REMINDER PROCESSOR ──

export interface ProcessedReminder {
  id: string;
  appointmentId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  channel: ReminderChannel;
  timing: ReminderTiming;
  content: ReminderTemplate;
  scheduledAt: string;
  processedAt?: string;
  status: 'ready' | 'sent' | 'failed';
  error?: string;
}

/**
 * Process due reminders — returns reminders that should be sent now
 */
export function processDueReminders(
  reminders: ReminderConfig[],
  appointments: Appointment[],
  currentTime: Date = new Date(),
  baseUrl: string = 'https://ranibeautyclinic.com/book',
): ProcessedReminder[] {
  const due: ProcessedReminder[] = [];
  const nowStr = currentTime.toISOString();

  for (const config of reminders) {
    if (config.status === 'cancelled') continue;

    const appointment = appointments.find(a => a.id === config.appointmentId);
    if (!appointment) continue;
    if (appointment.status === 'cancelled' || appointment.status === 'no-show') continue;

    for (const item of config.schedule) {
      if (item.status !== 'pending') continue;
      if (item.sendAt > nowStr) continue; // Not yet time

      const confirmUrl = `${baseUrl}/confirm/${appointment.id}?action=confirm`;
      const rescheduleUrl = `${baseUrl}/confirm/${appointment.id}?action=reschedule`;
      const cancelUrl = `${baseUrl}/confirm/${appointment.id}?action=cancel`;

      const content = generateReminderContent(
        appointment,
        item.timing,
        item.channel,
        confirmUrl,
        rescheduleUrl,
        cancelUrl,
      );

      due.push({
        id: `rem-${appointment.id}-${item.timing}-${item.channel}`,
        appointmentId: appointment.id,
        clientId: appointment.clientId,
        clientName: appointment.clientName,
        clientEmail: appointment.clientEmail,
        clientPhone: appointment.clientPhone,
        channel: item.channel,
        timing: item.timing,
        content,
        scheduledAt: item.sendAt,
        status: 'ready',
      });
    }
  }

  return due;
}
