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
  subject: 'Your Hormone Replacement Therapy Consultation - What to Prepare',
  preheader: 'How to get the most from your HRT consultation at Rani Beauty Clinic.',
  body: `
    ${heading('Preparing for Your HRT Consultation', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Your Hormone Replacement Therapy consultation is scheduled for <strong>{{appointment_date}}</strong> at <strong>{{appointment_time}}</strong> with {{provider_name}}. This comprehensive assessment will help us create a personalized hormone optimization plan.`)}

    ${heading('What to Bring', 2)}
    ${bulletList([
      'Complete list of <strong>all current medications and supplements</strong>',
      'Recent lab work (within 3 months) if available - especially hormone panels',
      'A brief symptom diary noting energy, mood, sleep, and any concerns',
      'Medical history, including any family history of hormone-related conditions',
      'List of questions or specific goals you would like to discuss',
    ])}

    ${heading('Pre-Visit Preparation', 2)}
    ${bulletList([
      'If we ordered labs, please complete them <strong>at least 5 days</strong> before your visit',
      'For morning lab draws, fast for <strong>8-12 hours</strong> beforehand',
      'Note any symptoms you are experiencing and their severity',
      'Consider what quality of life improvements matter most to you',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">What to Expect</strong><br>
      Your initial consultation takes approximately 60 minutes. Your provider will review your comprehensive health history, discuss lab results, explain treatment options, and develop a customized HRT protocol tailored to your body and goals.
    `, 'cream')}

    ${button('Confirm Your Appointment', '{{confirmation_url}}')}
    ${signoff('{{provider_name}}')}
  `,
});

const dayOfTemplate = buildTemplate({
  subject: 'Your HRT Consultation Is Today',
  preheader: 'Your personalized hormone optimization journey begins today.',
  body: `
    ${heading('Your Consultation Is Today', 1)}
    ${paragraph(`Good morning, {{first_name}}.`)}
    ${paragraph(`Your Hormone Replacement Therapy consultation is today at <strong>{{appointment_time}}</strong> with {{provider_name}}.`)}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Time:</strong> {{appointment_time}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Provider:</strong> {{provider_name}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Duration:</strong> 60 minutes</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Location:</strong> ${BRAND.address}</td></tr>
      </table>
    `, 'cream')}

    ${heading('Checklist', 3)}
    ${bulletList([
      'Medication and supplement list',
      'Recent lab results',
      'Symptom diary or notes',
      'Questions for your provider',
    ])}

    ${button('Get Directions', '{{directions_url}}', 'secondary')}
    ${signoff()}
  `,
});

const aftercareTemplate = buildTemplate({
  subject: 'Your HRT Journey - What Comes Next',
  preheader: 'Your personalized hormone therapy plan and what to expect going forward.',
  body: `
    ${heading('Your Hormone Therapy Journey', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Thank you for your thorough consultation today. We are honored to be part of your wellness journey. Here is a summary of your path forward.`)}

    ${divider('gold')}

    ${heading('Your Personalized Protocol', 2)}
    ${paragraph(`Your provider has designed a customized hormone optimization plan based on your lab results, symptoms, and goals. Please follow the prescribed protocol exactly as directed.`)}

    ${heading('What to Expect', 2)}
    ${bulletList([
      '<strong>Weeks 1-2:</strong> Your body begins adjusting to the new hormone levels',
      '<strong>Weeks 2-4:</strong> Many clients notice initial improvements in energy and mood',
      '<strong>Months 1-3:</strong> More significant changes in sleep, libido, body composition',
      '<strong>Month 3+:</strong> Full optimization as levels stabilize and are fine-tuned',
    ])}

    ${heading('Important Guidelines', 2)}
    ${bulletList([
      'Take medications <strong>exactly as prescribed</strong> - timing matters',
      'Do not adjust dosages without consulting your provider',
      'Keep a symptom journal to share at follow-up visits',
      'Complete all scheduled lab work on time',
      'Report any unusual symptoms promptly',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Follow-Up Schedule</strong><br>
      Your first follow-up with labs is in <strong>4-6 weeks</strong>. This allows us to assess your response and fine-tune your protocol. Regular monitoring is essential for safe, effective hormone optimization.
    `, 'cream')}

    ${button('Schedule Your Follow-Up Labs', '{{booking_url}}')}
    ${signoff('{{provider_name}}')}
  `,
});

export const hrt: ServiceEmailSet = {
  pretreatment: (vars?: TemplateVariables) => render(pretreatmentTemplate, vars),
  dayOf: (vars?: TemplateVariables) => render(dayOfTemplate, vars),
  aftercare: (vars?: TemplateVariables) => render(aftercareTemplate, vars),
};

export default hrt;
