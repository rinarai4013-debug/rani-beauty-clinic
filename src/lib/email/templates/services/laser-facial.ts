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
  subject: 'Your Laser Facial - Preparation Guide',
  preheader: 'Prepare your skin for a luminous laser facial transformation.',
  body: `
    ${heading('Preparing for Your Laser Facial', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Your Laser Facial is scheduled for <strong>{{appointment_date}}</strong> at <strong>{{appointment_time}}</strong> with {{provider_name}}. This treatment uses precision laser technology to address tone, texture, pigmentation, and overall radiance.`)}

    ${heading('Pre-Treatment Guidelines', 2)}
    ${bulletList([
      'Discontinue retinoids and vitamin A products <strong>7 days</strong> before treatment',
      'Stop all exfoliating acids (glycolic, salicylic, lactic) <strong>5 days</strong> prior',
      'Avoid sun exposure and tanning for <strong>2-4 weeks</strong> before',
      'Do not use self-tanners for <strong>2 weeks</strong> prior',
      'Avoid waxing, threading, or depilatory creams for <strong>7 days</strong> before',
      'If you have a history of cold sores, contact us for preventive medication',
      'Arrive with a completely clean face, free of all products',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Your Treatment: {{laser_type}}</strong><br>
      This laser has been selected specifically for your skin concerns. Treatment takes approximately 30-45 minutes. A topical numbing agent will be applied for your comfort.
    `, 'cream')}

    ${button('Confirm Your Appointment', '{{confirmation_url}}')}
    ${signoff('{{provider_name}}')}
  `,
});

const dayOfTemplate = buildTemplate({
  subject: 'Your Laser Facial Is Today',
  preheader: 'Luminous skin awaits - your laser facial details.',
  body: `
    ${heading('Your Laser Facial Is Today', 1)}
    ${paragraph(`Good morning, {{first_name}}.`)}
    ${paragraph(`Your Laser Facial is today at <strong>{{appointment_time}}</strong> with {{provider_name}}.`)}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Time:</strong> {{appointment_time}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Provider:</strong> {{provider_name}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Laser:</strong> {{laser_type}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Duration:</strong> 60-75 minutes (including numbing)</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Location:</strong> ${BRAND.address}</td></tr>
      </table>
    `, 'cream')}

    ${heading('Reminders', 3)}
    ${bulletList([
      'Come with a completely clean, product-free face',
      'Expect redness afterward - bring a hat and SPF',
      'Plan for a quiet evening to let your skin recover',
    ])}

    ${button('Get Directions', '{{directions_url}}', 'secondary')}
    ${signoff()}
  `,
});

const aftercareTemplate = buildTemplate({
  subject: 'Laser Facial Aftercare - Your Recovery Roadmap',
  preheader: 'Follow these steps for luminous, even results from your laser facial.',
  body: `
    ${heading('Your Laser Facial Aftercare', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Your laser facial is complete. Your skin is now in active healing and renewal mode. Diligent aftercare will ensure the most beautiful results.`)}

    ${divider('gold')}

    ${heading('First 24 Hours', 2)}
    ${bulletList([
      'Apply the provided post-treatment balm or moisturizer generously',
      'Do <strong>not</strong> wash your face for <strong>{{no_wash_hours}} hours</strong>',
      'Expect significant redness and mild swelling - this is completely normal',
      'Use a clean, soft pillowcase and sleep elevated if possible',
      'Apply cold compresses (not ice) for 10 minutes at a time to reduce swelling',
    ])}

    ${heading('Days 2-5', 2)}
    ${bulletList([
      'Gently cleanse with lukewarm water and a mild, fragrance-free cleanser',
      'Apply moisturizer frequently - your skin will feel tight and dry',
      'Do <strong>not</strong> pick or peel any flaking skin',
      'Avoid all makeup for <strong>{{makeup_wait_days}} days</strong>',
      'Skip exercise, saunas, and anything that causes sweating for <strong>72 hours</strong>',
    ])}

    ${heading('Weeks 1-4', 2)}
    ${bulletList([
      'Wear <strong>SPF 50+</strong> every single day - non-negotiable',
      'Avoid direct sun exposure for at least <strong>4 weeks</strong>',
      'Gradually reintroduce gentle skincare products after week 1',
      'Wait <strong>2-4 weeks</strong> before resuming retinoids (per provider instructions)',
      'Stay hydrated and nourish your skin with gentle, quality products',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Results Timeline</strong><br>
      Your skin will continue improving for <strong>3-6 months</strong> as new collagen develops and pigmentation fades. The initial "social downtime" of 5-7 days gives way to progressively clearer, more radiant skin.
    `, 'cream')}

    ${button('Schedule Your Follow-Up', '{{booking_url}}')}
    ${signoff('{{provider_name}}')}
  `,
});

export const laserFacial: ServiceEmailSet = {
  pretreatment: (vars?: TemplateVariables) => render(pretreatmentTemplate, vars),
  dayOf: (vars?: TemplateVariables) => render(dayOfTemplate, vars),
  aftercare: (vars?: TemplateVariables) => render(aftercareTemplate, vars),
};

export default laserFacial;
