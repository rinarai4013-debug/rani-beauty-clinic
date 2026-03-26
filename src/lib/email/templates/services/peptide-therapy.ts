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
  subject: 'Your Peptide Therapy Session - Preparation Guide',
  preheader: 'Everything you need to know before your peptide therapy appointment.',
  body: `
    ${heading('Preparing for Peptide Therapy', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Your Peptide Therapy session is scheduled for <strong>{{appointment_date}}</strong> at <strong>{{appointment_time}}</strong> with {{provider_name}}. Peptide therapy harnesses targeted bioactive molecules to support your body's natural regenerative processes.`)}

    ${heading('Pre-Treatment Guidelines', 2)}
    ${bulletList([
      'Fast for <strong>2 hours</strong> before your appointment (water is fine)',
      'Stay well-hydrated in the 24 hours leading up to your session',
      'Avoid alcohol for <strong>24 hours</strong> before treatment',
      'Bring a list of all current medications and supplements',
      'Wear comfortable clothing with easy access for injection',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Your Protocol: {{peptide_protocol}}</strong><br>
      This targeted peptide protocol is designed to support {{peptide_goals}}. Your provider will review your health history and adjust the protocol to your specific needs during your visit.
    `, 'cream')}

    ${button('Confirm Your Appointment', '{{confirmation_url}}')}
    ${signoff('{{provider_name}}')}
  `,
});

const dayOfTemplate = buildTemplate({
  subject: 'Your Peptide Therapy Is Today',
  preheader: 'Quick reminders for your peptide therapy session.',
  body: `
    ${heading('Your Session Is Today', 1)}
    ${paragraph(`Good morning, {{first_name}}.`)}
    ${paragraph(`Your Peptide Therapy appointment is today at <strong>{{appointment_time}}</strong> with {{provider_name}}.`)}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Time:</strong> {{appointment_time}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Provider:</strong> {{provider_name}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Protocol:</strong> {{peptide_protocol}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Location:</strong> ${BRAND.address}</td></tr>
      </table>
    `, 'cream')}

    ${heading('Reminders', 3)}
    ${bulletList([
      'Have you fasted for at least 2 hours? (water is fine)',
      'Bring your medication and supplement list',
      'Wear comfortable, loose-fitting clothing',
    ])}

    ${button('Get Directions', '{{directions_url}}', 'secondary')}
    ${signoff()}
  `,
});

const aftercareTemplate = buildTemplate({
  subject: 'Peptide Therapy Aftercare - Supporting Your Results',
  preheader: 'Post-treatment guidance to maximize your peptide therapy benefits.',
  body: `
    ${heading('Your Peptide Therapy Aftercare', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Your peptide therapy session is complete. Here is how to support your body's response and maximize your results.`)}

    ${divider('gold')}

    ${heading('First 24 Hours', 2)}
    ${bulletList([
      'Keep the injection site clean and dry',
      'Mild redness or soreness at the injection site is normal',
      'Stay well-hydrated - aim for <strong>8-10 glasses</strong> of water today',
      'Eat a balanced, protein-rich meal within a few hours of treatment',
      'Avoid alcohol for <strong>24 hours</strong>',
    ])}

    ${heading('Ongoing Support', 2)}
    ${bulletList([
      'Prioritize <strong>7-9 hours</strong> of quality sleep each night',
      'Maintain regular exercise - peptides work synergistically with activity',
      'Follow any at-home injection protocols provided by your provider',
      'Keep a journal noting energy levels, sleep quality, and overall wellness',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Results Timeline</strong><br>
      Peptide therapy is cumulative. Initial benefits may be felt within <strong>1-2 weeks</strong>, with more significant results developing over <strong>4-12 weeks</strong> of consistent treatment. Your protocol will be adjusted based on your response.
    `, 'cream')}

    ${button('Book Your Next Session', '{{booking_url}}')}
    ${signoff('{{provider_name}}')}
  `,
});

export const peptideTherapy: ServiceEmailSet = {
  pretreatment: (vars?: TemplateVariables) => render(pretreatmentTemplate, vars),
  dayOf: (vars?: TemplateVariables) => render(dayOfTemplate, vars),
  aftercare: (vars?: TemplateVariables) => render(aftercareTemplate, vars),
};

export default peptideTherapy;
