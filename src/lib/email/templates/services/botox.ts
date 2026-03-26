import {
  buildTemplate,
  heading,
  paragraph,
  button,
  bulletList,
  calloutBox,
  divider,
  signoff,
  BRAND,
  type ServiceEmailSet,
  type TemplateVariables,
  render,
} from '../../engine';

const pretreatmentTemplate = buildTemplate({
  subject: 'Your Botox Appointment - What to Know Before Your Visit',
  preheader: 'A few simple steps to ensure the best results from your treatment.',
  body: `
    ${heading('Preparing for Your Botox Treatment', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`We're looking forward to seeing you on <strong>{{appointment_date}}</strong> at <strong>{{appointment_time}}</strong> for your Botox treatment with {{provider_name}}.`)}
    ${paragraph(`To ensure optimal results and a comfortable experience, please review the following preparation guidelines.`)}

    ${heading('Pre-Treatment Guidelines', 2)}
    ${bulletList([
      'Avoid blood-thinning medications (aspirin, ibuprofen, fish oil) for <strong>7 days</strong> prior',
      'Refrain from alcohol consumption for <strong>24 hours</strong> before your appointment',
      'Discontinue retinoids and exfoliating acids <strong>3 days</strong> prior',
      'Arrive with a clean face, free of makeup and skincare products',
      'Eat a light meal before your visit to maintain comfort',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">What to Expect</strong><br>
      Your treatment will take approximately 15-30 minutes. Results begin to appear within 3-5 days, with full results visible at 14 days. Most clients describe the sensation as a brief, mild pinch.
    `, 'cream')}

    ${heading('Day-Of Reminders', 3)}
    ${bulletList([
      'Please arrive 10 minutes early to complete any necessary paperwork',
      'Wear comfortable clothing with easy access to the treatment area',
      'Feel free to bring a list of questions for your provider',
    ])}

    ${button('Confirm Your Appointment', '{{confirmation_url}}')}

    ${calloutBox(`
      <strong>Need to reschedule?</strong> We understand that plans change. Please contact us at least 24 hours in advance at <a href="tel:${BRAND.phone}" style="color: ${BRAND.gold};">${BRAND.phone}</a> or reply to this email.
    `, 'gold')}

    ${signoff('{{provider_name}}')}
  `,
});

const dayOfTemplate = buildTemplate({
  subject: 'See You Today - Your Botox Appointment Details',
  preheader: 'Everything you need for your visit today at Rani Beauty Clinic.',
  body: `
    ${heading('We\'ll See You Today', 1)}
    ${paragraph(`Good morning, {{first_name}}.`)}
    ${paragraph(`This is a friendly reminder of your Botox appointment today at <strong>{{appointment_time}}</strong> with {{provider_name}}.`)}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;">
            <strong>Time:</strong> {{appointment_time}}
          </td>
        </tr>
        <tr>
          <td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;">
            <strong>Provider:</strong> {{provider_name}}
          </td>
        </tr>
        <tr>
          <td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;">
            <strong>Location:</strong> ${BRAND.address}
          </td>
        </tr>
        <tr>
          <td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;">
            <strong>Duration:</strong> Approximately 30 minutes
          </td>
        </tr>
      </table>
    `, 'cream')}

    ${heading('Quick Reminders', 3)}
    ${bulletList([
      'Arrive with a clean, makeup-free face',
      'Plan for 10 minutes of check-in time',
      'Bring a valid photo ID if this is your first visit',
    ])}

    ${button('Get Directions', '{{directions_url}}', 'secondary')}

    ${paragraph(`If you need to reach us, call <a href="tel:${BRAND.phone}" style="color: ${BRAND.gold};">${BRAND.phone}</a>. We can't wait to see you.`)}

    ${signoff()}
  `,
});

const aftercareTemplate = buildTemplate({
  subject: 'Your Botox Aftercare Guide - Maximize Your Results',
  preheader: 'Follow these steps to ensure beautiful, lasting results from your treatment.',
  body: `
    ${heading('Your Botox Aftercare Guide', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Thank you for visiting us today. Your Botox treatment is now working its magic. Here is everything you need to know to ensure the best possible results.`)}

    ${divider('gold')}

    ${heading('First 4 Hours', 2)}
    ${bulletList([
      'Remain <strong>upright</strong> - do not lie down for at least 4 hours',
      'Avoid touching, rubbing, or massaging the treated areas',
      'Do <strong>not</strong> apply makeup to the injection sites',
      'Gentle facial exercises (frowning, raising eyebrows) can help product absorption',
    ])}

    ${heading('First 24 Hours', 2)}
    ${bulletList([
      'Avoid strenuous exercise, hot tubs, saunas, and steam rooms',
      'Skip alcohol consumption for the remainder of the day',
      'Sleep on your back if possible',
      'Avoid facials, chemical peels, or other skin treatments',
    ])}

    ${heading('First 2 Weeks', 2)}
    ${bulletList([
      'Results begin appearing in <strong>3-5 days</strong>, with full effect at <strong>14 days</strong>',
      'Avoid excessive sun exposure and always wear SPF 30+',
      'Do not schedule dental procedures for 2 weeks',
      'Contact us if you notice any asymmetry after day 14',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Your Follow-Up</strong><br>
      We recommend a complimentary 2-week follow-up to assess your results and make any adjustments if needed. This appointment is included with your treatment.
    `, 'cream')}

    ${button('Schedule Your Follow-Up', '{{booking_url}}')}

    ${calloutBox(`
      <strong>When to Contact Us</strong><br>
      Mild bruising, swelling, and headache are normal. Please call us immediately if you experience difficulty swallowing, breathing, or speaking, or if you develop a rash or significant swelling.
    `, 'gold')}

    ${paragraph(`Your next recommended Botox session is in approximately <strong>3-4 months</strong>. We'll send you a reminder when it's time.`, false)}

    ${signoff('{{provider_name}}')}
  `,
});

export const botox: ServiceEmailSet = {
  pretreatment: (vars?: TemplateVariables) => render(pretreatmentTemplate, vars),
  dayOf: (vars?: TemplateVariables) => render(dayOfTemplate, vars),
  aftercare: (vars?: TemplateVariables) => render(aftercareTemplate, vars),
};

export default botox;
