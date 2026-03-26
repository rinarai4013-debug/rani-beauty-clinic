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
  subject: 'Your RF Microneedling Appointment - Preparation Guide',
  preheader: 'Important steps to prepare for your radiofrequency microneedling treatment.',
  body: `
    ${heading('Preparing for RF Microneedling', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Your RF Microneedling session is scheduled for <strong>{{appointment_date}}</strong> at <strong>{{appointment_time}}</strong> with {{provider_name}}. This treatment combines microneedling with radiofrequency energy to stimulate collagen production at a deeper level.`)}

    ${heading('Pre-Treatment Guidelines', 2)}
    ${bulletList([
      'Discontinue retinoids (tretinoin, retinol) <strong>5-7 days</strong> before treatment',
      'Avoid blood thinners, aspirin, and NSAIDs for <strong>7 days</strong> prior',
      'Stop all exfoliating acids (AHA, BHA, glycolic) <strong>5 days</strong> before',
      'No waxing, threading, or depilatory creams in the treatment area for <strong>7 days</strong>',
      'Avoid sun exposure and tanning for <strong>2 weeks</strong> prior',
      'Discontinue accutane at least <strong>6 months</strong> before treatment',
      'Arrive with a clean face, free of all products',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">What to Expect</strong><br>
      A topical numbing cream will be applied for 30-45 minutes before treatment. The procedure itself takes 20-30 minutes. You may experience warmth, tingling, and mild pressure during treatment.
    `, 'cream')}

    ${calloutBox(`
      <strong>Important Note:</strong> If you have a history of cold sores, please let us know in advance so we can prescribe a preventive antiviral medication.
    `, 'gold')}

    ${button('Confirm Your Appointment', '{{confirmation_url}}')}
    ${signoff('{{provider_name}}')}
  `,
});

const dayOfTemplate = buildTemplate({
  subject: 'Your RF Microneedling Session Is Today',
  preheader: 'Quick reminders before your collagen-boosting treatment.',
  body: `
    ${heading('Your Treatment Is Today', 1)}
    ${paragraph(`Good morning, {{first_name}}.`)}
    ${paragraph(`Your RF Microneedling session is today at <strong>{{appointment_time}}</strong> with {{provider_name}}.`)}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Time:</strong> {{appointment_time}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Provider:</strong> {{provider_name}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Duration:</strong> 60-75 minutes (including numbing)</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Location:</strong> ${BRAND.address}</td></tr>
      </table>
    `, 'cream')}

    ${heading('Day-Of Reminders', 3)}
    ${bulletList([
      'Arrive with a completely clean face - no products',
      'Plan for 75-90 minutes total (numbing + treatment)',
      'Expect mild redness afterward, similar to a sunburn',
      'Bring a hat and SPF for the journey home',
    ])}

    ${button('Get Directions', '{{directions_url}}', 'secondary')}
    ${signoff()}
  `,
});

const aftercareTemplate = buildTemplate({
  subject: 'RF Microneedling Aftercare - Your Recovery Guide',
  preheader: 'Essential aftercare steps for optimal collagen remodeling results.',
  body: `
    ${heading('Your RF Microneedling Aftercare', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Thank you for your RF Microneedling treatment today. Your skin is now in active collagen-remodeling mode. Proper aftercare is essential for optimal results.`)}

    ${divider('gold')}

    ${heading('First 24 Hours', 2)}
    ${bulletList([
      'Keep the treated area <strong>clean and dry</strong>',
      'Do <strong>not</strong> apply any products except those provided by your provider',
      'Avoid touching or picking at the treated area',
      'Expect redness, warmth, and mild swelling - this is normal',
      'Sleep on a clean pillowcase, elevated if possible',
    ])}

    ${heading('Days 2-3', 2)}
    ${bulletList([
      'You may gently cleanse with a mild, fragrance-free cleanser',
      'Apply the recommended post-procedure moisturizer',
      'Continue to avoid makeup for <strong>48 hours</strong>',
      'Mild flaking or dryness is normal - do not pick or peel',
    ])}

    ${heading('Days 3-14', 2)}
    ${bulletList([
      'Begin wearing <strong>SPF 30+</strong> daily (mineral sunscreen preferred)',
      'Resume gentle skincare products gradually',
      'Avoid retinoids, AHAs, BHAs for <strong>7-10 days</strong>',
      'No strenuous exercise, saunas, or hot tubs for <strong>72 hours</strong>',
      'Avoid direct sun exposure for <strong>2 weeks</strong>',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Results Timeline</strong><br>
      Initial improvement is visible within 1-2 weeks. Collagen remodeling continues for <strong>3-6 months</strong> after treatment. A series of 3-4 treatments spaced 4-6 weeks apart delivers optimal results.
    `, 'cream')}

    ${button('Schedule Your Next Session', '{{booking_url}}')}
    ${signoff('{{provider_name}}')}
  `,
});

export const rfMicroneedling: ServiceEmailSet = {
  pretreatment: (vars?: TemplateVariables) => render(pretreatmentTemplate, vars),
  dayOf: (vars?: TemplateVariables) => render(dayOfTemplate, vars),
  aftercare: (vars?: TemplateVariables) => render(aftercareTemplate, vars),
};

export default rfMicroneedling;
