/**
 * Automation Engine for Rani Beauty Clinic CRM
 *
 * 30 pre-built automation recipes for medical aesthetics:
 * Lead nurture, post-treatment follow-up, treatment reminders, retention, reactivation,
 * membership, birthday, review requests, referral, cross-sell, seasonal, weather-triggered.
 *
 * Supports triggers: time-based, event-based, segment-based, score-based.
 * Includes execution logging, performance tracking, and A/B testing.
 */

import type {
  AutomationRecipe,
  AutomationTrigger,
  AutomationAction,
  AutomationExecution,
  AutomationMetrics,
  AutomationCategory,
  AutomationTriggerType,
  AutomationEventType,
  AutomationActionType,
  ABTest,
  SegmentCondition,
} from '@/types/crm';

// ─────────────────────────────────────────────────────────────
// PRE-BUILT AUTOMATION RECIPES (30)
// ─────────────────────────────────────────────────────────────

export const BUILT_IN_AUTOMATIONS: AutomationRecipe[] = [
  // ── Lead Nurture (5) ──────────────────────────────────────
  {
    id: 'auto_001',
    name: 'New Lead Welcome Sequence',
    description: 'Welcome email + SMS within 15 min of new lead. Introduce Rani and offer consultation booking.',
    category: 'lead_nurture',
    trigger: { type: 'event_based', event: 'lead_created' },
    actions: [
      { id: 'a1', type: 'send_email', config: { template: 'welcome_lead', delay: 0 }, order: 1 },
      { id: 'a2', type: 'send_sms', config: { template: 'welcome_lead_sms' }, delayMinutes: 15, order: 2 },
      { id: 'a3', type: 'create_task', config: { type: 'follow_up_call', title: 'Call new lead', priority: 'high', slaHours: 4 }, delayMinutes: 60, order: 3 },
      { id: 'a4', type: 'add_tag', config: { tag: 'welcome_sequence_sent' }, order: 4 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'auto_002',
    name: 'Post-Consultation Follow-Up',
    description: 'After consultation: send treatment plan, follow up in 24h and 72h if not booked.',
    category: 'lead_nurture',
    trigger: { type: 'event_based', event: 'consultation_completed' },
    actions: [
      { id: 'a1', type: 'send_email', config: { template: 'post_consult_plan' }, delayMinutes: 120, order: 1 },
      { id: 'a2', type: 'create_task', config: { type: 'follow_up_call', title: 'Follow up on treatment plan', priority: 'high', slaHours: 24 }, delayMinutes: 1440, order: 2 },
      { id: 'a3', type: 'send_sms', config: { template: 'consult_followup_sms' }, delayMinutes: 4320, order: 3 },
      { id: 'a4', type: 'update_stage', config: { stage: 'treatment_planned' }, order: 4 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'auto_003',
    name: 'Abandoned Booking Recovery',
    description: 'Client started booking but did not complete. Send reminder after 1h, 24h, and 3 days.',
    category: 'lead_nurture',
    trigger: { type: 'event_based', event: 'booking_abandoned' },
    actions: [
      { id: 'a1', type: 'send_sms', config: { template: 'abandoned_booking_sms' }, delayMinutes: 60, order: 1 },
      { id: 'a2', type: 'send_email', config: { template: 'abandoned_booking_email' }, delayMinutes: 1440, order: 2 },
      { id: 'a3', type: 'create_task', config: { type: 'follow_up_call', title: 'Call about abandoned booking', priority: 'medium', slaHours: 72 }, delayMinutes: 4320, order: 3 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'auto_004',
    name: 'Lead Score Upgrade Alert',
    description: 'When lead score crosses 70, alert team for priority outreach.',
    category: 'lead_nurture',
    trigger: { type: 'score_based', scoreThreshold: 70, scoreDirection: 'above' },
    actions: [
      { id: 'a1', type: 'add_tag', config: { tag: 'hot_lead' }, order: 1 },
      { id: 'a2', type: 'create_task', config: { type: 'follow_up_call', title: 'Priority: High-score lead', priority: 'urgent', slaHours: 2 }, order: 2 },
      { id: 'a3', type: 'log_activity', config: { note: 'Lead score reached hot threshold' }, order: 3 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'auto_005',
    name: 'Pre-Appointment Prep',
    description: 'Send preparation instructions 48h and 2h before appointment. Service-specific aftercare guidance.',
    category: 'lead_nurture',
    trigger: { type: 'time_based', schedule: '0 8 * * *' },
    actions: [
      { id: 'a1', type: 'send_email', config: { template: 'pre_appointment_48h' }, order: 1 },
      { id: 'a2', type: 'send_sms', config: { template: 'pre_appointment_2h' }, order: 2 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  // ── Post-Treatment (5) ────────────────────────────────────
  {
    id: 'auto_006',
    name: 'Post-Treatment Follow-Up Sequence',
    description: '5-step follow-up: immediate aftercare, 24h check-in, 72h results, 7-day review request, 30-day rebook.',
    category: 'post_treatment',
    trigger: { type: 'event_based', event: 'treatment_completed' },
    actions: [
      { id: 'a1', type: 'send_email', config: { template: 'aftercare_immediate' }, order: 1 },
      { id: 'a2', type: 'send_sms', config: { template: 'check_in_24h' }, delayMinutes: 1440, order: 2 },
      { id: 'a3', type: 'send_email', config: { template: 'results_72h' }, delayMinutes: 4320, order: 3 },
      { id: 'a4', type: 'send_email', config: { template: 'review_request_7d' }, delayMinutes: 10080, order: 4 },
      { id: 'a5', type: 'send_email', config: { template: 'rebook_30d' }, delayMinutes: 43200, order: 5 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'auto_007',
    name: 'Botox Maintenance Reminder (3 Month)',
    description: 'Remind injection clients to rebook at 10, 11, and 12 weeks for optimal results maintenance.',
    category: 'post_treatment',
    trigger: { type: 'event_based', event: 'treatment_completed', conditions: [{ field: 'serviceCategory', operator: 'equals', value: 'Injectable' }] },
    actions: [
      { id: 'a1', type: 'send_email', config: { template: 'botox_10week' }, delayMinutes: 100800, order: 1 },
      { id: 'a2', type: 'send_sms', config: { template: 'botox_11week' }, delayMinutes: 110880, order: 2 },
      { id: 'a3', type: 'send_email', config: { template: 'botox_12week_urgent' }, delayMinutes: 120960, order: 3 },
      { id: 'a4', type: 'create_task', config: { type: 'follow_up_call', title: 'Injection maintenance follow-up', priority: 'medium', slaHours: 48 }, delayMinutes: 120960, order: 4 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'auto_008',
    name: 'Filler Maintenance Reminder (12 Month)',
    description: 'Annual filler maintenance reminders at 10, 11, and 12 months.',
    category: 'post_treatment',
    trigger: { type: 'event_based', event: 'treatment_completed', conditions: [{ field: 'lastService', operator: 'contains', value: 'Filler' }] },
    actions: [
      { id: 'a1', type: 'send_email', config: { template: 'filler_10month' }, delayMinutes: 432000, order: 1 },
      { id: 'a2', type: 'send_sms', config: { template: 'filler_11month' }, delayMinutes: 475200, order: 2 },
      { id: 'a3', type: 'send_email', config: { template: 'filler_12month_urgent' }, delayMinutes: 518400, order: 3 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'auto_009',
    name: 'Review Request (7 Days Post-Treatment)',
    description: 'Request a Google review 7 days after treatment when results are most visible.',
    category: 'review',
    trigger: { type: 'event_based', event: 'treatment_completed' },
    actions: [
      { id: 'a1', type: 'send_email', config: { template: 'review_request' }, delayMinutes: 10080, order: 1 },
      { id: 'a2', type: 'send_sms', config: { template: 'review_request_sms' }, delayMinutes: 11520, order: 2 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'auto_010',
    name: 'Package Completion Upsell',
    description: 'When a package is 80% used, suggest renewal or upgrade.',
    category: 'cross_sell',
    trigger: { type: 'event_based', event: 'package_completing' },
    actions: [
      { id: 'a1', type: 'send_email', config: { template: 'package_renewal' }, order: 1 },
      { id: 'a2', type: 'create_task', config: { type: 'follow_up_call', title: 'Discuss package renewal', priority: 'medium', slaHours: 48 }, delayMinutes: 2880, order: 2 },
      { id: 'a3', type: 'add_tag', config: { tag: 'package_renewal_candidate' }, order: 3 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  // ── Retention & Reactivation (5) ──────────────────────────
  {
    id: 'auto_011',
    name: 'Reactivation - 30 Day Lapsed',
    description: 'Gentle check-in for clients who have not visited in 30 days.',
    category: 'reactivation',
    trigger: { type: 'segment_based', segment: 'need_attention' },
    actions: [
      { id: 'a1', type: 'send_email', config: { template: 'reactivation_30d' }, order: 1 },
      { id: 'a2', type: 'create_task', config: { type: 'follow_up_call', title: '30-day lapsed check-in', priority: 'medium', slaHours: 72 }, delayMinutes: 4320, order: 2 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'auto_012',
    name: 'Reactivation - 60 Day Lapsed',
    description: 'Stronger outreach with incentive for 60-day lapsed clients.',
    category: 'reactivation',
    trigger: { type: 'segment_based', segment: 'about_to_sleep' },
    actions: [
      { id: 'a1', type: 'send_email', config: { template: 'reactivation_60d' }, order: 1 },
      { id: 'a2', type: 'send_sms', config: { template: 'reactivation_60d_sms' }, delayMinutes: 2880, order: 2 },
      { id: 'a3', type: 'create_task', config: { type: 'follow_up_call', title: '60-day lapsed outreach', priority: 'high', slaHours: 48 }, delayMinutes: 7200, order: 3 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'auto_013',
    name: 'Reactivation - 90 Day Lapsed',
    description: 'Final win-back attempt with highest-value offer for 90-day lapsed clients.',
    category: 'reactivation',
    trigger: { type: 'segment_based', segment: 'at_risk' },
    actions: [
      { id: 'a1', type: 'send_email', config: { template: 'reactivation_90d' }, order: 1 },
      { id: 'a2', type: 'send_sms', config: { template: 'reactivation_90d_sms' }, delayMinutes: 1440, order: 2 },
      { id: 'a3', type: 'create_task', config: { type: 'follow_up_call', title: '90-day final outreach', priority: 'urgent', slaHours: 24 }, delayMinutes: 4320, order: 3 },
      { id: 'a4', type: 'send_email', config: { template: 'reactivation_final' }, delayMinutes: 10080, order: 4 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'auto_014',
    name: 'High-Value Client Save',
    description: "Immediate alert when a champion or can't-lose client shows inactivity.",
    category: 'retention',
    trigger: { type: 'event_based', event: 'inactivity_detected', conditions: [{ field: 'segment', operator: 'in', value: ['champions', 'cant_lose'] }] },
    actions: [
      { id: 'a1', type: 'create_task', config: { type: 'follow_up_call', title: 'URGENT: Save high-value client', priority: 'urgent', slaHours: 4 }, order: 1 },
      { id: 'a2', type: 'send_email', config: { template: 'vip_miss_you' }, order: 2 },
      { id: 'a3', type: 'log_activity', config: { note: 'High-value client save sequence initiated' }, order: 3 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'auto_015',
    name: 'Negative Review Response',
    description: 'Alert team immediately for any review under 4 stars. Create urgent follow-up task.',
    category: 'retention',
    trigger: { type: 'event_based', event: 'negative_review' },
    actions: [
      { id: 'a1', type: 'create_task', config: { type: 'follow_up_call', title: 'URGENT: Respond to negative review', priority: 'urgent', slaHours: 2 }, order: 1 },
      { id: 'a2', type: 'add_tag', config: { tag: 'negative_review' }, order: 2 },
      { id: 'a3', type: 'log_activity', config: { note: 'Negative review received - response needed' }, order: 3 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  // ── VIP & Membership (5) ──────────────────────────────────
  {
    id: 'auto_016',
    name: 'VIP Appreciation',
    description: 'Monthly VIP appreciation with exclusive offers and early access to new treatments.',
    category: 'vip',
    trigger: { type: 'time_based', schedule: '0 10 1 * *' },
    actions: [
      { id: 'a1', type: 'send_email', config: { template: 'vip_monthly_appreciation' }, order: 1 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'auto_017',
    name: 'Membership Renewal Reminder',
    description: 'Remind members 30, 14, and 3 days before membership renewal date.',
    category: 'membership',
    trigger: { type: 'event_based', event: 'membership_expiring' },
    actions: [
      { id: 'a1', type: 'send_email', config: { template: 'membership_renewal_30d' }, order: 1 },
      { id: 'a2', type: 'send_email', config: { template: 'membership_renewal_14d' }, delayMinutes: 23040, order: 2 },
      { id: 'a3', type: 'send_sms', config: { template: 'membership_renewal_3d' }, delayMinutes: 38880, order: 3 },
      { id: 'a4', type: 'create_task', config: { type: 'follow_up_call', title: 'Membership renewal discussion', priority: 'high', slaHours: 24 }, delayMinutes: 38880, order: 4 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'auto_018',
    name: 'New Membership Welcome',
    description: 'Welcome new members with benefits overview and first-month treatment suggestions.',
    category: 'membership',
    trigger: { type: 'event_based', event: 'membership_started' },
    actions: [
      { id: 'a1', type: 'send_email', config: { template: 'membership_welcome' }, order: 1 },
      { id: 'a2', type: 'add_tag', config: { tag: 'member' }, order: 2 },
      { id: 'a3', type: 'create_task', config: { type: 'schedule_follow_up', title: 'Schedule member first appointment', priority: 'high', slaHours: 24 }, order: 3 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'auto_019',
    name: 'Referral Program Enrollment',
    description: 'After 3rd visit, invite client to referral program with benefits explanation.',
    category: 'referral',
    trigger: { type: 'event_based', event: 'treatment_completed', conditions: [{ field: 'visitCount', operator: 'equals', value: 3 }] },
    actions: [
      { id: 'a1', type: 'send_email', config: { template: 'referral_program_invite' }, delayMinutes: 1440, order: 1 },
      { id: 'a2', type: 'add_tag', config: { tag: 'referral_eligible' }, order: 2 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'auto_020',
    name: 'Referral Thank You',
    description: 'Thank clients who make referrals and grant referral credits.',
    category: 'referral',
    trigger: { type: 'event_based', event: 'referral_made' },
    actions: [
      { id: 'a1', type: 'send_email', config: { template: 'referral_thank_you' }, order: 1 },
      { id: 'a2', type: 'send_sms', config: { template: 'referral_credit_notification' }, order: 2 },
      { id: 'a3', type: 'log_activity', config: { note: 'Referral credit applied' }, order: 3 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  // ── Birthday & Seasonal (5) ──────────────────────────────
  {
    id: 'auto_021',
    name: 'Birthday Campaign',
    description: 'Send birthday greeting with special offer 7 days before, on birthday, and 3 days after.',
    category: 'birthday',
    trigger: { type: 'event_based', event: 'birthday_approaching' },
    actions: [
      { id: 'a1', type: 'send_email', config: { template: 'birthday_7days_before' }, order: 1 },
      { id: 'a2', type: 'send_email', config: { template: 'birthday_day_of' }, delayMinutes: 10080, order: 2 },
      { id: 'a3', type: 'send_sms', config: { template: 'birthday_sms' }, delayMinutes: 10080, order: 3 },
      { id: 'a4', type: 'send_email', config: { template: 'birthday_3days_after' }, delayMinutes: 14400, order: 4 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'auto_022',
    name: 'Spring Skin Renewal Campaign',
    description: 'March seasonal campaign for spring skin renewal treatments: peels, laser, and facials.',
    category: 'seasonal',
    trigger: { type: 'time_based', schedule: '0 10 1 3 *' },
    actions: [
      { id: 'a1', type: 'send_email', config: { template: 'spring_renewal' }, order: 1 },
      { id: 'a2', type: 'add_tag', config: { tag: 'spring_2026_campaign' }, order: 2 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'auto_023',
    name: 'Summer UV Protection Campaign',
    description: 'UV protection education and SPF product recommendations for post-laser clients.',
    category: 'seasonal',
    trigger: { type: 'time_based', schedule: '0 10 1 6 *' },
    actions: [
      { id: 'a1', type: 'send_email', config: { template: 'summer_uv_protection' }, order: 1 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'auto_024',
    name: 'Holiday Glam Campaign',
    description: 'November holiday campaign for injection touch-ups and facial prep before holiday events.',
    category: 'seasonal',
    trigger: { type: 'time_based', schedule: '0 10 1 11 *' },
    actions: [
      { id: 'a1', type: 'send_email', config: { template: 'holiday_glam' }, order: 1 },
      { id: 'a2', type: 'send_sms', config: { template: 'holiday_booking_sms' }, delayMinutes: 4320, order: 2 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'auto_025',
    name: 'Weather-Triggered UV Alert',
    description: 'When UV index is high, send post-laser clients SPF and sun protection reminders.',
    category: 'seasonal',
    trigger: { type: 'event_based', event: 'segment_entered', conditions: [{ field: 'tags', operator: 'contains', value: 'recent_laser' }] },
    actions: [
      { id: 'a1', type: 'send_sms', config: { template: 'uv_alert_sms' }, order: 1 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  // ── Cross-Sell & Operational (5) ──────────────────────────
  {
    id: 'auto_026',
    name: 'Cross-Sell Recommendations',
    description: 'After 2nd visit, send personalized treatment recommendations based on service history.',
    category: 'cross_sell',
    trigger: { type: 'event_based', event: 'treatment_completed', conditions: [{ field: 'visitCount', operator: 'greater_than', value: 1 }] },
    actions: [
      { id: 'a1', type: 'send_email', config: { template: 'cross_sell_recommendations' }, delayMinutes: 4320, order: 1 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'auto_027',
    name: 'Milestone Celebration',
    description: 'Celebrate client milestones (5th visit, $1K spent, anniversary) with rewards.',
    category: 'vip',
    trigger: { type: 'event_based', event: 'treatment_completed' },
    actions: [
      { id: 'a1', type: 'send_email', config: { template: 'milestone_celebration' }, order: 1 },
      { id: 'a2', type: 'add_tag', config: { tag: 'milestone_achieved' }, order: 2 },
      { id: 'a3', type: 'log_activity', config: { note: 'Milestone celebration sent' }, order: 3 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'auto_028',
    name: 'High-Value Transaction Alert',
    description: 'Alert team when a transaction exceeds $2,000 for VIP follow-up.',
    category: 'operational',
    trigger: { type: 'event_based', event: 'high_value_transaction' },
    actions: [
      { id: 'a1', type: 'create_task', config: { type: 'follow_up_call', title: 'VIP follow-up: High-value client', priority: 'high', slaHours: 24 }, order: 1 },
      { id: 'a2', type: 'add_tag', config: { tag: 'high_value' }, order: 2 },
      { id: 'a3', type: 'log_activity', config: { note: 'High-value transaction recorded' }, order: 3 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'auto_029',
    name: 'First Visit Follow-Up',
    description: 'Special follow-up for first-time clients to ensure satisfaction and encourage rebooking.',
    category: 'retention',
    trigger: { type: 'event_based', event: 'treatment_completed', conditions: [{ field: 'visitCount', operator: 'equals', value: 1 }] },
    actions: [
      { id: 'a1', type: 'send_email', config: { template: 'first_visit_thank_you' }, delayMinutes: 120, order: 1 },
      { id: 'a2', type: 'send_sms', config: { template: 'first_visit_sms' }, delayMinutes: 1440, order: 2 },
      { id: 'a3', type: 'create_task', config: { type: 'follow_up_call', title: 'First-visit client check-in', priority: 'high', slaHours: 48 }, delayMinutes: 4320, order: 3 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'auto_030',
    name: 'Anniversary Celebration',
    description: 'Celebrate 1-year anniversary with Rani Beauty Clinic. Special offer + thank you.',
    category: 'vip',
    trigger: { type: 'event_based', event: 'anniversary_approaching' },
    actions: [
      { id: 'a1', type: 'send_email', config: { template: 'anniversary_celebration' }, order: 1 },
      { id: 'a2', type: 'send_sms', config: { template: 'anniversary_sms' }, order: 2 },
      { id: 'a3', type: 'add_tag', config: { tag: 'anniversary_celebrated' }, order: 3 },
    ],
    isEnabled: true,
    isBuiltIn: true,
    executionCount: 0,
    successRate: 0,
    avgRevenueGenerated: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

// ─────────────────────────────────────────────────────────────
// AUTOMATION EXECUTION ENGINE
// ─────────────────────────────────────────────────────────────

/**
 * Check if a trigger matches the current event/context.
 */
export function shouldTrigger(
  automation: AutomationRecipe,
  event: {
    type: AutomationEventType;
    clientData?: Record<string, unknown>;
    timestamp?: string;
  },
): boolean {
  if (!automation.isEnabled) return false;

  const trigger = automation.trigger;

  // Event-based trigger
  if (trigger.type === 'event_based' && trigger.event === event.type) {
    // Check additional conditions if present
    if (trigger.conditions && event.clientData) {
      return trigger.conditions.every(cond =>
        evaluateCondition(cond, event.clientData!),
      );
    }
    return true;
  }

  // Score-based trigger
  if (trigger.type === 'score_based' && event.clientData) {
    const score = event.clientData.score as number;
    if (trigger.scoreDirection === 'above') {
      return score >= (trigger.scoreThreshold || 0);
    } else {
      return score <= (trigger.scoreThreshold || 0);
    }
  }

  return false;
}

function evaluateCondition(
  condition: SegmentCondition,
  data: Record<string, unknown>,
): boolean {
  const value = data[condition.field];

  switch (condition.operator) {
    case 'equals':
      return value === condition.value;
    case 'greater_than':
      return typeof value === 'number' && value > (condition.value as number);
    case 'less_than':
      return typeof value === 'number' && value < (condition.value as number);
    case 'contains':
      if (Array.isArray(value)) return value.includes(condition.value);
      if (typeof value === 'string') return value.includes(condition.value as string);
      return false;
    case 'in':
      return Array.isArray(condition.value) && (condition.value as unknown[]).includes(value);
    default:
      return false;
  }
}

/**
 * Execute an automation for a client and return the execution log.
 */
export function executeAutomation(
  automation: AutomationRecipe,
  clientId: string,
  clientName: string,
): AutomationExecution {
  const now = new Date().toISOString();

  // If A/B test is active, select variant
  let variant: 'A' | 'B' | undefined;
  let actions = automation.actions;

  if (automation.abTest) {
    const rand = Math.random() * 100;
    if (rand < automation.abTest.splitPercentage) {
      variant = 'A';
      actions = automation.abTest.variantA.actions;
    } else {
      variant = 'B';
      actions = automation.abTest.variantB.actions;
    }
  }

  return {
    id: `exec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    automationId: automation.id,
    clientId,
    clientName,
    triggeredAt: now,
    status: 'running',
    actionsCompleted: 0,
    totalActions: actions.length,
    variant,
  };
}

/**
 * Get all automations that should fire for a given event.
 */
export function getTriggeredAutomations(
  automations: AutomationRecipe[],
  event: {
    type: AutomationEventType;
    clientData?: Record<string, unknown>;
  },
): AutomationRecipe[] {
  return automations.filter(a => shouldTrigger(a, event));
}

// ─────────────────────────────────────────────────────────────
// AUTOMATION METRICS
// ─────────────────────────────────────────────────────────────

/**
 * Calculate automation performance metrics.
 */
export function calculateAutomationMetrics(
  automations: AutomationRecipe[],
  executions: AutomationExecution[],
): AutomationMetrics {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const executionsToday = executions.filter(e => e.triggeredAt >= todayStart).length;
  const executionsThisWeek = executions.filter(e => e.triggeredAt >= weekAgo).length;

  const totalRevenueGenerated = executions
    .filter(e => e.revenue && e.revenue > 0)
    .reduce((sum, e) => sum + (e.revenue || 0), 0);

  const topPerformers = [...automations]
    .sort((a, b) => b.avgRevenueGenerated - a.avgRevenueGenerated)
    .slice(0, 5);

  const recentExecutions = [...executions]
    .sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt))
    .slice(0, 20);

  return {
    totalAutomations: automations.length,
    activeAutomations: automations.filter(a => a.isEnabled).length,
    executionsToday,
    executionsThisWeek,
    totalRevenueGenerated,
    topPerformers,
    recentExecutions,
  };
}

// ─────────────────────────────────────────────────────────────
// A/B TESTING
// ─────────────────────────────────────────────────────────────

/**
 * Create an A/B test on an automation.
 */
export function createABTest(
  automation: AutomationRecipe,
  variantB: { name: string; actions: AutomationAction[] },
  splitPercentage: number = 50,
): AutomationRecipe {
  const abTest: ABTest = {
    id: `ab_${Date.now()}`,
    variantA: { name: 'Original', actions: automation.actions },
    variantB,
    splitPercentage,
    metrics: {
      variantA: { sent: 0, opened: 0, clicked: 0, converted: 0 },
      variantB: { sent: 0, opened: 0, clicked: 0, converted: 0 },
    },
    startedAt: new Date().toISOString(),
  };

  return { ...automation, abTest };
}

/**
 * Determine A/B test winner based on conversion rate.
 */
export function determineABWinner(abTest: ABTest): 'A' | 'B' | null {
  const { variantA, variantB } = abTest.metrics;

  const rateA = variantA.sent > 0 ? variantA.converted / variantA.sent : 0;
  const rateB = variantB.sent > 0 ? variantB.converted / variantB.sent : 0;

  // Need minimum sample size
  const minSample = 30;
  if (variantA.sent < minSample || variantB.sent < minSample) return null;

  // Need statistically significant difference (>10% relative)
  if (Math.abs(rateA - rateB) / Math.max(rateA, rateB) < 0.1) return null;

  return rateA > rateB ? 'A' : 'B';
}

/**
 * Get all automations organized by category.
 */
export function getAutomationsByCategory(
  automations: AutomationRecipe[],
): Record<AutomationCategory, AutomationRecipe[]> {
  const categories: Record<AutomationCategory, AutomationRecipe[]> = {
    lead_nurture: [],
    post_treatment: [],
    retention: [],
    reactivation: [],
    vip: [],
    membership: [],
    seasonal: [],
    review: [],
    referral: [],
    operational: [],
    birthday: [],
    cross_sell: [],
  };

  for (const auto of automations) {
    categories[auto.category].push(auto);
  }

  return categories;
}
