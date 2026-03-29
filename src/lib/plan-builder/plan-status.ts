export const PLAN_STATUSES = [
  'Draft',
  'Ready to Send',
  'Sent',
  'Viewed',
  'Financing Clicked',
  'Booking Clicked',
  'Booked',
  'Accepted',
  'No Response',
  'Needs Follow-Up',
  'Lost',
  'Re-engaged',
] as const;

export type PlanStatus = typeof PLAN_STATUSES[number];

export interface StatusTransition {
  from: PlanStatus;
  to: PlanStatus;
  trigger: string;
  autoFollowUp?: {
    delayHours: number;
    action: 'email' | 'sms' | 'internal_alert';
    template: string;
  };
}

export const STATUS_TRANSITIONS: StatusTransition[] = [
  { from: 'Draft', to: 'Ready to Send', trigger: 'clinician_marks_ready' },
  { from: 'Ready to Send', to: 'Sent', trigger: 'email_sent' },
  { from: 'Sent', to: 'Viewed', trigger: 'client_opens_plan' },
  {
    from: 'Viewed',
    to: 'Financing Clicked',
    trigger: 'client_clicks_financing',
    autoFollowUp: { delayHours: 24, action: 'email', template: 'financing_followup' },
  },
  { from: 'Viewed', to: 'Booking Clicked', trigger: 'client_clicks_booking' },
  { from: 'Booking Clicked', to: 'Booked', trigger: 'booking_confirmed' },
  { from: 'Financing Clicked', to: 'Booked', trigger: 'financing_approved_and_booked' },
  { from: 'Booked', to: 'Accepted', trigger: 'appointment_completed' },
  {
    from: 'Sent',
    to: 'No Response',
    trigger: 'no_view_after_72h',
    autoFollowUp: { delayHours: 0, action: 'sms', template: 'plan_reminder_sms' },
  },
  {
    from: 'Viewed',
    to: 'Needs Follow-Up',
    trigger: 'no_action_after_48h',
    autoFollowUp: { delayHours: 0, action: 'email', template: 'confidence_builder' },
  },
  { from: 'No Response', to: 'Lost', trigger: 'no_response_after_14d' },
  { from: 'Needs Follow-Up', to: 'Lost', trigger: 'no_response_after_14d' },
  { from: 'Lost', to: 'Re-engaged', trigger: 'client_opens_plan_again' },
  { from: 'No Response', to: 'Re-engaged', trigger: 'client_opens_plan_again' },
];

/**
 * Given a current status and a trigger event, returns the next status
 * or null if no valid transition exists.
 */
export function getNextStatus(current: PlanStatus, trigger: string): PlanStatus | null {
  const transition = STATUS_TRANSITIONS.find(
    (t) => t.from === current && t.trigger === trigger
  );
  return transition?.to ?? null;
}

/**
 * Given a current status and trigger, returns the auto-follow-up config
 * if the matching transition has one, otherwise null.
 */
export function getAutoFollowUp(
  current: PlanStatus,
  trigger: string
): StatusTransition['autoFollowUp'] | null {
  const transition = STATUS_TRANSITIONS.find(
    (t) => t.from === current && t.trigger === trigger
  );
  return transition?.autoFollowUp ?? null;
}

/**
 * Returns a Tailwind color class string for the given plan status.
 */
export function getStatusColor(status: PlanStatus): string {
  const colorMap: Record<PlanStatus, string> = {
    Draft: 'text-gray-500 bg-gray-100',
    'Ready to Send': 'text-blue-700 bg-blue-100',
    Sent: 'text-indigo-700 bg-indigo-100',
    Viewed: 'text-amber-700 bg-amber-100',
    'Financing Clicked': 'text-orange-700 bg-orange-100',
    'Booking Clicked': 'text-orange-700 bg-orange-100',
    Booked: 'text-green-700 bg-green-100',
    Accepted: 'text-emerald-700 bg-emerald-100',
    'No Response': 'text-red-700 bg-red-100',
    'Needs Follow-Up': 'text-rose-700 bg-rose-100',
    Lost: 'text-gray-500 bg-gray-100',
    'Re-engaged': 'text-purple-700 bg-purple-100',
  };
  return colorMap[status] ?? 'text-gray-500 bg-gray-100';
}

/**
 * Returns a Lucide icon name string for the given plan status.
 */
export function getStatusIcon(status: PlanStatus): string {
  const iconMap: Record<PlanStatus, string> = {
    Draft: 'FileEdit',
    'Ready to Send': 'Send',
    Sent: 'Mail',
    Viewed: 'Eye',
    'Financing Clicked': 'CreditCard',
    'Booking Clicked': 'Calendar',
    Booked: 'CalendarCheck',
    Accepted: 'CheckCircle2',
    'No Response': 'Clock',
    'Needs Follow-Up': 'BellRing',
    Lost: 'XCircle',
    'Re-engaged': 'RefreshCw',
  };
  return iconMap[status] ?? 'Circle';
}
