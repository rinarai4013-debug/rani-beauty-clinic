/**
 * Daily Operating Rhythm
 * Rani Beauty Clinic
 *
 * Weekly cadence for medical weight loss operations.
 * Each day has a theme and focus areas for consistent execution.
 */

import type { DailyRhythm, RhythmTask, DayOfWeek } from '../../lib/medical/types';

// ============================================================
// MONDAY: PIPELINE DAY
// ============================================================

export const MONDAY_RHYTHM: DailyRhythm = {
  day: 'monday',
  theme: 'Pipeline Day',
  focusAreas: [
    'Review all pipeline patients by stage',
    'Process new intakes from the weekend',
    'Move stalled patients forward',
    'Clear escalation queue',
  ],
  tasks: [
    {
      id: 'mon-1',
      title: 'Pipeline Snapshot Review',
      description: 'Generate and review the current pipeline snapshot. Check patient counts by stage, overdue patients, and MRR.',
      priority: 'high',
      estimatedMinutes: 15,
      automated: true,
      toolsUsed: ['Pipeline Engine', 'Airtable', 'Dashboard'],
    },
    {
      id: 'mon-2',
      title: 'Process Weekend Intakes',
      description: 'Review and process any intake forms that came in over the weekend. Run contraindication checks, send welcome messages.',
      priority: 'high',
      estimatedMinutes: 30,
      automated: false,
      toolsUsed: ['Intake Processor', 'Airtable', 'Mangomint'],
    },
    {
      id: 'mon-3',
      title: 'Clear Overdue Patients',
      description: 'Review all overdue patients. Send nudges or escalations. Make personal calls for critical cases.',
      priority: 'high',
      estimatedMinutes: 20,
      automated: false,
      toolsUsed: ['Pipeline Engine', 'Voice Engine', 'Phone'],
    },
    {
      id: 'mon-4',
      title: 'Lab Follow-Ups',
      description: 'Follow up with patients in LABS_NEEDED stage. Check for received results. Send reminders.',
      priority: 'medium',
      estimatedMinutes: 15,
      automated: true,
      toolsUsed: ['Compliance Engine', 'Voice Engine'],
    },
    {
      id: 'mon-5',
      title: 'GFE Queue Check',
      description: 'Review pending GFEs in Qualiphy. Send reminders for incomplete exams.',
      priority: 'medium',
      estimatedMinutes: 10,
      automated: true,
      toolsUsed: ['Qualiphy Integration', 'Voice Engine'],
    },
  ],
  isAutoPilot: false,
};

// ============================================================
// TUESDAY: FOLLOW-UP DAY
// ============================================================

export const TUESDAY_RHYTHM: DailyRhythm = {
  day: 'tuesday',
  theme: 'Follow-Up Day',
  focusAreas: [
    'Patient check-ins (weekly and monthly)',
    'Dose titration reviews',
    'Side effect assessments',
    'MD review queue',
  ],
  tasks: [
    {
      id: 'tue-1',
      title: 'Weekly Check-Ins',
      description: 'Send weekly check-in texts to patients in their first month. Review responses from last week.',
      priority: 'high',
      estimatedMinutes: 20,
      automated: true,
      toolsUsed: ['Voice Engine', 'Dose Tracker'],
    },
    {
      id: 'tue-2',
      title: 'Monthly Reviews',
      description: 'Process monthly check-ins for active patients. Review weight progress, side effects, satisfaction.',
      priority: 'high',
      estimatedMinutes: 30,
      automated: false,
      toolsUsed: ['Dose Tracker', 'Airtable'],
    },
    {
      id: 'tue-3',
      title: 'Titration Reviews',
      description: 'Review patients eligible for dose titration. Prepare titration requests for provider approval.',
      priority: 'medium',
      estimatedMinutes: 20,
      automated: true,
      toolsUsed: ['Dose Tracker', 'Mangomint'],
    },
    {
      id: 'tue-4',
      title: 'Side Effect Follow-Ups',
      description: 'Follow up with patients who reported side effects. Check for resolution. Adjust treatment if needed.',
      priority: 'high',
      estimatedMinutes: 15,
      automated: false,
      toolsUsed: ['Dose Tracker', 'Compliance Engine'],
    },
    {
      id: 'tue-5',
      title: 'MD Review Queue',
      description: 'Check pending MD reviews for soft-flagged patients. Follow up with provider if reviews are pending.',
      priority: 'medium',
      estimatedMinutes: 10,
      automated: false,
      toolsUsed: ['Qualiphy Integration', 'Compliance Engine'],
    },
  ],
  isAutoPilot: false,
};

// ============================================================
// WEDNESDAY: CONTENT DAY
// ============================================================

export const WEDNESDAY_RHYTHM: DailyRhythm = {
  day: 'wednesday',
  theme: 'Content Day',
  focusAreas: [
    'Educational content creation',
    'Social media posts',
    'Patient education materials',
    'Review request outreach',
  ],
  tasks: [
    {
      id: 'wed-1',
      title: 'Create Educational Content',
      description: 'Write 2-3 educational posts about GLP-1 treatment, weight loss tips, nutrition, or wellness. Use compliant language.',
      priority: 'high',
      estimatedMinutes: 45,
      automated: false,
      toolsUsed: ['Compliance Engine (ad compliance)', 'Voice Engine'],
    },
    {
      id: 'wed-2',
      title: 'Schedule Social Media',
      description: 'Schedule content for the week across Instagram, Facebook, and Google Business Profile.',
      priority: 'medium',
      estimatedMinutes: 20,
      automated: false,
      toolsUsed: ['Social tools'],
    },
    {
      id: 'wed-3',
      title: 'Google Review Requests',
      description: 'Send review requests to satisfied patients (satisfaction 8+, active 30+ days).',
      priority: 'medium',
      estimatedMinutes: 10,
      automated: true,
      toolsUsed: ['Voice Engine', 'Mangomint'],
    },
    {
      id: 'wed-4',
      title: 'Ad Compliance Check',
      description: 'Review any running ads for compliance. Check for banned phrases, missing disclaimers.',
      priority: 'low',
      estimatedMinutes: 10,
      automated: true,
      toolsUsed: ['Compliance Engine'],
    },
  ],
  isAutoPilot: false,
};

// ============================================================
// THURSDAY: REVENUE DAY
// ============================================================

export const THURSDAY_RHYTHM: DailyRhythm = {
  day: 'thursday',
  theme: 'Revenue Day',
  focusAreas: [
    'Refill processing',
    'Cross-sell execution',
    'Revenue at risk review',
    'Payment failure resolution',
  ],
  tasks: [
    {
      id: 'thu-1',
      title: 'Process Refills',
      description: 'Review 7-day refill lookahead. Send reminders. Process confirmed refills. Place pharmacy orders.',
      priority: 'high',
      estimatedMinutes: 30,
      automated: true,
      toolsUsed: ['Refill Engine', 'Airtable', 'Pharmacy'],
    },
    {
      id: 'thu-2',
      title: 'Cross-Sell Outreach',
      description: 'Review cross-sell ready patients. Send personalized recommendations. Track responses.',
      priority: 'medium',
      estimatedMinutes: 20,
      automated: false,
      toolsUsed: ['Cross-Sell Matrix', 'Voice Engine'],
    },
    {
      id: 'thu-3',
      title: 'Revenue at Risk Review',
      description: 'Review overdue refills and churn risk patients. Initiate churn-save outreach for high-risk patients.',
      priority: 'high',
      estimatedMinutes: 15,
      automated: true,
      toolsUsed: ['Refill Engine', 'Pipeline Engine'],
    },
    {
      id: 'thu-4',
      title: 'Payment Failure Resolution',
      description: 'Follow up on failed payments. Process retries. Make personal calls for repeat failures.',
      priority: 'high',
      estimatedMinutes: 15,
      automated: false,
      toolsUsed: ['Refill Engine', 'Square/Stripe'],
    },
    {
      id: 'thu-5',
      title: 'Upgrade Opportunities',
      description: 'Identify monthly patients eligible for VIP Transform upgrade. Send personalized upgrade offers.',
      priority: 'low',
      estimatedMinutes: 10,
      automated: true,
      toolsUsed: ['Cross-Sell Matrix', 'Mangomint'],
    },
  ],
  isAutoPilot: false,
};

// ============================================================
// FRIDAY: REPORT DAY
// ============================================================

export const FRIDAY_RHYTHM: DailyRhythm = {
  day: 'friday',
  theme: 'Report Day',
  focusAreas: [
    'Weekly KPI review',
    'Pipeline report generation',
    'Revenue report',
    'Plan next week',
  ],
  tasks: [
    {
      id: 'fri-1',
      title: 'Generate Weekly Pipeline Report',
      description: 'Generate full pipeline report: stage counts, conversions, drop-offs, velocity metrics.',
      priority: 'high',
      estimatedMinutes: 10,
      automated: true,
      toolsUsed: ['Pipeline Engine', 'Dashboard'],
    },
    {
      id: 'fri-2',
      title: 'KPI Dashboard Review',
      description: 'Review all KPIs against targets: MRR, conversion rate, churn, CPA, cross-sell rate.',
      priority: 'high',
      estimatedMinutes: 15,
      automated: true,
      toolsUsed: ['KPI Targets', 'Airtable', 'Dashboard'],
    },
    {
      id: 'fri-3',
      title: 'Revenue Summary',
      description: 'Calculate weekly revenue: new MRR added, refills processed, cross-sells closed, revenue at risk.',
      priority: 'high',
      estimatedMinutes: 10,
      automated: true,
      toolsUsed: ['Refill Engine', 'Cross-Sell Matrix', 'Pipeline Engine'],
    },
    {
      id: 'fri-4',
      title: 'Quarterly Lab Schedule Check',
      description: 'Review patients with quarterly labs due in the next 2 weeks. Send reminders.',
      priority: 'medium',
      estimatedMinutes: 10,
      automated: true,
      toolsUsed: ['Dose Tracker', 'Compliance Engine'],
    },
    {
      id: 'fri-5',
      title: 'Plan Next Week',
      description: 'Review upcoming week: expected intakes, titrations, refills, and any special items.',
      priority: 'medium',
      estimatedMinutes: 15,
      automated: false,
      toolsUsed: ['All systems'],
    },
  ],
  isAutoPilot: false,
};

// ============================================================
// WEEKEND: AUTO-PILOT
// ============================================================

export const SATURDAY_RHYTHM: DailyRhythm = {
  day: 'saturday',
  theme: 'Auto-Pilot',
  focusAreas: [
    'Automated systems handle routine tasks',
    'Emergency protocols active',
    'No proactive outreach',
  ],
  tasks: [
    {
      id: 'sat-1',
      title: 'Automated Reminders',
      description: 'Automated refill and lab reminders continue to send as scheduled.',
      priority: 'low',
      estimatedMinutes: 0,
      automated: true,
      toolsUsed: ['Voice Engine', 'Refill Engine'],
    },
    {
      id: 'sat-2',
      title: 'Emergency Monitoring',
      description: 'Emergency protocols remain active. Severe side effect reports trigger immediate response.',
      priority: 'high',
      estimatedMinutes: 0,
      automated: true,
      toolsUsed: ['Compliance Engine'],
    },
  ],
  isAutoPilot: true,
};

export const SUNDAY_RHYTHM: DailyRhythm = {
  day: 'sunday',
  theme: 'Auto-Pilot',
  focusAreas: [
    'Automated systems handle routine tasks',
    'Emergency protocols active',
    'Intake forms queue for Monday processing',
  ],
  tasks: [
    {
      id: 'sun-1',
      title: 'Automated Reminders',
      description: 'Automated reminders continue.',
      priority: 'low',
      estimatedMinutes: 0,
      automated: true,
      toolsUsed: ['Voice Engine', 'Refill Engine'],
    },
    {
      id: 'sun-2',
      title: 'Emergency Monitoring',
      description: 'Emergency protocols remain active.',
      priority: 'high',
      estimatedMinutes: 0,
      automated: true,
      toolsUsed: ['Compliance Engine'],
    },
    {
      id: 'sun-3',
      title: 'Queue Weekend Intakes',
      description: 'Any intake forms received queue up for Monday morning processing.',
      priority: 'low',
      estimatedMinutes: 0,
      automated: true,
      toolsUsed: ['Intake Processor'],
    },
  ],
  isAutoPilot: true,
};

// ============================================================
// ALL RHYTHMS
// ============================================================

/** Complete weekly rhythm */
export const WEEKLY_RHYTHM: DailyRhythm[] = [
  MONDAY_RHYTHM,
  TUESDAY_RHYTHM,
  WEDNESDAY_RHYTHM,
  THURSDAY_RHYTHM,
  FRIDAY_RHYTHM,
  SATURDAY_RHYTHM,
  SUNDAY_RHYTHM,
];

/** Rhythm by day of week */
export const RHYTHM_BY_DAY: Record<DayOfWeek, DailyRhythm> = {
  monday: MONDAY_RHYTHM,
  tuesday: TUESDAY_RHYTHM,
  wednesday: WEDNESDAY_RHYTHM,
  thursday: THURSDAY_RHYTHM,
  friday: FRIDAY_RHYTHM,
  saturday: SATURDAY_RHYTHM,
  sunday: SUNDAY_RHYTHM,
};

// ============================================================
// HELPERS
// ============================================================

/**
 * Gets today's rhythm based on the current day.
 */
export function getTodayRhythm(date?: Date): DailyRhythm {
  const now = date ?? new Date();
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const day = days[now.getDay()];
  return RHYTHM_BY_DAY[day];
}

/**
 * Returns estimated total minutes for a day's tasks.
 */
export function getDayTotalMinutes(day: DayOfWeek): number {
  const rhythm = RHYTHM_BY_DAY[day];
  return rhythm.tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
}

/**
 * Returns the weekly task count and time estimate.
 */
export function getWeeklySummary(): {
  totalTasks: number;
  totalMinutes: number;
  automatedTasks: number;
  manualTasks: number;
} {
  let totalTasks = 0;
  let totalMinutes = 0;
  let automatedTasks = 0;
  let manualTasks = 0;

  for (const rhythm of WEEKLY_RHYTHM) {
    for (const task of rhythm.tasks) {
      totalTasks++;
      totalMinutes += task.estimatedMinutes;
      if (task.automated) automatedTasks++;
      else manualTasks++;
    }
  }

  return { totalTasks, totalMinutes, automatedTasks, manualTasks };
}

/**
 * Formats the weekly rhythm as a readable schedule.
 */
export function formatWeeklySchedule(): string {
  const lines = ['Weekly Operating Rhythm', '='.repeat(50), ''];

  for (const rhythm of WEEKLY_RHYTHM) {
    const totalMin = rhythm.tasks.reduce((s, t) => s + t.estimatedMinutes, 0);
    lines.push(`${rhythm.day.toUpperCase()}: ${rhythm.theme} (${totalMin} min)`);
    for (const task of rhythm.tasks) {
      const icon = task.automated ? '[Auto]' : '[Manual]';
      lines.push(`  ${icon} ${task.title} (${task.estimatedMinutes} min)`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
