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
  subject: 'Your Sofwave Treatment - Preparation Guide',
  preheader: 'Get ready for your non-invasive skin tightening and lifting treatment.',
  body: `
    ${heading('Preparing for Your Sofwave Treatment', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Your Sofwave session is scheduled for <strong>{{appointment_date}}</strong> at <strong>{{appointment_time}}</strong> with {{provider_name}}. Sofwave uses advanced ultrasound technology to lift and tighten your skin without surgery or downtime.`)}

    ${heading('Pre-Treatment Guidelines', 2)}
    ${bulletList([
      'No specific skincare restrictions - continue your normal routine',
      'Avoid sunburn in the treatment area',
      'Remove all jewelry and piercings from the treatment zone',
      'Arrive with a clean face, free of makeup and products',
      'Take over-the-counter pain relief 30 minutes before if desired',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">What to Expect</strong><br>
      Treatment takes 30-45 minutes for a full face. You will feel brief pulses of warmth and energy. Most clients find the treatment very tolerable. Results develop gradually over 3-6 months as new collagen forms.
    `, 'cream')}

    ${button('Confirm Your Appointment', '{{confirmation_url}}')}
    ${signoff('{{provider_name}}')}
  `,
});

const dayOfTemplate = buildTemplate({
  subject: 'Your Sofwave Appointment Is Today',
  preheader: 'Quick details for your skin tightening session at Rani Beauty Clinic.',
  body: `
    ${heading('Your Sofwave Session Is Today', 1)}
    ${paragraph(`Good morning, {{first_name}}.`)}
    ${paragraph(`We are excited to see you today for your Sofwave treatment at <strong>{{appointment_time}}</strong>.`)}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Time:</strong> {{appointment_time}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Provider:</strong> {{provider_name}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Duration:</strong> 30-45 minutes</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Location:</strong> ${BRAND.address}</td></tr>
      </table>
    `, 'cream')}

    ${heading('Reminders', 3)}
    ${bulletList([
      'Come with a clean, product-free face',
      'Zero downtime - you can return to activities immediately',
      'Bring SPF for afterward (always a good idea)',
    ])}

    ${button('Get Directions', '{{directions_url}}', 'secondary')}
    ${signoff()}
  `,
});

const aftercareTemplate = buildTemplate({
  subject: 'Sofwave Aftercare - What Comes Next',
  preheader: 'Your guide to maximizing your Sofwave results over the coming months.',
  body: `
    ${heading('Your Sofwave Aftercare Guide', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Congratulations on completing your Sofwave treatment. Your body is now producing fresh collagen that will continue tightening and lifting your skin over the coming months.`)}

    ${divider('gold')}

    ${heading('Immediate Aftercare', 2)}
    ${bulletList([
      'Mild redness or warmth may occur - this typically resolves within <strong>1-2 hours</strong>',
      'You may resume your normal skincare routine immediately',
      'Makeup can be applied right away if desired',
      'No activity restrictions - return to your day as planned',
    ])}

    ${heading('Ongoing Care', 2)}
    ${bulletList([
      'Wear <strong>SPF 30+</strong> daily to protect your investment',
      'Maintain a consistent skincare routine with quality products',
      'Stay hydrated for optimal skin health',
      'Be patient - results build gradually over <strong>3-6 months</strong>',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Results Timeline</strong><br>
      Some clients see initial improvement within weeks. The most significant results appear at <strong>3 months</strong>, with continued improvement through <strong>6 months</strong>. Results can last 1-2 years with proper skincare and sun protection.
    `, 'cream')}

    ${button('Book Your Follow-Up', '{{booking_url}}')}
    ${signoff('{{provider_name}}')}
  `,
});

export const sofwave: ServiceEmailSet = {
  pretreatment: (vars?: TemplateVariables) => render(pretreatmentTemplate, vars),
  dayOf: (vars?: TemplateVariables) => render(dayOfTemplate, vars),
  aftercare: (vars?: TemplateVariables) => render(aftercareTemplate, vars),
};

export default sofwave;
