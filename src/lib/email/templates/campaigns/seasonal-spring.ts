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
  subject: 'Spring Renewal - Refresh Your Skin This Season',
  preheader: 'Shed the winter dullness. Your spring glow-up starts at Rani.',
  body: `
    ${heading('Spring Into Radiance', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`As nature renews itself this spring, it is the perfect time to renew your skin. Winter can leave us with dryness, dullness, and buildup that masks your natural radiance. Let us help you shed the winter and step into spring glowing.`)}

    ${divider('gold')}

    ${heading('Spring Treatment Recommendations', 2)}

    ${calloutBox(`
      <strong style="color: ${BRAND.navy};">HydraFacial Deep Cleanse</strong><br>
      The ultimate spring reset. Deep cleansing, exfoliation, and hydration in one luxurious treatment. Emerge with instantly radiant, dewy skin.
    `, 'cream')}

    ${calloutBox(`
      <strong style="color: ${BRAND.navy};">Chemical Peel Refresh</strong><br>
      Reveal the fresh, even-toned skin hiding beneath winter's dullness. Our customized peels address uneven texture, dark spots, and fine lines.
    `, 'cream')}

    ${calloutBox(`
      <strong style="color: ${BRAND.navy};">Laser Hair Removal</strong><br>
      Start now so you are smooth and carefree by summer. Spring is the ideal time to begin your laser hair removal series.
    `, 'cream')}

    ${heading('Spring Special', 3)}
    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">{{spring_offer_title}}</strong><br>
      {{spring_offer_description}}<br><br>
      <em>Valid through {{offer_expiry}}</em>
    `, 'gold')}

    ${button('Book Your Spring Treatment', '{{booking_url}}')}

    ${signoff()}
  `,
});

export function seasonalSpring(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default seasonalSpring;
