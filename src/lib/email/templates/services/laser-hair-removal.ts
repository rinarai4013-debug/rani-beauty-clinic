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
  subject: 'Your Laser Hair Removal - Important Prep Steps',
  preheader: 'Essential preparation for smooth, lasting results.',
  body: `
    ${heading('Preparing for Laser Hair Removal', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Your Laser Hair Removal session is scheduled for <strong>{{appointment_date}}</strong> at <strong>{{appointment_time}}</strong> with {{provider_name}}. Proper preparation is key to optimal results.`)}

    ${heading('Pre-Treatment Guidelines', 2)}
    ${bulletList([
      '<strong>Shave the treatment area 24 hours before</strong> your appointment - do not wax, pluck, or thread',
      'Avoid sun exposure and tanning (including self-tanners) for <strong>2-4 weeks</strong> prior',
      'Discontinue retinoids and exfoliating acids <strong>5 days</strong> before',
      'Do not bleach hair in the treatment area for <strong>4 weeks</strong> prior',
      'Avoid caffeine on the day of treatment to reduce sensitivity',
      'Wear loose, comfortable clothing that provides easy access to the treatment area',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Why Shaving Matters</strong><br>
      The laser targets the hair follicle beneath the skin. Shaving ensures the energy is directed to the root rather than being absorbed by surface hair. Waxing or plucking removes the root entirely, making the treatment ineffective.
    `, 'cream')}

    ${button('Confirm Your Appointment', '{{confirmation_url}}')}
    ${signoff('{{provider_name}}')}
  `,
});

const dayOfTemplate = buildTemplate({
  subject: 'Your Laser Hair Removal Is Today',
  preheader: 'See you soon for your session at Rani Beauty Clinic.',
  body: `
    ${heading('Your Session Is Today', 1)}
    ${paragraph(`Good morning, {{first_name}}.`)}
    ${paragraph(`Your Laser Hair Removal appointment is today at <strong>{{appointment_time}}</strong> with {{provider_name}}.`)}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Time:</strong> {{appointment_time}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Provider:</strong> {{provider_name}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Treatment Area:</strong> {{treatment_area}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Location:</strong> ${BRAND.address}</td></tr>
      </table>
    `, 'cream')}

    ${heading('Quick Check', 3)}
    ${bulletList([
      'Did you shave the treatment area yesterday?',
      'No tanning or sun exposure in the last 2 weeks?',
      'Wearing loose, comfortable clothing?',
    ])}

    ${button('Get Directions', '{{directions_url}}', 'secondary')}
    ${signoff()}
  `,
});

const aftercareTemplate = buildTemplate({
  subject: 'Laser Hair Removal Aftercare - Protect Your Results',
  preheader: 'Essential post-treatment care for smooth, lasting results.',
  body: `
    ${heading('Your Laser Hair Removal Aftercare', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Your laser session is complete. Here is how to care for your skin and get the best results.`)}

    ${divider('gold')}

    ${heading('First 24-48 Hours', 2)}
    ${bulletList([
      'Apply a cool compress or aloe vera gel to soothe any redness',
      'Avoid hot showers, baths, saunas, and steam rooms for <strong>24 hours</strong>',
      'Skip deodorant on treated areas (if underarms) for <strong>24 hours</strong>',
      'Do not scratch or pick at the treated area',
      'Wear loose clothing over the treated area',
    ])}

    ${heading('First 2 Weeks', 2)}
    ${bulletList([
      'Apply <strong>SPF 30+</strong> daily to treated areas exposed to sun',
      'Avoid direct sun exposure and tanning completely',
      'Do not wax, pluck, or thread - <strong>shaving only</strong> between sessions',
      'Avoid swimming pools and hot tubs for <strong>48 hours</strong>',
      'Skip retinoids and exfoliating acids for <strong>5 days</strong>',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">What to Expect</strong><br>
      Hair will begin to shed naturally over the next <strong>1-3 weeks</strong>. This is not regrowth - it is the treated hair falling out. You will need <strong>6-8 sessions</strong> spaced 4-8 weeks apart for optimal, lasting results.
    `, 'cream')}

    ${paragraph(`Your next session is recommended in approximately <strong>{{next_session_weeks}} weeks</strong>.`)}

    ${button('Book Your Next Session', '{{booking_url}}')}
    ${signoff('{{provider_name}}')}
  `,
});

export const laserHairRemoval: ServiceEmailSet = {
  pretreatment: (vars?: TemplateVariables) => render(pretreatmentTemplate, vars),
  dayOf: (vars?: TemplateVariables) => render(dayOfTemplate, vars),
  aftercare: (vars?: TemplateVariables) => render(aftercareTemplate, vars),
};

export default laserHairRemoval;
