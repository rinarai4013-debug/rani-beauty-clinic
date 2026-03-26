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
  type TemplateVariables,
  render,
  type RenderedEmail,
} from '../../engine';

const template = buildTemplate({
  subject: 'Summer Glow - Protect, Hydrate, and Shine',
  preheader: 'Your summer skin strategy from the experts at Rani Beauty Clinic.',
  body: `
    ${heading('Your Summer Glow Guide', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Summer is here, and your skin needs a different kind of care. Between sun exposure, humidity, and outdoor activities, this season demands a focused approach to keep you looking and feeling your best.`)}

    ${divider('gold')}

    ${heading('Summer Essentials', 2)}

    ${calloutBox(`
      <strong style="color: ${BRAND.navy};">HydraFacial Hydration Boost</strong><br>
      Combat summer dehydration with our signature HydraFacial. Deep hydration, antioxidant protection, and instant luminosity - the perfect summer maintenance treatment.
    `, 'cream')}

    ${calloutBox(`
      <strong style="color: ${BRAND.navy};">Vitamin Injections</strong><br>
      Boost your energy and support your skin from within. Our vitamin injection cocktails are formulated to keep you vibrant all summer long.
    `, 'cream')}

    ${heading('Summer Skin Tips', 3)}
    ${bulletList([
      'Apply <strong>SPF 30+</strong> every morning - reapply every 2 hours outdoors',
      'Hydrate from within: aim for 8+ glasses of water daily',
      'Use antioxidant serums (vitamin C) in the morning for added protection',
      'Avoid harsh exfoliants - opt for gentle, hydrating products',
      'Schedule treatments in the evening to avoid immediate sun exposure',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">{{summer_offer_title}}</strong><br>
      {{summer_offer_description}}<br><br>
      <em>Valid through {{offer_expiry}}</em>
    `, 'gold')}

    ${button('Book Your Summer Treatment', '{{booking_url}}')}

    ${signoff()}
  `,
});

export function seasonalSummer(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default seasonalSummer;
