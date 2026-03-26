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
  subject: 'Your Chemical Peel - Preparation Guide',
  preheader: 'Important steps to prepare your skin for optimal peel results.',
  body: `
    ${heading('Preparing for Your Chemical Peel', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Your Chemical Peel is scheduled for <strong>{{appointment_date}}</strong> at <strong>{{appointment_time}}</strong> with {{provider_name}}. This treatment will reveal fresher, smoother, more luminous skin beneath the surface.`)}

    ${heading('Pre-Treatment Guidelines', 2)}
    ${bulletList([
      'Discontinue retinoids (tretinoin, retinol) <strong>7 days</strong> before treatment',
      'Stop all exfoliating acids (AHA, BHA, glycolic) <strong>5 days</strong> prior',
      'Avoid sun exposure and tanning for <strong>2 weeks</strong> prior - this is critical',
      'Do not wax, use depilatories, or have electrolysis for <strong>7 days</strong> before',
      'If you have a history of cold sores, notify us for antiviral prophylaxis',
      'Arrive with a clean face, free of all skincare products and makeup',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Peel Strength: {{peel_type}}</strong><br>
      Your provider has selected the ideal peel depth for your skin goals. During treatment, you may feel a mild tingling or warming sensation. Treatment time is approximately 30-45 minutes.
    `, 'cream')}

    ${button('Confirm Your Appointment', '{{confirmation_url}}')}
    ${signoff('{{provider_name}}')}
  `,
});

const dayOfTemplate = buildTemplate({
  subject: 'Your Chemical Peel Is Today',
  preheader: 'Reveal brighter skin - your peel appointment details.',
  body: `
    ${heading('Renewal Day Is Here', 1)}
    ${paragraph(`Good morning, {{first_name}}.`)}
    ${paragraph(`Your Chemical Peel is today at <strong>{{appointment_time}}</strong> with {{provider_name}}.`)}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Time:</strong> {{appointment_time}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Provider:</strong> {{provider_name}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Peel Type:</strong> {{peel_type}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Location:</strong> ${BRAND.address}</td></tr>
      </table>
    `, 'cream')}

    ${heading('Reminders', 3)}
    ${bulletList([
      'Arrive with a completely clean face',
      'Plan for some redness and sensitivity afterward',
      'Bring a wide-brimmed hat and sunscreen for afterward',
    ])}

    ${button('Get Directions', '{{directions_url}}', 'secondary')}
    ${signoff()}
  `,
});

const aftercareTemplate = buildTemplate({
  subject: 'Chemical Peel Aftercare - Nurture Your New Skin',
  preheader: 'Essential care instructions for beautiful, even results.',
  body: `
    ${heading('Your Chemical Peel Aftercare', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Your skin is now in renewal mode. Proper aftercare is absolutely essential for safe healing and optimal results.`)}

    ${divider('gold')}

    ${heading('First 24 Hours', 2)}
    ${bulletList([
      'Do <strong>not</strong> wash your face for the first <strong>{{no_wash_hours}} hours</strong>',
      'Do not touch, pick, or scratch the treated area',
      'Avoid all sun exposure - stay indoors when possible',
      'Skip makeup completely',
      'Expect tightness and mild redness - this is normal',
    ])}

    ${heading('Days 2-7', 2)}
    ${bulletList([
      'Gently cleanse with a <strong>mild, fragrance-free cleanser</strong>',
      'Apply the recommended post-peel moisturizer liberally and often',
      'Peeling and flaking will begin - <strong>never pull or peel loose skin</strong>',
      'Avoid all active ingredients (retinoids, acids, vitamin C)',
      'Wear <strong>SPF 50+</strong> every day, reapplying every 2 hours if outdoors',
    ])}

    ${heading('Weeks 2-4', 2)}
    ${bulletList([
      'Continue strict sun protection',
      'Gradually reintroduce your normal skincare products',
      'Your provider will advise when to resume retinoids and actives',
      'Stay well-hydrated and nourish your skin from within',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Important</strong><br>
      Peeling is a natural and expected part of the process. The temptation to pull loose skin is real - please resist. Premature removal can cause scarring or hyperpigmentation. Let your skin shed naturally.
    `, 'gold')}

    ${button('Schedule Your Follow-Up', '{{booking_url}}')}
    ${signoff('{{provider_name}}')}
  `,
});

export const chemicalPeel: ServiceEmailSet = {
  pretreatment: (vars?: TemplateVariables) => render(pretreatmentTemplate, vars),
  dayOf: (vars?: TemplateVariables) => render(dayOfTemplate, vars),
  aftercare: (vars?: TemplateVariables) => render(aftercareTemplate, vars),
};

export default chemicalPeel;
