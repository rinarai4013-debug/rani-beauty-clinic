// @ts-nocheck
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
  subject: 'Winter Wellness - Nourish and Protect Your Skin',
  preheader: 'Combat winter dryness and dullness with our curated winter treatments.',
  body: `
    ${heading('Winter Wellness Collection', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Winter can be harsh on your skin. Cold air, indoor heating, and reduced humidity create the perfect storm for dryness, sensitivity, and dullness. But with the right treatments, you can emerge from winter with your most beautiful skin yet.`)}

    ${divider('gold')}

    ${heading('Winter Favorites', 2)}

    ${calloutBox(`
      <strong style="color: ${BRAND.navy};">HydraFacial Intensive</strong><br>
      Deep hydration when your skin needs it most. Our winter HydraFacial protocol includes extra hydrating serums and barrier-repair boosters for maximum protection against winter conditions.
    `, 'cream')}

    ${calloutBox(`
      <strong style="color: ${BRAND.navy};">NAD+ Therapy</strong><br>
      Winter is the perfect time to invest in cellular renewal. NAD+ therapy supports your body's natural repair mechanisms, boosts energy during shorter days, and promotes overall vitality.
    `, 'cream')}

    ${calloutBox(`
      <strong style="color: ${BRAND.navy};">Peptide Therapy</strong><br>
      Support your body's resilience during the cold months. Targeted peptide protocols can enhance immune function, sleep quality, and skin health from within.
    `, 'cream')}

    ${heading('Winter Skin Tips', 3)}
    ${bulletList([
      'Switch to a richer, more emollient moisturizer',
      'Continue using SPF daily - UV rays are present year-round',
      'Use a humidifier at home to combat indoor dryness',
      "Avoid very hot showers - they strip your skin's natural oils",
      'Layer hydrating serums under your moisturizer for extra nourishment',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">{{winter_offer_title}}</strong><br>
      {{winter_offer_description}}<br><br>
      <em>Valid through {{offer_expiry}}</em>
    `, 'gold')}

    ${button('Book Your Winter Treatment', '{{booking_url}}')}

    ${signoff()}
  `,
});

export function seasonalWinter(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default seasonalWinter;
