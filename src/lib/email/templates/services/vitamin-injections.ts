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
  subject: 'Your Vitamin Injection Appointment - What to Know',
  preheader: 'Simple preparation for your wellness-boosting vitamin injection.',
  body: `
    ${heading('Preparing for Your Vitamin Injection', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Your Vitamin Injection is scheduled for <strong>{{appointment_date}}</strong> at <strong>{{appointment_time}}</strong> with {{provider_name}}. This targeted injection delivers essential nutrients directly into your system for maximum absorption and efficacy.`)}

    ${heading('Pre-Treatment Guidelines', 2)}
    ${bulletList([
      'Eat a light meal or snack <strong>1-2 hours</strong> before your appointment',
      'Stay well-hydrated - drink plenty of water leading up to your visit',
      'Wear a short-sleeved top or clothing with easy arm access',
      'Avoid alcohol for <strong>24 hours</strong> prior',
      'Inform your provider of any allergies or supplements you are taking',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Your Injection: {{injection_type}}</strong><br>
      This quick, 5-10 minute treatment delivers {{injection_benefits}}. Many clients feel an energy boost within hours. The injection is administered intramuscularly for optimal absorption.
    `, 'cream')}

    ${button('Confirm Your Appointment', '{{confirmation_url}}')}
    ${signoff('{{provider_name}}')}
  `,
});

const dayOfTemplate = buildTemplate({
  subject: 'Your Vitamin Injection Is Today',
  preheader: 'A quick wellness boost awaits you at Rani Beauty Clinic.',
  body: `
    ${heading('Your Vitamin Boost Awaits', 1)}
    ${paragraph(`Good morning, {{first_name}}.`)}
    ${paragraph(`Your Vitamin Injection is today at <strong>{{appointment_time}}</strong>. This will be quick - in and out in under 15 minutes.`)}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Time:</strong> {{appointment_time}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Provider:</strong> {{provider_name}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Injection:</strong> {{injection_type}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Location:</strong> ${BRAND.address}</td></tr>
      </table>
    `, 'cream')}

    ${heading('Reminders', 3)}
    ${bulletList([
      'Have you eaten a light meal today?',
      'Stay hydrated before and after',
      'Wear a short-sleeved or loose-fitting top',
    ])}

    ${button('Get Directions', '{{directions_url}}', 'secondary')}
    ${signoff()}
  `,
});

const aftercareTemplate = buildTemplate({
  subject: 'After Your Vitamin Injection - Quick Care Tips',
  preheader: 'Simple aftercare steps to maximize your vitamin injection benefits.',
  body: `
    ${heading('Your Vitamin Injection Aftercare', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Your vitamin injection is already at work, nourishing your body from within. Here is how to get the most from your treatment.`)}

    ${divider('gold')}

    ${heading('Immediate Care', 2)}
    ${bulletList([
      'Keep the bandage on for <strong>15-30 minutes</strong>',
      'Apply gentle pressure if there is any bleeding',
      'Mild soreness at the injection site is normal and resolves within 24 hours',
      'Stay hydrated - aim for at least 8 glasses of water today',
    ])}

    ${heading('Next 24-48 Hours', 2)}
    ${bulletList([
      'Avoid strenuous arm exercises for <strong>24 hours</strong>',
      'A warm compress can ease any injection site soreness',
      'You may notice increased energy, improved mood, or better sleep',
      'Continue your regular diet - nutrient-rich foods enhance results',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Maximize Your Results</strong><br>
      For sustained benefits, we recommend a regular vitamin injection schedule. Most clients see the best results with <strong>weekly or bi-weekly</strong> injections. Your provider can create a personalized wellness protocol.
    `, 'cream')}

    ${button('Book Your Next Injection', '{{booking_url}}')}
    ${signoff('{{provider_name}}')}
  `,
});

export const vitaminInjections: ServiceEmailSet = {
  pretreatment: (vars?: TemplateVariables) => render(pretreatmentTemplate, vars),
  dayOf: (vars?: TemplateVariables) => render(dayOfTemplate, vars),
  aftercare: (vars?: TemplateVariables) => render(aftercareTemplate, vars),
};

export default vitaminInjections;
