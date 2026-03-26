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
  subject: 'Your Scar Reduction Treatment - Preparation Guide',
  preheader: 'Important preparation steps for your scar reduction session.',
  body: `
    ${heading('Preparing for Scar Reduction', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Your Scar Reduction treatment is scheduled for <strong>{{appointment_date}}</strong> at <strong>{{appointment_time}}</strong> with {{provider_name}}. This treatment uses advanced technology to improve the appearance of scarring and restore smoother, more even skin.`)}

    ${heading('Pre-Treatment Guidelines', 2)}
    ${bulletList([
      'Discontinue retinoids and exfoliating acids <strong>7 days</strong> before treatment',
      'Avoid sun exposure and tanning for <strong>2-4 weeks</strong> prior',
      'Stop blood thinners (aspirin, ibuprofen) for <strong>7 days</strong> if medically cleared',
      'Do not apply self-tanner to the treatment area for <strong>2 weeks</strong> before',
      'Arrive with clean skin, free of products in the treatment area',
      'If you have a history of cold sores (for facial treatment), notify us in advance',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Treatment Approach: {{treatment_method}}</strong><br>
      Your provider has selected the optimal approach for your scar type. A topical numbing agent will be applied before treatment to ensure your comfort throughout the procedure.
    `, 'cream')}

    ${button('Confirm Your Appointment', '{{confirmation_url}}')}
    ${signoff('{{provider_name}}')}
  `,
});

const dayOfTemplate = buildTemplate({
  subject: 'Your Scar Reduction Session Is Today',
  preheader: 'Your appointment details for today at Rani Beauty Clinic.',
  body: `
    ${heading('Your Treatment Is Today', 1)}
    ${paragraph(`Good morning, {{first_name}}.`)}
    ${paragraph(`Your Scar Reduction session is today at <strong>{{appointment_time}}</strong> with {{provider_name}}.`)}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Time:</strong> {{appointment_time}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Provider:</strong> {{provider_name}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Treatment:</strong> {{treatment_method}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Location:</strong> ${BRAND.address}</td></tr>
      </table>
    `, 'cream')}

    ${heading('Reminders', 3)}
    ${bulletList([
      'Clean skin in the treatment area - no products',
      'Plan for numbing time (30-45 minutes) plus treatment',
      'Bring SPF and a hat for the journey home',
    ])}

    ${button('Get Directions', '{{directions_url}}', 'secondary')}
    ${signoff()}
  `,
});

const aftercareTemplate = buildTemplate({
  subject: 'Scar Reduction Aftercare - Protect Your Progress',
  preheader: 'Essential aftercare to ensure optimal scar improvement results.',
  body: `
    ${heading('Your Scar Reduction Aftercare', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Your scar reduction treatment is complete. Your skin is now in healing mode. Proper aftercare is critical to achieving the best results.`)}

    ${divider('gold')}

    ${heading('First 24-48 Hours', 2)}
    ${bulletList([
      'Keep the treated area <strong>clean and dry</strong>',
      'Apply only provider-recommended products to the treatment area',
      'Expect redness, mild swelling, and warmth - similar to a sunburn',
      'Do <strong>not</strong> pick, scratch, or rub the treated area',
      'Avoid makeup on the treated area for <strong>24-48 hours</strong>',
    ])}

    ${heading('First 2 Weeks', 2)}
    ${bulletList([
      'Apply <strong>SPF 50+</strong> daily to the treatment area',
      'Avoid direct sun exposure as much as possible',
      'Use gentle, fragrance-free cleansers and moisturizers',
      'Avoid retinoids, acids, and exfoliants for <strong>7-10 days</strong>',
      'No swimming, saunas, or steam rooms for <strong>72 hours</strong>',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Results Timeline</strong><br>
      Scar improvement is gradual. Initial results may be visible in <strong>2-4 weeks</strong>. Optimal results develop over <strong>3-6 months</strong> as collagen remodels. A series of <strong>{{recommended_sessions}} treatments</strong> spaced 4-6 weeks apart typically delivers the best outcome.
    `, 'cream')}

    ${button('Schedule Your Next Session', '{{booking_url}}')}
    ${signoff('{{provider_name}}')}
  `,
});

export const scarReduction: ServiceEmailSet = {
  pretreatment: (vars?: TemplateVariables) => render(pretreatmentTemplate, vars),
  dayOf: (vars?: TemplateVariables) => render(dayOfTemplate, vars),
  aftercare: (vars?: TemplateVariables) => render(aftercareTemplate, vars),
};

export default scarReduction;
