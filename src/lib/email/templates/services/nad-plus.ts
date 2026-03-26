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
  subject: 'Your NAD+ Therapy Session - Preparation Guide',
  preheader: 'Get ready for cellular rejuvenation with your NAD+ treatment.',
  body: `
    ${heading('Preparing for NAD+ Therapy', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Your NAD+ Therapy session is scheduled for <strong>{{appointment_date}}</strong> at <strong>{{appointment_time}}</strong> with {{provider_name}}. NAD+ (Nicotinamide Adenine Dinucleotide) is a coenzyme essential for cellular energy, repair, and longevity.`)}

    ${heading('Pre-Treatment Guidelines', 2)}
    ${bulletList([
      'Eat a <strong>light meal</strong> 1-2 hours before your appointment',
      'Hydrate thoroughly in the 24 hours prior - this improves vein access and comfort',
      'Avoid alcohol for <strong>24 hours</strong> before treatment',
      'Wear comfortable clothing - you will be seated for an extended period',
      'Bring entertainment (book, tablet, headphones) for your session',
      'Inform your provider of all medications and supplements',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">What to Expect</strong><br>
      NAD+ is administered via injection. The session takes approximately {{session_duration}}. You may experience mild warmth, chest tightness, or nausea during the injection - these sensations are normal and can be managed by adjusting the rate. Many clients feel increased clarity and energy afterward.
    `, 'cream')}

    ${button('Confirm Your Appointment', '{{confirmation_url}}')}
    ${signoff('{{provider_name}}')}
  `,
});

const dayOfTemplate = buildTemplate({
  subject: 'Your NAD+ Session Is Today',
  preheader: 'Cellular rejuvenation awaits you at Rani Beauty Clinic.',
  body: `
    ${heading('Your NAD+ Session Is Today', 1)}
    ${paragraph(`Good morning, {{first_name}}.`)}
    ${paragraph(`Your NAD+ Therapy session is today at <strong>{{appointment_time}}</strong>. Come ready to relax and recharge.`)}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Time:</strong> {{appointment_time}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Provider:</strong> {{provider_name}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Duration:</strong> {{session_duration}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Location:</strong> ${BRAND.address}</td></tr>
      </table>
    `, 'cream')}

    ${heading('Bring With You', 3)}
    ${bulletList([
      'Entertainment for your session (book, tablet, headphones)',
      'A water bottle to stay hydrated',
      'A light snack in case you need it',
    ])}

    ${button('Get Directions', '{{directions_url}}', 'secondary')}
    ${signoff()}
  `,
});

const aftercareTemplate = buildTemplate({
  subject: 'After Your NAD+ Session - Maximize the Benefits',
  preheader: 'How to extend the cellular rejuvenation benefits of your NAD+ therapy.',
  body: `
    ${heading('Your NAD+ Aftercare Guide', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Your NAD+ therapy session is complete. Your cells are now equipped with a fresh supply of this vital coenzyme. Here is how to maximize and extend the benefits.`)}

    ${divider('gold')}

    ${heading('Immediate Care', 2)}
    ${bulletList([
      'Continue hydrating generously for the rest of the day',
      'Eat a nutritious, balanced meal within an hour of treatment',
      'Mild fatigue is normal - some clients feel energized, others need rest',
      'Avoid alcohol for <strong>24 hours</strong> to support cellular repair',
    ])}

    ${heading('Enhance Your Results', 2)}
    ${bulletList([
      '<strong>Sleep:</strong> Prioritize 7-9 hours of quality sleep tonight and ongoing',
      '<strong>Nutrition:</strong> Focus on whole foods rich in B vitamins and antioxidants',
      '<strong>Exercise:</strong> Regular moderate exercise enhances NAD+ benefits',
      '<strong>Stress:</strong> Practice stress management - meditation, breathwork, or journaling',
      '<strong>Supplements:</strong> Your provider may recommend supporting supplements',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Results and Frequency</strong><br>
      Many clients report improved mental clarity, energy, and overall vitality within <strong>24-72 hours</strong>. For optimal longevity benefits, a series of sessions is recommended. Your provider will create a schedule tailored to your goals.
    `, 'cream')}

    ${button('Book Your Next NAD+ Session', '{{booking_url}}')}
    ${signoff('{{provider_name}}')}
  `,
});

export const nadPlus: ServiceEmailSet = {
  pretreatment: (vars?: TemplateVariables) => render(pretreatmentTemplate, vars),
  dayOf: (vars?: TemplateVariables) => render(dayOfTemplate, vars),
  aftercare: (vars?: TemplateVariables) => render(aftercareTemplate, vars),
};

export default nadPlus;
