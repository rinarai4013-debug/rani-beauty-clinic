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
  subject: 'Your HydraFacial Appointment - Prep for Glowing Skin',
  preheader: 'Simple steps to get the most from your HydraFacial experience.',
  body: `
    ${heading('Preparing for Your HydraFacial', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Your HydraFacial is scheduled for <strong>{{appointment_date}}</strong> at <strong>{{appointment_time}}</strong> with {{provider_name}}. Get ready for an instant glow.`)}

    ${heading('Pre-Treatment Guidelines', 2)}
    ${bulletList([
      'Discontinue retinoids and exfoliating acids <strong>48 hours</strong> before treatment',
      'Avoid waxing, threading, or laser treatments on the face for <strong>7 days</strong> prior',
      'Limit direct sun exposure and skip tanning for <strong>48 hours</strong> before',
      'Arrive with a clean face - we will cleanse thoroughly, but starting fresh helps',
      'Stay well-hydrated in the days leading up to your appointment',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">What to Expect</strong><br>
      Your HydraFacial takes approximately 45-60 minutes. The multi-step treatment cleanses, exfoliates, extracts, and hydrates your skin using patented technology. There is zero downtime - you will leave with an immediate, radiant glow.
    `, 'cream')}

    ${button('Confirm Your Appointment', '{{confirmation_url}}')}
    ${signoff('{{provider_name}}')}
  `,
});

const dayOfTemplate = buildTemplate({
  subject: 'Your HydraFacial Is Today - Here\'s What to Bring',
  preheader: 'See you soon for your glow-up at Rani Beauty Clinic.',
  body: `
    ${heading('Glow Day Is Here', 1)}
    ${paragraph(`Good morning, {{first_name}}.`)}
    ${paragraph(`Your HydraFacial awaits you today at <strong>{{appointment_time}}</strong>. Here is a quick overview of your visit.`)}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Time:</strong> {{appointment_time}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Provider:</strong> {{provider_name}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Duration:</strong> 45-60 minutes</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Location:</strong> ${BRAND.address}</td></tr>
      </table>
    `, 'cream')}

    ${heading('Reminders', 3)}
    ${bulletList([
      'Come with a clean face (no makeup if possible)',
      'Bring SPF for after your treatment - your skin will be extra receptive',
      'Plan for zero downtime - you can return to your day immediately',
    ])}

    ${button('Get Directions', '{{directions_url}}', 'secondary')}
    ${signoff()}
  `,
});

const aftercareTemplate = buildTemplate({
  subject: 'HydraFacial Aftercare - Keep That Glow Going',
  preheader: 'Your post-treatment guide for radiant, lasting results.',
  body: `
    ${heading('Your HydraFacial Aftercare', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`You are already glowing. Here is how to maintain and extend your beautiful results.`)}

    ${divider('gold')}

    ${heading('First 6 Hours', 2)}
    ${bulletList([
      'Avoid touching your face unnecessarily',
      'Skip makeup for at least <strong>6 hours</strong> to let serums absorb fully',
      'Do not use any exfoliating products or active serums',
    ])}

    ${heading('First 48 Hours', 2)}
    ${bulletList([
      'Avoid direct sun exposure - wear <strong>SPF 30+</strong> daily',
      'Skip saunas, steam rooms, and excessively hot showers',
      'Avoid retinoids, glycolic acid, and salicylic acid for <strong>48 hours</strong>',
      'Stay well-hydrated to support your refreshed skin',
    ])}

    ${heading('Ongoing Care', 2)}
    ${bulletList([
      'Use gentle, hydrating skincare products',
      'Continue daily SPF use for optimal results',
      'Results improve with regular treatments - we recommend every <strong>4-6 weeks</strong>',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Pro Tip</strong><br>
      Your skin is primed to absorb your favorite serums exceptionally well right now. This is the ideal time to apply high-quality hydrating and brightening products.
    `, 'gold')}

    ${button('Book Your Next HydraFacial', '{{booking_url}}')}
    ${signoff('{{provider_name}}')}
  `,
});

export const hydrafacial: ServiceEmailSet = {
  pretreatment: (vars?: TemplateVariables) => render(pretreatmentTemplate, vars),
  dayOf: (vars?: TemplateVariables) => render(dayOfTemplate, vars),
  aftercare: (vars?: TemplateVariables) => render(aftercareTemplate, vars),
};

export default hydrafacial;
