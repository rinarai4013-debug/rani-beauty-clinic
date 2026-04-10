import { describe, expect, it } from 'vitest';

import {
  PLAN_STATUSES,
  STATUS_TRANSITIONS,
  getNextStatus,
  getAutoFollowUp,
  getStatusColor,
  getStatusIcon,
} from '@/lib/plan-builder/plan-status';

describe('plan-builder/plan-status', () => {
  it('defines the full ordered list of plan statuses', () => {
    expect(PLAN_STATUSES).toEqual([
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
    ]);
  });

  it('includes follow-up transitions for no-response and viewed-without-action states', () => {
    expect(STATUS_TRANSITIONS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: 'Sent',
          to: 'No Response',
          trigger: 'no_view_after_72h',
        }),
        expect.objectContaining({
          from: 'Viewed',
          to: 'Needs Follow-Up',
          trigger: 'no_action_after_48h',
        }),
      ])
    );
  });

  it('returns the next valid status for a known trigger', () => {
    expect(getNextStatus('Viewed', 'client_clicks_booking')).toBe('Booking Clicked');
  });

  it('returns null when no transition matches the trigger', () => {
    expect(getNextStatus('Accepted', 'email_sent')).toBeNull();
  });

  it('returns the configured auto follow-up when one exists', () => {
    expect(getAutoFollowUp('Viewed', 'client_clicks_financing')).toEqual({
      delayHours: 24,
      action: 'email',
      template: 'financing_followup',
    });
  });

  it('returns null when a transition has no auto follow-up', () => {
    expect(getAutoFollowUp('Booking Clicked', 'booking_confirmed')).toBeNull();
  });

  it('maps statuses to consistent badge colors', () => {
    expect(getStatusColor('Booked')).toBe('text-green-700 bg-green-100');
    expect(getStatusColor('Re-engaged')).toBe('text-purple-700 bg-purple-100');
  });

  it('maps statuses to the expected icon names', () => {
    expect(getStatusIcon('Draft')).toBe('FileEdit');
    expect(getStatusIcon('Needs Follow-Up')).toBe('BellRing');
  });
});
