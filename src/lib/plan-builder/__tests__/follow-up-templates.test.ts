import { describe, expect, it } from 'vitest';

import {
  FOLLOW_UP_TEMPLATES,
  renderTemplate,
} from '@/lib/plan-builder/follow-up-templates';

describe('plan-builder/follow-up-templates', () => {
  it('includes core reminder and confidence templates', () => {
    expect(Object.keys(FOLLOW_UP_TEMPLATES)).toEqual(
      expect.arrayContaining(['plan_reminder_sms', 'confidence_builder'])
    );
  });

  it('renders SMS templates by substituting provided placeholders', () => {
    expect(
      renderTemplate('plan_reminder_sms', {
        clientName: 'Rina',
        planUrl: 'https://plans.rani/rina',
        clinicPhone: '(425) 539-4440',
      })
    ).toEqual({
      subject: undefined,
      body: 'Hi Rina! Your personalized treatment plan from Rani Beauty Clinic is ready for you. Take a look: https://plans.rani/rina Questions? Call us at (425) 539-4440',
    });
  });

  it('renders email templates by substituting placeholders in subject and body', () => {
    const rendered = renderTemplate('confidence_builder', {
      clientName: 'Mom',
      planUrl: 'https://plans.rani/mom',
      clinicPhone: '(425) 539-4440',
    });

    expect(rendered?.subject).toBe("Mom, we're here to answer any questions");
    expect(rendered?.body).toContain('Hi Mom,');
    expect(rendered?.body).toContain('https://plans.rani/mom');
    expect(rendered?.body).toContain('(425) 539-4440');
  });

  it('returns null for unknown template ids', () => {
    expect(renderTemplate('not-real', { clientName: 'Rina' })).toBeNull();
  });

  it('leaves unresolved placeholders intact when variables are missing', () => {
    const rendered = renderTemplate('plan_reminder_sms', {
      clientName: 'Rina',
    });

    expect(rendered?.body).toContain('{{planUrl}}');
    expect(rendered?.body).toContain('{{clinicPhone}}');
  });

  it('never uses infusion wording anywhere in the template catalog', () => {
    expect(JSON.stringify(FOLLOW_UP_TEMPLATES).toLowerCase()).not.toContain('infusion');
  });
});
